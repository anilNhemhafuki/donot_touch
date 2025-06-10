import {
  categories,
  products,
  inventoryItems,
  productIngredients,
  orders,
  orderItems,
  productionSchedule,
  inventoryTransactions,
  customers,
  parties,
  assets,
  expenses,
  users,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type InventoryItem,
  type InsertInventoryItem,
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
  type User,
  type UpsertUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, gte, lte, sql, like } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
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
  createProductIngredient(ingredient: InsertProductIngredient): Promise<ProductIngredient>;
  deleteProductIngredients(productId: number): Promise<void>;

  // Inventory operations
  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItemById(id: number): Promise<InventoryItem | undefined>;
  getLowStockItems(): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem>;
  deleteInventoryItem(id: number): Promise<void>;

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
  createProductionScheduleItem(item: InsertProductionScheduleItem): Promise<ProductionScheduleItem>;
  updateProductionScheduleItem(id: number, item: Partial<InsertProductionScheduleItem>): Promise<ProductionScheduleItem>;
  deleteProductionScheduleItem(id: number): Promise<void>;

  // Inventory transaction operations
  createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction>;
  getInventoryTransactions(itemId?: number): Promise<any[]>;

  // Analytics operations
  getDashboardStats(): Promise<any>;
  getSalesAnalytics(startDate?: Date, endDate?: Date): Promise<any>;

  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
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

  // User management methods
  getAllUsers(): Promise<any[]>;
  updateUser(id: string, data: any): Promise<any>;
  deleteUser(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
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

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
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
    return await db.select().from(products).where(eq(products.isActive, true)).orderBy(asc(products.name));
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
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

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updated] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
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
      .innerJoin(inventoryItems, eq(productIngredients.inventoryItemId, inventoryItems.id))
      .where(eq(productIngredients.productId, productId));
  }

  async createProductIngredient(ingredient: InsertProductIngredient): Promise<ProductIngredient> {
    const [created] = await db.insert(productIngredients).values(ingredient).returning();
    return created;
  }

  async deleteProductIngredients(productId: number): Promise<void> {
    await db.delete(productIngredients).where(eq(productIngredients.productId, productId));
  }

  // Inventory operations
  async getInventoryItems(): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems).orderBy(asc(inventoryItems.name));
  }

  async getInventoryItemById(id: number): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return item;
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return await db
      .select()
      .from(inventoryItems)
      .where(sql`${inventoryItems.currentStock} <= ${inventoryItems.minLevel}`)
      .orderBy(asc(inventoryItems.name));
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [created] = await db.insert(inventoryItems).values(item).returning();
    return created;
  }

  async updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem> {
    const [updated] = await db
      .update(inventoryItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning();
    return updated;
  }

  async deleteInventoryItem(id: number): Promise<void> {
    await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
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
          lte(productionSchedule.scheduledDate, tomorrow)
        )
      )
      .orderBy(asc(productionSchedule.startTime));
  }

  async createProductionScheduleItem(item: InsertProductionScheduleItem): Promise<ProductionScheduleItem> {
    const [created] = await db.insert(productionSchedule).values(item).returning();
    return created;
  }

  async updateProductionScheduleItem(id: number, item: Partial<InsertProductionScheduleItem>): Promise<ProductionScheduleItem> {
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
  async createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction> {
    const [created] = await db.insert(inventoryTransactions).values(transaction).returning();
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
      .innerJoin(inventoryItems, eq(inventoryTransactions.inventoryItemId, inventoryItems.id))
      .leftJoin(users, eq(inventoryTransactions.createdBy, users.id));

    if (itemId) {
      return await query.where(eq(inventoryTransactions.inventoryItemId, itemId)).orderBy(desc(inventoryTransactions.createdAt));
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
          eq(orders.status, "completed")
        )
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
          eq(productionSchedule.status, "completed")
        )
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
          eq(orders.status, "completed")
        )
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
          eq(orders.status, "completed")
        )
      )
      .groupBy(products.id, products.name)
      .orderBy(desc(sql`SUM(${orderItems.totalPrice})`))
      .limit(10);

    return {
      salesData: salesData.map(row => ({
        date: row.date,
        sales: Number(row.totalSales),
        orders: Number(row.orderCount),
      })),
      topProducts: topProducts.map(row => ({
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

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db.insert(customers).values(customer).returning();
    return created;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer> {
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
  async getAssets(): Promise<Asset[]> {
    return await db.select().from(assets).orderBy(asc(assets.name));
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
    await db.delete(assets).where(eq(assets.id, id));
  }

  // Expenses operations
  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.date));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [created] = await db.insert(expenses).values(expense).returning();
    return created;
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense> {
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

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense> {
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
  async getAllUsers() {
    return await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users);
  }

  async updateUser(id: string, data: any) {
    const [updated] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: string) {
    await db.delete(users).where(eq(users.id, id));
  }
}

export const storage = new DatabaseStorage();