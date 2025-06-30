import { Express } from "express";
import { enhancedStorage } from "./enhanced-storage";
import { insertFixedSampleData } from "./sample-data-fixed";
import { isAuthenticated } from "./localAuth";

export function registerEnhancedRoutes(app: Express) {
  // Initialize comprehensive sample data
  app.post("/api/initialize-sample-data", isAuthenticated, async (req, res) => {
    try {
      const result = await insertFixedSampleData();
      res.json({ 
        success: true, 
        message: "Comprehensive sample data inserted successfully",
        summary: result
      });
    } catch (error) {
      console.error("Error inserting sample data:", error);
      res.status(500).json({ 
        error: "Failed to insert sample data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Enhanced Purchase System Routes
  app.post("/api/purchases/with-stock-sync", isAuthenticated, async (req, res) => {
    try {
      const purchase = await enhancedStorage.createPurchaseWithStockSync(req.body);
      res.json(purchase);
    } catch (error) {
      console.error("Error creating purchase with stock sync:", error);
      res.status(500).json({ 
        error: "Failed to create purchase",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Production Cost Calculation Routes
  app.get("/api/products/:id/cost-calculation", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity = 1 } = req.query;
      
      const costCalculation = await enhancedStorage.calculateProductionCost(
        parseInt(id),
        parseInt(quantity as string)
      );
      
      res.json(costCalculation);
    } catch (error) {
      console.error("Error calculating production cost:", error);
      res.status(500).json({ 
        error: "Failed to calculate production cost",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/products/:id/update-cost", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await enhancedStorage.updateProductCostFromCalculation(parseInt(id));
      res.json({ success: true, message: "Product cost updated successfully" });
    } catch (error) {
      console.error("Error updating product cost:", error);
      res.status(500).json({ 
        error: "Failed to update product cost",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Customer Account Management Routes
  app.post("/api/customers/:id/account", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, type, description } = req.body;
      
      await enhancedStorage.updateCustomerAccount(
        parseInt(id),
        amount,
        type,
        description
      );
      
      res.json({ success: true, message: "Customer account updated successfully" });
    } catch (error) {
      console.error("Error updating customer account:", error);
      res.status(500).json({ 
        error: "Failed to update customer account",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/customers/:id/balance", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const balance = await enhancedStorage.getCustomerBalance(parseInt(id));
      res.json({ balance });
    } catch (error) {
      console.error("Error getting customer balance:", error);
      res.status(500).json({ 
        error: "Failed to get customer balance",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Supplier Account Management Routes
  app.post("/api/suppliers/:id/payment", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, paymentMethod, notes } = req.body;
      
      await enhancedStorage.createSupplierPayment(
        parseInt(id),
        amount,
        paymentMethod,
        notes
      );
      
      res.json({ success: true, message: "Supplier payment recorded successfully" });
    } catch (error) {
      console.error("Error recording supplier payment:", error);
      res.status(500).json({ 
        error: "Failed to record supplier payment",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/suppliers/:id/balance", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const balance = await enhancedStorage.getSupplierBalance(parseInt(id));
      res.json({ balance });
    } catch (error) {
      console.error("Error getting supplier balance:", error);
      res.status(500).json({ 
        error: "Failed to get supplier balance",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Financial Summary and Analytics Routes
  app.get("/api/analytics/financial-summary", isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const summary = await enhancedStorage.getFinancialSummary(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      
      res.json(summary);
    } catch (error) {
      console.error("Error getting financial summary:", error);
      res.status(500).json({ 
        error: "Failed to get financial summary",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Low Stock Alert Routes
  app.get("/api/inventory/low-stock", isAuthenticated, async (req, res) => {
    try {
      const lowStockItems = await enhancedStorage.getLowStockItems();
      res.json(lowStockItems);
    } catch (error) {
      console.error("Error getting low stock items:", error);
      res.status(500).json({ 
        error: "Failed to get low stock items",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Enhanced Production Schedule Routes
  app.post("/api/production-schedule/with-cost-tracking", isAuthenticated, async (req, res) => {
    try {
      const result = await enhancedStorage.createProductionScheduleWithCostTracking(req.body);
      res.json(result);
    } catch (error) {
      console.error("Error creating production schedule with cost tracking:", error);
      res.status(500).json({ 
        error: "Failed to create production schedule",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/production-schedule/:id/process", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { actualQuantity } = req.body;
      
      await enhancedStorage.processProduction(parseInt(id), actualQuantity);
      res.json({ success: true, message: "Production processed successfully" });
    } catch (error) {
      console.error("Error processing production:", error);
      res.status(500).json({ 
        error: "Failed to process production",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Inventory Transaction Routes
  app.post("/api/inventory/:id/transaction", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity, type, reason, reference } = req.body;
      
      await enhancedStorage.updateInventoryStock(
        parseInt(id),
        quantity,
        type,
        reason,
        reference
      );
      
      res.json({ success: true, message: "Inventory transaction recorded successfully" });
    } catch (error) {
      console.error("Error recording inventory transaction:", error);
      res.status(500).json({ 
        error: "Failed to record inventory transaction",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}