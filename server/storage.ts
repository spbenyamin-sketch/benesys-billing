import {
  users,
  parties,
  items,
  sales,
  saleItems,
  purchases,
  purchaseItems,
  stockInwardItems,
  sizeMaster,
  payments,
  stock,
  billTemplates,
  barcodeLabelTemplates,
  companies,
  userCompanies,
  agents,
  type User,
  type UpsertUser,
  type Party,
  type InsertParty,
  type Item,
  type InsertItem,
  type Sale,
  type InsertSale,
  type SaleItem,
  type InsertSaleItem,
  type Purchase,
  type InsertPurchase,
  type PurchaseItem,
  type InsertPurchaseItem,
  type StockInwardItem,
  type InsertStockInwardItem,
  type Payment,
  type InsertPayment,
  type Stock,
  type InsertStock,
  type BillTemplate,
  type InsertBillTemplate,
  type BarcodeLabelTemplate,
  type InsertBarcodeLabelTemplate,
  type Company,
  type InsertCompany,
  type Agent,
  type InsertAgent,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, lt, sql, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: Partial<UpsertUser>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getUserCompanies(userId: string): Promise<any[]>;
  assignUserToDefaultCompany(userId: string): Promise<void>;
  assignUserToCompany(userId: string, companyId: number, isDefault?: boolean): Promise<void>;
  removeUserFromCompany(userId: string, companyId: number): Promise<void>;
  needsInitialSetup(): Promise<boolean>;

  // Company operations
  getCompanies(): Promise<Company[]>;
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany, userId: string): Promise<Company>;
  updateCompany(id: number, company: InsertCompany): Promise<Company>;
  deleteCompany(id: number): Promise<void>;

  // Party operations
  getParties(companyId: number): Promise<Party[]>;
  getParty(id: number, companyId: number): Promise<Party | undefined>;
  createParty(party: InsertParty, userId: string, companyId: number): Promise<Party>;
  updateParty(id: number, party: InsertParty, companyId: number): Promise<Party>;

  // Item operations
  getItems(companyId: number): Promise<Item[]>;
  getItem(id: number, companyId: number): Promise<Item | undefined>;
  createItem(item: InsertItem, userId: string, companyId: number): Promise<Item>;
  updateItem(id: number, item: InsertItem, companyId: number): Promise<Item>;

  // Sales operations
  getSales(companyId: number): Promise<Sale[]>;
  getSale(id: number, companyId: number): Promise<Sale | undefined>;
  getSaleItems(saleId: number, companyId: number): Promise<SaleItem[]>;
  getNextInvoiceNumber(billType: string, companyId: number): Promise<number>;
  createSale(sale: InsertSale, items: InsertSaleItem[], userId: string, companyId: number): Promise<Sale>;
  updateSale(id: number, sale: Partial<InsertSale>, items: InsertSaleItem[], companyId: number): Promise<Sale>;

  // Purchase operations
  getPurchases(companyId: number): Promise<Purchase[]>;
  getPurchase(id: number, companyId: number): Promise<any | undefined>;
  getNextPurchaseNumber(companyId: number): Promise<number>;
  getNextSerial(companyId: number): Promise<number>;
  createPurchase(purchase: InsertPurchase, items: InsertPurchaseItem[], userId: string, companyId: number): Promise<Purchase>;

  // Payment operations
  getPayments(companyId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment, userId: string, companyId: number): Promise<Payment>;
  updatePayment(id: number, payment: Partial<InsertPayment>, companyId: number): Promise<Payment>;
  deletePayment(id: number, companyId: number): Promise<void>;

  // Stock operations
  getStock(companyId: number): Promise<any[]>;
  updateStock(itemId: number, quantityChange: number, companyId: number): Promise<void>;
  getInventoryByBarcode(barcode: string, companyId: number): Promise<any | undefined>;
  getPartyOutstanding(partyId: number, companyId: number): Promise<number>;

  // Report operations
  getDashboardMetrics(companyId: number): Promise<any>;
  getOutstanding(companyId: number): Promise<any[]>;
  getSalesReport(companyId: number, startDate?: string, endDate?: string, saleType?: string): Promise<any[]>;
  getPurchasesReport(companyId: number, startDate?: string, endDate?: string): Promise<any[]>;
  getItemsReport(companyId: number, startDate?: string, endDate?: string, saleType?: string, itemId?: string, category?: string): Promise<any[]>;
  getCategoriesReport(companyId: number, startDate?: string, endDate?: string, saleType?: string): Promise<any[]>;
  getPaymentsReport(companyId: number, startDate?: string, endDate?: string, type?: string): Promise<any[]>;
  getPartyLedger(partyId: number, companyId: number, startDate?: string, endDate?: string): Promise<any>;

  // Bill Template operations
  getBillTemplates(companyId: number): Promise<BillTemplate[]>;
  getDefaultBillTemplate(companyId: number): Promise<BillTemplate | undefined>;
  getBillTemplateByAssignment(assignedTo: string, companyId: number): Promise<BillTemplate | undefined>;
  createBillTemplate(template: InsertBillTemplate, userId: string, companyId: number): Promise<BillTemplate>;
  updateBillTemplate(id: number, template: InsertBillTemplate, companyId: number): Promise<BillTemplate>;
  deleteBillTemplate(id: number, companyId: number): Promise<void>;
  
  // Agent operations
  getAgents(companyId: number): Promise<Agent[]>;
  getAgent(id: number, companyId: number): Promise<Agent | undefined>;
  getNextAgentCode(companyId: number): Promise<number>;
  createAgent(agent: InsertAgent, userId: string, companyId: number): Promise<Agent>;
  updateAgent(id: number, agent: InsertAgent, companyId: number): Promise<Agent>;

  // Stock Inward operations
  getPendingPurchases(companyId: number): Promise<Purchase[]>;
  getPurchaseItems(purchaseId: number, companyId: number): Promise<PurchaseItem[]>;
  addPurchaseItem(item: InsertPurchaseItem, companyId: number): Promise<PurchaseItem>;
  updatePurchaseItem(id: number, item: Partial<InsertPurchaseItem>, companyId: number): Promise<PurchaseItem>;
  deletePurchaseItem(id: number, companyId: number): Promise<void>;
  createStockInwardItems(purchaseItemId: number, items: InsertStockInwardItem[], companyId: number): Promise<StockInwardItem[]>;
  getStockInwardItems(purchaseItemId: number, companyId: number): Promise<StockInwardItem[]>;
  getNextGlobalSerial(companyId: number): Promise<number>;
  completePurchase(purchaseId: number, companyId: number): Promise<void>;
  getSizeMaster(): Promise<any[]>;
  createPurchaseEntry(purchase: InsertPurchase, userId: string, companyId: number): Promise<Purchase>;
  updatePurchase(id: number, purchase: Partial<InsertPurchase>, companyId: number): Promise<Purchase>;
  
  // Stock Inward Barcode Management
  getAllStockInwardItems(companyId: number, filters?: { purchaseId?: number; status?: string; size?: string }): Promise<StockInwardItem[]>;
  getStockInwardItem(id: number, companyId: number): Promise<StockInwardItem | undefined>;
  updateStockInwardItem(id: number, updates: { rate?: string; mrp?: string; size?: string; sizeCode?: number }, companyId: number): Promise<StockInwardItem>;
  createBulkStockInwardItems(purchaseItemId: number, sizeEntries: Array<{ size: string; sizeCode: number; quantity: number }>, baseData: Partial<InsertStockInwardItem>, companyId: number): Promise<StockInwardItem[]>;
  deleteStockInwardItem(id: number, companyId: number): Promise<void>;
  bulkDeleteStockInwardItems(ids: number[], companyId: number): Promise<void>;
  
  // Barcode Label Template operations
  getBarcodeLabelTemplates(companyId: number): Promise<any[]>;
  getDefaultBarcodeLabelTemplate(companyId: number): Promise<any | undefined>;
  createBarcodeLabelTemplate(template: any, userId: string, companyId: number): Promise<any>;
  updateBarcodeLabelTemplate(id: number, template: any, companyId: number): Promise<any>;
  deleteBarcodeLabelTemplate(id: number, companyId: number): Promise<void>;
  
  // Item Movement History
  getItemMovementHistory(itemId: number, companyId: number): Promise<{
    item: any;
    stock: { currentQty: number; avgCost: number; valuation: number };
    purchases: any[];
    sales: any[];
    movement: { totalPurchasedQty: number; totalSoldQty: number; balanceQty: number };
  }>;
}

