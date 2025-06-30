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
import { IStorage } from "./storage";

export class FixedStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = await this.getUserByEmail(userData.email);
    
    if (existingUser) {
      const [updatedUser] = await db
        .update(users)
        .set({
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          role: userData.role,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      return updatedUser;
    } else {
      const [newUser] = await db.insert(users).values(userData).returning();
      return newUser;
    }
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(asc(categories.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [result] = await db.insert(categories).values(category).returning();
    return result;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    const [result] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return result;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(asc(products.name));
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async getProductsWithIngredients(): Promise<any[]> {
    const productsData = await db.select().from(products);
    
    const result = [];
    for (const product of productsData) {
      const ingredients = await this.getProductIngredients(product.id);
      result.push({
        ...product,
        ingredients,
      });
    }
    
    return result;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [result] = await db.insert(products).values(product).returning();
    return result;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [result] = await db
      .update(products)
      .set({...product, updatedAt: new Date()})
      .where(eq(products.id, id))
      .returning();
    return result;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Product ingredients operations
  async getProductIngredients(productId: number): Promise<any[]> {
    return db
      .select({
        id: productIngredients.id,
        productId: productIngredients.productId,
        inventoryItemId: productIngredients.inventoryItemId,
        quantity: productIngredients.quantity,
        unit: productIngredients.unit,
        inventoryItemName: inventoryItems.name,
        costPerUnit: inventoryItems.costPerUnit,
      })
      .from(productIngredients)
      .innerJoin(inventoryItems, eq(productIngredients.inventoryItemId, inventoryItems.id))
      .where(eq(productIngredients.productId, productId));
  }

  async createProductIngredient(ingredient: any): Promise<any> {
    const [result] = await db.insert(productIngredients).values({
      productId: ingredient.productId,
      inventoryItemId: ingredient.inventoryItemId,
      quantity: ingredient.quantity.toString(),
      unit: ingredient.unit,
    }).returning();
    return result;
  }

  async deleteProductIngredients(productId: number): Promise<void> {
    await db.delete(productIngredients).where(eq(productIngredients.productId, productId));
  }

  // Units operations
  async getUnits() {
    return db.select().from(units).orderBy(asc(units.name));
  }

  async createUnit(data: any) {
    const [result] = await db.insert(units).values(data).returning();
    return result;
  }

  async updateUnit(id: number, data: any) {
    const [result] = await db
      .update(units)
      .set(data)
      .where(eq(units.id, id))
      .returning();
    return result;
  }

  async deleteUnit(id: number): Promise<void> {
    await db.delete(units).where(eq(units.id, id));
  }

  // Inventory operations
  async getInventoryItems() {
    return db.select().from(inventoryItems).orderBy(asc(inventoryItems.name));
  }

  async getInventoryItemById(id: number) {
    const result = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).limit(1);
    return result[0];
  }

  async createInventoryTransaction(data: any) {
    const [result] = await db.insert(inventoryTransactions).values(data).returning();
    return result;
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return db
      .select()
      .from(inventoryItems)
      .where(sql`CAST(${inventoryItems.currentStock} AS DECIMAL) <= CAST(${inventoryItems.minLevel} AS DECIMAL)`);
  }

  async createInventoryItem(data: any) {
    const insertData = {
      name: data.name,
      currentStock: data.currentStock.toString(),
      minLevel: data.minLevel.toString(),
      unit: data.unit,
      costPerUnit: data.costPerUnit.toString(),
      supplier: data.supplier,
      categoryId: data.categoryId,
      lastRestocked: data.lastRestocked,
    };
    
    const [result] = await db.insert(inventoryItems).values(insertData).returning();
    return result;
  }

  async updateInventoryItem(id: number, data: any) {
    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.currentStock !== undefined) updateData.currentStock = data.currentStock.toString();
    if (data.minLevel !== undefined) updateData.minLevel = data.minLevel.toString();
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.costPerUnit !== undefined) updateData.costPerUnit = data.costPerUnit.toString();
    if (data.supplier !== undefined) updateData.supplier = data.supplier;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.lastRestocked !== undefined) updateData.lastRestocked = data.lastRestocked;
    
    updateData.updatedAt = new Date();

    const [result] = await db
      .update(inventoryItems)
      .set(updateData)
      .where(eq(inventoryItems.id, id))
      .returning();
    return result;
  }

  async deleteInventoryItem(id: number): Promise<void> {
    await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
  }

  // Inventory category operations
  async getInventoryCategories() {
    return db.select().from(inventoryCategories).orderBy(asc(inventoryCategories.name));
  }

  async createInventoryCategory(data: any) {
    const [result] = await db.insert(inventoryCategories).values(data).returning();
    return result;
  }

  async updateInventoryCategory(id: number, data: any) {
    const [result] = await db
      .update(inventoryCategories)
      .set({...data, updatedAt: new Date()})
      .where(eq(inventoryCategories.id, id))
      .returning();
    return result;
  }

  async deleteInventoryCategory(id: number): Promise<void> {
    await db.delete(inventoryCategories).where(eq(inventoryCategories.id, id));
  }

  // Order operations
  async getOrders(): Promise<any[]> {
    return db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        customerId: orders.customerId,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        totalAmount: orders.totalAmount,
        status: orders.status,
        paymentMethod: orders.paymentMethod,
        deliveryDate: orders.deliveryDate,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: number): Promise<any> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) return null;

    const items = await this.getOrderItems(id);
    return { ...order, items };
  }

  async getRecentOrders(limit: number = 10): Promise<any[]> {
    return db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [result] = await db.insert(orders).values(order).returning();
    return result;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order> {
    const [result] = await db
      .update(orders)
      .set({...order, updatedAt: new Date()})
      .where(eq(orders.id, id))
      .returning();
    return result;
  }

  async deleteOrder(id: number): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }

  // Order items operations
  async getOrderItems(orderId: number): Promise<any[]> {
    return db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
        productName: products.name,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [result] = await db.insert(orderItems).values(item).returning();
    return result;
  }

  async deleteOrderItems(orderId: number): Promise<void> {
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
  }

  // Production schedule operations
  async getProductionSchedule(): Promise<any[]> {
    return db
      .select({
        id: productionSchedule.id,
        productId: productionSchedule.productId,
        quantity: productionSchedule.quantity,
        scheduledDate: productionSchedule.scheduledDate,
        startTime: productionSchedule.startTime,
        endTime: productionSchedule.endTime,
        assignedTo: productionSchedule.assignedTo,
        notes: productionSchedule.notes,
        status: productionSchedule.status,
        productName: products.name,
      })
      .from(productionSchedule)
      .innerJoin(products, eq(productionSchedule.productId, products.id))
      .orderBy(desc(productionSchedule.scheduledDate));
  }

  async getTodayProductionSchedule(): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return db
      .select({
        id: productionSchedule.id,
        productId: productionSchedule.productId,
        quantity: productionSchedule.quantity,
        scheduledDate: productionSchedule.scheduledDate,
        startTime: productionSchedule.startTime,
        endTime: productionSchedule.endTime,
        assignedTo: productionSchedule.assignedTo,
        notes: productionSchedule.notes,
        status: productionSchedule.status,
        productName: products.name,
      })
      .from(productionSchedule)
      .innerJoin(products, eq(productionSchedule.productId, products.id))
      .where(
        and(
          gte(productionSchedule.scheduledDate, today),
          lte(productionSchedule.scheduledDate, tomorrow)
        )
      );
  }

  async createProductionScheduleItem(item: any): Promise<any> {
    const [result] = await db.insert(productionSchedule).values(item).returning();
    return result;
  }

  async updateProductionScheduleItem(id: number, item: any): Promise<any> {
    const [result] = await db
      .update(productionSchedule)
      .set({...item, updatedAt: new Date()})
      .where(eq(productionSchedule.id, id))
      .returning();
    return result;
  }

  async deleteProductionScheduleItem(id: number): Promise<void> {
    await db.delete(productionSchedule).where(eq(productionSchedule.id, id));
  }

  // Inventory transaction operations
  async createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction> {
    const [result] = await db.insert(inventoryTransactions).values(transaction).returning();
    return result;
  }

  async getInventoryTransactions(itemId?: number): Promise<any[]> {
    let query = db
      .select({
        id: inventoryTransactions.id,
        inventoryItemId: inventoryTransactions.inventoryItemId,
        type: inventoryTransactions.type,
        quantity: inventoryTransactions.quantity,
        reason: inventoryTransactions.reason,
        reference: inventoryTransactions.reference,
        createdAt: inventoryTransactions.createdAt,
        itemName: inventoryItems.name,
      })
      .from(inventoryTransactions)
      .innerJoin(inventoryItems, eq(inventoryTransactions.inventoryItemId, inventoryItems.id));

    if (itemId) {
      query = query.where(eq(inventoryTransactions.inventoryItemId, itemId));
    }

    return query.orderBy(desc(inventoryTransactions.createdAt));
  }

  // Analytics operations
  async getDashboardStats(): Promise<any> {
    // Get total orders
    const totalOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders);
    
    // Get total revenue from completed orders
    const totalRevenueResult = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)` 
      })
      .from(orders)
      .where(eq(orders.status, "completed"));

    // Get pending orders
    const pendingOrdersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.status, "pending"));

    // Get low stock items count
    const lowStockResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryItems)
      .where(sql`CAST(${inventoryItems.currentStock} AS DECIMAL) <= CAST(${inventoryItems.minLevel} AS DECIMAL)`);

    return {
      totalOrders: totalOrdersResult[0]?.count || 0,
      totalRevenue: totalRevenueResult[0]?.total || 0,
      pendingOrders: pendingOrdersResult[0]?.count || 0,
      lowStockItems: lowStockResult[0]?.count || 0,
    };
  }

  async getSalesAnalytics(startDate?: Date, endDate?: Date): Promise<any> {
    let query = db
      .select({
        date: sql<string>`DATE(${orders.createdAt})`,
        totalSales: sql<number>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
        orderCount: sql<number>`count(*)`,
      })
      .from(orders)
      .where(eq(orders.status, "completed"));

    if (startDate && endDate) {
      query = query.where(
        and(
          gte(orders.createdAt, startDate),
          lte(orders.createdAt, endDate)
        )
      );
    }

    const dailySales = await query.groupBy(sql`DATE(${orders.createdAt})`);

    return { dailySales };
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return db.select().from(customers).orderBy(asc(customers.name));
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return result[0];
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [result] = await db.insert(customers).values({
      ...customer,
      totalSpent: customer.totalSpent?.toString() || "0",
    }).returning();
    return result;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer> {
    const updateData: any = { ...customer };
    if (updateData.totalSpent !== undefined) {
      updateData.totalSpent = updateData.totalSpent.toString();
    }
    updateData.updatedAt = new Date();

    const [result] = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();
    return result;
  }

  async deleteCustomer(id: number): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Parties operations
  async getParties(): Promise<Party[]> {
    return db.select().from(parties).orderBy(asc(parties.name));
  }

  async createParty(party: InsertParty): Promise<Party> {
    const [result] = await db.insert(parties).values({
      ...party,
      balance: party.balance?.toString() || "0",
    }).returning();
    return result;
  }

  async updateParty(id: number, party: Partial<InsertParty>): Promise<Party> {
    const updateData: any = { ...party };
    if (updateData.balance !== undefined) {
      updateData.balance = updateData.balance.toString();
    }
    updateData.updatedAt = new Date();

    const [result] = await db
      .update(parties)
      .set(updateData)
      .where(eq(parties.id, id))
      .returning();
    return result;
  }

  async deleteParty(id: number): Promise<void> {
    await db.delete(parties).where(eq(parties.id, id));
  }

  // Assets operations
  async getAssets(): Promise<any[]> {
    return db.select().from(assets).orderBy(desc(assets.createdAt));
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const [result] = await db.insert(assets).values(asset).returning();
    return result;
  }

  async updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset> {
    const [result] = await db
      .update(assets)
      .set({...asset, updatedAt: new Date()})
      .where(eq(assets.id, id))
      .returning();
    return result;
  }

  async deleteAsset(id: number): Promise<void> {
    await db.delete(assets).where(eq(assets.id, id));
  }

  // Purchase operations
  async getPurchases(): Promise<any[]> {
    return db.select().from(purchases).orderBy(desc(purchases.purchaseDate));
  }

  async createPurchase(purchaseData: any): Promise<any> {
    const [result] = await db.insert(purchases).values({
      ...purchaseData,
      totalAmount: purchaseData.totalAmount.toString(),
    }).returning();
    return result;
  }

  async updatePurchase(id: number, purchaseData: any): Promise<any> {
    const updateData: any = { ...purchaseData };
    if (updateData.totalAmount !== undefined) {
      updateData.totalAmount = updateData.totalAmount.toString();
    }

    const [result] = await db
      .update(purchases)
      .set(updateData)
      .where(eq(purchases.id, id))
      .returning();
    return result;
  }

  async deletePurchase(id: number): Promise<void> {
    await db.delete(purchases).where(eq(purchases.id, id));
  }

  // Expense operations
  async getExpenses(): Promise<Expense[]> {
    return db.select().from(expenses).orderBy(desc(expenses.date));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [result] = await db.insert(expenses).values(expense).returning();
    return result;
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense> {
    const [result] = await db
      .update(expenses)
      .set(expense)
      .where(eq(expenses.id, id))
      .returning();
    return result;
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  // Bills operations
  async getBills(): Promise<any[]> {
    return [];
  }

  async createBill(bill: any): Promise<any> {
    return bill;
  }

  async deleteBill(id: number): Promise<void> {
    // Implementation needed
  }

  // Settings operations
  async getSettings(): Promise<any> {
    const settingsResult = await db.select().from(settings);
    const settingsObj: any = {};
    settingsResult.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    return settingsObj;
  }

  async updateSettings(settingsData: any): Promise<any> {
    for (const [key, value] of Object.entries(settingsData)) {
      await this.updateOrCreateSetting(key, value as string);
    }
    return settingsData;
  }

  async updateOrCreateSetting(key: string, value: string): Promise<any> {
    const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    
    if (existing.length > 0) {
      const [result] = await db
        .update(settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(settings.key, key))
        .returning();
      return result;
    } else {
      const [result] = await db.insert(settings).values({ key, value }).returning();
      return result;
    }
  }

  async getProductionScheduleByDate(date: string): Promise<any[]> {
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return db
      .select({
        id: productionSchedule.id,
        productId: productionSchedule.productId,
        quantity: productionSchedule.quantity,
        scheduledDate: productionSchedule.scheduledDate,
        startTime: productionSchedule.startTime,
        endTime: productionSchedule.endTime,
        assignedTo: productionSchedule.assignedTo,
        notes: productionSchedule.notes,
        status: productionSchedule.status,
        productName: products.name,
      })
      .from(productionSchedule)
      .innerJoin(products, eq(productionSchedule.productId, products.id))
      .where(
        and(
          gte(productionSchedule.scheduledDate, targetDate),
          lte(productionSchedule.scheduledDate, nextDay)
        )
      );
  }

  // User management methods
  async getAllUsers(): Promise<any[]> {
    return db.select().from(users).orderBy(asc(users.email));
  }

  async updateUser(id: string, data: any): Promise<any> {
    const [result] = await db
      .update(users)
      .set({...data, updatedAt: new Date()})
      .where(eq(users.id, id))
      .returning();
    return result;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Media operations
  async getMediaItems(): Promise<any[]> {
    return [];
  }

  async uploadMedia(file: any, userId: string): Promise<any> {
    return { id: Date.now().toString(), filename: file.name, userId };
  }

  async deleteMedia(id: string): Promise<void> {
    // Implementation needed
  }
}

export const fixedStorage = new FixedStorage();