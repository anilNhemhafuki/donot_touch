import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  integer,
  boolean,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  password: varchar("password"), // For local authentication
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("staff").notNull(), // 'admin', 'supervisor', 'manager', 'staff', 'marketer'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  margin: decimal("margin", { precision: 5, scale: 2 }).notNull(),
  sku: varchar("sku", { length: 50 }).unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory items (ingredients)
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  currentStock: decimal("current_stock", { precision: 10, scale: 2 }).notNull(),
  minLevel: decimal("min_level", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(), // lbs, kg, dozen, etc.
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull(),
  supplier: varchar("supplier", { length: 200 }),
  company: varchar("company", { length: 200 }),
  lastRestocked: timestamp("last_restocked"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product ingredients (recipes)
export const productIngredients = pgTable("product_ingredients", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  inventoryItemId: integer("inventory_item_id").references(() => inventoryItems.id).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).unique().notNull(),
  customerName: varchar("customer_name", { length: 200 }).notNull(),
  customerEmail: varchar("customer_email", { length: 200 }),
  customerPhone: varchar("customer_phone", { length: 50 }),
  deliveryDate: timestamp("delivery_date"),
  deliveryAddress: text("delivery_address"),
  specialInstructions: text("special_instructions"),
  orderType: varchar("order_type", { length: 50 }).default("walk_in"), // walk_in, online, phone
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, in_progress, completed, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  orderDate: timestamp("order_date").defaultNow(),
  dueDate: timestamp("due_date"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Production schedule
export const productionSchedule = pgTable("production_schedule", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 20 }).default("packets"), // kg, packets
  targetPackets: integer("target_packets"),
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, in_progress, completed, cancelled, delayed
  assignedTo: varchar("assigned_to").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory transactions
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  inventoryItemId: integer("inventory_item_id").references(() => inventoryItems.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'in', 'out', 'adjustment'
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  reason: varchar("reason", { length: 200 }),
  reference: varchar("reference", { length: 100 }), // order_id, production_id, etc.
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customers
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  remainingBalance: decimal("remaining_balance", { precision: 12, scale: 2 }).default("0.00"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Parties (Suppliers/Vendors)
export const parties = pgTable("parties", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  paymentTerms: varchar("payment_terms", { length: 50 }),
  outstandingAmount: decimal("outstanding_amount", { precision: 12, scale: 2 }).default("0.00"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assets
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'equipment', 'furniture', 'vehicle', etc.
  purchaseDate: timestamp("purchase_date"),
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }),
  currentValue: decimal("current_value", { precision: 12, scale: 2 }),
  description: text("description"),
  location: varchar("location", { length: 100 }),
  condition: varchar("condition", { length: 50 }).default("good"), // 'excellent', 'good', 'fair', 'poor'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Expenses
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // 'utilities', 'rent', 'supplies', 'marketing', etc.
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  description: text("description"),
  receipt: varchar("receipt", { length: 255 }), // file path
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

//Bills
export const bills = pgTable("bills", {
  id: serial("id").primaryKey(),
  billNumber: varchar("bill_number", { length: 50 }).notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: varchar("customer_name", { length: 255 }),
  billDate: timestamp("bill_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending', 'paid', 'overdue', 'cancelled'
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

//Bill Items
export const billItems = pgTable("bill_items", {
  id: serial("id").primaryKey(),
  billId: integer("bill_id").notNull().references(() => bills.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  productName: varchar("product_name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

//Settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  type: varchar("type", { length: 20 }).notNull().default("string"), // 'string', 'number', 'boolean', 'json'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  productionTasks: many(productionSchedule),
  inventoryTransactions: many(inventoryTransactions),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  ingredients: many(productIngredients),
  orderItems: many(orderItems),
  productionTasks: many(productionSchedule),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ many }) => ({
  productIngredients: many(productIngredients),
  transactions: many(inventoryTransactions),
}));

export const productIngredientsRelations = relations(productIngredients, ({ one }) => ({
  product: one(products, {
    fields: [productIngredients.productId],
    references: [products.id],
  }),
  inventoryItem: one(inventoryItems, {
    fields: [productIngredients.inventoryItemId],
    references: [inventoryItems.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  items: many(orderItems),
  createdByUser: one(users, {
    fields: [orders.createdBy],
    references: [users.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const productionScheduleRelations = relations(productionSchedule, ({ one }) => ({
  product: one(products, {
    fields: [productionSchedule.productId],
    references: [products.id],
  }),
  assignedUser: one(users, {
    fields: [productionSchedule.assignedTo],
    references: [users.id],
  }),
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  inventoryItem: one(inventoryItems, {
    fields: [inventoryTransactions.inventoryItemId],
    references: [inventoryItems.id],
  }),
  createdByUser: one(users, {
    fields: [inventoryTransactions.createdBy],
    references: [users.id],
  }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = typeof inventoryItems.$inferInsert;

export type ProductIngredient = typeof productIngredients.$inferSelect;
export type InsertProductIngredient = typeof productIngredients.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

export type ProductionScheduleItem = typeof productionSchedule.$inferSelect;
export type InsertProductionScheduleItem = typeof productionSchedule.$inferInsert;

export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type InsertInventoryTransaction = typeof inventoryTransactions.$inferInsert;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

export type Party = typeof parties.$inferSelect;
export type InsertParty = typeof parties.$inferInsert;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

// Schemas
export const insertCategorySchema = createInsertSchema(categories);
export const insertProductSchema = createInsertSchema(products);
export const insertInventoryItemSchema = createInsertSchema(inventoryItems);
export const insertProductIngredientSchema = createInsertSchema(productIngredients);
export const insertOrderSchema = createInsertSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const insertProductionScheduleItemSchema = createInsertSchema(productionSchedule);
export const insertInventoryTransactionSchema = createInsertSchema(inventoryTransactions);
export const insertCustomerSchema = createInsertSchema(customers);
export const insertPartySchema = createInsertSchema(parties);
export const insertAssetSchema = createInsertSchema(assets);
export const insertExpenseSchema = createInsertSchema(expenses);