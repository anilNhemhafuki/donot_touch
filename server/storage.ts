import {
  users,
  categories,
  products,
  inventoryItems,
  inventoryCategories,
  units,
  productIngredients,
  orders,
  orderItems,
  productionSchedule,
  inventoryTransactions,
  customers,
  parties,
  assets,
  expenses,
  bills,
  billItems,
  settings,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type InventoryItem,
  type InsertInventoryItem,
  type InventoryCategory,
  type InsertInventoryCategory,
  type Unit,
  type InsertUnit,
  type ProductIngredient,
  type InsertProductIngredient,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type ProductionScheduleItem,
  type InsertProductionScheduleItem,
  type InventoryTransaction,
  type InsertInventoryTransaction,
  type Customer,
  type InsertCustomer,
  type Party,
  type InsertParty,
  type Asset,
  type InsertAsset,
  type Expense,
  type InsertExpense,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, gte, lte, sql, like } from "drizzle-orm";
import bcrypt from "bcrypt";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(
    id: number,
    category: Partial<InsertCategory>,
  ): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductsWithIngredients(): Promise<any[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Product ingredients operations
  getProductIngredients(productId: number): Promise<ProductIngredient[]>;
  createProductIngredient(
    ingredient: InsertProductIngredient,
  ): Promise<ProductIngredient>;
  deleteProductIngredients(productId: number): Promise<void>;

  // Units operations
  getUnits(): Promise<Unit[]>;
  createUnit(unit: InsertUnit): Promise<Unit>;
  updateUnit(id: number, unit: Partial<InsertUnit>): Promise<Unit>;
  deleteUnit(id: number): Promise<void>;

  // Inventory operations
  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItemById(id: number): Promise<InventoryItem | undefined>;
  getLowStockItems(): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(
    id: number,
    item: Partial<InsertInventoryItem>,
  ): Promise<InventoryItem>;
  deleteInventoryItem(id: number): Promise<void>;

  // Inventory category operations
  getInventoryCategories(): Promise<InventoryCategory[]>;
  createInventoryCategory(category: InsertInventoryCategory): Promise<InventoryCategory>;
  updateInventoryCategory(
    id: number,
    category: Partial<InsertInventoryCategory>,
  ): Promise<InventoryCategory>;
  deleteInventoryCategory(id: number): Promise<void>;

  // Order operations
  getOrders(): Promise<any[]>;
  getOrderById(id: number): Promise<any>;
  getRecentOrders(limit?: number): Promise<any[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order>;
  deleteOrder(id: number): Promise<void>;

  // Order items operations
  getOrderItems(orderId: number): Promise<any[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  deleteOrderItems(orderId: number): Promise<void>;

  // Production schedule operations
  getProductionSchedule(): Promise<any[]>;
  getTodayProductionSchedule(): Promise<any[]>;
  createProductionScheduleItem(
    item: InsertProductionScheduleItem,
  ): Promise<ProductionScheduleItem>;
  updateProductionScheduleItem(
    id: number,
    item: Partial<InsertProductionScheduleItem>,
  ): Promise<ProductionScheduleItem>;
  deleteProductionScheduleItem(id: number): Promise<void>;

  // Inventory transaction operations
  createInventoryTransaction(
    transaction: InsertInventoryTransaction,
  ): Promise<InventoryTransaction>;
  getInventoryTransactions(itemId?: number): Promise<any[]>;

  // Analytics operations
  getDashboardStats(): Promise<any>;
  getSalesAnalytics(startDate?: Date, endDate?: Date): Promise<any>;

  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(
    id: number,
    customer: Partial<InsertCustomer>,
  ): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;

  // Parties operations
  getParties(): Promise<Party[]>;
  createParty(party: InsertParty): Promise<Party>;
  updateParty(id: number, party: Partial<InsertParty>): Promise<Party>;
  deleteParty(id: number): Promise<void>;

  // Assets operations
  getAssets(): Promise<Asset[]>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset>;
  deleteAsset(id: number): Promise<void>;

  // Expense operations
  getExpenses(): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;

  // Bills operations
  getBills(): Promise<any[]>;
  createBill(bill: any): Promise<any>;
  deleteBill(id: number): Promise<void>;

  // Settings operations
  getSettings(): Promise<any>;
  updateSettings(settings: any): Promise<any>;
  updateOrCreateSetting(key: string, value: string): Promise<any>;
  getProductionScheduleByDate(date: string): Promise<any[]>;

  // User management methods
  getAllUsers(): Promise<any[]>;
  updateUser(id: string, data: any): Promise<any>;
  deleteUser(id: string): Promise<void>;

  //Unit
  getUnits(): Promise<Unit[]>;
  createUnit(data: InsertUnit): Promise<Unit>;

  // Media operations
  getMediaItems(): Promise<any[]>;
  uploadMedia(file: any, userId: string): Promise<any>;
  deleteMedia(id: string): Promise<void>;
}

export class Storage {
  async getUser(id: string): Promise<User | undefined> {
    const user = await this.getUserById(id);
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return result[0] || undefined;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return null;
    }
  }

  async getUserById(id: string) {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return null;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async updateCategory(
    id: number,
    category: Partial<InsertCategory>,
  ): Promise<Category> {
    const [updated] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updated;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(asc(products.name));
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product;
  }

  async getProductsWithIngredients(): Promise<any[]> {
    return await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        cost: products.cost,
        margin: products.margin,
        sku: products.sku,
        categoryName: categories.name,
        categoryId: products.categoryId,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.isActive, true))
      .orderBy(asc(products.name));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async updateProduct(
    id: number,
    product: Partial<InsertProduct>,
  ): Promise<Product> {
    const [updated] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, id));
  }

  // Product ingredients operations
  async getProductIngredients(productId: number): Promise<any[]> {
    return await db
      .select({
        id: productIngredients.id,
        createdAt: productIngredients.createdAt,
        productId: productIngredients.productId,
        inventoryItemId: productIngredients.inventoryItemId,
        quantity: productIngredients.quantity,
        ingredientName: inventoryItems.name,
        unit: inventoryItems.unit,
        costPerUnit: inventoryItems.costPerUnit,
      })
      .from(productIngredients)
      .innerJoin(
        inventoryItems,
        eq(productIngredients.inventoryItemId, inventoryItems.id),
      )
      .where(eq(productIngredients.productId, productId));
  }

  async createProductIngredient(
    ingredient: InsertProductIngredient,
  ): Promise<ProductIngredient> {
    const [created] = await db
      .insert(productIngredients)
      .values(ingredient)
      .returning();
    return created;
  }

  async deleteProductIngredients(productId: number): Promise<void> {
    await db
      .delete(productIngredients)
      .where(eq(productIngredients.productId, productId));
  }

  // Inventory operations
  async getUnits() {
    return await db
      .select()
      .from(units)
      .orderBy(units.name);
  }

  async createUnit(data: InsertUnit) {
    const [unit] = await db.insert(units).values(data).returning();
    return unit;
  }

  async updateUnit(id: number, data: Partial<InsertUnit>) {
    const [unit] = await db
      .update(units)
      .set(data)
      .where(eq(units.id, id))
      .returning();
    return unit;
  }

  async deleteUnit(id: number): Promise<void> {
    await db.delete(units).where(eq(units.id, id));
  }

  async getInventoryItems() {
    return await db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        categoryId: inventoryItems.categoryId,
        currentStock: inventoryItems.currentStock,
        minLevel: inventoryItems.minLevel,
        unit: inventoryItems.unit,
        unitId: inventoryItems.unitId,
        costPerUnit: inventoryItems.costPerUnit,
        supplier: inventoryItems.supplier,
        company: inventoryItems.company,
        lastRestocked: inventoryItems.lastRestocked,
        dateAdded: inventoryItems.dateAdded,
        dateUpdated: inventoryItems.dateUpdated,
        createdAt: inventoryItems.createdAt,
        updatedAt: inventoryItems.updatedAt,
        unitName: units.name,
        unitAbbreviation: units.abbreviation,
        categoryName: inventoryCategories.name,
      })
      .from(inventoryItems)
      .leftJoin(units, eq(inventoryItems.unitId, units.id))
      .leftJoin(inventoryCategories, eq(inventoryItems.categoryId, inventoryCategories.id))
      .orderBy(inventoryItems.name);
  }

  async getInventoryItemById(id: number): Promise<InventoryItem | undefined> {
    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id));
    return item;
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return await db
      .select()
      .from(inventoryItems)
      .where(sql`${inventoryItems.currentStock} <= ${inventoryItems.minLevel}`)
      .orderBy(asc(inventoryItems.name));
  }

  async createInventoryItem(data: any) {
    const inventoryData = {
      name: data.name,
      currentStock: data.currentStock,
      minLevel: data.minLevel || 0,
      unit: data.unit,
      costPerUnit: data.costPerUnit,
      supplier: data.supplier || null,
      company: data.company || null,
      // New fields
      unitId: data.unitId || null,
      defaultPrice: data.defaultPrice || 0,
      group: data.group || null,
      openingQuantity: data.openingQuantity || 0,
      openingRate: data.openingRate || 0,
      openingValue: data.openingValue || 0,
      location: data.location || null,
      notes: data.notes || null,
      dateAdded: data.dateAdded || new Date().toISOString(),
      lastRestocked: data.lastRestocked || new Date().toISOString(),
    };
    return await db.insert(inventoryItems).values(inventoryData).returning();
  }

  async updateInventoryItem(id: number, data: any) {
    const updateData = {
      name: data.name,
      currentStock: data.currentStock,
      minLevel: data.minLevel,
      unit: data.unit,
      costPerUnit: data.costPerUnit,
      supplier: data.supplier,
      company: data.company,
      // New fields
      unitId: data.unitId,
      defaultPrice: data.defaultPrice,
      group: data.group,
      openingQuantity: data.openingQuantity,
      openingRate: data.openingRate,
      openingValue: data.openingValue,
      location: data.location,
      notes: data.notes,
      dateUpdated: data.dateUpdated || new Date().toISOString(),
    };
    return await db
      .update(inventoryItems)
      .set(updateData)
      .where(eq(inventoryItems.id, id))
      .returning();
  }

  // Inventory category operations
  async getInventoryCategories(): Promise<InventoryCategory[]> {
    return await db
      .select()
      .from(inventoryCategories)
      .where(eq(inventoryCategories.isActive, true))
      .orderBy(inventoryCategories.name);
  }

  async createInventoryCategory(data: InsertInventoryCategory): Promise<InventoryCategory> {
    const [category] = await db.insert(inventoryCategories).values(data).returning();
    return category;
  }

  async updateInventoryCategory(id: number, data: Partial<InsertInventoryCategory>): Promise<InventoryCategory> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    const [category] = await db
      .update(inventoryCategories)
      .set(updateData)
      .where(eq(inventoryCategories.id, id))
      .returning();
    return category;
  }

  async deleteInventoryCategory(id: number): Promise<void> {
    await db.delete(inventoryCategories).where(eq(inventoryCategories.id, id));
  }

  // Order operations
  async getOrders(): Promise<any[]> {
    return await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        status: orders.status,
        totalAmount: orders.totalAmount,
        orderDate: orders.orderDate,
        dueDate: orders.dueDate,
        notes: orders.notes,
        createdBy: orders.createdBy,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .orderBy(desc(orders.orderDate));
  }

  async getOrderById(id: number): Promise<any> {
    const [order] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
        customerPhone: orders.customerPhone,
        status: orders.status,
        totalAmount: orders.totalAmount,
        orderDate: orders.orderDate,
        dueDate: orders.dueDate,
        notes: orders.notes,
        createdBy: orders.createdBy,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(eq(orders.id, id));
    return order;
  }

  async getRecentOrders(limit: number = 10): Promise<any[]> {
    return await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        status: orders.status,
        totalAmount: orders.totalAmount,
        orderDate: orders.orderDate,
      })
      .from(orders)
      .orderBy(desc(orders.orderDate))
      .limit(limit);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order> {
    const [updated] = await db
      .update(orders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async deleteOrder(id: number): Promise<void> {
    await db.delete(orders).where(eq(orders.id, id));
  }

  // Order items operations
  async getOrderItems(orderId: number): Promise<any[]> {
    return await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        productName: products.name,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [created] = await db.insert(orderItems).values(item).returning();
    return created;
  }

  async deleteOrderItems(orderId: number): Promise<void> {
    await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
  }

  // Production schedule operations
  async getProductionSchedule(): Promise<any[]> {
    return await db
      .select({
        id: productionSchedule.id,
        productId: productionSchedule.productId,
        productName: products.name,
        quantity: productionSchedule.quantity,
        scheduledDate: productionSchedule.scheduledDate,
        startTime: productionSchedule.startTime,
        endTime: productionSchedule.endTime,
        status: productionSchedule.status,
        assignedTo: productionSchedule.assignedTo,
        assignedUserName: users.firstName,
        notes: productionSchedule.notes,
      })
      .from(productionSchedule)
      .innerJoin(products, eq(productionSchedule.productId, products.id))
      .leftJoin(users, eq(productionSchedule.assignedTo, users.id))
      .orderBy(asc(productionSchedule.scheduledDate));
  }

  async getTodayProductionSchedule(): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db
      .select({
        id: productionSchedule.id,
        productId: productionSchedule.productId,
        productName: products.name,
        quantity: productionSchedule.quantity,
        scheduledDate: productionSchedule.scheduledDate,
        startTime: productionSchedule.startTime,
        endTime: productionSchedule.endTime,
        status: productionSchedule.status,
        assignedTo: productionSchedule.assignedTo,
        assignedUserName: users.firstName,
        notes: productionSchedule.notes,
      })
      .from(productionSchedule)
      .innerJoin(products, eq(productionSchedule.productId, products.id))
      .leftJoin(users, eq(productionSchedule.assignedTo, users.id))
      .where(
        and(
          gte(productionSchedule.scheduledDate, today),
          lte(productionSchedule.scheduledDate, tomorrow),
        ),
      )
      .orderBy(asc(productionSchedule.startTime));
  }

  async createProductionScheduleItem(
    item: InsertProductionScheduleItem,
  ): Promise<ProductionScheduleItem> {
    const [created] = await db
      .insert(productionSchedule)
      .values(item)
      .returning();
    return created;
  }

  async updateProductionScheduleItem(
    id: number,
    item: Partial<InsertProductionScheduleItem>,
  ): Promise<ProductionScheduleItem> {
    const [updated] = await db
      .update(productionSchedule)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(productionSchedule.id, id))
      .returning();
    return updated;
  }

  async deleteProductionScheduleItem(id: number): Promise<void> {
    await db.delete(productionSchedule).where(eq(productionSchedule.id, id));
  }

  // Inventory transaction operations
  async createInventoryTransaction(
    transaction: InsertInventoryTransaction,
  ): Promise<InventoryTransaction> {
    const [created] = await db
      .insert(inventoryTransactions)
      .values(transaction)
      .returning();
    return created;
  }

  async getInventoryTransactions(itemId?: number): Promise<any[]> {
    const query = db
      .select({
        id: inventoryTransactions.id,
        inventoryItemId: inventoryTransactions.inventoryItemId,
        itemName: inventoryItems.name,
        type: inventoryTransactions.type,
        quantity: inventoryTransactions.quantity,
        reason: inventoryTransactions.reason,
        reference: inventoryTransactions.reference,
        createdBy: inventoryTransactions.createdBy,
        createdByName: users.firstName,
        createdAt: inventoryTransactions.createdAt,
      })
      .from(inventoryTransactions)
      .innerJoin(
        inventoryItems,
        eq(inventoryTransactions.inventoryItemId, inventoryItems.id),
      )
      .leftJoin(users, eq(inventoryTransactions.createdBy, users.id));

    if (itemId) {
      return await query
        .where(eq(inventoryTransactions.inventoryItemId, itemId))
        .orderBy(desc(inventoryTransactions.createdAt));
    }

    return await query.orderBy(desc(inventoryTransactions.createdAt));
  }

  // Analytics operations
  async getDashboardStats(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's sales
    const [todaySalesResult] = await db
      .select({
        totalSales: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
        orderCount: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(
        and(
          gte(orders.orderDate, today),
          lte(orders.orderDate, tomorrow),
          eq(orders.status, "completed"),
        ),
      );

    // Total products in stock
    const [stockResult] = await db
      .select({
        totalProducts: sql<number>`COUNT(*)`,
        lowStockCount: sql<number>`COUNT(*) FILTER (WHERE ${inventoryItems.currentStock} <= ${inventoryItems.minLevel})`,
      })
      .from(inventoryItems);

    // Today's production
    const [productionResult] = await db
      .select({
        completedItems: sql<number>`COALESCE(SUM(${productionSchedule.quantity}), 0)`,
      })
      .from(productionSchedule)
      .where(
        and(
          gte(productionSchedule.scheduledDate, today),
          lte(productionSchedule.scheduledDate, tomorrow),
          eq(productionSchedule.status, "completed"),
        ),
      );

    return {
      todaySales: Number(todaySalesResult.totalSales),
      todayOrders: Number(todaySalesResult.orderCount),
      productsInStock: Number(stockResult.totalProducts),
      lowStockItems: Number(stockResult.lowStockCount),
      productionToday: Number(productionResult.completedItems),
    };
  }

  async getSalesAnalytics(startDate?: Date, endDate?: Date): Promise<any> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate || new Date();

    const salesData = await db
      .select({
        date: sql<string>`DATE(${orders.orderDate})`,
        totalSales: sql<number>`SUM(${orders.totalAmount})`,
        orderCount: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(
        and(
          gte(orders.orderDate, start),
          lte(orders.orderDate, end),
          eq(orders.status, "completed"),
        ),
      )
      .groupBy(sql`DATE(${orders.orderDate})`)
      .orderBy(sql`DATE(${orders.orderDate})`);

    // Top selling products
    const topProducts = await db
      .select({
        productName: products.name,
        totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
        totalRevenue: sql<number>`SUM(${orderItems.totalPrice})`,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          gte(orders.orderDate, start),
          lte(orders.orderDate, end),
          eq(orders.status, "completed"),
        ),
      )
      .groupBy(products.id, products.name)
      .orderBy(desc(sql`SUM(${orderItems.totalPrice})`))
      .limit(10);

    return {
      salesData: salesData.map((row) => ({
        date: row.date,
        sales: Number(row.totalSales),
        orders: Number(row.orderCount),
      })),
      topProducts: topProducts.map((row) => ({
        name: row.productName,
        quantity: Number(row.totalQuantity),
        revenue: Number(row.totalRevenue),
      })),
    };
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(asc(customers.name));
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(customers).values(customer).returning();
    return created;
  }

  async updateCustomer(
    id: number,
    customer: Partial<InsertCustomer>,
  ): Promise<Customer> {
    const [updated] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  async deleteCustomer(id: number): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Parties operations
  async getParties(): Promise<Party[]> {
    return await db.select().from(parties).orderBy(asc(parties.name));
  }

  async createParty(party: InsertParty): Promise<Party> {
    const [created] = await db.insert(parties).values(party).returning();
    return created;
  }

  async updateParty(id: number, party: Partial<InsertParty>): Promise<Party> {
    const [updated] = await db
      .update(parties)
      .set({ ...party, updatedAt: new Date() })
      .where(eq(parties.id, id))
      .returning();
    return updated;
  }

  async deleteParty(id: number): Promise<void> {
    await db.delete(parties).where(eq(parties.id, id));
  }

  // Assets operations
  async getAssets(): Promise<any[]> {
    return await db
      .select({
        id: assets.id,
        name: assets.name,
        category: assets.category,
        description: assets.description,
        location: assets.location,
        condition: assets.condition,
        purchaseDate: assets.purchaseDate,
        purchasePrice: assets.purchasePrice,
        currentValue: assets.currentValue,
        isActive: assets.isActive,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
      })
      .from(assets)
      .where(eq(assets.isActive, true))
      .orderBy(desc(assets.createdAt));
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const [created] = await db.insert(assets).values(asset).returning();
    return created;
  }

  async updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset> {
    const [updated] = await db
      .update(assets)
      .set({ ...asset, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return updated;
  }

  async deleteAsset(id: number): Promise<void> {
    await db
      .update(assets)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(assets.id, id));
  }

  // Expense operations
  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.date));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [created] = await db.insert(expenses).values(expense).returning();
    return created;
  }

  async updateExpense(
    id: number,
    expense: Partial<InsertExpense>,
  ): Promise<Expense> {
    const [updated] = await db
      .update(expenses)
      .set({ ...expense, updatedAt: new Date() })
      .where(eq(expenses.id, id))
      .returning();
    return updated;
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  // User management methods
  async getAllUsers(): Promise<User[]> {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,        })
        .from(users);
      return allUsers;
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Bills operations
  async getBills(): Promise<any[]> {
    try {
      return await db.select().from(bills).orderBy(desc(bills.createdAt));
    } catch (error) {
      console.error("Error getting bills:", error);
      return [];
    }
  }

  async createBill(bill: any): Promise<any> {
    const [created] = await db.insert(bills).values(bill).returning();
    return created;
  }

  async deleteBill(id: number): Promise<void> {
    await db.delete(bills).where(eq(bills.id, id));
  }

  // Settings operations
  async getSettings(): Promise<any> {
    try {
      const result = await db.select().from(settings);
      const settingsObj: any = {};

      result.forEach((setting) => {
        let value: any = setting.value;

        // Parse based on type
        if (setting.type === "boolean") {
          value = value === "true";
        } else if (setting.type === "number") {
          value = parseFloat(value || "0");
        } else if (setting.type === "json") {
          try {
            value = JSON.parse(value || "{}");
          } catch {
            value = {};
          }
        }

        settingsObj[setting.key] = value;
      });

      return settingsObj;
    } catch (error) {
      console.error("Error getting settings:", error);
      return {};
    }
  }

  async updateSettings(settingsData: any): Promise<any> {
    try {
      const updatedSettings: any = {};

      for (const [key, value] of Object.entries(settingsData)) {
        if (value !== undefined && value !== null) {
          await this.updateOrCreateSetting(key, String(value));
          updatedSettings[key] = value;
        }
      }

      return await this.getSettings();
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  }

  async updateOrCreateSetting(key: string, value: string): Promise<any> {
    try {
      const existing = await db
        .select()
        .from(settings)
        .where(eq(settings.key, key))
        .limit(1);

      if (existing.length > 0) {
        const [updated] = await db
          .update(settings)
          .set({ value, updatedAt: new Date() })
          .where(eq(settings.key, key))
          .returning();
        return updated;
      } else {
        const [created] = await db
          .insert(settings)
          .values({
            key,
            value,
            type: "string",
          })
          .returning();
        return created;
      }
    } catch (error) {
      console.error("Error updating/creating setting:", error);
      throw error;
    }
  }

  async getProductionScheduleByDate(date: string): Promise<any[]> {
    try {
      const scheduleDate = new Date(date);
      const nextDay = new Date(scheduleDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const result = await db
        .select({
          id: productionSchedule.id,
          productId: productionSchedule.productId,
          productName: products.name,
          scheduledDate: productionSchedule.scheduledDate,
          targetAmount: productionSchedule.targetAmount,
          unit: productionSchedule.unit,
          targetPackets: productionSchedule.targetPackets,
          priority: productionSchedule.priority,
          status: productionSchedule.status,
          notes: productionSchedule.notes,
          assignedTo: productionSchedule.assignedTo,
        })
        .from(productionSchedule)
        .leftJoin(products, eq(productionSchedule.productId, products.id))
        .where(
          and(
            gte(productionSchedule.scheduledDate, scheduleDate),
            lte(productionSchedule.scheduledDate, nextDay),
          ),
        )
        .orderBy(asc(productionSchedule.scheduledDate));

      return result;
    } catch (error) {
      console.error("Error getting production schedule by date:", error);
      return [];
    }
  }

  async ensureDefaultAdmin(): Promise<void> {
    try {
      console.log("🔄 Ensuring default users exist...");

      const defaultUsers = [
        {
          id: "admin_default",
          email: "admin@sweetreats.com",
          password: await bcrypt.hash("admin123", 10),
          firstName: "Admin",
          lastName: "User",
          role: "admin",
        },
        {
          id: "manager_default",
          email: "manager@sweetreats.com",
          password: await bcrypt.hash("manager123", 10),
          firstName: "Manager",
          lastName: "User",
          role: "manager",
        },
        {
          id: "staff_default",
          email: "staff@sweetreats.com",
          password: await bcrypt.hash("staff123", 10),
          firstName: "Staff",
          lastName: "User",
          role: "staff",
        },
      ];

      for (const user of defaultUsers) {
        try {
          const existingUser = await this.getUserByEmail(user.email);
          if (!existingUser) {
            await db.insert(users).values(user);
            console.log(`✅ Created ${user.role} user: ${user.email}`);
          } else {
            console.log(`✅ ${user.role} user already exists: ${user.email}`);
          }
        } catch (error) {
          console.log(`⚠️  Could not create ${user.role} user:`, error.message);
        }
      }
    } catch (error) {
      console.error("❌ Error ensuring default users:", error);
      throw error;
    }
  }

  // Media management methods
  async getMediaItems(): Promise<any[]> {
    try {
      // For now, return mock data since we need to set up Object Storage
      // In a real implementation, this would fetch from Object Storage
      return [];
    } catch (error) {
      console.error("Error getting media items:", error);
      return [];
    }
  }

  async uploadMedia(file: any, userId: string): Promise<any> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const filename = `product_${timestamp}.${extension}`;

      // For development, we'll store files locally and return a mock response
      // In production, this would upload to Object Storage
      const mediaItem = {
        id: `media_${timestamp}`,
        filename: file.name,
        url: `/uploads/${filename}`,
        size: file.size,
        contentType: file.mimetype,
        uploadedAt: new Date().toISOString(),
        uploadedBy: userId
      };

      console.log("Mock media upload:", mediaItem);
      return mediaItem;
    } catch (error) {
      console.error("Error uploading media:", error);
      throw error;
    }
  }

  async deleteMedia(id: string): Promise<void> {
    try {
      // In a real implementation, this would delete from Object Storage
      console.log("Mock media delete:", id);
    } catch (error) {
      console.error("Error deleting media:", error);
      throw error;
    }
  }
}

export const storage = new Storage();