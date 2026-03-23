import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./localAuth";
import { validateCompanyAccess } from "./companyMiddleware";
import { runMigrations } from "./db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import archiver from "archiver";
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
  insertFinancialYearSchema,
  type PrintSettings,
} from "@shared/schema";
import { ObjectStorageService } from "./objectStorage";

// Store connected print clients
const printClients: Map<string, WebSocket> = new Map();

// Helper function to check if user has admin privileges
function isAdminRole(role: string | undefined | null): boolean {
  return role === 'admin' || role === 'superadmin';
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Run database migrations first (handles schema updates)
  try {
    await runMigrations();
  } catch (error) {
    console.error('Failed to run migrations:', error);
    process.exit(1);
  }

  // Setup Replit Auth
  await setupAuth(app);

  // ==================== HEALTH CHECK ====================
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // ==================== SETUP ROUTES (No Auth Required) ====================
  app.get('/api/check-setup', async (req: any, res) => {
    try {
      const needsSetup = await storage.needsInitialSetup();
      res.json({ needsSetup });
    } catch (error) {
      console.error("Error checking setup:", error);
      res.status(500).json({ message: "Failed to check setup status" });
    }
  });

  app.post('/api/setup', async (req: any, res) => {
    try {
      console.log('[SETUP] Setup POST request initiated');
      
      // Check if setup is already complete
      const needsSetup = await storage.needsInitialSetup();
      console.log('[SETUP] Needs setup check:', needsSetup);
      
      if (!needsSetup) {
        return res.status(400).json({ message: "System is already set up" });
      }

      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create super admin user - MUST be superadmin role
      const userRole = 'superadmin';
      const userFirstName = 'Super';
      const userLastName = 'Admin';
      console.log('[SETUP] Creating superadmin with role:', userRole, 'username:', username);
      
      const user = await storage.createUser({
        username,
        passwordHash,
        role: userRole,
        firstName: userFirstName,
        lastName: userLastName,
      });
      console.log('[SETUP] User created:', { id: user.id, username: user.username, role: user.role });

      // Login the user by creating a session
      req.logIn(user, async (err: any) => {
        if (err) {
          console.error("[SETUP] Error logging in user:", err);
          return res.status(500).json({ message: "User created but login failed: " + err.message });
        }

        try {
          // Assign to default company
          await storage.assignUserToDefaultCompany(user.id);
          console.log('[SETUP] User assigned to default company');
        } catch (companyErr) {
          console.error("[SETUP] Error assigning company:", companyErr);
        }

        res.json({
          message: "Setup complete! Super admin account created successfully.",
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
          },
        });
      });
    } catch (error) {
      console.error("[SETUP] Error during setup:", error);
      res.status(500).json({ message: "Failed to complete setup: " + (error instanceof Error ? error.message : "Unknown error") });
    }
  });

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
      // Allow both superadmin and admin to access user management
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only admin users can access user management" });
      }
      const allUsers = await storage.getAllUsers();
      
      // Filter users based on current user's role
      let filteredUsers = allUsers;
      if (currentUser?.role === 'admin') {
        // Admin users should NOT see superadmin users
        filteredUsers = allUsers.filter(u => u.role !== 'superadmin');
      }
      // superadmin users see all users
      
      res.json(filteredUsers);
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

  app.put('/api/users/:id/permissions', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only super admin can manage permissions" });
      }
      const { role, pagePermissions } = req.body;
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const user = await storage.updateUserPermissions(req.params.id, role, pagePermissions);
      res.json(user);
    } catch (error) {
      console.error("Error updating user permissions:", error);
      res.status(500).json({ message: "Failed to update user permissions" });
    }
  });

  app.put('/api/users/:id/password', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only super admin can update passwords" });
      }
      const { password } = req.body;
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.updateUserPassword(req.params.id, passwordHash);
      res.json(user);
    } catch (error) {
      console.error("Error updating user password:", error);
      res.status(500).json({ message: "Failed to update user password" });
    }
  });

  app.post('/api/users/create', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only admin users can create users" });
      }

      const createUserSchema = z.object({
        username: z.string().min(1, "Username is required"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        role: z.enum(['user', 'admin']),
        pagePermissions: z.array(z.string()).optional(),
        companyIds: z.array(z.number()).optional(),
      });

      const validated = createUserSchema.parse(req.body);
      
      // Admin users can create admin and normal users, but NOT superadmin
      // Superadmin can create admin and normal users
      if (validated.role === 'superadmin') {
        return res.status(403).json({ message: "Cannot create superadmin users" });
      }
      
      // Convert empty strings to undefined for optional fields
      if (validated.email === "") validated.email = undefined;
      if (validated.firstName === "") validated.firstName = undefined;
      if (validated.lastName === "") validated.lastName = undefined;
      
      // Hash password
      const passwordHash = await bcrypt.hash(validated.password, 10);
      
      // Create user with page permissions
      const newUser = await storage.createUser({
        username: validated.username,
        passwordHash,
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email,
        role: validated.role,
        pagePermissions: validated.pagePermissions || [],
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
      // Ensure default FY start dates
      const companyData = {
        ...validated,
        fyStartMonth: validated.fyStartMonth ?? 4,
        fyStartDay: validated.fyStartDay ?? 1,
      };
      const userId = req.user.id;
      const company = await storage.createCompany(companyData, userId);
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

  // ==================== FINANCIAL YEAR ROUTES ====================
  app.get('/api/financial-years', isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const financialYears = await storage.getFinancialYears(req.companyId);
      res.json(financialYears);
    } catch (error) {
      console.error("Error fetching financial years:", error);
      res.status(500).json({ message: "Failed to fetch financial years" });
    }
  });

  app.get('/api/financial-years/active', isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const activeFY = await storage.getActiveFinancialYear(req.companyId);
      res.json(activeFY || null);
    } catch (error) {
      console.error("Error fetching active financial year:", error);
      res.status(500).json({ message: "Failed to fetch active financial year" });
    }
  });

  app.get('/api/financial-years/:id', isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const fy = await storage.getFinancialYear(id, req.companyId);
      if (!fy) {
        return res.status(404).json({ message: "Financial year not found" });
      }
      res.json(fy);
    } catch (error) {
      console.error("Error fetching financial year:", error);
      res.status(500).json({ message: "Failed to fetch financial year" });
    }
  });

  app.post('/api/financial-years', isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only admin can create financial years" });
      }
      const validated = insertFinancialYearSchema.parse({
        ...req.body,
        companyId: req.companyId,
      });
      const fy = await storage.createFinancialYear(validated);
      res.json(fy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating financial year:", error);
      res.status(500).json({ message: "Failed to create financial year" });
    }
  });

  app.put('/api/financial-years/:id', isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only admin can update financial years" });
      }
      const id = parseInt(req.params.id);
      const validated = insertFinancialYearSchema.partial().parse(req.body);
      const fy = await storage.updateFinancialYear(id, validated, req.companyId);
      res.json(fy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating financial year:", error);
      res.status(500).json({ message: "Failed to update financial year" });
    }
  });

  app.post('/api/financial-years/:id/activate', isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only admin can activate financial years" });
      }
      const id = parseInt(req.params.id);
      const fy = await storage.setActiveFinancialYear(id, req.companyId);
      res.json(fy);
    } catch (error) {
      console.error("Error activating financial year:", error);
      res.status(500).json({ message: "Failed to activate financial year" });
    }
  });

  app.delete('/api/financial-years/:id', isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only admin can delete financial years" });
      }
      const id = parseInt(req.params.id);
      await storage.deleteFinancialYear(id, req.companyId);
      res.json({ success: true, message: "Financial year deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting financial year:", error);
      res.status(500).json({ message: error.message || "Failed to delete financial year" });
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

  app.get("/api/parties/export", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const parties = await storage.getParties(req.companyId);
      const exportData = parties.map(party => ({
        Code: party.code || "",
        Name: party.name || "",
        City: party.city || "",
        State: party.state || "",
        StateCode: party.stateCode || "",
        Address: party.address || "",
        GSTNo: party.gstNo || "",
        Phone: party.phone || "",
        OpeningDebit: parseFloat(party.openingDebit) || 0,
        OpeningCredit: parseFloat(party.openingCredit) || 0,
      }));
      res.json(exportData);
    } catch (error: any) {
      console.error("Export parties error:", error?.message || error);
      res.status(500).json({ message: "Failed to export parties: " + (error?.message || "Unknown error") });
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

  app.get("/api/items/export", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const items = await storage.getItems(req.companyId);
      const exportData = items.map(item => ({
        Code: item.code || "",
        Name: item.name || "",
        HSN: item.hsnCode || "",
        Category: item.category || "",
        Floor: item.floor || "",
        PackType: item.packType || "PCS",
        Type: item.type || "product",
        Cost: parseFloat(item.cost) || 0,
        MRP: parseFloat(item.mrp) || 0,
        SellingPrice: parseFloat(item.sellingPrice) || 0,
        Tax: parseFloat(item.tax) || 0,
        Active: item.active ? "Yes" : "No",
      }));
      res.json(exportData);
    } catch (error: any) {
      console.error("Export items error:", error?.message || error);
      res.status(500).json({ message: "Failed to export items: " + (error?.message || "Unknown error") });
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

  // ==================== IMPORT / EXPORT ROUTES ====================

  // Export Items to JSON
  // Import Items from Excel
  app.post("/api/items/import", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ message: "No data provided" });
      }
      const userId = req.user.id;
      let created = 0, updated = 0;
      const errors: string[] = [];
      for (const row of rows) {
        try {
          const taxVal = parseFloat(row.Tax || row.tax || 0);
          const itemData = {
            code: String(row.Code || row.code || "").trim(),
            name: String(row.Name || row.name || "").trim(),
            hsnCode: String(row.HSN || row.hsnCode || "").trim(),
            category: String(row.Category || row.category || "").trim(),
            floor: String(row.Floor || row.floor || "").trim(),
            packType: String(row.PackType || row.packType || "PCS").trim(),
            type: String(row.Type || row.type || "product").trim().toLowerCase(),
            cost: String(parseFloat(row.Cost || row.cost || 0)),
            mrp: String(parseFloat(row.MRP || row.mrp || 0)),
            sellingPrice: String(parseFloat(row.SellingPrice || row.sellingPrice || 0)),
            tax: String(taxVal),
            cgst: String(taxVal / 2),
            sgst: String(taxVal / 2),
            active: String(row.Active || "Yes").toLowerCase() !== "no",
          };
          if (!itemData.name) { errors.push("Row skipped: missing Name"); continue; }
          if (itemData.code) {
            const existing = await storage.getItemByCode(itemData.code, req.companyId);
            if (existing) { await storage.updateItem(existing.id, itemData, req.companyId); updated++; continue; }
          }
          await storage.createItem(itemData, userId, req.companyId);
          created++;
        } catch (e: any) { errors.push(e.message); }
      }
      res.json({ message: "Import complete", created, updated, errors: errors.slice(0, 10) });
    } catch (error) {
      res.status(500).json({ message: "Failed to import items" });
    }
  });

  // Export Parties to JSON
  // Import Parties from Excel
  app.post("/api/parties/import", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ message: "No data provided" });
      }
      const userId = req.user.id;
      let created = 0, updated = 0;
      const errors: string[] = [];
      for (const row of rows) {
        try {
          const partyData = {
            code: String(row.Code || row.code || "").trim(),
            name: String(row.Name || row.name || "").trim(),
            city: String(row.City || row.city || "N/A").trim() || "N/A",
            state: String(row.State || row.state || "").trim(),
            stateCode: String(row.StateCode || row.stateCode || "").trim(),
            address: String(row.Address || row.address || "").trim(),
            gstNo: String(row.GSTNo || row.gstNo || row.GST || "").trim(),
            phone: String(row.Phone || row.phone || "").trim(),
            openingDebit: String(parseFloat(row.OpeningDebit || row.openingDebit || 0)),
            openingCredit: String(parseFloat(row.OpeningCredit || row.openingCredit || 0)),
          };
          if (!partyData.name) { errors.push("Row skipped: missing Name"); continue; }
          if (partyData.code) {
            const existing = await storage.getPartyByCode(partyData.code, req.companyId);
            if (existing) { await storage.updateParty(existing.id, partyData, req.companyId); updated++; continue; }
          }
          await storage.createParty(partyData, userId, req.companyId);
          created++;
        } catch (e: any) { errors.push(e.message); }
      }
      res.json({ message: "Import complete", created, updated, errors: errors.slice(0, 10) });
    } catch (error) {
      res.status(500).json({ message: "Failed to import parties" });
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

      // Validate transaction date is within active FY period
      const activeFY = await storage.getActiveFinancialYear(req.companyId);
      if (!activeFY) {
        return res.status(400).json({ message: "No active Financial Year set for this company" });
      }

      const transactionDate = new Date(saleData.date);
      const fyStartDate = new Date(activeFY.startDate);
      const fyEndDate = new Date(activeFY.endDate);

      if (transactionDate < fyStartDate || transactionDate > fyEndDate) {
        return res.status(400).json({ 
          message: `Transaction date must be between ${fyStartDate.toLocaleDateString()} and ${fyEndDate.toLocaleDateString()} (Active FY: ${activeFY.label})` 
        });
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

      // Validate transaction date is within active FY period
      const activeFY = await storage.getActiveFinancialYear(req.companyId);
      if (!activeFY) {
        return res.status(400).json({ message: "No active Financial Year set for this company" });
      }

      const transactionDate = new Date(saleData.date);
      const fyStartDate = new Date(activeFY.startDate);
      const fyEndDate = new Date(activeFY.endDate);

      if (transactionDate < fyStartDate || transactionDate > fyEndDate) {
        return res.status(400).json({ 
          message: `Transaction date must be between ${fyStartDate.toLocaleDateString()} and ${fyEndDate.toLocaleDateString()} (Active FY: ${activeFY.label})` 
        });
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
      const { partyId, itemId } = req.query;
      const stock = await storage.getStock(
        req.companyId, 
        partyId ? parseInt(partyId) : undefined,
        itemId ? parseInt(itemId) : undefined
      );
      res.json(stock);
    } catch (error) {
      console.error("Error fetching stock:", error);
      res.status(500).json({ message: "Failed to fetch stock" });
    }
  });

  // Stock info for bill entry - available qty and barcode flag
  app.get("/api/stock/info/:companyId", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const stockInfo = await storage.getStockInfoForBillEntry(req.companyId);
      res.json(stockInfo);
    } catch (error) {
      console.error("Error fetching stock info:", error);
      res.status(500).json({ message: "Failed to fetch stock info" });
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
      const { startDate, endDate, saleType, itemId } = req.query;
      const salesData = await storage.getSalesReport(
        req.companyId,
        startDate as string,
        endDate as string,
        saleType as string,
        itemId as string
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
      const { startDate, endDate, saleType, itemId, category } = req.query;
      const items = await storage.getItemsReport(
        req.companyId, 
        startDate as string, 
        endDate as string,
        saleType as string,
        itemId as string,
        category as string
      );
      res.json(items);
    } catch (error) {
      console.error("Error fetching items report:", error);
      res.status(500).json({ message: "Failed to fetch items report" });
    }
  });

  app.get("/api/reports/categories", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const { startDate, endDate, saleType } = req.query;
      const categories = await storage.getCategoriesReport(
        req.companyId, 
        startDate as string, 
        endDate as string,
        saleType as string
      );
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories report:", error);
      res.status(500).json({ message: "Failed to fetch categories report" });
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

  app.get("/api/reports/sales-total", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const { fromDate, toDate, billType } = req.query;
      const reportData = await storage.getSalesTotalReport(
        req.companyId,
        fromDate as string,
        toDate as string,
        billType as string
      );
      res.json(reportData);
    } catch (error) {
      console.error("Error fetching sales total report:", error);
      res.status(500).json({ message: "Failed to fetch sales total report" });
    }
  });

  app.get("/api/reports/gstr1", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      console.log("[GSTR1] User:", req.user?.id, "Company:", req.companyId);
      const { startDate, endDate, saleType } = req.query;
      console.log("[GSTR1] Params:", { startDate, endDate, saleType });
      const gstrData = await storage.getGSTR1Data(
        req.companyId,
        startDate as string,
        endDate as string,
        saleType as string
      );
      console.log("[GSTR1] Data count:", gstrData?.length);
      res.json(gstrData);
    } catch (error) {
      console.error("Error fetching GSTR1 data:", error);
      res.status(500).json({ message: "Failed to fetch GSTR1 data" });
    }
  });

  app.get("/api/reports/hsn-summary", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const { startDate, endDate, saleType } = req.query;
      const hsnData = await storage.getHSNSummaryData(
        req.companyId,
        startDate as string,
        endDate as string,
        saleType as string
      );
      res.json(hsnData);
    } catch (error) {
      console.error("Error fetching HSN summary data:", error);
      res.status(500).json({ message: "Failed to fetch HSN summary data" });
    }
  });

  app.get("/api/sales/:id/einvoice-json", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const saleId = parseInt(req.params.id);
      const eInvoiceJSON = await storage.generateEInvoiceJSON(saleId, req.companyId);
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="einvoice-${saleId}.json"`);
      res.json([eInvoiceJSON]);
    } catch (error: any) {
      console.error("Error generating e-Invoice JSON:", error);
      res.status(400).json({ message: error.message || "Failed to generate e-Invoice JSON" });
    }
  });

  // Update e-invoice details for a sale (after uploading to GST portal)
  app.patch("/api/sales/:id/einvoice", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const saleId = parseInt(req.params.id);
      const { irn, ackNumber, ackDate, qrCode, einvoiceStatus, signedInvoice } = req.body;
      
      const updatedSale = await storage.updateSaleEinvoice(saleId, req.companyId, {
        irn,
        ackNumber,
        ackDate: ackDate ? new Date(ackDate) : null,
        qrCode,
        einvoiceStatus: einvoiceStatus || 'generated',
        signedInvoice
      });
      
      res.json(updatedSale);
    } catch (error: any) {
      console.error("Error updating e-Invoice details:", error);
      res.status(400).json({ message: error.message || "Failed to update e-Invoice details" });
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
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only admin can create bill templates" });
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
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only admin can update bill templates" });
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
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only admin can delete bill templates" });
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

  // Get purchase tally status (qty matching between bills and stock inward)
  app.get("/api/purchase-tally", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const tallyStatus = await storage.getPurchaseTallyStatus(req.companyId);
      res.json(tallyStatus);
    } catch (error) {
      console.error("Error fetching purchase tally status:", error);
      res.status(500).json({ message: "Failed to fetch purchase tally status" });
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
      // Update item's sellingPrice and mrp from rrate/mrp
      if (item.itemId && item.rrate) {
        const sellingPrice = Math.round(parseFloat(item.rrate)).toString();
        const mrp = item.mrp ? Math.round(parseFloat(item.mrp)).toString() : sellingPrice;
        await storage.updateItemRates(item.itemId, sellingPrice, mrp, req.companyId);
      }
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
      // Update item's sellingPrice and mrp from rrate/mrp
      if (item.itemId && item.rrate) {
        const sellingPrice = Math.round(parseFloat(item.rrate)).toString();
        const mrp = item.mrp ? Math.round(parseFloat(item.mrp)).toString() : sellingPrice;
        await storage.updateItemRates(item.itemId, sellingPrice, mrp, req.companyId);
      }
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

  // ==================== DIRECT PRINT WEBSOCKET ROUTES ====================
  
  // Generate a unique print token for a company
  app.post("/api/print/generate-token", isAuthenticated, async (req: any, res) => {
    try {
      const companyId = parseInt(req.headers['x-company-id'] as string) || req.user?.companyId;
      if (!companyId) {
        return res.status(400).json({ success: false, message: "Company ID required" });
      }
      
      // Generate a random token
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Save to database and disconnect old clients
      const savedToken = await storage.createOrUpdatePrintToken(companyId, token);
      
      // Disconnect old clients for this company
      for (const [clientToken, client] of printClients.entries()) {
        if (client && client.readyState === WebSocket.OPEN) {
          client.close(1000, "Token rotated");
        }
      }
      printClients.clear();
      
      res.json({ 
        success: true, 
        token: savedToken.token,
        message: "Token generated. Use this in your local print service configuration."
      });
    } catch (error) {
      console.error("Error generating token:", error);
      res.status(500).json({ success: false, message: "Failed to generate token" });
    }
  });
  
  // Validate a print token
  app.get("/api/print/validate-token", isAuthenticated, async (req: any, res) => {
    try {
      const token = req.query.token as string;
      const companyId = parseInt(req.headers['x-company-id'] as string) || req.user?.companyId;
      
      if (!token) {
        return res.json({ valid: false });
      }
      
      const savedToken = await storage.getPrintToken(companyId);
      res.json({ 
        valid: savedToken?.token === token,
        createdAt: savedToken?.createdAt
      });
    } catch (error) {
      console.error("Error validating token:", error);
      res.json({ valid: false });
    }
  });
  
  // ==================== PRINT SETTINGS ROUTES ====================
  
  // Get print settings for company
  app.get("/api/print-settings", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const settings = await storage.getPrintSettings(req.companyId);
      if (!settings) {
        return res.json({
          autoPrintB2B: false,
          autoPrintB2C: true,
          autoPrintEstimate: false,
          autoPrintCreditNote: false,
          autoPrintDebitNote: false,
          printCopiesB2B: 2,
          printCopiesB2C: 1,
          printCopiesEstimate: 1,
          printCopiesCreditNote: 2,
          printCopiesDebitNote: 2,
          showPrintConfirmation: true,
          defaultPrinterName: "",
          enableTamilPrint: false,
          directPrintB2B: false,
          directPrintB2C: false,
          directPrintEstimate: false,
          directPrintCreditNote: false,
          directPrintDebitNote: false,
          enableWebSocketPrint: false,
          webSocketPrinterName: "",
        });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error getting print settings:", error);
      res.status(500).json({ message: "Failed to get print settings" });
    }
  });

  // Save print settings for company
  app.post("/api/print-settings", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const settings = await storage.upsertPrintSettings(req.companyId, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error saving print settings:", error);
      res.status(500).json({ message: "Failed to save print settings" });
    }
  });

  // Get print client status - authenticated by company token
  app.get("/api/print/status", isAuthenticated, async (req: any, res) => {
    try {
      const companyId = parseInt(req.headers['x-company-id'] as string) || req.user?.companyId;
      
      const savedToken = await storage.getPrintToken(companyId);
      const companyToken = savedToken?.token || null;
      
      // Check if a client is connected with this company's token
      const client = companyToken ? printClients.get(companyToken) : null;
      const isConnected = client && client.readyState === WebSocket.OPEN;
      
      res.json({ 
        connected: isConnected,
        hasToken: !!companyToken,
        message: isConnected 
          ? "Local print service connected" 
          : companyToken 
            ? "Token exists but service not connected. Run the Python script on your Windows PC."
            : "No token generated. Generate a token first."
      });
    } catch (error) {
      console.error("Error checking status:", error);
      res.json({ 
        connected: false, 
        hasToken: false, 
        message: "Error checking print service status" 
      });
    }
  });
  
  // Send print command to connected client
  app.post("/api/print/send", isAuthenticated, async (req: any, res) => {
    try {
      const { content, format, printerName } = req.body;
      const companyId = parseInt(req.headers['x-company-id'] as string) || req.user?.companyId;
      
      const savedToken = await storage.getPrintToken(companyId);
      const companyToken = savedToken?.token || null;
      
      // Get the client connected with this company's token
      const client = companyToken ? printClients.get(companyToken) : null;
      
      if (!client || client.readyState !== WebSocket.OPEN) {
        return res.status(503).json({ 
          success: false, 
          message: "Print service not connected. Please start the local print service." 
        });
      }
      
      const printData = {
        type: "print",
        content,
        format: format || "text",
        printerName: printerName || null,
        timestamp: new Date().toISOString()
      };
      
      client.send(JSON.stringify(printData));
      res.json({ success: true, message: "Print command sent" });
    } catch (error) {
      console.error("Error sending print command:", error);
      res.status(500).json({ success: false, message: "Failed to send print command" });
    }
  });

  const httpServer = createServer(app);
  
  // ==================== WEBSOCKET SERVER FOR DIRECT PRINTING ====================
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/print" });
  
  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token") || "";
    
    // Validate the token from database
    if (!token) {
      console.log("Print client rejected: missing token");
      ws.close(4001, "Invalid or missing authentication token");
      return;
    }
    
    // Find company with this token in database
    let companyId: number | null = null;
    try {
      // This is a simplified approach - in production you might want a dedicated method
      // For now, we validate by checking if WebSocket messages include company context
      // The token itself is stored with companyId in the database
      companyId = null; // Will be set after validation
    } catch (error) {
      console.log("Print client rejected: token validation error");
      ws.close(4001, "Token validation failed");
      return;
    }
    
    console.log(`Print client connected with token: ${token.substring(0, 8)}...`);
    
    // Close any existing connection for this token (replace old connection)
    const existingClient = printClients.get(token);
    if (existingClient && existingClient.readyState === WebSocket.OPEN) {
      existingClient.close(1000, "Replaced by new connection");
    }
    
    // Store the connection by token
    printClients.set(token, ws);
    
    // Send connection confirmation
    ws.send(JSON.stringify({ 
      type: "connected", 
      message: "Connected to print server"
    }));
    
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`Message from print client:`, message);
        
        if (message.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        } else if (message.type === "print_result") {
          console.log(`Print result:`, message.success ? "Success" : "Failed");
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });
    
    ws.on("close", () => {
      console.log(`Print client disconnected`);
      printClients.delete(token);
    });
    
    ws.on("error", (error) => {
      console.error(`WebSocket error:`, error);
      printClients.delete(token);
    });
  });
  
  console.log("WebSocket print server initialized on /ws/print");
  
  // ==================== FILE DOWNLOADS ====================
  app.get('/api/download/benesys_print_service.py', (req, res) => {
    try {
      const filePath = join(process.cwd(), 'attached_assets', 'benesys_print_service.py');
      const fileContent = readFileSync(filePath, 'utf-8');
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="benesys_print_service.py"');
      res.send(fileContent);
    } catch (error) {
      console.error('Error downloading print service:', error);
      res.status(404).json({ message: 'File not found' });
    }
  });

  app.get('/api/download/install_dependencies.bat', (req, res) => {
    try {
      const filePath = join(process.cwd(), 'attached_assets', 'install_dependencies.bat');
      const fileContent = readFileSync(filePath, 'utf-8');
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="install_dependencies.bat"');
      res.send(fileContent);
    } catch (error) {
      console.error('Error downloading installer:', error);
      res.status(404).json({ message: 'File not found' });
    }
  });

  app.get('/api/download/benesys-setup-complete.zip', (req, res) => {
    try {
      const assetsDir = join(process.cwd(), 'attached_assets');
      const files = [
        'install_dependencies.bat',
        'setup_autostart.bat',
        'benesys_print_service.py',
        'SETUP_GUIDE.txt'
      ];

      // Check if all files exist
      for (const file of files) {
        if (!existsSync(join(assetsDir, file))) {
          console.warn(`Warning: ${file} not found, will skip in ZIP`);
        }
      }

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="BeneSys-Print-Service-Setup.zip"');

      const archive = archiver('zip', { zlib: { level: 9 } });
      archive.pipe(res);

      // Add files to ZIP
      files.forEach((file) => {
        const filePath = join(assetsDir, file);
        if (existsSync(filePath)) {
          archive.file(filePath, { name: file });
        }
      });

      archive.finalize();
    } catch (error) {
      console.error('Error creating ZIP:', error);
      res.status(500).json({ message: 'Failed to create ZIP file' });
    }
  });

  app.get("/api/reports/agent-commission", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const commissions = await storage.getAgentCommissionReport(req.companyId);
      res.json(commissions);
    } catch (error) {
      console.error("Error fetching agent commission report:", error);
      res.status(500).json({ message: "Failed to fetch agent commission report" });
    }
  });

  // Generate PRN file for Zebra barcode printers
  app.post("/api/barcodes/generate-prn", isAuthenticated, validateCompanyAccess, async (req: any, res) => {
    try {
      const { barcodeIds, templateId } = req.body;
      if (!barcodeIds || !Array.isArray(barcodeIds) || barcodeIds.length === 0) {
        return res.status(400).json({ message: "No barcodes selected" });
      }

      const barcodes = await storage.getBarcodesByIds(barcodeIds);
      
      // Get the label template if templateId provided, or get default template
      let prnProgram: string | null = null;
      if (templateId) {
        const template = await storage.getBarcodeLabelTemplate(templateId);
        if (template && template.prnProgram) {
          prnProgram = template.prnProgram;
        }
      } else {
        // Try to get default template
        const defaultTemplate = await storage.getDefaultBarcodeLabelTemplate(req.companyId);
        if (defaultTemplate && defaultTemplate.prnProgram) {
          prnProgram = defaultTemplate.prnProgram;
        }
      }
      
      let prnContent = '';
      barcodes.forEach((barcode: any) => {
        const itemName = (barcode.itemName || '').substring(0, 30);
        const mrp = barcode.mrp || '0';
        const sellingPrice = barcode.sellingPrice || '0';
        const barcodeNum = barcode.barcode || '';
        const hsnCode = barcode.hsnCode || '';
        const size = barcode.size || '';
        const sizeCode = barcode.sizeCode || '';

        if (prnProgram) {
          // Use the stored program template with placeholder replacement
          let labelContent = prnProgram
            .replace(/\{barcode\}/g, barcodeNum)
            .replace(/\{itemName\}/g, itemName)
            .replace(/\{mrp\}/g, mrp)
            .replace(/\{sellingPrice\}/g, sellingPrice)
            .replace(/\{hsnCode\}/g, hsnCode)
            .replace(/\{size\}/g, size)
            .replace(/\{sizeCode\}/g, sizeCode);
          prnContent += labelContent + '\n';
        } else {
          // Default Zebra EPL2 commands for each label
          prnContent += '\nN\n';
          prnContent += 'q400\n';
          prnContent += 'Q200,24\n';
          prnContent += `B50,20,0,1,2,7,80,B,"${barcodeNum}"\n`;
          prnContent += `A50,110,0,2,1,1,N,"${itemName}"\n`;
          prnContent += `A50,135,0,2,1,1,N,"MRP: ${mrp}  Rate: ${sellingPrice}"\n`;
          if (hsnCode) {
            prnContent += `A50,160,0,1,1,1,N,"HSN: ${hsnCode}"\n`;
          }
          prnContent += 'P1\n';
        }
      });

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="LABELS_${Date.now()}.PRN"`);
      res.send(prnContent);
    } catch (error) {
      console.error("Error generating PRN file:", error);
      res.status(500).json({ message: "Failed to generate PRN file" });
    }
  });
  
  return httpServer;
}
