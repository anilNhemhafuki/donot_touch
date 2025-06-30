import { db } from "./db";
import { eq, desc, asc, and, gte, lte, sql } from "drizzle-orm";
import {
  users,
  categories,
  products,
  inventoryItems,
  inventoryCategories,
  customers,
  parties,
  units,
  purchases,
  purchaseItems,
  orders,
  orderItems,
  productIngredients,
  productionSchedule,
  inventoryTransactions,
  expenses,
  assets,
  settings,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type InventoryItem,
  type InsertInventoryItem,
  type Customer,
  type InsertCustomer,
  type Party,
  type InsertParty,
  type Purchase,
  type InsertPurchase,
  type PurchaseItem,
  type InsertPurchaseItem,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type InventoryTransaction,
  type InsertInventoryTransaction,
  type Expense,
  type InsertExpense,
  type Asset,
  type InsertAsset,
} from "../shared/schema";

export class EnhancedStorage {
  // Enhanced Purchase System with Stock Sync
  async createPurchaseWithStockSync(purchaseData: {
    supplierName: string;
    partyId?: number;
    paymentMethod: string;
    status?: string;
    invoiceNumber?: string;
    notes?: string;
    items: Array<{
      inventoryItemId: number;
      quantity: number;
      unitPrice: number;
    }>;
  }): Promise<Purchase> {
    const totalAmount = purchaseData.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    // Create the purchase
    const [purchase] = await db
      .insert(purchases)
      .values({
        supplierName: purchaseData.supplierName,
        partyId: purchaseData.partyId,
        totalAmount: totalAmount.toString(),
        paymentMethod: purchaseData.paymentMethod,
        status: purchaseData.status || "pending",
        invoiceNumber: purchaseData.invoiceNumber,
        notes: purchaseData.notes,
        purchaseDate: new Date(),
      })
      .returning();

    // Create purchase items and update inventory
    for (const item of purchaseData.items) {
      // Create purchase item
      await db.insert(purchaseItems).values({
        purchaseId: purchase.id,
        inventoryItemId: item.inventoryItemId,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        totalPrice: (item.quantity * item.unitPrice).toString(),
      });

      // Update inventory stock
      await this.updateInventoryStock(
        item.inventoryItemId,
        item.quantity,
        "in",
        `Purchase #${purchase.id}`,
        purchase.id.toString()
      );

      // Update cost per unit (weighted average)
      await this.updateInventoryCostPerUnit(
        item.inventoryItemId,
        item.quantity,
        item.unitPrice
      );
    }

    // Update supplier balance if party exists
    if (purchaseData.partyId) {
      await this.updatePartyBalance(purchaseData.partyId, totalAmount);
    }

    return purchase;
  }

  async updateInventoryStock(
    inventoryItemId: number,
    quantity: number,
    type: "in" | "out" | "adjustment",
    reason: string,
    reference?: string
  ): Promise<void> {
    // Create inventory transaction
    await db.insert(inventoryTransactions).values({
      inventoryItemId,
      type,
      quantity: quantity.toString(),
      reason,
      reference,
      createdAt: new Date(),
    });

    // Update current stock
    const multiplier = type === "out" ? -1 : 1;
    await db
      .update(inventoryItems)
      .set({
        currentStock: sql`${inventoryItems.currentStock} + ${quantity * multiplier}`,
        lastRestocked: type === "in" ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, inventoryItemId));
  }

