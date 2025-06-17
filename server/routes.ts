import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./localAuth";
import {
  insertCategorySchema,
  insertProductSchema,
  insertInventoryItemSchema,
  insertOrderSchema,
  insertProductionScheduleItemSchema,
  insertCustomerSchema,
  insertPartySchema,
  insertAssetSchema,
  insertExpenseSchema,
} from "@shared/schema";
import authRoutes from "./authRoutes"; // Import the new auth routes

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('🔧 Setting up routes...');

  // Database test endpoint (remove in production)
  app.get('/api/test/db', async (req, res) => {
    try {
      console.log('🔍 Testing database connection...');
      
      // Test database connection
      const testUsers = await storage.getAllUsers();
      console.log('✅ Database connected. Found', testUsers.length, 'users');
      
      // Ensure default users exist
      await storage.ensureDefaultAdmin();
      
      res.json({
        success: true,
        message: 'Database is working',
        userCount: testUsers.length,
        users: testUsers.map(u => ({ id: u.id, email: u.email, role: u.role }))
      });
    } catch (error) {
      console.error('❌ Database test failed:', error);
      res.status(500).json({
        success: false,
        message: 'Database test failed',
        error: error.message
      });
    }
  });

  // Use the new authentication routes
  app.use('/api/auth', authRoutes);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Recent orders for dashboard
  app.get("/api/dashboard/recent-orders", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getRecentOrders(5);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      res.status(500).json({ message: "Failed to fetch recent orders" });
    }
  });

  // Today's production schedule
  app.get("/api/dashboard/production-schedule", isAuthenticated, async (req, res) => {
    try {
      const schedule = await storage.getTodayProductionSchedule();
      res.json(schedule);
    } catch (error) {
      console.error("Error fetching production schedule:", error);
      res.status(500).json({ message: "Failed to fetch production schedule" });
    }
  });

  // Low stock items
  app.get("/api/dashboard/low-stock", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getLowStockItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      res.status(500).json({ message: "Failed to fetch low stock items" });
    }
  });

  // Categories
  app.get("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", isAuthenticated, async (req, res) => {
    try {
      // Validate required fields
      if (!req.body.name) {
        return res.status(400).json({ message: "Category name is required" });
      }

      // Transform the data
      const transformedData = {
        name: req.body.name.trim(),
        description: req.body.description ? req.body.description.trim() : null,
      };

      console.log("Creating category with data:", transformedData);
      const category = await storage.createCategory(transformedData);
      console.log("Category created successfully:", category);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ 
        message: "Failed to create category",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Products
  app.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getProductsWithIngredients();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      const ingredients = await storage.getProductIngredients(id);
      res.json({ ...product, ingredients });
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", isAuthenticated, async (req, res) => {
    try {
      const { ingredients, ...productData } = req.body;

      // Ensure required fields are present
      if (!productData.name) {
        return res.status(400).json({ message: "Product name is required" });
      }

      if (!productData.price || isNaN(parseFloat(productData.price))) {
        return res.status(400).json({ message: "Valid price is required" });
      }

      if (!productData.cost || isNaN(parseFloat(productData.cost))) {
        return res.status(400).json({ message: "Valid cost is required" });
      }

      if (!productData.margin || isNaN(parseFloat(productData.margin))) {
        return res.status(400).json({ message: "Valid margin is required" });
      }

      // Transform the data
      const transformedData = {
        name: productData.name.trim(),
        description: productData.description || null,
        categoryId: productData.categoryId || null,
        price: parseFloat(productData.price).toString(),
        cost: parseFloat(productData.cost).toString(),
        margin: parseFloat(productData.margin).toString(),
        sku: productData.sku || null,
        isActive: true,
      };

      console.log("Creating product with data:", transformedData);

      const product = await storage.createProduct(transformedData);

      // Add ingredients if provided
      if (ingredients && ingredients.length > 0) {
        for (const ingredient of ingredients) {
          await storage.createProductIngredient({
            productId: product.id,
            inventoryItemId: ingredient.inventoryItemId,
            quantity: ingredient.quantity,
          });
        }
      }

      console.log("Product created successfully:", product);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ 
        message: "Failed to create product", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.put("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { ingredients, ...productData } = req.body;

      const product = await storage.updateProduct(id, productData);

      // Update ingredients if provided
      if (ingredients) {
        await storage.deleteProductIngredients(id);
        for (const ingredient of ingredients) {
          await storage.createProductIngredient({
            productId: id,
            inventoryItemId: ingredient.inventoryItemId,
            quantity: ingredient.quantity,
          });
        }
      }

      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Inventory
  app.get("/api/inventory", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getInventoryItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.post("/api/inventory", isAuthenticated, async (req, res) => {
    try {
      // Validate required fields
      if (!req.body.name) {
        return res.status(400).json({ message: "Item name is required" });
      }

      if (!req.body.currentStock || isNaN(parseFloat(req.body.currentStock))) {
        return res.status(400).json({ message: "Valid current stock is required" });
      }

      if (!req.body.minLevel || isNaN(parseFloat(req.body.minLevel))) {
        return res.status(400).json({ message: "Valid minimum level is required" });
      }

      if (!req.body.unit) {
        return res.status(400).json({ message: "Unit is required" });
      }

      if (!req.body.costPerUnit || isNaN(parseFloat(req.body.costPerUnit))) {
        return res.status(400).json({ message: "Valid cost per unit is required" });
      }

      // Transform the data
      const transformedData = {
        name: req.body.name.trim(),
        currentStock: parseFloat(req.body.currentStock).toString(),
        minLevel: parseFloat(req.body.minLevel).toString(),
        unit: req.body.unit.trim(),
        costPerUnit: parseFloat(req.body.costPerUnit).toString(),
        supplier: req.body.supplier ? req.body.supplier.trim() : null,
        lastRestocked: req.body.lastRestocked ? new Date(req.body.lastRestocked) : null,
      };

      console.log("Creating inventory item with data:", transformedData);
      const item = await storage.createInventoryItem(transformedData);
      console.log("Inventory item created successfully:", item);
      res.json(item);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(500).json({ 
        message: "Failed to create inventory item",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/inventory/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.updateInventoryItem(id, req.body);
      res.json(item);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.delete("/api/inventory/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteInventoryItem(id);
      res.json({ message: "Inventory item deleted successfully" });
    } catch (error) {
      console.error("Error deleting inventory item:", error);
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Orders
  app.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      const items = await storage.getOrderItems(id);
      res.json({ ...order, items });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const { items, ...orderData } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!orderData.customerName) {
        return res.status(400).json({ message: "Customer name is required" });
      }

      if (!orderData.totalAmount || isNaN(parseFloat(orderData.totalAmount))) {
        return res.status(400).json({ message: "Valid total amount is required" });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Order items are required" });
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;

      // Transform the data
      const transformedData = {
        orderNumber,
        customerName: orderData.customerName.trim(),
        customerEmail: orderData.customerEmail ? orderData.customerEmail.trim() : null,
        customerPhone: orderData.customerPhone ? orderData.customerPhone.trim() : null,
        status: orderData.status || "pending",
        totalAmount: parseFloat(orderData.totalAmount).toString(),
        orderDate: orderData.orderDate ? new Date(orderData.orderDate) : new Date(),
        dueDate: orderData.dueDate ? new Date(orderData.dueDate) : null,
        notes: orderData.notes ? orderData.notes.trim() : null,
        createdBy: userId,
      };

      console.log("Creating order with data:", transformedData);
      const order = await storage.createOrder(transformedData);

      // Add order items
      for (const item of items) {
        if (!item.productId || !item.quantity || !item.unitPrice) {
          throw new Error("Invalid order item data");
        }

        await storage.createOrderItem({
          orderId: order.id,
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice).toString(),
          totalPrice: (parseInt(item.quantity) * parseFloat(item.unitPrice)).toString(),
        });
      }

      console.log("Order created successfully:", order);
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ 
        message: "Failed to create order",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.updateOrder(id, req.body);
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Production schedule
  app.get("/api/production", isAuthenticated, async (req, res) => {
    try {
      const schedule = await storage.getProductionSchedule();
      res.json(schedule);
    } catch (error) {
      console.error("Error fetching production schedule:", error);
      res.status(500).json({ message: "Failed to fetch production schedule" });
    }
  });

  app.post("/api/production", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Validate required fields
      if (!req.body.productId) {
        return res.status(400).json({ message: "Product is required" });
      }

      if (!req.body.quantity || isNaN(parseInt(req.body.quantity))) {
        return res.status(400).json({ message: "Valid quantity is required" });
      }

      if (!req.body.scheduledDate) {
        return res.status(400).json({ message: "Scheduled date is required" });
      }

      // Transform the data
      const transformedData = {
        productId: parseInt(req.body.productId),
        quantity: parseInt(req.body.quantity),
        scheduledDate: new Date(req.body.scheduledDate),
        startTime: req.body.startTime ? new Date(req.body.startTime) : null,
        endTime: req.body.endTime ? new Date(req.body.endTime) : null,
        status: req.body.status || "scheduled",
        assignedTo: req.body.assignedTo || userId,
        notes: req.body.notes ? req.body.notes.trim() : null,
      };

      console.log("Creating production schedule item with data:", transformedData);
      const item = await storage.createProductionScheduleItem(transformedData);
      console.log("Production schedule item created successfully:", item);
      res.json(item);
    } catch (error) {
      console.error("Error creating production schedule item:", error);
      res.status(500).json({ 
        message: "Failed to create production schedule item",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/production/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.updateProductionScheduleItem(id, req.body);
      res.json(item);
    } catch (error) {
      console.error("Error updating production schedule item:", error);
      res.status(500).json({ message: "Failed to update production schedule item" });
    }
  });

  // Analytics
  app.get("/api/analytics/sales", isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const analytics = await storage.getSalesAnalytics(start, end);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching sales analytics:", error);
      res.status(500).json({ message: "Failed to fetch sales analytics" });
    }
  });

  // Customer routes
  app.get("/api/customers", isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", isAuthenticated, async (req, res) => {
    try {
      // Validate required fields
      if (!req.body.name) {
        return res.status(400).json({ message: "Customer name is required" });
      }

      // Transform the data
      const transformedData = {
        name: req.body.name.trim(),
        email: req.body.email ? req.body.email.trim() : null,
        phone: req.body.phone ? req.body.phone.trim() : null,
        address: req.body.address ? req.body.address.trim() : null,
        remainingBalance: req.body.remainingBalance ? parseFloat(req.body.remainingBalance).toString() : "0.00",
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      };

      console.log("Creating customer with data:", transformedData);
      const customer = await storage.createCustomer(transformedData);
      console.log("Customer created successfully:", customer);
      res.json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ 
        message: "Failed to create customer",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.updateCustomer(id, req.body);
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomer(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Party routes
  app.get("/api/parties", isAuthenticated, async (req, res) => {
    try {
      const parties = await storage.getParties();
      res.json(parties);
    } catch (error) {
      console.error("Error fetching parties:", error);
      res.status(500).json({ message: "Failed to fetch parties" });
    }
  });

  app.post("/api/parties", isAuthenticated, async (req, res) => {
    try {
      // Validate required fields
      if (!req.body.name) {
        return res.status(400).json({ message: "Party name is required" });
      }

      // Transform the data
      const transformedData = {
        name: req.body.name.trim(),
        email: req.body.email ? req.body.email.trim() : null,
        phone: req.body.phone ? req.body.phone.trim() : null,
        address: req.body.address ? req.body.address.trim() : null,
        paymentTerms: req.body.paymentTerms ? req.body.paymentTerms.trim() : null,
        outstandingAmount: req.body.outstandingAmount ? parseFloat(req.body.outstandingAmount).toString() : "0.00",
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      };

      console.log("Creating party with data:", transformedData);
      const party = await storage.createParty(transformedData);
      console.log("Party created successfully:", party);
      res.json(party);
    } catch (error) {
      console.error("Error creating party:", error);
      res.status(500).json({ 
        message: "Failed to create party",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/parties/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const party = await storage.updateParty(id, req.body);
      res.json(party);
    } catch (error) {
      console.error("Error updating party:", error);
      res.status(500).json({ message: "Failed to update party" });
    }
  });

  app.delete("/api/parties/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteParty(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting party:", error);
      res.status(500).json({ message: "Failed to delete party" });
    }
  });

  // Assets
  app.get("/api/assets", isAuthenticated, async (req, res) => {
    try {
      const assets = await storage.getAssets();
      res.json(assets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });

  // Bills
  app.get("/api/bills", isAuthenticated, async (req, res) => {
    try {
      const bills = await storage.getBills();
      res.json(bills);
    } catch (error) {
      console.error("Error fetching bills:", error);
      res.status(500).json({ message: "Failed to fetch bills" });
    }
  });

  app.post("/api/bills", isAuthenticated, async (req, res) => {
    try {
      const bill = await storage.createBill(req.body);
      res.json(bill);
    } catch (error) {
      console.error("Error creating bill:", error);
      res.status(500).json({ message: "Failed to create bill" });
    }
  });

  app.delete("/api/bills/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteBill(parseInt(req.params.id));
      res.json({ message: "Bill deleted successfully" });
    } catch (error) {
      console.error("Error deleting bill:", error);
      res.status(500).json({ message: "Failed to delete bill" });
    }
  });

  // Settings
  app.get("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.updateSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Expense routes
  app.get("/api/expenses", isAuthenticated, async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", isAuthenticated, async (req, res) => {
    try {
      const { description, amount, category, date } = req.body;

      if (!description || !description.trim()) {
        return res.status(400).json({ message: "Expense description is required" });
      }

      if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({ message: "Valid amount is required" });
      }

      if (!category) {
        return res.status(400).json({ message: "Category is required" });
      }

      const expenseData = {
        description: description.trim(),
        amount: parseFloat(amount).toString(),
        category,
        date: date ? new Date(date) : new Date(),
      };

      console.log("Creating expense with data:", expenseData);
      const expense = await storage.createExpense(expenseData);
      console.log("Expense created successfully:", expense);
      res.json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ 
        message: "Failed to create expense", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.put("/api/expenses/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { description, amount, category, date } = req.body;

      if (!description || !description.trim()) {
        return res.status(400).json({ message: "Expense description is required" });
      }

      if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({ message: "Valid amount is required" });
      }

      const expenseData = {
        description: description.trim(),
        amount: parseFloat(amount).toString(),
        category,
        date: date ? new Date(date) : new Date(),
      };

      const expense = await storage.updateExpense(id, expenseData);
      res.json(expense);
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteExpense(id);
      res.json({ message: "Expense deleted successfully" });
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Admin user management routes
  const isAdmin = (req: any, res: any, next: any) => {
    console.log('Checking admin access for user:', req.user);
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    console.log('Access denied - user role:', req.user?.role);
    res.status(403).json({ message: "Access denied. Admin role required." });
  };

  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.upsertUser({
        id: `user_${Date.now()}`,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || 'staff'
      });

      res.json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.put("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { email, password, firstName, lastName, role } = req.body;

      const updateData: any = {
        email,
        firstName,
        lastName,
        role,
      };

      // Only update password if provided
      if (password) {
        const bcrypt = require('bcrypt');
        updateData.password = await bcrypt.hash(password, 10);
      }

      const user = await storage.updateUser(id, updateData);
      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteUser(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  // Profile management routes
  app.put("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
            const userId = req.user.id;
      const { firstName, lastName, email, currentPassword, newPassword } = req.body;

      const updateData: any = {
        firstName,
        lastName,
        email,
      };

      // If password change is requested, verify current password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: 'Current password is required to change password' });
        }
        const user = await storage.getUser(userId);
        const bcrypt = require('bcrypt');
        const isValidPassword = await bcrypt.compare(currentPassword, user.password || '');
        if (!isValidPassword) {
          return res.status(400).json({ message: 'Current password is incorrect' });
        }

        updateData.password = await bcrypt.hash(newPassword, 10);
      }

      const user = await storage.updateUser(userId, updateData);
      res.json(user);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });

  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const { customerId, items, ...orderData } = req.body;

      console.log("Creating order with data:", { customerId, items, orderData });

      if (!items || items.length === 0) {
        return res.status(400).json({ message: "Order must have at least one item" });
      }

      // Calculate total from items
      let calculatedTotal = 0;
      for (const item of items) {
        if (!item.productId || !item.quantity || !item.price) {
          return res.status(400).json({ message: "All items must have productId, quantity, and price" });
        }
        calculatedTotal += parseFloat(item.price) * parseInt(item.quantity);
      }

      const order = await storage.createOrder({
        customerId: customerId || null,
        status: orderData.status || "pending",
        total: calculatedTotal.toString(),
        notes: orderData.notes || null,
        dueDate: orderData.dueDate ? new Date(orderData.dueDate) : null,
      });

      console.log("Order created:", order);

      // Add order items
      for (const item of items) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: parseInt(item.productId),
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price).toString(),
        });
      }

      console.log("Order items added successfully");
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ 
        message: "Failed to create order", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.put("/api/categories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (!req.body.name) {
        return res.status(400).json({ message: "Category name is required" });
      }

      const transformedData = {
        name: req.body.name.trim(),
        description: req.body.description ? req.body.description.trim() : null,
      };

      const category = await storage.updateCategory(id, transformedData);
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Notification system routes
  const hasNotificationAccess = (req: any, res: any, next: any) => {
    if (req.user && ['admin', 'supervisor', 'manager'].includes(req.user.role)) {
      return next();
    }
    res.status(403).json({ message: "Access denied. Admin, Supervisor, or Manager role required." });
  };

  // In-memory storage for push subscriptions (in production, use database)
  const pushSubscriptions = new Map<string, any>();

  app.post("/api/notifications/subscribe", isAuthenticated, hasNotificationAccess, async (req: any, res) => {
    try {
      const { subscription } = req.body;
      const userId = req.user.id;
      
      pushSubscriptions.set(userId, subscription);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving push subscription:", error);
      res.status(500).json({ message: "Failed to save subscription" });
    }
  });

  app.post("/api/notifications/unsubscribe", isAuthenticated, hasNotificationAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
      pushSubscriptions.delete(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing push subscription:", error);
      res.status(500).json({ message: "Failed to remove subscription" });
    }
  });

  app.put("/api/notifications/rules", isAuthenticated, hasNotificationAccess, async (req: any, res) => {
    try {
      const { rules } = req.body;
      const userId = req.user.id;
      
      // In production, save rules to database
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating notification rules:", error);
      res.status(500).json({ message: "Failed to update rules" });
    }
  });

  app.post("/api/notifications/test", isAuthenticated, hasNotificationAccess, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const subscription = pushSubscriptions.get(userId);
      
      if (!subscription) {
        return res.status(400).json({ message: "No subscription found" });
      }

      // Simulate successful notification send
      console.log("Test notification sent to user:", userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ message: "Failed to send test notification" });
    }
  });

  // Sales routes (using orders as sales)
  app.get("/api/sales", isAuthenticated, async (req, res) => {
    try {
      const sales = await storage.getOrders();
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.post("/api/sales", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { customerId, customerName, totalAmount, paymentMethod, status, items } = req.body;

      const orderData = {
        orderNumber: `SALE-${Date.now()}`,
        customerName,
        totalAmount,
        status: status || 'completed',
        createdBy: userId,
        notes: `Payment: ${paymentMethod}`
      };

      const order = await storage.createOrder(orderData);

      for (const item of items) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        });
      }

      res.json(order);
    } catch (error) {
      console.error("Error creating sale:", error);
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  // Purchases routes (using expenses as purchases)
  app.get("/api/purchases", isAuthenticated, async (req, res) => {
    try {
      const purchases = await storage.getExpenses();
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.post("/api/purchases", isAuthenticated, async (req: any, res) => {
    try {
      const { partyId, supplierName, totalAmount, paymentMethod, status, items } = req.body;

      const purchaseData = {
        description: `Purchase from ${supplierName}`,
        amount: totalAmount,
        category: 'purchase',
        date: new Date()
      };

      const purchase = await storage.createExpense(purchaseData);
      res.json(purchase);
    } catch (error) {
      console.error("Error creating purchase:", error);
      res.status(500).json({ message: "Failed to create purchase" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}