export class DatabaseStorage implements IStorage {
  // ==================== USER OPERATIONS ====================
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if user exists by ID or email
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userData.id!))
      .limit(1);
    
    if (existingUser.length > 0) {
      // User exists, update without changing role
      const [updated] = await db
        .update(users)
        .set({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          // Preserve existing role
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id!))
        .returning();
      return updated;
    } else {
      // New user, insert with role
      const [newUser] = await db
        .insert(users)
        .values(userData)
        .returning();
      return newUser;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return results[0];
  }

  async createUser(user: Partial<UpsertUser>): Promise<User> {
    const results = await db.insert(users).values(user as any).returning();
    return results[0];
  }

  async updateUser(id: string, user: Partial<UpsertUser>): Promise<User> {
    const results = await db
      .update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return results[0];
  }

  async needsInitialSetup(): Promise<boolean> {
    const allUsers = await this.getAllUsers();
    // If no users exist, need setup
    if (allUsers.length === 0) return true;
    
    // If users exist but none have passwords (old Replit Auth users), need setup
    const hasUserWithPassword = allUsers.some(user => user.passwordHash);
    return !hasUserWithPassword;
  }

  async getUserCompanies(userId: string): Promise<any[]> {
    const results = await db
      .select({
        id: userCompanies.id,
        userId: userCompanies.userId,
        companyId: userCompanies.companyId,
        isDefault: userCompanies.isDefault,
        company: companies,
      })
      .from(userCompanies)
      .innerJoin(companies, eq(userCompanies.companyId, companies.id))
      .where(eq(userCompanies.userId, userId))
      .orderBy(desc(userCompanies.isDefault));
    
    return results;
  }

  async assignUserToDefaultCompany(userId: string): Promise<void> {
    // Find or create default company
    let defaultCompany = await db
      .select()
      .from(companies)
      .where(eq(companies.id, 1))
      .limit(1);
    
    if (defaultCompany.length === 0) {
      // Create default company if it doesn't exist
      const newCompany = await db
        .insert(companies)
        .values({
          id: 1,
          name: "Default Company",
          address: "Default Address",
          city: "Default City",
          state: "Default State",
          gstNo: "DEFAULT-GST",
          createdBy: userId,
        })
        .returning();
      defaultCompany = newCompany;
    }
    
    // Assign user to default company
    await db.insert(userCompanies).values({
      userId,
      companyId: 1,
      isDefault: true,
    });
  }

  async assignUserToCompany(userId: string, companyId: number, isDefault: boolean = false): Promise<void> {
    // Check if assignment already exists
    const existing = await db
      .select()
      .from(userCompanies)
      .where(and(eq(userCompanies.userId, userId), eq(userCompanies.companyId, companyId)))
      .limit(1);
    
    if (existing.length > 0) {
      // Update isDefault if needed
      if (isDefault) {
        // Remove default from other companies for this user
        await db
          .update(userCompanies)
          .set({ isDefault: false })
          .where(eq(userCompanies.userId, userId));
        
        // Set this as default
        await db
          .update(userCompanies)
          .set({ isDefault: true })
          .where(and(eq(userCompanies.userId, userId), eq(userCompanies.companyId, companyId)));
      }
      return;
    }
    
    // Remove default from other companies if this should be default
    if (isDefault) {
      await db
        .update(userCompanies)
        .set({ isDefault: false })
        .where(eq(userCompanies.userId, userId));
    }
    
    // Create new assignment
    await db.insert(userCompanies).values({
      userId,
      companyId,
      isDefault,
    });
  }

  async removeUserFromCompany(userId: string, companyId: number): Promise<void> {
    await db
      .delete(userCompanies)
      .where(and(eq(userCompanies.userId, userId), eq(userCompanies.companyId, companyId)));
  }

  // ==================== COMPANY OPERATIONS ====================
  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(desc(companies.createdAt));
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async createCompany(company: InsertCompany, userId: string): Promise<Company> {
    const [newCompany] = await db
      .insert(companies)
      .values({ ...company, createdBy: userId })
      .returning();
    
    await db.insert(userCompanies).values({
      userId,
      companyId: newCompany.id,
      isDefault: false,
    });
    
    return newCompany;
  }

  async updateCompany(id: number, company: InsertCompany): Promise<Company> {
    const [updated] = await db
      .update(companies)
      .set({ ...company, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updated;
  }

  async deleteCompany(id: number): Promise<void> {
    await db.delete(userCompanies).where(eq(userCompanies.companyId, id));
    await db.delete(companies).where(eq(companies.id, id));
  }

  // ==================== PARTY OPERATIONS ====================
  async getParties(companyId: number): Promise<Party[]> {
    // Include company-specific parties AND shared parties from any company
    return await db
      .select()
      .from(parties)
      .where(or(eq(parties.companyId, companyId), eq(parties.isShared, true)))
      .orderBy(desc(parties.createdAt));
  }

  async getParty(id: number, companyId: number): Promise<Party | undefined> {
    // Allow access to company-specific parties or shared parties
    const [party] = await db
      .select()
      .from(parties)
      .where(and(eq(parties.id, id), or(eq(parties.companyId, companyId), eq(parties.isShared, true))));
    return party;
  }

  async getNextPartyCode(companyId: number): Promise<string> {
    const [result] = await db
      .select({ maxCode: sql<number>`COALESCE(MAX(CAST(${parties.code} AS INTEGER)), 0)` })
      .from(parties)
      .where(eq(parties.companyId, companyId));
    return String((result?.maxCode || 0) + 1);
  }

  async createParty(party: InsertParty, userId: string, companyId: number): Promise<Party> {
    const code = await this.getNextPartyCode(companyId);
    const [newParty] = await db
      .insert(parties)
      .values({ ...party, code, createdBy: userId, companyId })
      .returning();
    return newParty;
  }

  async updateParty(id: number, party: InsertParty, companyId: number): Promise<Party> {
    const [updated] = await db
      .update(parties)
      .set({ ...party, updatedAt: new Date() })
      .where(and(eq(parties.id, id), eq(parties.companyId, companyId)))
      .returning();
    return updated;
  }

  // ==================== ITEM OPERATIONS ====================
  async getItems(companyId: number): Promise<Item[]> {
    // Include company-specific items AND shared items from any company
    return await db
      .select()
      .from(items)
      .where(or(eq(items.companyId, companyId), eq(items.isShared, true)))
      .orderBy(desc(items.createdAt));
  }

  async getItem(id: number, companyId: number): Promise<Item | undefined> {
    // Allow access to company-specific items or shared items
    const [item] = await db
      .select()
      .from(items)
      .where(and(eq(items.id, id), or(eq(items.companyId, companyId), eq(items.isShared, true))));
    return item;
  }

  async getNextItemCode(companyId: number): Promise<string> {
    const [result] = await db
      .select({ maxCode: sql<number>`COALESCE(MAX(CAST(${items.code} AS INTEGER)), 0)` })
      .from(items)
      .where(eq(items.companyId, companyId));
    return String((result?.maxCode || 0) + 1);
  }

  async createItem(item: InsertItem, userId: string, companyId: number): Promise<Item> {
    // Auto-generate code
    const code = await this.getNextItemCode(companyId);
    
    // Auto-calculate CGST and SGST from tax
    const tax = parseFloat(item.tax?.toString() || "0");
    const cgst = tax / 2;
    const sgst = tax / 2;

    const [newItem] = await db
      .insert(items)
      .values({
        ...item,
        code,
        cgst: cgst.toString(),
        sgst: sgst.toString(),
        createdBy: userId,
        companyId,
      })
      .returning();

    // Initialize stock entry
    await db.insert(stock).values({
      itemId: newItem.id,
      quantity: "0",
      companyId,
    });

    return newItem;
  }

  async updateItem(id: number, item: InsertItem, companyId: number): Promise<Item> {
    // Auto-calculate CGST and SGST from tax
    const tax = parseFloat(item.tax?.toString() || "0");
    const cgst = tax / 2;
    const sgst = tax / 2;

    const [updated] = await db
      .update(items)
      .set({
        ...item,
        cgst: cgst.toString(),
        sgst: sgst.toString(),
        updatedAt: new Date(),
      })
      .where(and(eq(items.id, id), eq(items.companyId, companyId)))
      .returning();
    return updated;
  }

  // ==================== SALES OPERATIONS ====================
  async getSales(companyId: number): Promise<Sale[]> {
    return await db
      .select()
      .from(sales)
      .where(eq(sales.companyId, companyId))
      .orderBy(desc(sales.date), desc(sales.id));
  }

  async getSale(id: number, companyId: number): Promise<Sale | undefined> {
    const [sale] = await db
      .select()
      .from(sales)
      .where(and(eq(sales.id, id), eq(sales.companyId, companyId)));
    return sale;
  }

  async getSaleItems(saleId: number, companyId: number): Promise<SaleItem[]> {
    // First verify the sale belongs to the company
    const sale = await this.getSale(saleId, companyId);
    if (!sale) {
      return [];
    }
    
    const items = await db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, saleId));
    return items as SaleItem[];
  }

  async getNextInvoiceNumber(saleType: string, companyId: number): Promise<number> {
    // Separate invoice numbering for B2B, B2C, and ESTIMATE
    const result = await db
      .select({ maxNo: sql<number>`COALESCE(MAX(${sales.invoiceNo}), 0)` })
      .from(sales)
      .where(and(eq(sales.saleType, saleType), eq(sales.companyId, companyId)));
    return ((result[0]?.maxNo as any) || 0) + 1;
  }

  async createSale(saleData: InsertSale, saleItemsData: InsertSaleItem[], userId: string, companyId: number): Promise<Sale> {
    // Get next invoice number based on sale type (B2B, B2C, ESTIMATE)
    const invoiceNo = await this.getNextInvoiceNumber(saleData.saleType, companyId);

    // SECURITY: Validate all items belong to this company before creating sale
    for (const item of saleItemsData) {
      if (item.itemId) {
        const dbItem = await this.getItem(item.itemId as number, companyId);
        if (!dbItem) {
          throw new Error(`Item ${item.itemId} not found or does not belong to this company`);
        }
      }
    }

    // Insert sale
    const [newSale] = await db
      .insert(sales)
      .values({
        ...saleData,
        invoiceNo,
        time: new Date().toTimeString().substring(0, 8),
        createdBy: userId,
        companyId,
      })
      .returning();

    // Insert sale items and mark barcodes as sold
    for (const item of saleItemsData) {
      const saleItem = await db.insert(saleItems).values({
        ...item,
        saleId: newSale.id,
      }).returning();

      // Mark barcode as sold if this item came from stock inward
      if (item.stockInwardId) {
        // Get current barcode qty
        const [barcode] = await db
          .select()
          .from(stockInwardItems)
          .where(eq(stockInwardItems.id, item.stockInwardId));
        
        if (barcode) {
          const currentQty = parseFloat(barcode.qty?.toString() || "1");
          const soldQty = parseFloat(item.quantity.toString());
          const remainingQty = currentQty - soldQty;
          
          if (remainingQty > 0) {
            // Bulk barcode: reduce qty but keep as available
            await db
              .update(stockInwardItems)
              .set({ qty: remainingQty.toString(), saleId: newSale.id, soldAt: new Date() })
              .where(eq(stockInwardItems.id, item.stockInwardId));
          } else {
            // Last unit sold: mark as sold
            await db
              .update(stockInwardItems)
              .set({ status: "sold", qty: "0", saleId: newSale.id, soldAt: new Date() })
              .where(eq(stockInwardItems.id, item.stockInwardId));
          }
        }
      }

      // Update stock (decrease)
      if (item.itemId) {
        await this.updateStock(item.itemId, -parseFloat(item.quantity.toString()), companyId);
      }
    }

    return newSale;
  }

  async updateSale(id: number, saleData: Partial<InsertSale>, saleItemsData: InsertSaleItem[], companyId: number): Promise<Sale> {
    // Get existing sale and items for stock adjustment
    const existingSale = await this.getSale(id, companyId);
    if (!existingSale) {
      throw new Error("Sale not found");
    }
    const existingItems = await this.getSaleItems(id, companyId);

    // SECURITY: Validate all new items belong to this company
    for (const item of saleItemsData) {
      if (item.itemId) {
        const dbItem = await this.getItem(item.itemId, companyId);
        if (!dbItem) {
          throw new Error(`Item ${item.itemId} not found or does not belong to this company`);
        }
      }
    }

    // Restore stock for existing items and mark barcodes as available again
    for (const item of existingItems) {
      // Restore barcode qty if it was sold
      if (item.stockInwardId) {
        const [barcode] = await db
          .select()
          .from(stockInwardItems)
          .where(eq(stockInwardItems.id, item.stockInwardId));
        
        if (barcode) {
          const currentQty = parseFloat(barcode.qty?.toString() || "0");
          const itemQty = parseFloat(item.quantity.toString());
          const restoredQty = currentQty + itemQty;
          
          // Always restore to available with restored qty
          await db
            .update(stockInwardItems)
            .set({ qty: restoredQty.toString(), status: "available" })
            .where(eq(stockInwardItems.id, item.stockInwardId));
        }
      }
      if (item.itemId) {
        await this.updateStock(item.itemId, parseFloat(item.quantity.toString()), companyId);
      }
    }

    // Delete existing sale items
    await db.delete(saleItems).where(eq(saleItems.saleId, id));

    // Merge existing sale data with new data to preserve unchanged fields
    const mergedSaleData = {
      billType: saleData.billType ?? existingSale.billType,
      saleType: saleData.saleType ?? existingSale.saleType,
      date: saleData.date ?? existingSale.date,
      partyId: saleData.partyId !== undefined ? saleData.partyId : existingSale.partyId,
      partyName: saleData.partyName ?? existingSale.partyName,
      partyCity: saleData.partyCity ?? existingSale.partyCity,
      partyAddress: saleData.partyAddress ?? existingSale.partyAddress,
      partyGstNo: saleData.partyGstNo ?? existingSale.partyGstNo,
      gstType: saleData.gstType ?? existingSale.gstType,
      saleValue: saleData.saleValue ?? existingSale.saleValue,
      taxValue: saleData.taxValue ?? existingSale.taxValue,
      cgstTotal: saleData.cgstTotal ?? existingSale.cgstTotal,
      sgstTotal: saleData.sgstTotal ?? existingSale.sgstTotal,
      discountTotal: saleData.discountTotal ?? existingSale.discountTotal,
      roundOff: saleData.roundOff ?? existingSale.roundOff,
      grandTotal: saleData.grandTotal ?? existingSale.grandTotal,
      totalQty: saleData.totalQty ?? existingSale.totalQty,
      mobile: saleData.mobile ?? existingSale.mobile,
      paymentMode: saleData.paymentMode ?? existingSale.paymentMode,
      amountGiven: saleData.amountGiven ?? existingSale.amountGiven,
      amountReturn: saleData.amountReturn ?? existingSale.amountReturn,
      byCash: saleData.byCash ?? existingSale.byCash,
      byCard: saleData.byCard ?? existingSale.byCard,
    };

    // Update sale (keep same invoice number and creation metadata)
    const [updatedSale] = await db
      .update(sales)
      .set({
        ...mergedSaleData,
        invoiceNo: existingSale.invoiceNo,
      })
      .where(and(eq(sales.id, id), eq(sales.companyId, companyId)))
      .returning();

    // Insert new sale items and mark barcodes as sold
    for (const item of saleItemsData) {
      await db.insert(saleItems).values({
        ...item,
        saleId: id,
      });

      // Mark barcode as sold if this item came from stock inward
      if (item.stockInwardId) {
        // Get current barcode qty
        const [barcode] = await db
          .select()
          .from(stockInwardItems)
          .where(eq(stockInwardItems.id, item.stockInwardId));
        
        if (barcode) {
          const currentQty = parseFloat(barcode.qty?.toString() || "1");
          const soldQty = parseFloat(item.quantity.toString());
          const remainingQty = currentQty - soldQty;
          
          if (remainingQty > 0) {
            // Bulk barcode: reduce qty but keep as available
            await db
              .update(stockInwardItems)
              .set({ qty: remainingQty.toString(), saleId: id, soldAt: new Date() })
              .where(eq(stockInwardItems.id, item.stockInwardId));
          } else {
            // Last unit sold: mark as sold
            await db
              .update(stockInwardItems)
              .set({ status: "sold", qty: "0", saleId: id, soldAt: new Date() })
              .where(eq(stockInwardItems.id, item.stockInwardId));
          }
        }
      }

      // Update stock (decrease)
      if (item.itemId) {
        await this.updateStock(item.itemId, -parseFloat(item.quantity.toString()), companyId);
      }
    }

    return updatedSale;
  }

  // ==================== PURCHASE OPERATIONS ====================
  async getPurchases(companyId: number): Promise<Purchase[]> {
    return await db
      .select()
      .from(purchases)
      .where(eq(purchases.companyId, companyId))
      .orderBy(desc(purchases.date), desc(purchases.id));
  }

  async getPurchase(id: number, companyId: number): Promise<any | undefined> {
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(and(eq(purchases.id, id), eq(purchases.companyId, companyId)));

    if (!purchase) {
      return undefined;
    }

    const items = await db
      .select()
      .from(purchaseItems)
      .where(eq(purchaseItems.purchaseId, id));

    return { ...purchase, items };
  }

  async getNextPurchaseNumber(companyId: number): Promise<number> {
    const [result] = await db
      .select({ maxNo: sql<number>`COALESCE(MAX(${purchases.purchaseNo}), 0)` })
      .from(purchases)
      .where(eq(purchases.companyId, companyId));
    return (result?.maxNo || 0) + 1;
  }

  async getNextSerial(companyId: number): Promise<number> {
    const [result] = await db
      .select({ maxSerial: sql<number>`COALESCE(MAX(${purchaseItems.serial}), 0)` })
      .from(purchaseItems)
      .innerJoin(purchases, eq(purchaseItems.purchaseId, purchases.id))
      .where(eq(purchases.companyId, companyId));
    return (result?.maxSerial || 0) + 1;
  }

  async createPurchase(purchaseData: InsertPurchase, itemsData: InsertPurchaseItem[], userId: string, companyId: number): Promise<Purchase> {
    const purchaseNo = await this.getNextPurchaseNumber(companyId);

    // Calculate totals and tax breakdowns
    let totalQty = 0;
    let totalAmount = 0;
    const taxBreakdown = { val0: 0, val5: 0, val12: 0, val18: 0, val28: 0, ctax0: 0, ctax5: 0, ctax12: 0, ctax18: 0, ctax28: 0, stax0: 0, stax5: 0, stax12: 0, stax18: 0, stax28: 0 };

    for (const item of itemsData) {
      totalQty += parseFloat(item.qty.toString());
      const itemTotal = parseFloat(item.cost.toString()) * parseFloat(item.qty.toString());
      const taxRate = parseFloat((item.tax || 0).toString());
      const taxAmount = (itemTotal * taxRate) / 100;
      totalAmount += itemTotal + taxAmount;

      if (taxRate === 0) {
        taxBreakdown.val0 += itemTotal;
        taxBreakdown.ctax0 += taxAmount / 2;
        taxBreakdown.stax0 += taxAmount / 2;
      } else if (taxRate === 5) {
        taxBreakdown.val5 += itemTotal;
        taxBreakdown.ctax5 += taxAmount / 2;
        taxBreakdown.stax5 += taxAmount / 2;
      } else if (taxRate === 12) {
        taxBreakdown.val12 += itemTotal;
        taxBreakdown.ctax12 += taxAmount / 2;
        taxBreakdown.stax12 += taxAmount / 2;
      } else if (taxRate === 18) {
        taxBreakdown.val18 += itemTotal;
        taxBreakdown.ctax18 += taxAmount / 2;
        taxBreakdown.stax18 += taxAmount / 2;
      } else if (taxRate === 28) {
        taxBreakdown.val28 += itemTotal;
        taxBreakdown.ctax28 += taxAmount / 2;
        taxBreakdown.stax28 += taxAmount / 2;
      }
    }

    // Insert purchase
    const [newPurchase] = await db
      .insert(purchases)
      .values({
        ...purchaseData,
        purchaseNo,
        totalQty: totalQty.toString(),
        amount: totalAmount.toString(),
        val0: taxBreakdown.val0.toString(),
        val5: taxBreakdown.val5.toString(),
        val12: taxBreakdown.val12.toString(),
        val18: taxBreakdown.val18.toString(),
        val28: taxBreakdown.val28.toString(),
        ctax0: taxBreakdown.ctax0.toString(),
        ctax5: taxBreakdown.ctax5.toString(),
        ctax12: taxBreakdown.ctax12.toString(),
        ctax18: taxBreakdown.ctax18.toString(),
        ctax28: taxBreakdown.ctax28.toString(),
        stax0: taxBreakdown.stax0.toString(),
        stax5: taxBreakdown.stax5.toString(),
        stax12: taxBreakdown.stax12.toString(),
        stax18: taxBreakdown.stax18.toString(),
        stax28: taxBreakdown.stax28.toString(),
        createdBy: userId,
        companyId,
      })
      .returning();

    // Insert purchase items and update stock
    for (const item of itemsData) {
      const qty = parseFloat(item.qty.toString());
      const stockQty = qty - parseFloat((item.dqty || 0).toString());
      
      await db.insert(purchaseItems).values({
        ...item,
        purchaseId: newPurchase.id,
        stockqty: stockQty.toString(),
      });

      // Update stock (increase) if item is linked to an item master
      if (item.itemId) {
        await this.updateStock(item.itemId, qty, companyId);
      }
    }

    return newPurchase;
  }

  // ==================== PAYMENT OPERATIONS ====================
  async getPayments(companyId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.companyId, companyId))
      .orderBy(desc(payments.date), desc(payments.id));
  }

  async createPayment(payment: InsertPayment, userId: string, companyId: number): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values({ ...payment, createdBy: userId, companyId })
      .returning();
    return newPayment;
  }

  async updatePayment(id: number, payment: Partial<InsertPayment>, companyId: number): Promise<Payment> {
    const [updatedPayment] = await db
      .update(payments)
      .set(payment)
      .where(and(eq(payments.id, id), eq(payments.companyId, companyId)))
      .returning();
    if (!updatedPayment) {
      throw new Error("Payment not found or access denied");
    }
    return updatedPayment;
  }

  async deletePayment(id: number, companyId: number): Promise<void> {
    await db
      .delete(payments)
      .where(and(eq(payments.id, id), eq(payments.companyId, companyId)));
  }

  // ==================== STOCK OPERATIONS ====================
  async getStock(companyId: number, partyId?: number, itemId?: number): Promise<any[]> {
    // Get stock from stockInwardItems with party information
    // CRITICAL: Only include items with status = 'available' or 'in_stock' (exclude 'sold')
    const conditions = [
      eq(stockInwardItems.companyId, companyId),
      or(
        eq(stockInwardItems.status, "available"),
        eq(stockInwardItems.status, "in_stock")
      ) // Show all unsold stock
    ];
    if (partyId) conditions.push(eq(purchases.partyId, partyId));
    if (itemId) conditions.push(eq(stockInwardItems.itemId, itemId));

    const result = await db
      .select({
        stockInwardId: sql<number>`MIN(${stockInwardItems.id})`,
        itemId: stockInwardItems.itemId,
        itemCode: items.code,
        itemName: stockInwardItems.itname,
        category: items.category,
        packType: items.packType,
        brandName: stockInwardItems.brandname,
        quality: stockInwardItems.quality,
        size: stockInwardItems.size,
        partyId: purchases.partyId,
        partyName: purchases.partyName,
        quantity: sql<string>`CAST(COALESCE(SUM(CAST(${stockInwardItems.qty} AS NUMERIC)), 0) AS VARCHAR)`,
        cost: sql<string>`CAST(AVG(${stockInwardItems.cost}) AS VARCHAR)`,
        ncost: sql<string>`CAST(AVG(${stockInwardItems.ncost}) AS VARCHAR)`,
        rate: sql<string>`CAST(AVG(${stockInwardItems.rate}) AS VARCHAR)`,
        status: stockInwardItems.status,
      })
      .from(stockInwardItems)
      .leftJoin(items, eq(stockInwardItems.itemId, items.id))
      .leftJoin(purchases, eq(stockInwardItems.purchaseId, purchases.id))
      .where(and(...conditions))
      .groupBy(
        stockInwardItems.itemId,
        items.code,
        stockInwardItems.itname,
        items.category,
        items.packType,
        stockInwardItems.brandname,
        stockInwardItems.quality,
        stockInwardItems.size,
        purchases.partyId,
        purchases.partyName,
        stockInwardItems.status
      )
      .orderBy(purchases.partyName, stockInwardItems.itname);
    return result;
  }

  async updateStock(itemId: number, quantityChange: number, companyId: number): Promise<void> {
    // CRITICAL SECURITY: Defensive validation - verify item belongs to company before stock update
    // This prevents cross-company stock manipulation even if caller validation fails
    const item = await this.getItem(itemId, companyId);
    if (!item) {
      throw new Error(`Stock update rejected: Item ${itemId} not found or does not belong to company ${companyId}`);
    }
    
    // Item validated - safe to update stock
    await db
      .update(stock)
      .set({
        quantity: sql`${stock.quantity} + ${quantityChange}`,
        lastUpdated: new Date(),
      })
      .where(and(eq(stock.itemId, itemId), eq(stock.companyId, companyId)));
  }

  async getInventoryByBarcode(barcode: string, companyId: number): Promise<any | undefined> {
    // Find stock inward item by barcode with all related details
    const [result] = await db
      .select({
        // Barcode & Stock Inward Fields
        stockInwardId: stockInwardItems.id,
        barcode: stockInwardItems.barcode,
        serial: stockInwardItems.serial,
        itemId: stockInwardItems.itemId,
        purchaseItemId: stockInwardItems.purchaseItemId,
        status: stockInwardItems.status,
        createdAt: stockInwardItems.createdAt,
        soldAt: stockInwardItems.soldAt,
        // Item Details
        itemName: stockInwardItems.itname,
        brandName: stockInwardItems.brandname,
        quality: stockInwardItems.quality,
        dno1: stockInwardItems.dno1,
        pattern: stockInwardItems.pattern,
        sleeve: stockInwardItems.sleeve,
        size: stockInwardItems.size,
        sizeCode: stockInwardItems.sizeCode,
        qty: stockInwardItems.qty,
        expDate: stockInwardItems.expdate,
        // Pricing
        cost: stockInwardItems.cost,
        ncost: stockInwardItems.ncost,
        lcost: stockInwardItems.lcost,
        rate: stockInwardItems.rate,
        mrp: stockInwardItems.mrp,
        tax: stockInwardItems.tax,
        // Item Master Fields
        hsnCode: items.hsnCode,
        cgst: items.cgst,
        sgst: items.sgst,
        packType: items.packType,
        // Purchase (Stock Inward) Details
        purchaseId: stockInwardItems.purchaseId,
        purchaseNo: purchases.purchaseNo,
        purchaseDate: purchases.date,
        purchaseInvoice: purchases.invoiceNo,
        supplierName: parties.name,
        supplierCode: parties.code,
        supplierCity: parties.city,
        supplierPhone: parties.phone,
        // Sale Details (if sold)
        saleId: stockInwardItems.saleId,
        saleItemId: stockInwardItems.saleItemId,
      })
      .from(stockInwardItems)
      .leftJoin(items, eq(stockInwardItems.itemId, items.id))
      .leftJoin(purchases, eq(stockInwardItems.purchaseId, purchases.id))
      .leftJoin(parties, eq(purchases.partyId, parties.id))
      .where(
        and(
          eq(stockInwardItems.barcode, barcode),
          eq(stockInwardItems.companyId, companyId)
        )
      )
      .limit(1);

    if (!result) return undefined;

    // Get sale details if barcode was sold
    let saleDetails = null;
    if (result.saleId) {
      const [sale] = await db
        .select({
          saleId: sales.id,
          invoiceNo: sales.invoiceNo,
          saleType: sales.saleType,
          date: sales.date,
          customerName: sales.partyName,
          customerCode: parties.code,
          customerCity: sales.partyCity,
          grandTotal: sales.grandTotal,
          saleValue: sales.saleValue,
          taxValue: sales.taxValue,
          billType: sales.billType,
        })
        .from(sales)
        .leftJoin(parties, eq(sales.partyId, parties.id))
        .where(eq(sales.id, result.saleId));
      saleDetails = sale;
    }

    return {
      ...result,
      sale: saleDetails,
    };
  }

  async getPartyOutstanding(partyId: number, companyId: number): Promise<number> {
    // Get party opening balance
    const [party] = await db
      .select({
        openingDebit: parties.openingDebit,
        openingCredit: parties.openingCredit,
      })
      .from(parties)
      .where(and(eq(parties.id, partyId), eq(parties.companyId, companyId)));

    if (!party) return 0;

    // Get total sales to party
    const [salesTotal] = await db
      .select({ total: sql<string>`COALESCE(SUM(${sales.grandTotal}), 0)` })
      .from(sales)
      .where(and(eq(sales.partyId, partyId), eq(sales.companyId, companyId)));

    // Get total purchases from party
    const [purchasesTotal] = await db
      .select({ total: sql<string>`COALESCE(SUM(${purchases.amount}), 0)` })
      .from(purchases)
      .where(and(eq(purchases.partyId, partyId), eq(purchases.companyId, companyId)));

    // Get total payments
    const [paymentsTotal] = await db
      .select({
        credit: sql<string>`COALESCE(SUM(${payments.credit}), 0)`,
        debit: sql<string>`COALESCE(SUM(${payments.debit}), 0)`,
      })
      .from(payments)
      .where(and(eq(payments.partyId, partyId), eq(payments.companyId, companyId)));

    const openingBal = parseFloat(party.openingDebit || "0") - parseFloat(party.openingCredit || "0");
    const salesAmt = parseFloat(salesTotal?.total || "0");
    const purchasesAmt = parseFloat(purchasesTotal?.total || "0");
    const paymentsCredit = parseFloat(paymentsTotal?.credit || "0");
    const paymentsDebit = parseFloat(paymentsTotal?.debit || "0");

    // Outstanding = Opening + Sales - Purchases - Payments Received + Payments Made
    const outstanding = openingBal + salesAmt - purchasesAmt - paymentsCredit + paymentsDebit;
    return outstanding;
  }

  // ==================== REPORT OPERATIONS ====================
  async getDashboardMetrics(companyId: number): Promise<any> {
    const today = new Date().toISOString().split('T')[0];

    // Today's sales
    const [todaySales] = await db
      .select({ total: sql<number>`COALESCE(SUM(${sales.grandTotal}), 0)` })
      .from(sales)
      .where(and(eq(sales.date, today), eq(sales.companyId, companyId)));

    // Recent sales
    const recentSales = await db
      .select({
        id: sales.id,
        invoiceNo: sales.invoiceNo,
        billType: sales.billType,
        date: sales.date,
        partyName: sales.partyName,
        grandTotal: sales.grandTotal,
      })
      .from(sales)
      .where(eq(sales.companyId, companyId))
      .orderBy(desc(sales.date), desc(sales.id))
      .limit(5);

    // Get outstanding
    const outstanding = await this.getOutstanding(companyId);
    const totalOutstanding = outstanding.reduce((sum, p) => sum + p.balance, 0);

    // Low stock count
    const [lowStockResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(stock)
      .where(and(sql`${stock.quantity} < 10`, eq(stock.companyId, companyId)));

    // Total customers
    const [customersResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(parties)
      .where(eq(parties.companyId, companyId));

    return {
      todaysSales: todaySales?.total || 0,
      totalOutstanding,
      lowStockCount: lowStockResult?.count || 0,
      totalCustomers: customersResult?.count || 0,
      recentSales,
    };
  }

  async getOutstanding(companyId: number): Promise<any[]> {
    const result = await db
      .select({
        partyId: parties.id,
        partyCode: parties.code,
        partyName: parties.name,
        partyCity: parties.city,
        openingDebit: parties.openingDebit,
        openingCredit: parties.openingCredit,
        totalSales: sql<string>`COALESCE(SUM(${sales.grandTotal}), 0)`,
        totalPurchases: sql<string>`COALESCE(SUM(${purchases.amount}), 0)`,
        totalPaymentsCredit: sql<string>`COALESCE(SUM(${payments.credit}), 0)`,
        totalPaymentsDebit: sql<string>`COALESCE(SUM(${payments.debit}), 0)`,
      })
      .from(parties)
      .leftJoin(sales, and(eq(parties.id, sales.partyId), eq(sales.companyId, companyId)))
      .leftJoin(purchases, and(eq(parties.id, purchases.partyId), eq(purchases.companyId, companyId)))
      .leftJoin(payments, and(
        eq(parties.id, payments.partyId),
        eq(payments.companyId, companyId)
      ))
      .where(eq(parties.companyId, companyId))
      .groupBy(parties.id, parties.code, parties.name, parties.city, parties.openingDebit, parties.openingCredit);

    return result.map((row) => {
      const openingBal = parseFloat(row.openingDebit) - parseFloat(row.openingCredit);
      const salesAmt = parseFloat(row.totalSales);
      const purchasesAmt = parseFloat(row.totalPurchases);
      const paymentsCredit = parseFloat(row.totalPaymentsCredit);
      const paymentsDebit = parseFloat(row.totalPaymentsDebit);
      const balance = openingBal + salesAmt - purchasesAmt - paymentsCredit + paymentsDebit;

      return {
        ...row,
        balance,
      };
    });
  }

  async getSalesReport(companyId: number, startDate?: string, endDate?: string, saleType?: string, itemId?: string): Promise<any[]> {
    const conditions = [eq(sales.companyId, companyId)];
    if (startDate) conditions.push(gte(sales.date, startDate));
    if (endDate) conditions.push(lte(sales.date, endDate));
    if (saleType && saleType !== 'all') conditions.push(eq(sales.saleType, saleType));

    if (itemId) {
      // If filtering by item, join with saleItems
      const itemIdNum = parseInt(itemId);
      const salesWithItem = await db
        .selectDistinct({
          id: sales.id,
          invoiceNo: sales.invoiceNo,
          billType: sales.billType,
          saleType: sales.saleType,
          date: sales.date,
          partyName: sales.partyName,
          partyCity: sales.partyCity,
          saleValue: sales.saleValue,
          taxValue: sales.taxValue,
          cgstTotal: sales.cgstTotal,
          sgstTotal: sales.sgstTotal,
          grandTotal: sales.grandTotal,
          totalQty: sales.totalQty,
        })
        .from(sales)
        .innerJoin(saleItems, eq(saleItems.saleId, sales.id))
        .where(and(and(...conditions), eq(saleItems.itemId, itemIdNum)))
        .orderBy(desc(sales.date), desc(sales.id));
      return salesWithItem;
    }

    return await db
      .select()
      .from(sales)
      .where(and(...conditions))
      .orderBy(desc(sales.date), desc(sales.id));
  }

  async getPurchasesReport(companyId: number, startDate?: string, endDate?: string): Promise<any[]> {
    const conditions = [eq(purchases.companyId, companyId)];
    if (startDate) conditions.push(gte(purchases.date, startDate));
    if (endDate) conditions.push(lte(purchases.date, endDate));

    const purchasesList = await db
      .select()
      .from(purchases)
      .where(and(...conditions))
      .orderBy(desc(purchases.date), desc(purchases.id));

    const result = await Promise.all(purchasesList.map(async (purchase) => {
      const items = await db
        .select()
        .from(purchaseItems)
        .where(eq(purchaseItems.purchaseId, purchase.id));
      
      const party = purchase.partyId ? await db
        .select()
        .from(parties)
        .where(eq(parties.id, purchase.partyId))
        .limit(1) : null;
      
      return {
        ...purchase,
        items,
        partyName: party?.[0]?.name || null,
        city: party?.[0]?.city || null,
      };
    }));

    return result;
  }

  async getItemsReport(companyId: number, startDate?: string, endDate?: string, saleType?: string, itemId?: string, category?: string): Promise<any[]> {
    const conditions = [eq(sales.companyId, companyId)];
    if (startDate) conditions.push(gte(sales.date, startDate));
    if (endDate) conditions.push(lte(sales.date, endDate));
    if (saleType) conditions.push(eq(sales.saleType, saleType));
    if (itemId) conditions.push(eq(saleItems.itemId, parseInt(itemId)));
    if (category) conditions.push(eq(items.category, category));

    return await db
      .select({
        itemId: saleItems.itemId,
        itemCode: saleItems.itemCode,
        itemName: saleItems.itemName,
        hsnCode: saleItems.hsnCode,
        category: items.category,
        packType: items.packType,
        tax: saleItems.tax,
        totalQty: sql<string>`SUM(${saleItems.quantity})`,
        totalAmount: sql<string>`SUM(${saleItems.amount})`,
        totalSaleValue: sql<string>`SUM(${saleItems.saleValue})`,
        totalTaxValue: sql<string>`SUM(${saleItems.taxValue})`,
        invoiceCount: sql<number>`COUNT(DISTINCT ${saleItems.saleId})`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .leftJoin(items, eq(saleItems.itemId, items.id))
      .where(and(...conditions))
      .groupBy(saleItems.itemId, saleItems.itemCode, saleItems.itemName, saleItems.hsnCode, items.category, items.packType, saleItems.tax)
      .orderBy(sql`SUM(${saleItems.amount}) DESC`);
  }

  async getCategoriesReport(companyId: number, startDate?: string, endDate?: string, saleType?: string): Promise<any[]> {
    const conditions = [eq(sales.companyId, companyId)];
    if (startDate) conditions.push(gte(sales.date, startDate));
    if (endDate) conditions.push(lte(sales.date, endDate));
    if (saleType) conditions.push(eq(sales.saleType, saleType));

    return await db
      .select({
        category: items.category,
        totalQty: sql<string>`SUM(${saleItems.quantity})`,
        totalAmount: sql<string>`SUM(${saleItems.amount})`,
        totalSaleValue: sql<string>`SUM(${saleItems.saleValue})`,
        totalTaxValue: sql<string>`SUM(${saleItems.taxValue})`,
        invoiceCount: sql<number>`COUNT(DISTINCT ${saleItems.saleId})`,
        itemCount: sql<number>`COUNT(DISTINCT ${saleItems.itemId})`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .leftJoin(items, eq(saleItems.itemId, items.id))
      .where(and(...conditions))
      .groupBy(items.category)
      .orderBy(sql`SUM(${saleItems.amount}) DESC`);
  }

  async getPaymentsReport(companyId: number, startDate?: string, endDate?: string, type?: string): Promise<any[]> {
    const conditions = [eq(payments.companyId, companyId)];
    if (startDate) conditions.push(gte(payments.date, startDate));
    if (endDate) conditions.push(lte(payments.date, endDate));

    let data = await db
      .select({
        id: payments.id,
        date: payments.date,
        partyId: payments.partyId,
        partyName: payments.partyName,
        credit: payments.credit,
        debit: payments.debit,
        details: payments.details,
      })
      .from(payments)
      .where(and(...conditions))
      .orderBy(desc(payments.date), desc(payments.id));

    // Transform credit/debit to type format and filter by type if specified
    const transformed = data.map((row: any) => ({
      ...row,
      type: parseFloat(row.credit) > 0 ? "RECEIVED" : "PAID",
      amount: parseFloat(row.credit) > 0 ? row.credit : row.debit,
    }));

    if (type) {
      return transformed.filter((row: any) => row.type === type);
    }

    return transformed;
  }

  // ==================== BILL TEMPLATE OPERATIONS ====================
  async getBillTemplates(companyId: number): Promise<BillTemplate[]> {
    return await db
      .select()
      .from(billTemplates)
      .where(eq(billTemplates.companyId, companyId))
      .orderBy(desc(billTemplates.createdAt));
  }

  async getDefaultBillTemplate(companyId: number): Promise<BillTemplate | undefined> {
    const [template] = await db
      .select()
      .from(billTemplates)
      .where(and(eq(billTemplates.isDefault, true), eq(billTemplates.companyId, companyId)))
      .limit(1);
    return template;
  }

  async getBillTemplateByAssignment(assignedTo: string, companyId: number): Promise<BillTemplate | undefined> {
    const [template] = await db
      .select()
      .from(billTemplates)
      .where(and(eq(billTemplates.assignedTo, assignedTo), eq(billTemplates.companyId, companyId)))
      .limit(1);
    return template || await this.getDefaultBillTemplate(companyId);
  }

  async createBillTemplate(template: InsertBillTemplate, userId: string, companyId: number): Promise<BillTemplate> {
    // If this is set as default, unset other defaults for this company
    if (template.isDefault) {
      await db
        .update(billTemplates)
        .set({ isDefault: false })
        .where(and(eq(billTemplates.isDefault, true), eq(billTemplates.companyId, companyId)));
    }
    const [newTemplate] = await db
      .insert(billTemplates)
      .values({ ...template, createdBy: userId, companyId })
      .returning();
    return newTemplate;
  }

  async updateBillTemplate(id: number, template: InsertBillTemplate, companyId: number): Promise<BillTemplate> {
    // If this is set as default, unset other defaults for this company
    if (template.isDefault) {
      await db
        .update(billTemplates)
        .set({ isDefault: false })
        .where(and(eq(billTemplates.isDefault, true), eq(billTemplates.companyId, companyId)));
    }
    const [updated] = await db
      .update(billTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(and(eq(billTemplates.id, id), eq(billTemplates.companyId, companyId)))
      .returning();
    return updated;
  }

  async deleteBillTemplate(id: number, companyId: number): Promise<void> {
    await db
      .delete(billTemplates)
      .where(and(eq(billTemplates.id, id), eq(billTemplates.companyId, companyId)));
  }

  async getPartyLedger(partyId: number, companyId: number, startDate?: string, endDate?: string): Promise<any> {
    const party = await this.getParty(partyId, companyId);
    if (!party) return null;

    let openingBalance = parseFloat(party.openingDebit) - parseFloat(party.openingCredit);

    // If startDate is specified, calculate opening balance by including transactions before startDate
    if (startDate) {
      const priorSales = await db
        .select({ total: sql<string>`COALESCE(SUM(${sales.grandTotal}), 0)` })
        .from(sales)
        .where(and(eq(sales.partyId, partyId), eq(sales.companyId, companyId), lt(sales.date, startDate)));
      
      const priorPurchases = await db
        .select({ total: sql<string>`COALESCE(SUM(${purchases.amount}), 0)` })
        .from(purchases)
        .where(and(eq(purchases.partyId, partyId), eq(purchases.companyId, companyId), lt(purchases.date, startDate)));
      
      const priorPayments = await db
        .select({ 
          totalDebit: sql<string>`COALESCE(SUM(${payments.debit}), 0)`,
          totalCredit: sql<string>`COALESCE(SUM(${payments.credit}), 0)`
        })
        .from(payments)
        .where(and(eq(payments.partyId, partyId), eq(payments.companyId, companyId), lt(payments.date, startDate)));

      openingBalance += parseFloat(priorSales[0]?.total || "0");
      openingBalance -= parseFloat(priorPurchases[0]?.total || "0");
      openingBalance += parseFloat(priorPayments[0]?.totalCredit || "0");
      openingBalance -= parseFloat(priorPayments[0]?.totalDebit || "0");
    }

    // Build date conditions for the transactions to display
    const salesConditions = [eq(sales.partyId, partyId), eq(sales.companyId, companyId)];
    const purchasesConditions = [eq(purchases.partyId, partyId), eq(purchases.companyId, companyId)];
    const paymentsConditions = [eq(payments.partyId, partyId), eq(payments.companyId, companyId)];
    
    if (startDate) {
      salesConditions.push(gte(sales.date, startDate));
      purchasesConditions.push(gte(purchases.date, startDate));
      paymentsConditions.push(gte(payments.date, startDate));
    }
    if (endDate) {
      salesConditions.push(lte(sales.date, endDate));
      purchasesConditions.push(lte(purchases.date, endDate));
      paymentsConditions.push(lte(payments.date, endDate));
    }

    // Get all transactions
    const salesData = await db
      .select({
        id: sales.id,
        date: sales.date,
        type: sql<string>`'sale'`.as('type'),
        reference: sql<string>`CONCAT(${sales.saleType}, '-', ${sales.invoiceNo})`.as('reference'),
        details: sql<string>`NULL`.as('details'),
        debit: sales.grandTotal,
        credit: sql<string>`'0'`.as('credit'),
      })
      .from(sales)
      .where(and(...salesConditions));

    const purchasesData = await db
      .select({
        id: purchases.id,
        date: purchases.date,
        type: sql<string>`'purchase'`.as('type'),
        reference: sql<string>`CONCAT('P-', ${purchases.purchaseNo})`.as('reference'),
        details: purchases.details,
        debit: sql<string>`'0'`.as('debit'),
        credit: purchases.amount,
      })
      .from(purchases)
      .where(and(...purchasesConditions));

    const paymentsData = await db
      .select({
        id: payments.id,
        date: payments.date,
        type: sql<string>`'payment'`.as('type'),
        reference: sql<string>`'PAYMENT'`.as('reference'),
        details: payments.details,
        debit: payments.debit,
        credit: payments.credit,
      })
      .from(payments)
      .where(and(...paymentsConditions));

    // Combine and sort
    const allTransactions = [
      ...salesData.map(t => ({ ...t, debit: parseFloat(t.debit), credit: parseFloat(t.credit) })),
      ...purchasesData.map(t => ({ ...t, debit: parseFloat(t.debit), credit: parseFloat(t.credit) })),
      ...paymentsData.map(t => ({ ...t, debit: parseFloat(t.debit), credit: parseFloat(t.credit) })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = openingBalance;
    const entries = allTransactions.map(t => {
      runningBalance = runningBalance + t.credit - t.debit;
      return {
        ...t,
        balance: runningBalance,
      };
    });

    return {
      partyId: party.id,
      partyCode: party.code,
      partyName: party.name,
      openingBalance,
      entries,
      closingBalance: runningBalance,
    };
  }

  // ==================== AGENT OPERATIONS ====================
  async getAgents(companyId: number): Promise<Agent[]> {
    // Include company-specific agents AND shared agents from any company
    return await db
      .select()
      .from(agents)
      .where(or(eq(agents.companyId, companyId), eq(agents.isShared, true)))
      .orderBy(agents.code);
  }

  async getAgent(id: number, companyId: number): Promise<Agent | undefined> {
    const [agent] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, id), or(eq(agents.companyId, companyId), eq(agents.isShared, true))));
    return agent;
  }

  async getNextAgentCode(companyId: number): Promise<number> {
    const [result] = await db
      .select({ maxCode: sql<number>`COALESCE(MAX(${agents.code}), 0)` })
      .from(agents)
      .where(eq(agents.companyId, companyId));
    return (result?.maxCode || 0) + 1;
  }

  async createAgent(agent: InsertAgent, userId: string, companyId: number): Promise<Agent> {
    const code = await this.getNextAgentCode(companyId);
    const [newAgent] = await db
      .insert(agents)
      .values({ ...agent, code, createdBy: userId, companyId })
      .returning();
    return newAgent;
  }

  async updateAgent(id: number, agent: InsertAgent, companyId: number): Promise<Agent> {
    const [updated] = await db
      .update(agents)
      .set({ ...agent, updatedAt: new Date() })
      .where(and(eq(agents.id, id), eq(agents.companyId, companyId)))
      .returning();
    return updated;
  }

  // ==================== STOCK INWARD OPERATIONS ====================
  
  async getPendingPurchases(companyId: number): Promise<Purchase[]> {
    return await db
      .select()
      .from(purchases)
      .where(and(
        eq(purchases.companyId, companyId),
        eq(purchases.stockInwardCompleted, false)
      ))
      .orderBy(desc(purchases.date), desc(purchases.purchaseNo));
  }

  async getPurchaseItems(purchaseId: number, companyId: number): Promise<PurchaseItem[]> {
    // First verify purchase belongs to company
    const purchase = await this.getPurchase(purchaseId, companyId);
    if (!purchase) return [];
    
    return await db
      .select()
      .from(purchaseItems)
      .where(eq(purchaseItems.purchaseId, purchaseId))
      .orderBy(purchaseItems.serial);
  }

  async addPurchaseItem(item: InsertPurchaseItem, companyId: number): Promise<PurchaseItem> {
    // Verify the purchase belongs to this company
    const purchase = await this.getPurchase(item.purchaseId, companyId);
    if (!purchase) {
      throw new Error("Purchase not found or does not belong to this company");
    }
    
    const [newItem] = await db
      .insert(purchaseItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updatePurchaseItem(id: number, item: Partial<InsertPurchaseItem>, companyId: number): Promise<PurchaseItem> {
    // First get the purchase item to verify company access
    const [existingItem] = await db
      .select()
      .from(purchaseItems)
      .where(eq(purchaseItems.id, id));
    
    if (!existingItem) {
      throw new Error("Purchase item not found");
    }
    
    const purchase = await this.getPurchase(existingItem.purchaseId, companyId);
    if (!purchase) {
      throw new Error("Purchase not found or does not belong to this company");
    }
    
    const [updated] = await db
      .update(purchaseItems)
      .set(item)
      .where(eq(purchaseItems.id, id))
      .returning();
    return updated;
  }

  async deletePurchaseItem(id: number, companyId: number): Promise<void> {
    // First get the purchase item to verify company access
    const [existingItem] = await db
      .select()
      .from(purchaseItems)
      .where(eq(purchaseItems.id, id));
    
    if (!existingItem) return;
    
    const purchase = await this.getPurchase(existingItem.purchaseId, companyId);
    if (!purchase) {
      throw new Error("Purchase not found or does not belong to this company");
    }
    
    // Delete related stock inward items first
    await db
      .delete(stockInwardItems)
      .where(eq(stockInwardItems.purchaseItemId, id));
    
    // Delete the purchase item
    await db
      .delete(purchaseItems)
      .where(eq(purchaseItems.id, id));
  }

  async createStockInwardItems(purchaseItemId: number, items: InsertStockInwardItem[], companyId: number): Promise<StockInwardItem[]> {
    // First get the purchase item to find its purchaseId and item details
    const [purchaseItem] = await db
      .select()
      .from(purchaseItems)
      .where(eq(purchaseItems.id, purchaseItemId));
    
    if (!purchaseItem) {
      throw new Error("Purchase item not found");
    }
    
    // Verify the purchase belongs to this company
    const purchase = await this.getPurchase(purchaseItem.purchaseId, companyId);
    if (!purchase) {
      throw new Error("Purchase not found or does not belong to this company");
    }
    
    const createdItems: StockInwardItem[] = [];
    
    for (const item of items) {
      const [created] = await db
        .insert(stockInwardItems)
        .values({
          ...item,
          purchaseItemId,
          purchaseId: purchaseItem.purchaseId,
          companyId,
          itemId: purchaseItem.itemId,
          // Copy product info from purchase item
          itname: purchaseItem.itname || "Unknown Item",
          brandname: purchaseItem.brandname,
          quality: purchaseItem.quality,
          dno1: purchaseItem.dno1,
          pattern: purchaseItem.pattern,
          sleeve: purchaseItem.sleeve,
          size: purchaseItem.name || purchaseItem.size1,
          // Pricing info (use correct field names from purchaseItems)
          cost: purchaseItem.cost || "0",
          ncost: purchaseItem.ncost || purchaseItem.cost || "0",
          lcost: purchaseItem.lcost || purchaseItem.cost || "0",
          rate: purchaseItem.rrate || purchaseItem.cost || "0",
          mrp: purchaseItem.mrp || purchaseItem.rrate || "0",
          tax: purchaseItem.tax || "0",
        })
        .returning();
      createdItems.push(created);
    }
    
    // Mark purchase item as barcode generated
    await db
      .update(purchaseItems)
      .set({ barcodeGenerated: true })
      .where(eq(purchaseItems.id, purchaseItemId));
    
    return createdItems;
  }

  async getStockInwardItems(purchaseItemId: number, companyId: number): Promise<StockInwardItem[]> {
    return await db
      .select()
      .from(stockInwardItems)
      .where(and(
        eq(stockInwardItems.purchaseItemId, purchaseItemId),
        eq(stockInwardItems.companyId, companyId)
      ))
      .orderBy(stockInwardItems.serial);
  }

  async getNextGlobalSerial(companyId: number): Promise<number> {
    const [result] = await db
      .select({ maxSerial: sql<number>`COALESCE(MAX(${stockInwardItems.serial}), 0)` })
      .from(stockInwardItems)
      .where(eq(stockInwardItems.companyId, companyId));
    return (result?.maxSerial || 0) + 1;
  }

  async completePurchase(purchaseId: number, companyId: number): Promise<void> {
    // Verify purchase belongs to company
    const purchase = await this.getPurchase(purchaseId, companyId);
    if (!purchase) {
      throw new Error("Purchase not found or does not belong to this company");
    }
    
    // Calculate totals from purchase items
    const items = await this.getPurchaseItems(purchaseId, companyId);
    let totalQty = 0;
    let totalAmount = 0;
    
    for (const item of items) {
      totalQty += parseFloat(item.qty.toString());
      totalAmount += parseFloat(item.cost.toString()) * parseFloat(item.qty.toString());
    }
    
    await db
      .update(purchases)
      .set({
        stockInwardCompleted: true,
        status: "completed",
        totalQty: totalQty.toString(),
        amount: totalAmount.toString(),
        updatedAt: new Date(),
      })
      .where(and(eq(purchases.id, purchaseId), eq(purchases.companyId, companyId)));
  }

  async getSizeMaster(): Promise<any[]> {
    return await db
      .select()
      .from(sizeMaster)
      .orderBy(sizeMaster.sortOrder);
  }

  async createPurchaseEntry(purchaseData: InsertPurchase, userId: string, companyId: number): Promise<Purchase> {
    const purchaseNo = await this.getNextPurchaseNumber(companyId);
    
    const [newPurchase] = await db
      .insert(purchases)
      .values({
        ...purchaseData,
        purchaseNo,
        status: "pending",
        stockInwardCompleted: false,
        createdBy: userId,
        companyId,
      })
      .returning();
    
    return newPurchase;
  }

  async updatePurchase(id: number, purchaseData: Partial<InsertPurchase>, companyId: number): Promise<Purchase> {
    const [updated] = await db
      .update(purchases)
      .set({
        ...purchaseData,
        updatedAt: new Date(),
      })
      .where(and(eq(purchases.id, id), eq(purchases.companyId, companyId)))
      .returning();
    return updated;
  }

  // ==================== STOCK INWARD BARCODE MANAGEMENT ====================
  
  async getAllStockInwardItems(companyId: number, filters?: { purchaseId?: number; status?: string; size?: string }): Promise<StockInwardItem[]> {
    let query = db
      .select()
      .from(stockInwardItems)
      .where(eq(stockInwardItems.companyId, companyId));
    
    const conditions: any[] = [eq(stockInwardItems.companyId, companyId)];
    
    if (filters?.purchaseId) {
      conditions.push(eq(stockInwardItems.purchaseId, filters.purchaseId));
    }
    if (filters?.status) {
      conditions.push(eq(stockInwardItems.status, filters.status));
    }
    if (filters?.size) {
      conditions.push(eq(stockInwardItems.size, filters.size));
    }
    
    return await db
      .select()
      .from(stockInwardItems)
      .where(and(...conditions))
      .orderBy(desc(stockInwardItems.createdAt));
  }

  async getStockInwardItem(id: number, companyId: number): Promise<StockInwardItem | undefined> {
    const [item] = await db
      .select()
      .from(stockInwardItems)
      .where(and(
        eq(stockInwardItems.id, id),
        eq(stockInwardItems.companyId, companyId)
      ));
    return item;
  }

  async updateStockInwardItem(id: number, updates: { rate?: string; mrp?: string; size?: string; sizeCode?: number }, companyId: number): Promise<StockInwardItem> {
    const [updated] = await db
      .update(stockInwardItems)
      .set(updates)
      .where(and(
        eq(stockInwardItems.id, id),
        eq(stockInwardItems.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async createBulkStockInwardItems(
    purchaseItemId: number, 
    sizeEntries: Array<{ size: string; sizeCode: number; quantity: number }>, 
    baseData: Partial<InsertStockInwardItem>, 
    companyId: number
  ): Promise<StockInwardItem[]> {
    // Verify purchase item exists and belongs to company
    const purchaseItem = await db
      .select()
      .from(purchaseItems)
      .innerJoin(purchases, eq(purchaseItems.purchaseId, purchases.id))
      .where(and(
        eq(purchaseItems.id, purchaseItemId),
        eq(purchases.companyId, companyId)
      ));
    
    if (purchaseItem.length === 0) {
      throw new Error("Purchase item not found or does not belong to this company");
    }
    
    const pItem = purchaseItem[0].purchase_items;
    const purchase = purchaseItem[0].purchases;
    
    const createdItems: StockInwardItem[] = [];
    let currentSerial = await this.getNextGlobalSerial(companyId);
    
    for (const entry of sizeEntries) {
      for (let i = 0; i < entry.quantity; i++) {
        const barcode = `${companyId}${currentSerial.toString().padStart(10, '0')}`;
        
        const [created] = await db
          .insert(stockInwardItems)
          .values({
            purchaseItemId,
            purchaseId: pItem.purchaseId,
            companyId,
            itemId: pItem.itemId,
            serial: currentSerial,
            barcode,
            itname: pItem.itname || "Unknown Item",
            brandname: pItem.brandname,
            quality: pItem.quality,
            dno1: pItem.dno1,
            pattern: pItem.pattern,
            sleeve: pItem.sleeve,
            size: entry.size,
            sizeCode: entry.sizeCode,
            cost: baseData.cost || pItem.cost || "0",
            ncost: baseData.ncost || pItem.ncost || pItem.cost || "0",
            lcost: baseData.lcost || pItem.lcost || pItem.cost || "0",
            rate: baseData.rate || pItem.rrate || pItem.cost || "0",
            mrp: baseData.mrp || pItem.mrp || pItem.rrate || "0",
            tax: pItem.tax || "0",
            status: "available",
          })
          .returning();
        
        createdItems.push(created);
        currentSerial++;
      }
    }
    
    // Mark purchase item as barcode generated
    await db
      .update(purchaseItems)
      .set({ barcodeGenerated: true })
      .where(eq(purchaseItems.id, purchaseItemId));
    
    return createdItems;
  }

  async deleteStockInwardItem(id: number, companyId: number): Promise<void> {
    // Only allow deletion of items that are not sold
    const [item] = await db
      .select()
      .from(stockInwardItems)
      .where(and(
        eq(stockInwardItems.id, id),
        eq(stockInwardItems.companyId, companyId)
      ));
    
    if (!item) {
      throw new Error("Barcode not found");
    }
    
    if (item.status === "sold") {
      throw new Error("Cannot delete a sold barcode");
    }
    
    await db
      .delete(stockInwardItems)
      .where(and(
        eq(stockInwardItems.id, id),
        eq(stockInwardItems.companyId, companyId)
      ));
  }

  async bulkDeleteStockInwardItems(ids: number[], companyId: number): Promise<void> {
    // Only delete items that are not sold
    for (const id of ids) {
      await this.deleteStockInwardItem(id, companyId);
    }
  }

  // ==================== BARCODE LABEL TEMPLATE OPERATIONS ====================
  
  async getBarcodeLabelTemplates(companyId: number): Promise<BarcodeLabelTemplate[]> {
    return await db
      .select()
      .from(barcodeLabelTemplates)
      .where(eq(barcodeLabelTemplates.companyId, companyId))
      .orderBy(desc(barcodeLabelTemplates.createdAt));
  }

  async getDefaultBarcodeLabelTemplate(companyId: number): Promise<BarcodeLabelTemplate | undefined> {
    const [template] = await db
      .select()
      .from(barcodeLabelTemplates)
      .where(and(
        eq(barcodeLabelTemplates.companyId, companyId),
        eq(barcodeLabelTemplates.isDefault, true)
      ));
    return template;
  }

  async createBarcodeLabelTemplate(template: InsertBarcodeLabelTemplate, userId: string, companyId: number): Promise<BarcodeLabelTemplate> {
    // If this is set as default, unset other defaults
    if (template.isDefault) {
      await db
        .update(barcodeLabelTemplates)
        .set({ isDefault: false })
        .where(eq(barcodeLabelTemplates.companyId, companyId));
    }
    
    const [created] = await db
      .insert(barcodeLabelTemplates)
      .values({
        ...template,
        companyId,
        createdBy: userId,
      })
      .returning();
    return created;
  }

  async updateBarcodeLabelTemplate(id: number, template: Partial<InsertBarcodeLabelTemplate>, companyId: number): Promise<BarcodeLabelTemplate> {
    // If this is set as default, unset other defaults
    if (template.isDefault) {
      await db
        .update(barcodeLabelTemplates)
        .set({ isDefault: false })
        .where(eq(barcodeLabelTemplates.companyId, companyId));
    }
    
    const [updated] = await db
      .update(barcodeLabelTemplates)
      .set({
        ...template,
        updatedAt: new Date(),
      })
      .where(and(
        eq(barcodeLabelTemplates.id, id),
        eq(barcodeLabelTemplates.companyId, companyId)
      ))
      .returning();
    return updated;
  }

  async deleteBarcodeLabelTemplate(id: number, companyId: number): Promise<void> {
    await db
      .delete(barcodeLabelTemplates)
      .where(and(
        eq(barcodeLabelTemplates.id, id),
        eq(barcodeLabelTemplates.companyId, companyId)
      ));
  }

  async getItemMovementHistory(itemId: number, companyId: number): Promise<{
    item: any;
    stock: { currentQty: number; avgCost: number; valuation: number };
    purchases: any[];
    sales: any[];
    movement: { totalPurchasedQty: number; totalSoldQty: number; balanceQty: number };
  }> {
    // Get item details
    const [item] = await db
      .select()
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.companyId, companyId)));

    if (!item) {
      throw new Error("Item not found");
    }

    // Get current stock
    const [currentStock] = await db
      .select()
      .from(stock)
      .where(and(eq(stock.itemId, itemId), eq(stock.companyId, companyId)));

    const currentQty = currentStock ? parseFloat(currentStock.quantity) : 0;
    const avgCost = parseFloat(item.cost);
    const valuation = currentQty * avgCost;

    // Get purchase history for this item
    const purchaseHistory = await db
      .select({
        purchaseId: purchases.id,
        purchaseNo: purchases.purchaseNo,
        date: purchases.date,
        partyName: parties.name,
        quantity: purchaseItems.quantity,
        rate: purchaseItems.rate,
        mrp: purchaseItems.mrp,
        amount: purchaseItems.amount,
        barcode: purchaseItems.barcode,
      })
      .from(purchaseItems)
      .innerJoin(purchases, eq(purchaseItems.purchaseId, purchases.id))
      .leftJoin(parties, eq(purchases.partyId, parties.id))
      .where(and(
        eq(purchaseItems.itemId, itemId),
        eq(purchases.companyId, companyId)
      ))
      .orderBy(desc(purchases.date));

    // Get sales history for this item
    const salesHistory = await db
      .select({
        saleId: sales.id,
        invoiceNo: sales.invoiceNo,
        billType: sales.billType,
        date: sales.date,
        partyName: parties.name,
        quantity: saleItems.quantity,
        rate: saleItems.rate,
        amount: saleItems.amount,
        barcode: saleItems.barcode,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .leftJoin(parties, eq(sales.partyId, parties.id))
      .where(and(
        eq(saleItems.itemId, itemId),
        eq(sales.companyId, companyId)
      ))
      .orderBy(desc(sales.date));

    // Calculate totals
    const totalPurchasedQty = purchaseHistory.reduce((sum, p) => sum + parseFloat(p.quantity || "0"), 0);
    const totalSoldQty = salesHistory.reduce((sum, s) => sum + parseFloat(s.quantity || "0"), 0);
    const balanceQty = totalPurchasedQty - totalSoldQty;

    return {
      item,
      stock: { currentQty, avgCost, valuation },
      purchases: purchaseHistory,
      sales: salesHistory,
      movement: { totalPurchasedQty, totalSoldQty, balanceQty },
    };
  }
}

export const storage = new DatabaseStorage();