  async updateInventoryCostPerUnit(
    inventoryItemId: number,
    newQuantity: number,
    newUnitPrice: number
  ): Promise<void> {
    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, inventoryItemId));

    if (item) {
      const currentStock = parseFloat(item.currentStock);
      const currentCost = parseFloat(item.costPerUnit);
      const oldQuantity = currentStock - newQuantity;

      // Weighted average cost calculation
      const totalValue = oldQuantity * currentCost + newQuantity * newUnitPrice;
      const newCostPerUnit = totalValue / currentStock;

      await db
        .update(inventoryItems)
        .set({
          costPerUnit: newCostPerUnit.toString(),
          updatedAt: new Date(),
        })
        .where(eq(inventoryItems.id, inventoryItemId));
    }
  }

  async updatePartyBalance(partyId: number, amount: number): Promise<void> {
    await db
      .update(parties)
      .set({
        balance: sql`${parties.balance} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(parties.id, partyId));
  }

  // Production Cost Calculation System
  async calculateProductionCost(productId: number, quantity: number = 1): Promise<{
    materialCost: number;
    laborCost: number;
    overheadCost: number;
    totalCost: number;
    perUnitCost: number;
  }> {
    // Get product ingredients
    const ingredients = await db
      .select({
        inventoryItemId: productIngredients.inventoryItemId,
        quantity: productIngredients.quantity,
        costPerUnit: inventoryItems.costPerUnit,
        itemName: inventoryItems.name,
      })
      .from(productIngredients)
      .innerJoin(
        inventoryItems,
        eq(productIngredients.inventoryItemId, inventoryItems.id)
      )
      .where(eq(productIngredients.productId, productId));

    // Calculate material cost
    let materialCost = 0;
    for (const ingredient of ingredients) {
      const ingredientQuantity = parseFloat(ingredient.quantity);
      const costPerUnit = parseFloat(ingredient.costPerUnit);
      materialCost += ingredientQuantity * costPerUnit * quantity;
    }

    // Get settings for labor and overhead rates
    const laborRate = await this.getSettingValue("labor_cost_per_hour", "25");
    const overheadRate = await this.getSettingValue("overhead_percentage", "15");
    const productionTimeHours = await this.getSettingValue("production_time_hours", "2");

    // Calculate labor cost (assuming 2 hours per batch)
    const laborCost = parseFloat(laborRate) * parseFloat(productionTimeHours) * quantity;

    // Calculate overhead cost (percentage of material + labor)
    const overheadCost = (materialCost + laborCost) * (parseFloat(overheadRate) / 100);

    const totalCost = materialCost + laborCost + overheadCost;
    const perUnitCost = totalCost / quantity;

    return {
      materialCost,
      laborCost,
      overheadCost,
      totalCost,
      perUnitCost,
    };
  }

  async updateProductCostFromCalculation(productId: number): Promise<void> {
    const costCalculation = await this.calculateProductionCost(productId, 1);
    
    await db
      .update(products)
      .set({
        cost: costCalculation.perUnitCost.toString(),
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId));
  }

  // Customer Account Management (Debtor System)
  async updateCustomerAccount(
    customerId: number,
    amount: number,
    type: "debit" | "credit",
    description: string
  ): Promise<void> {
    const multiplier = type === "debit" ? 1 : -1;
    
    await db
      .update(customers)
      .set({
        totalSpent: sql`${customers.totalSpent} + ${amount * multiplier}`,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customerId));

    // Create transaction record (you might want to add a customer_transactions table)
    await this.createCustomerTransaction(customerId, amount, type, description);
  }

  async createCustomerTransaction(
    customerId: number,
    amount: number,
    type: "debit" | "credit",
    description: string
  ): Promise<void> {
    // For now, we'll use the expenses table to track customer transactions
    // In a full implementation, you'd create a dedicated customer_transactions table
    await db.insert(expenses).values({
      description: `Customer Account: ${description}`,
      amount: amount.toString(),
      category: type === "debit" ? "accounts_receivable" : "customer_payment",
      date: new Date(),
      paymentMethod: "account",
      vendor: `Customer ID: ${customerId}`,
    });
  }

  async getCustomerBalance(customerId: number): Promise<number> {
    const [customer] = await db
      .select({ totalSpent: customers.totalSpent })
      .from(customers)
      .where(eq(customers.id, customerId));

    return customer ? parseFloat(customer.totalSpent) : 0;
  }

  // Supplier Account Management (Creditor System)
  async createSupplierPayment(
    partyId: number,
    amount: number,
    paymentMethod: string,
    notes?: string
  ): Promise<void> {
    // Update supplier balance
    await db
      .update(parties)
      .set({
        balance: sql`${parties.balance} - ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(parties.id, partyId));

    // Record the payment as an expense
    const [party] = await db
      .select({ name: parties.name })
      .from(parties)
      .where(eq(parties.id, partyId));

    await db.insert(expenses).values({
      description: `Payment to ${party?.name || "Unknown Supplier"}`,
      amount: amount.toString(),
      category: "supplier_payment",
      date: new Date(),
      paymentMethod,
      vendor: party?.name || "Unknown Supplier",
    });
  }

  async getSupplierBalance(partyId: number): Promise<number> {
    const [party] = await db
      .select({ balance: parties.balance })
      .from(parties)
      .where(eq(parties.id, partyId));

    return party ? parseFloat(party.balance) : 0;
  }

  // Enhanced Analytics and Reporting
  async getFinancialSummary(startDate?: Date, endDate?: Date): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    totalPurchases: number;
    netProfit: number;
    outstandingReceivables: number;
    outstandingPayables: number;
  }> {
    const dateFilter = startDate && endDate 
      ? and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate))
      : undefined;

    // Calculate total revenue from completed orders
    const revenueResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
      })
      .from(orders)
      .where(and(eq(orders.status, "completed"), dateFilter));

    // Calculate total expenses
    const expenseFilter = startDate && endDate 
      ? and(gte(expenses.date, startDate), lte(expenses.date, endDate))
      : undefined;

    const expensesResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${expenses.amount} AS DECIMAL)), 0)`,
      })
      .from(expenses)
      .where(expenseFilter);

    // Calculate total purchases
    const purchaseFilter = startDate && endDate 
      ? and(gte(purchases.purchaseDate, startDate), lte(purchases.purchaseDate, endDate))
      : undefined;

    const purchasesResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${purchases.totalAmount} AS DECIMAL)), 0)`,
      })
      .from(purchases)
      .where(purchaseFilter);

    // Calculate outstanding receivables (customer balances)
    const receivablesResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${customers.totalSpent} AS DECIMAL)), 0)`,
      })
      .from(customers)
      .where(gte(customers.totalSpent, "0"));

    // Calculate outstanding payables (supplier balances)
    const payablesResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(CAST(${parties.balance} AS DECIMAL)), 0)`,
      })
      .from(parties)
      .where(gte(parties.balance, "0"));

    const totalRevenue = revenueResult[0]?.total || 0;
    const totalExpenses = expensesResult[0]?.total || 0;
    const totalPurchases = purchasesResult[0]?.total || 0;
    const outstandingReceivables = receivablesResult[0]?.total || 0;
    const outstandingPayables = payablesResult[0]?.total || 0;

    return {
      totalRevenue,
      totalExpenses,
      totalPurchases,
      netProfit: totalRevenue - totalExpenses - totalPurchases,
      outstandingReceivables,
      outstandingPayables,
    };
  }

  // Low Stock Alert System
  async getLowStockItems(): Promise<Array<{
    id: number;
    name: string;
    currentStock: number;
    minLevel: number;
    unit: string;
    supplier: string;
    shortageAmount: number;
  }>> {
    const lowStockItems = await db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        currentStock: inventoryItems.currentStock,
        minLevel: inventoryItems.minLevel,
        unit: inventoryItems.unit,
        supplier: inventoryItems.supplier,
      })
      .from(inventoryItems)
      .where(sql`CAST(${inventoryItems.currentStock} AS DECIMAL) <= CAST(${inventoryItems.minLevel} AS DECIMAL)`);

    return lowStockItems.map(item => ({
      ...item,
      currentStock: parseFloat(item.currentStock),
      minLevel: parseFloat(item.minLevel),
      supplier: item.supplier || "Unknown",
      shortageAmount: parseFloat(item.minLevel) - parseFloat(item.currentStock),
    }));
  }

  // Production Schedule with Cost Tracking
  async createProductionScheduleWithCostTracking(scheduleData: {
    productId: number;
    quantity: number;
    scheduledDate: Date;
    startTime?: Date;
    endTime?: Date;
    assignedTo?: string;
    notes?: string;
  }): Promise<{
    schedule: any;
    costBreakdown: any;
    ingredientRequirements: Array<{
      itemName: string;
      requiredQuantity: number;
      availableStock: number;
      sufficient: boolean;
    }>;
  }> {
    // Calculate production costs
    const costBreakdown = await this.calculateProductionCost(
      scheduleData.productId,
      scheduleData.quantity
    );

    // Check ingredient availability
    const ingredients = await db
      .select({
        inventoryItemId: productIngredients.inventoryItemId,
        quantity: productIngredients.quantity,
        itemName: inventoryItems.name,
        currentStock: inventoryItems.currentStock,
        unit: inventoryItems.unit,
      })
      .from(productIngredients)
      .innerJoin(
        inventoryItems,
        eq(productIngredients.inventoryItemId, inventoryItems.id)
      )
      .where(eq(productIngredients.productId, scheduleData.productId));

    const ingredientRequirements = ingredients.map(ingredient => {
      const requiredQuantity = parseFloat(ingredient.quantity) * scheduleData.quantity;
      const availableStock = parseFloat(ingredient.currentStock);
      
      return {
        itemName: ingredient.itemName,
        requiredQuantity,
        availableStock,
        sufficient: availableStock >= requiredQuantity,
      };
    });

    // Create production schedule
    const [schedule] = await db
      .insert(productionSchedule)
      .values({
        productId: scheduleData.productId,
        quantity: scheduleData.quantity,
        scheduledDate: scheduleData.scheduledDate,
        startTime: scheduleData.startTime,
        endTime: scheduleData.endTime,
        assignedTo: scheduleData.assignedTo,
        notes: scheduleData.notes,
        status: "scheduled",
      })
      .returning();

    return {
      schedule,
      costBreakdown,
      ingredientRequirements,
    };
  }

  // Helper method to get setting values
  async getSettingValue(key: string, defaultValue: string): Promise<string> {
    const [setting] = await db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, key));

    return setting?.value || defaultValue;
  }

  // Enhanced inventory management
  async processProduction(
    productionId: number,
    actualQuantity: number
  ): Promise<void> {
    // Get production schedule details
    const [production] = await db
      .select()
      .from(productionSchedule)
      .where(eq(productionSchedule.id, productionId));

    if (!production) {
      throw new Error("Production schedule not found");
    }

    // Deduct ingredients from inventory
    const ingredients = await db
      .select({
        inventoryItemId: productIngredients.inventoryItemId,
        quantity: productIngredients.quantity,
      })
      .from(productIngredients)
      .where(eq(productIngredients.productId, production.productId));

    for (const ingredient of ingredients) {
      const usedQuantity = parseFloat(ingredient.quantity) * actualQuantity;
      await this.updateInventoryStock(
        ingredient.inventoryItemId,
        usedQuantity,
        "out",
        `Production #${productionId}`,
        productionId.toString()
      );
    }

    // Update production status
    await db
      .update(productionSchedule)
      .set({
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(productionSchedule.id, productionId));
  }
}

export const enhancedStorage = new EnhancedStorage();