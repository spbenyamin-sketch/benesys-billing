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
  insertBillTemplateSchema,
  insertCompanySchema,
} from "@shared/schema";
import { ObjectStorageService } from "./objectStorage";

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

  // ==================== USER MANAGEMENT ROUTES ====================
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only super admin can access user management" });
      }
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/users/:id/role', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only super admin can manage roles" });
      }
      const { role } = req.body;
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const user = await storage.updateUserRole(req.params.id, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only super admin can delete users" });
      }
      if (req.params.id === req.user.claims.sub) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      await storage.deleteUser(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ==================== USER COMPANY ROUTES ====================
  app.get('/api/user-companies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userCompanies = await storage.getUserCompanies(userId);
      res.json(userCompanies);
    } catch (error) {
      console.error("Error fetching user companies:", error);
      res.status(500).json({ message: "Failed to fetch user companies" });
    }
  });

  // ==================== COMPANY ROUTES ====================
  app.get('/api/companies', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only super admin can view all companies" });
      }
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.post('/api/companies', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only super admin can create companies" });
      }
      const validated = insertCompanySchema.parse(req.body);
      const userId = req.user.claims.sub;
      const company = await storage.createCompany(validated, userId);
      res.json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.put('/api/companies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only super admin can update companies" });
      }
      const id = parseInt(req.params.id);
      const validated = insertCompanySchema.parse(req.body);
      const company = await storage.updateCompany(id, validated);
      res.json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  app.delete('/api/companies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only super admin can delete companies" });
      }
      const id = parseInt(req.params.id);
      await storage.deleteCompany(id);
      res.json({ message: "Company deleted successfully" });
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ message: "Failed to delete company" });
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

  // ==================== BILL TEMPLATE ROUTES ====================
  app.get('/api/bill-templates', isAuthenticated, async (req, res) => {
    try {
      const templates = await storage.getBillTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching bill templates:", error);
      res.status(500).json({ message: "Failed to fetch bill templates" });
    }
  });

  app.post('/api/bill-templates', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only super admin can create bill templates" });
      }
      const validated = insertBillTemplateSchema.parse(req.body);
      const template = await storage.createBillTemplate(validated, req.user.claims.sub);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating bill template:", error);
      res.status(500).json({ message: "Failed to create bill template" });
    }
  });

  app.put('/api/bill-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only super admin can update bill templates" });
      }
      const validated = insertBillTemplateSchema.parse(req.body);
      const template = await storage.updateBillTemplate(parseInt(req.params.id), validated);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating bill template:", error);
      res.status(500).json({ message: "Failed to update bill template" });
    }
  });

  app.delete('/api/bill-templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only super admin can delete bill templates" });
      }
      await storage.deleteBillTemplate(parseInt(req.params.id));
      res.json({ message: "Bill template deleted successfully" });
    } catch (error) {
      console.error("Error deleting bill template:", error);
      res.status(500).json({ message: "Failed to delete bill template" });
    }
  });

  // ==================== OBJECT STORAGE ROUTES ====================
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL. Make sure object storage is configured." });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
