import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./localAuth";
import { validateCompanyAccess } from "./companyMiddleware";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  insertPartySchema,
  insertItemSchema,
  insertSaleSchema,
  insertPurchaseSchema,
  insertPaymentSchema,
  insertBillTemplateSchema,
  insertCompanySchema,
  insertAgentSchema,
  insertBarcodeLabelTemplateSchema,
  updateStockInwardItemSchema,
} from "@shared/schema";
import { ObjectStorageService } from "./objectStorage";

// Helper function to check if user has admin privileges
function isAdminRole(role: string | undefined | null): boolean {
  return role === 'admin' || role === 'superadmin';
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);

  // ==================== AUTH ROUTES ====================
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // req.user is now the full user object from passport
      const user = req.user;
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ==================== USER MANAGEMENT ROUTES ====================
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
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
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
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

  app.post('/api/users/create', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only super admin can create users" });
      }

      const createUserSchema = z.object({
        username: z.string().min(1, "Username is required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        role: z.enum(['user', 'admin']),
        companyIds: z.array(z.number()).optional(),
      });

      const validated = createUserSchema.parse(req.body);
      
      // Convert empty strings to undefined for optional fields
      if (validated.email === "") validated.email = undefined;
      if (validated.firstName === "") validated.firstName = undefined;
      if (validated.lastName === "") validated.lastName = undefined;
      
      // Hash password
      const passwordHash = await bcrypt.hash(validated.password, 10);
      
      // Create user
      const newUser = await storage.createUser({
        username: validated.username,
        passwordHash,
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email,
        role: validated.role,
      });

      // Assign companies if provided
      if (validated.companyIds && validated.companyIds.length > 0) {
        for (let i = 0; i < validated.companyIds.length; i++) {
          await storage.assignUserToCompany(
            newUser.id,
            validated.companyIds[i],
            i === 0 // First company is default
          );
        }
      }

      res.json(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.delete('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only super admin can delete users" });
      }
      if (req.params.id === req.user.id) {
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
      const userId = req.user.id;
      const userCompanies = await storage.getUserCompanies(userId);
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json(userCompanies);
    } catch (error) {
      console.error("Error fetching user companies:", error);
      res.status(500).json({ message: "Failed to fetch user companies" });
    }
  });

  // Get companies for a specific user (admin only)
  app.get('/api/users/:id/companies', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only super admin can view user companies" });
      }
      const userCompanies = await storage.getUserCompanies(req.params.id);
      res.json(userCompanies);
    } catch (error) {
      console.error("Error fetching user companies:", error);
      res.status(500).json({ message: "Failed to fetch user companies" });
    }
  });

  // Assign company to user (admin only)
  app.post('/api/users/:id/companies', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only super admin can assign companies" });
      }
      const { companyId, isDefault } = req.body;
      await storage.assignUserToCompany(req.params.id, companyId, isDefault);
      res.json({ message: "Company assigned successfully" });
    } catch (error) {
      console.error("Error assigning company:", error);
      res.status(500).json({ message: "Failed to assign company" });
    }
  });

  // Remove company from user (admin only)
  app.delete('/api/users/:id/companies/:companyId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only super admin can remove companies" });
      }
      await storage.removeUserFromCompany(req.params.id, parseInt(req.params.companyId));
      res.json({ message: "Company removed successfully" });
    } catch (error) {
      console.error("Error removing company:", error);
      res.status(500).json({ message: "Failed to remove company" });
    }
  });

  // ==================== COMPANY ROUTES ====================
  app.get('/api/companies', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
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
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only super admin can create companies" });
      }
      const validated = insertCompanySchema.parse(req.body);
      const userId = req.user.id;
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
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
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
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
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
  app.get("/api/parties", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const parties = await storage.getParties(req.companyId);
      res.json(parties);
    } catch (error) {
      console.error("Error fetching parties:", error);
      res.status(500).json({ message: "Failed to fetch parties" });
    }
  });

  app.get("/api/parties/:id", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const party = await storage.getParty(id, req.companyId);
      if (!party) {
        return res.status(404).json({ message: "Party not found" });
      }
      res.json(party);
    } catch (error) {
      console.error("Error fetching party:", error);
      res.status(500).json({ message: "Failed to fetch party" });
    }
  });

  app.post("/api/parties", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const validated = insertPartySchema.parse(req.body);
      const userId = req.user.id;
      const party = await storage.createParty(validated, userId, req.companyId);
      res.json(party);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating party:", error);
      res.status(500).json({ message: "Failed to create party" });
    }
  });

  app.put("/api/parties/:id", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertPartySchema.parse(req.body);
      const party = await storage.updateParty(id, validated, req.companyId);
      res.json(party);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating party:", error);
      res.status(500).json({ message: "Failed to update party" });
    }
  });

  // ==================== AGENT ROUTES ====================
  app.get("/api/agents", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const agents = await storage.getAgents(req.companyId);
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  app.get("/api/agents/next-code", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const nextCode = await storage.getNextAgentCode(req.companyId);
      res.json({ nextCode });
    } catch (error) {
      console.error("Error fetching next agent code:", error);
      res.status(500).json({ message: "Failed to fetch next agent code" });
    }
  });

  app.get("/api/agents/:id", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const agent = await storage.getAgent(id, req.companyId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      console.error("Error fetching agent:", error);
      res.status(500).json({ message: "Failed to fetch agent" });
    }
  });

  app.post("/api/agents", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const validated = insertAgentSchema.parse(req.body);
      const userId = req.user.id;
      const agent = await storage.createAgent(validated, userId, req.companyId);
      res.json(agent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating agent:", error);
      res.status(500).json({ message: "Failed to create agent" });
    }
  });

  app.put("/api/agents/:id", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertAgentSchema.parse(req.body);
      const agent = await storage.updateAgent(id, validated, req.companyId);
      res.json(agent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating agent:", error);
      res.status(500).json({ message: "Failed to update agent" });
    }
  });

  // ==================== ITEM ROUTES ====================
  app.get("/api/items", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const items = await storage.getItems(req.companyId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get("/api/items/:id", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getItem(id, req.companyId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  app.post("/api/items", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const validated = insertItemSchema.parse(req.body);
      const userId = req.user.id;
      const item = await storage.createItem(validated, userId, req.companyId);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating item:", error);
      res.status(500).json({ message: "Failed to create item" });
    }
  });

  app.put("/api/items/:id", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertItemSchema.parse(req.body);
      const item = await storage.updateItem(id, validated, req.companyId);
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating item:", error);
      res.status(500).json({ message: "Failed to update item" });
    }
  });

  // Item movement history (purchase and sales history)
  app.get("/api/items/:id/history", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const history = await storage.getItemMovementHistory(id, req.companyId);
      res.json(history);
    } catch (error: any) {
      if (error.message === "Item not found") {
        return res.status(404).json({ message: "Item not found" });
      }
      console.error("Error fetching item history:", error);
      res.status(500).json({ message: "Failed to fetch item history" });
    }
  });

  // ==================== SALES ROUTES ====================
  app.get("/api/sales", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const sales = await storage.getSales(req.companyId);
      res.json(sales);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.post("/api/sales", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const { items: saleItems, ...saleData } = req.body;
      
      if (!saleItems || saleItems.length === 0) {
        return res.status(400).json({ message: "At least one item is required" });
      }

      const userId = req.user.id;
      const sale = await storage.createSale(saleData, saleItems, userId, req.companyId);
      res.json(sale);
    } catch (error) {
      console.error("Error creating sale:", error);
      res.status(500).json({ message: "Failed to create sale" });
    }
  });

  // Get single sale by ID
  app.get("/api/sales/:id", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const sale = await storage.getSale(parseInt(req.params.id), req.companyId);
      if (!sale) {
        return res.status(404).json({ message: "Sale not found" });
      }
      res.json(sale);
    } catch (error) {
      console.error("Error fetching sale:", error);
      res.status(500).json({ message: "Failed to fetch sale" });
    }
  });

  // Get sale items by sale ID
  app.get("/api/sales/:id/items", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const items = await storage.getSaleItems(parseInt(req.params.id), req.companyId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching sale items:", error);
      res.status(500).json({ message: "Failed to fetch sale items" });
    }
  });

  // Update sale
  app.put("/api/sales/:id", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const { items: saleItems, ...saleData } = req.body;
      
      if (!saleItems || !Array.isArray(saleItems) || saleItems.length === 0) {
        return res.status(400).json({ message: "At least one item is required" });
      }

      // Validate each item has required fields
      for (const item of saleItems) {
        if (!item.itemName || item.quantity === undefined || item.rate === undefined) {
          return res.status(400).json({ message: "Each item must have itemName, quantity, and rate" });
        }
        if (typeof item.quantity !== 'number' || item.quantity <= 0) {
          return res.status(400).json({ message: "Quantity must be a positive number" });
        }
        if (typeof item.rate !== 'number' || item.rate < 0) {
          return res.status(400).json({ message: "Rate must be a non-negative number" });
        }
      }

      const sale = await storage.updateSale(parseInt(req.params.id), saleData, saleItems, req.companyId);
      res.json(sale);
    } catch (error) {
      console.error("Error updating sale:", error);
      res.status(500).json({ message: "Failed to update sale" });
    }
  });

  // ==================== PURCHASE ROUTES ====================
  app.get("/api/purchases", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const purchases = await storage.getPurchases(req.companyId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });

  app.get("/api/purchases/:id", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const purchase = await storage.getPurchase(parseInt(req.params.id), req.companyId);
      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      res.json(purchase);
    } catch (error) {
      console.error("Error fetching purchase:", error);
      res.status(500).json({ message: "Failed to fetch purchase" });
    }
  });

  app.get("/api/next-serial", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const nextSerial = await storage.getNextSerial(req.companyId);
      res.json({ serial: nextSerial });
    } catch (error) {
      console.error("Error fetching next serial:", error);
      res.status(500).json({ message: "Failed to fetch next serial" });
    }
  });

  app.post("/api/purchases", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const { purchase, items } = req.body;
      
      if (!purchase || !items || !Array.isArray(items)) {
        return res.status(400).json({ message: "Purchase and items array required" });
      }

      const validatedPurchase = insertPurchaseSchema.parse(purchase);
      const userId = req.user.id;
      
      const newPurchase = await storage.createPurchase(validatedPurchase, items, userId, req.companyId);
      res.json(newPurchase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating purchase:", error);
      res.status(500).json({ message: "Failed to create purchase" });
    }
  });

  // ==================== PAYMENT ROUTES ====================
  app.get("/api/payments", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const payments = await storage.getPayments(req.companyId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const validated = insertPaymentSchema.parse(req.body);
      const userId = req.user.id;
      const payment = await storage.createPayment(validated, userId, req.companyId);
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.put("/api/payments/:id", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertPaymentSchema.parse(req.body);
      const payment = await storage.updatePayment(id, validated, req.companyId);
      res.json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating payment:", error);
      res.status(500).json({ message: "Failed to update payment" });
    }
  });

  app.delete("/api/payments/:id", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePayment(id, req.companyId);
      res.json({ message: "Payment deleted successfully" });
    } catch (error) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ message: "Failed to delete payment" });
    }
  });

  // ==================== STOCK ROUTES ====================
  app.get("/api/stock", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const stock = await storage.getStock(req.companyId);
      res.json(stock);
    } catch (error) {
      console.error("Error fetching stock:", error);
      res.status(500).json({ message: "Failed to fetch stock" });
    }
  });

  // Barcode lookup - get inventory item by barcode
  app.get("/api/inventory/barcode/:barcode", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const barcode = req.params.barcode;
      const inventoryItem = await storage.getInventoryByBarcode(barcode, req.companyId);
      
      if (!inventoryItem) {
        return res.status(404).json({ message: "Item not found with this barcode" });
      }
      
      res.json(inventoryItem);
    } catch (error) {
      console.error("Error fetching inventory by barcode:", error);
      res.status(500).json({ message: "Failed to fetch inventory by barcode" });
    }
  });

  // Get party outstanding balance
  app.get("/api/parties/:id/outstanding", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const partyId = parseInt(req.params.id);
      const outstanding = await storage.getPartyOutstanding(partyId, req.companyId);
      res.json({ partyId, outstanding });
    } catch (error) {
      console.error("Error fetching party outstanding:", error);
      res.status(500).json({ message: "Failed to fetch party outstanding" });
    }
  });

  // ==================== REPORT ROUTES ====================
  app.get("/api/dashboard/metrics", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const metrics = await storage.getDashboardMetrics(req.companyId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  app.get("/api/reports/outstanding", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const outstanding = await storage.getOutstanding(req.companyId);
      res.json(outstanding);
    } catch (error) {
      console.error("Error fetching outstanding:", error);
      res.status(500).json({ message: "Failed to fetch outstanding" });
    }
  });

  app.get("/api/reports/sales", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const { startDate, endDate, saleType } = req.query;
      const salesData = await storage.getSalesReport(
        req.companyId,
        startDate as string,
        endDate as string,
        saleType as string
      );
      res.json(salesData);
    } catch (error) {
      console.error("Error fetching sales report:", error);
      res.status(500).json({ message: "Failed to fetch sales report" });
    }
  });

  app.get("/api/reports/purchases", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      const purchasesData = await storage.getPurchasesReport(
        req.companyId,
        startDate as string,
        endDate as string
      );
      res.json(purchasesData);
    } catch (error) {
      console.error("Error fetching purchases report:", error);
      res.status(500).json({ message: "Failed to fetch purchases report" });
    }
  });

  app.get("/api/reports/items", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const { startDate, endDate, saleType } = req.query;
      const items = await storage.getItemsReport(
        req.companyId, 
        startDate as string, 
        endDate as string,
        saleType as string
      );
      res.json(items);
    } catch (error) {
      console.error("Error fetching items report:", error);
      res.status(500).json({ message: "Failed to fetch items report" });
    }
  });

  app.get("/api/reports/payments", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const { startDate, endDate, type } = req.query;
      const paymentsData = await storage.getPaymentsReport(
        req.companyId,
        startDate as string,
        endDate as string,
        type as string
      );
      res.json(paymentsData);
    } catch (error) {
      console.error("Error fetching payments report:", error);
      res.status(500).json({ message: "Failed to fetch payments report" });
    }
  });

  app.get("/api/reports/ledger/:partyId", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const partyId = parseInt(req.params.partyId);
      const { startDate, endDate } = req.query;
      const ledger = await storage.getPartyLedger(
        partyId, 
        req.companyId,
        startDate as string,
        endDate as string
      );
      
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
  app.get('/api/bill-templates', isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const templates = await storage.getBillTemplates(req.companyId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching bill templates:", error);
      res.status(500).json({ message: "Failed to fetch bill templates" });
    }
  });

  app.get('/api/bill-templates/assigned/:type', isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const { type } = req.params;
      const template = await storage.getBillTemplateByAssignment(type, req.companyId);
      res.json(template || null);
    } catch (error) {
      console.error("Error fetching assigned bill template:", error);
      res.status(500).json({ message: "Failed to fetch bill template" });
    }
  });

  app.post('/api/bill-templates', isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only super admin can create bill templates" });
      }
      const validated = insertBillTemplateSchema.parse(req.body);
      const template = await storage.createBillTemplate(validated, req.user.id, req.companyId);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating bill template:", error);
      res.status(500).json({ message: "Failed to create bill template" });
    }
  });

  app.put('/api/bill-templates/:id', isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only super admin can update bill templates" });
      }
      const validated = insertBillTemplateSchema.parse(req.body);
      const template = await storage.updateBillTemplate(parseInt(req.params.id), validated, req.companyId);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating bill template:", error);
      res.status(500).json({ message: "Failed to update bill template" });
    }
  });

  app.delete('/api/bill-templates/:id', isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only super admin can delete bill templates" });
      }
      await storage.deleteBillTemplate(parseInt(req.params.id), req.companyId);
      res.json({ message: "Bill template deleted successfully" });
    } catch (error) {
      console.error("Error deleting bill template:", error);
      res.status(500).json({ message: "Failed to delete bill template" });
    }
  });

  // ==================== PURCHASE ENTRY (Phase 1 - Bill Outline) ====================
  
  // Create purchase entry (bill header only, no items)
  app.post("/api/purchase-entries", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const validated = insertPurchaseSchema.parse(req.body);
      const userId = req.user.id;
      const purchase = await storage.createPurchaseEntry(validated, userId, req.companyId);
      res.json(purchase);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating purchase entry:", error);
      res.status(500).json({ message: "Failed to create purchase entry" });
    }
  });

  // Update purchase entry
  app.put("/api/purchase-entries/:id", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const purchase = await storage.updatePurchase(id, req.body, req.companyId);
      res.json(purchase);
    } catch (error) {
      console.error("Error updating purchase entry:", error);
      res.status(500).json({ message: "Failed to update purchase entry" });
    }
  });

  // Get pending purchases for stock inward
  app.get("/api/pending-purchases", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const purchases = await storage.getPendingPurchases(req.companyId);
      res.json(purchases);
    } catch (error) {
      console.error("Error fetching pending purchases:", error);
      res.status(500).json({ message: "Failed to fetch pending purchases" });
    }
  });

  // ==================== STOCK INWARD (Phase 2 - Item Entry) ====================

  // Get size master for size conversion
  app.get("/api/size-master", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const sizes = await storage.getSizeMaster();
      res.json(sizes);
    } catch (error) {
      console.error("Error fetching size master:", error);
      res.status(500).json({ message: "Failed to fetch size master" });
    }
  });

  // Get next global serial for barcode generation
  app.get("/api/next-global-serial", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const serial = await storage.getNextGlobalSerial(req.companyId);
      res.json({ serial });
    } catch (error) {
      console.error("Error fetching next global serial:", error);
      res.status(500).json({ message: "Failed to fetch next global serial" });
    }
  });

  // Get purchase items for a purchase
  app.get("/api/purchases/:id/items", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const purchaseId = parseInt(req.params.id);
      const items = await storage.getPurchaseItems(purchaseId, req.companyId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching purchase items:", error);
      res.status(500).json({ message: "Failed to fetch purchase items" });
    }
  });

  // Add purchase item (stock inward entry)
  app.post("/api/purchase-items", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const item = await storage.addPurchaseItem(req.body, req.companyId);
      res.json(item);
    } catch (error) {
      console.error("Error adding purchase item:", error);
      res.status(500).json({ message: "Failed to add purchase item" });
    }
  });

  // Update purchase item
  app.put("/api/purchase-items/:id", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.updatePurchaseItem(id, req.body, req.companyId);
      res.json(item);
    } catch (error) {
      console.error("Error updating purchase item:", error);
      res.status(500).json({ message: "Failed to update purchase item" });
    }
  });

  // Delete purchase item
  app.delete("/api/purchase-items/:id", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePurchaseItem(id, req.companyId);
      res.json({ message: "Purchase item deleted successfully" });
    } catch (error) {
      console.error("Error deleting purchase item:", error);
      res.status(500).json({ message: "Failed to delete purchase item" });
    }
  });

  // Generate barcodes for a purchase item (create stock inward items)
  app.post("/api/purchase-items/:id/generate-barcodes", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const purchaseItemId = parseInt(req.params.id);
      const { items } = req.body;
      
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ message: "Items array required" });
      }
      
      const createdItems = await storage.createStockInwardItems(purchaseItemId, items, req.companyId);
      res.json(createdItems);
    } catch (error) {
      console.error("Error generating barcodes:", error);
      res.status(500).json({ message: "Failed to generate barcodes" });
    }
  });

  // Get stock inward items for a purchase item
  app.get("/api/purchase-items/:id/stock-inward-items", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const purchaseItemId = parseInt(req.params.id);
      const items = await storage.getStockInwardItems(purchaseItemId, req.companyId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching stock inward items:", error);
      res.status(500).json({ message: "Failed to fetch stock inward items" });
    }
  });

  // Complete purchase (mark as stock inward completed)
  app.post("/api/purchases/:id/complete", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const purchaseId = parseInt(req.params.id);
      await storage.completePurchase(purchaseId, req.companyId);
      res.json({ message: "Purchase completed successfully" });
    } catch (error) {
      console.error("Error completing purchase:", error);
      res.status(500).json({ message: "Failed to complete purchase" });
    }
  });

  // ==================== STOCK INWARD BARCODE MANAGEMENT ====================

  // Get all stock inward items with filters
  app.get("/api/stock-inward-items", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const filters: { purchaseId?: number; status?: string; size?: string } = {};
      if (req.query.purchaseId) filters.purchaseId = parseInt(req.query.purchaseId);
      if (req.query.status) filters.status = req.query.status;
      if (req.query.size) filters.size = req.query.size;
      
      const items = await storage.getAllStockInwardItems(req.companyId, filters);
      res.json(items);
    } catch (error) {
      console.error("Error fetching stock inward items:", error);
      res.status(500).json({ message: "Failed to fetch stock inward items" });
    }
  });

  // Get single stock inward item
  app.get("/api/stock-inward-items/:id", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getStockInwardItem(id, req.companyId);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching stock inward item:", error);
      res.status(500).json({ message: "Failed to fetch stock inward item" });
    }
  });

  // Update stock inward item (price/size)
  app.patch("/api/stock-inward-items/:id", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = updateStockInwardItemSchema.parse(req.body);
      const updated = await storage.updateStockInwardItem(id, validated, req.companyId);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating stock inward item:", error);
      res.status(500).json({ message: "Failed to update stock inward item" });
    }
  });

  // Delete stock inward item (barcode)
  app.delete("/api/stock-inward-items/:id", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteStockInwardItem(id, req.companyId);
      res.json({ message: "Barcode deleted successfully" });
    } catch (error) {
      console.error("Error deleting stock inward item:", error);
      res.status(500).json({ message: "Failed to delete barcode" });
    }
  });

  // Bulk delete stock inward items
  app.post("/api/stock-inward-items/bulk-delete", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ message: "ids array required" });
      }
      await storage.bulkDeleteStockInwardItems(ids, req.companyId);
      res.json({ message: `${ids.length} barcodes deleted successfully` });
    } catch (error) {
      console.error("Error bulk deleting stock inward items:", error);
      res.status(500).json({ message: "Failed to delete barcodes" });
    }
  });

  // Bulk create stock inward items with multiple sizes
  app.post("/api/purchase-items/:id/generate-bulk-barcodes", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const purchaseItemId = parseInt(req.params.id);
      const { sizeEntries, baseData } = req.body;
      
      if (!sizeEntries || !Array.isArray(sizeEntries)) {
        return res.status(400).json({ message: "sizeEntries array required" });
      }
      
      // Validate size entries
      for (const entry of sizeEntries) {
        if (!entry.size || typeof entry.quantity !== 'number' || entry.quantity < 1) {
          return res.status(400).json({ message: "Each size entry must have size and quantity >= 1" });
        }
      }
      
      const createdItems = await storage.createBulkStockInwardItems(
        purchaseItemId, 
        sizeEntries, 
        baseData || {}, 
        req.companyId
      );
      res.json(createdItems);
    } catch (error) {
      console.error("Error generating bulk barcodes:", error);
      res.status(500).json({ message: "Failed to generate bulk barcodes" });
    }
  });

  // ==================== BARCODE LABEL TEMPLATE ROUTES ====================

  // Get all barcode label templates
  app.get("/api/barcode-label-templates", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const templates = await storage.getBarcodeLabelTemplates(req.companyId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching barcode label templates:", error);
      res.status(500).json({ message: "Failed to fetch barcode label templates" });
    }
  });

  // Get default barcode label template
  app.get("/api/barcode-label-templates/default", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const template = await storage.getDefaultBarcodeLabelTemplate(req.companyId);
      res.json(template || null);
    } catch (error) {
      console.error("Error fetching default barcode label template:", error);
      res.status(500).json({ message: "Failed to fetch default barcode label template" });
    }
  });

  // Create barcode label template
  app.post("/api/barcode-label-templates", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const validated = insertBarcodeLabelTemplateSchema.parse(req.body);
      const template = await storage.createBarcodeLabelTemplate(validated, req.user.id, req.companyId);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating barcode label template:", error);
      res.status(500).json({ message: "Failed to create barcode label template" });
    }
  });

  // Update barcode label template
  app.patch("/api/barcode-label-templates/:id", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.updateBarcodeLabelTemplate(id, req.body, req.companyId);
      res.json(template);
    } catch (error) {
      console.error("Error updating barcode label template:", error);
      res.status(500).json({ message: "Failed to update barcode label template" });
    }
  });

  // Delete barcode label template
  app.delete("/api/barcode-label-templates/:id", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBarcodeLabelTemplate(id, req.companyId);
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Error deleting barcode label template:", error);
      res.status(500).json({ message: "Failed to delete barcode label template" });
    }
  });

  // ==================== OBJECT STORAGE ROUTES ====================
  app.post("/api/objects/upload", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
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
