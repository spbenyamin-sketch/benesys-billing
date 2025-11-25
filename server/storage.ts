import {
  users,
  parties,
  items,
  sales,
  saleItems,
  purchases,
  purchaseItems,
  payments,
  stock,
  billTemplates,
  companies,
  userCompanies,
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
  type Payment,
  type InsertPayment,
  type Stock,
  type InsertStock,
  type BillTemplate,
  type InsertBillTemplate,
  type Company,
  type InsertCompany,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql, or } from "drizzle-orm";

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
  getNextInvoiceNumber(billType: string, companyId: number): Promise<number>;
  createSale(sale: InsertSale, items: InsertSaleItem[], userId: string, companyId: number): Promise<Sale>;

  // Purchase operations
  getPurchases(companyId: number): Promise<Purchase[]>;
  getPurchase(id: number, companyId: number): Promise<any | undefined>;
  getNextPurchaseNumber(companyId: number): Promise<number>;
  getNextSerial(companyId: number): Promise<number>;
  createPurchase(purchase: InsertPurchase, items: InsertPurchaseItem[], userId: string, companyId: number): Promise<Purchase>;

  // Payment operations
  getPayments(companyId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment, userId: string, companyId: number): Promise<Payment>;

  // Stock operations
  getStock(companyId: number): Promise<any[]>;
  updateStock(itemId: number, quantityChange: number, companyId: number): Promise<void>;

  // Report operations
  getDashboardMetrics(companyId: number): Promise<any>;
  getOutstanding(companyId: number): Promise<any[]>;
  getSalesReport(companyId: number, startDate?: string, endDate?: string, billType?: string): Promise<any[]>;
  getItemsReport(companyId: number, startDate?: string, endDate?: string): Promise<any[]>;
  getPartyLedger(partyId: number, companyId: number): Promise<any>;

  // Bill Template operations
  getBillTemplates(companyId: number): Promise<BillTemplate[]>;
  getDefaultBillTemplate(companyId: number): Promise<BillTemplate | undefined>;
  createBillTemplate(template: InsertBillTemplate, userId: string, companyId: number): Promise<BillTemplate>;
  updateBillTemplate(id: number, template: InsertBillTemplate, companyId: number): Promise<BillTemplate>;
  deleteBillTemplate(id: number, companyId: number): Promise<void>;
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

  async createParty(party: InsertParty, userId: string, companyId: number): Promise<Party> {
    const [newParty] = await db
      .insert(parties)
      .values({ ...party, createdBy: userId, companyId })
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

  async createItem(item: InsertItem, userId: string, companyId: number): Promise<Item> {
    // Auto-calculate CGST and SGST from tax
    const tax = parseFloat(item.tax?.toString() || "0");
    const cgst = tax / 2;
    const sgst = tax / 2;

    const [newItem] = await db
      .insert(items)
      .values({
        ...item,
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

  async getNextInvoiceNumber(billType: string, companyId: number): Promise<number> {
    const [result] = await db
      .select({ maxNo: sql<number>`COALESCE(MAX(${sales.invoiceNo}), 0)` })
      .from(sales)
      .where(and(eq(sales.billType, billType), eq(sales.companyId, companyId)));
    return (result?.maxNo || 0) + 1;
  }

  async createSale(saleData: InsertSale, saleItemsData: InsertSaleItem[], userId: string, companyId: number): Promise<Sale> {
    // Get next invoice number
    const invoiceNo = await this.getNextInvoiceNumber(saleData.billType, companyId);

    // SECURITY: Validate all items belong to this company before creating sale
    for (const item of saleItemsData) {
      if (item.itemId) {
        const dbItem = await this.getItem(item.itemId, companyId);
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

    // Insert sale items
    for (const item of saleItemsData) {
      await db.insert(saleItems).values({
        ...item,
        saleId: newSale.id,
      });

      // Update stock (decrease)
      if (item.itemId) {
        await this.updateStock(item.itemId, -parseFloat(item.quantity.toString()), companyId);
      }
    }

    return newSale;
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

  // ==================== STOCK OPERATIONS ====================
  async getStock(companyId: number): Promise<any[]> {
    // Include stock for company-specific items AND shared items
    const result = await db
      .select({
        id: stock.id,
        itemId: stock.itemId,
        itemCode: items.code,
        itemName: items.name,
        category: items.category,
        packType: items.packType,
        quantity: stock.quantity,
        cost: items.cost,
        isShared: items.isShared,
      })
      .from(stock)
      .innerJoin(items, eq(stock.itemId, items.id))
      .where(
        and(
          eq(stock.companyId, companyId),
          or(eq(items.companyId, companyId), eq(items.isShared, true))
        )
      )
      .orderBy(items.name);
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
      .leftJoin(payments, and(eq(parties.id, payments.partyId), eq(payments.companyId, companyId)))
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

  async getSalesReport(companyId: number, startDate?: string, endDate?: string, billType?: string): Promise<any[]> {
    const conditions = [eq(sales.companyId, companyId)];
    if (startDate) conditions.push(gte(sales.date, startDate));
    if (endDate) conditions.push(lte(sales.date, endDate));
    if (billType && billType !== 'all') conditions.push(eq(sales.billType, billType));

    return await db
      .select()
      .from(sales)
      .where(and(...conditions))
      .orderBy(desc(sales.date), desc(sales.id));
  }

  async getItemsReport(companyId: number, startDate?: string, endDate?: string): Promise<any[]> {
    const conditions = [eq(sales.companyId, companyId)];
    if (startDate) conditions.push(gte(sales.date, startDate));
    if (endDate) conditions.push(lte(sales.date, endDate));

    return await db
      .select({
        itemId: saleItems.itemId,
        itemCode: saleItems.itemCode,
        itemName: saleItems.itemName,
        hsnCode: saleItems.hsnCode,
        totalQty: sql<string>`SUM(${saleItems.quantity})`,
        totalAmount: sql<string>`SUM(${saleItems.amount})`,
        totalSaleValue: sql<string>`SUM(${saleItems.saleValue})`,
        totalTaxValue: sql<string>`SUM(${saleItems.taxValue})`,
        invoiceCount: sql<number>`COUNT(DISTINCT ${saleItems.saleId})`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(and(...conditions))
      .groupBy(saleItems.itemId, saleItems.itemCode, saleItems.itemName, saleItems.hsnCode)
      .orderBy(sql`SUM(${saleItems.amount}) DESC`);
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

  async getPartyLedger(partyId: number, companyId: number): Promise<any> {
    const party = await this.getParty(partyId, companyId);
    if (!party) return null;

    const openingBalance = parseFloat(party.openingDebit) - parseFloat(party.openingCredit);

    // Get all transactions
    const salesData = await db
      .select({
        id: sales.id,
        date: sales.date,
        type: sql<string>`'sale'`,
        reference: sql<string>`CONCAT(${sales.billType}, '-', ${sales.invoiceNo})`,
        details: sql<string>`NULL`,
        debit: sql<string>`0`,
        credit: sales.grandTotal,
      })
      .from(sales)
      .where(and(eq(sales.partyId, partyId), eq(sales.companyId, companyId)));

    const purchasesData = await db
      .select({
        id: purchases.id,
        date: purchases.date,
        type: sql<string>`'purchase'`,
        reference: sql<string>`CONCAT('P-', ${purchases.purchaseNo})`,
        details: purchases.details,
        debit: sql<string>`0`,
        credit: sql<string>`CONCAT('-', ${purchases.amount})`,
      })
      .from(purchases)
      .where(and(eq(purchases.partyId, partyId), eq(purchases.companyId, companyId)));

    const paymentsData = await db
      .select({
        id: payments.id,
        date: payments.date,
        type: sql<string>`'payment'`,
        reference: sql<string>`'PAYMENT'`,
        details: payments.details,
        debit: payments.debit,
        credit: payments.credit,
      })
      .from(payments)
      .where(and(eq(payments.partyId, partyId), eq(payments.companyId, companyId)));

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
}

export const storage = new DatabaseStorage();
