import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import {
  insertPartySchema,
  insertItemSchema,
  insertSaleSchema,
  insertPurchaseSchema,
  insertPaymentSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);

  // ==================== AUTH ROUTES ====================
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ==================== PARTY ROUTES ====================
  app.get("/api/parties", isAuthenticated, async (req, res) => {
    try {
      const parties = await storage.getParties();
      res.json(parties);
    } catch (error) {
      console.error("Error fetching parties:", error);
      res.status(500).json({ message: "Failed to fetch parties" });
    }
  });

  app.get("/api/parties/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const party = await storage.getParty(id);
      if (!party) {
        return res.status(404).json({ message: "Party not found" });
      }
      res.json(party);
    } catch (error) {
      console.error("Error fetching party:", error);
      res.status(500).json({ message: "Failed to fetch party" });
    }
  });

  app.post("/api/parties", isAuthenticated, async (req: any, res) => {
    try {
      const validated = insertPartySchema.parse(req.body);
      const userId = req.user.claims.sub;
      const party = await storage.createParty(validated, userId);
      res.json(party);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating party:", error);
      res.status(500).json({ message: "Failed to create party" });
    }
  });

  app.put("/api/parties/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertPartySchema.parse(req.body);
      const party = await storage.updateParty(id, validated);
      res.json(party);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating party:", error);
      res.status(500).json({ message: "Failed to update party" });
    }
  });

  // ==================== ITEM ROUTES ====================
  app.get("/api/items", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get("/api/items/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getItem(id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  app.post("/api/items", isAuthenticated, async (req: any, res) => {
    try {
      const validated = insertItemSchema.parse(req.body);
      const userId = req.user.claims.sub;
      const item = await storage.createItem(validated, userId);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating item:", error);
      res.status(500).json({ message: "Failed to create item" });
    }
  });

  app.put("/api/items/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertItemSchema.parse(req.body);
      const item = await storage.updateItem(id, validated);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating item:", error);
      res.status(500).json({ message: "Failed to update item" });
    }
  });

  // ==================== SALES ROUTES ====================
  app.get("/api/sales", isAuthenticated, async (req, res) => {
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.post("/api/sales", isAuthenticated, async (req: any, res) => {
    try {
      const { items: saleItems, ...saleData } = req.body;
      
      if (!saleItems || saleItems.length === 0) {
        return res.status(400).json({ message: "At least one item is required" });
      }

      const userId = req.user.claims.sub;
      const sale = await storage.createSale(saleData, saleItems, userId);
      res.json(sale);
    } catch (error) {
      console.error("Error creating sale:", error);
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  // ==================== PURCHASE ROUTES ====================
  app.get("/api/purchases", isAuthenticated, async (req, res) => {
    try {
      const purchases = await storage.getPurchases();
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.post("/api/purchases", isAuthenticated, async (req: any, res) => {
    try {
      const validated = insertPurchaseSchema.parse(req.body);
      const userId = req.user.claims.sub;
      const purchase = await storage.createPurchase(validated, userId);
      res.json(purchase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating purchase:", error);
      res.status(500).json({ message: "Failed to create purchase" });
    }
  });

  // ==================== PAYMENT ROUTES ====================
  app.get("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", isAuthenticated, async (req: any, res) => {
    try {
      const validated = insertPaymentSchema.parse(req.body);
      const userId = req.user.claims.sub;
      const payment = await storage.createPayment(validated, userId);
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // ==================== STOCK ROUTES ====================
  app.get("/api/stock", isAuthenticated, async (req, res) => {
    try {
      const stock = await storage.getStock();
      res.json(stock);
    } catch (error) {
      console.error("Error fetching stock:", error);
      res.status(500).json({ message: "Failed to fetch stock" });
    }
  });

  // ==================== REPORT ROUTES ====================
  app.get("/api/dashboard/metrics", isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  app.get("/api/reports/outstanding", isAuthenticated, async (req, res) => {
    try {
      const outstanding = await storage.getOutstanding();
      res.json(outstanding);
    } catch (error) {
      console.error("Error fetching outstanding:", error);
      res.status(500).json({ message: "Failed to fetch outstanding" });
    }
  });

  app.get("/api/reports/sales", isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate, billType } = req.query;
      const sales = await storage.getSalesReport(
        startDate as string,
        endDate as string,
        billType as string
      );
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales report:", error);
      res.status(500).json({ message: "Failed to fetch sales report" });
    }
  });

  app.get("/api/reports/items", isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const items = await storage.getItemsReport(startDate as string, endDate as string);
      res.json(items);
    } catch (error) {
      console.error("Error fetching items report:", error);
      res.status(500).json({ message: "Failed to fetch items report" });
    }
  });

  app.get("/api/reports/ledger/:partyId", isAuthenticated, async (req, res) => {
    try {
      const partyId = parseInt(req.params.partyId);
      const ledger = await storage.getPartyLedger(partyId);
      
      if (!ledger) {
        return res.status(404).json({ message: "Party ledger not found" });
      }
      
      res.json(ledger);
    } catch (error) {
      console.error("Error fetching party ledger:", error);
      res.status(500).json({ message: "Failed to fetch party ledger" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
