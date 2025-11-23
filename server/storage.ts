import {
  users,
  parties,
  items,
  sales,
  saleItems,
  purchases,
  payments,
  stock,
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
  type Payment,
  type InsertPayment,
  type Stock,
  type InsertStock,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (REQUIRED for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Party operations
  getParties(): Promise<Party[]>;
  getParty(id: number): Promise<Party | undefined>;
  createParty(party: InsertParty, userId: string): Promise<Party>;
  updateParty(id: number, party: InsertParty): Promise<Party>;

  // Item operations
  getItems(): Promise<Item[]>;
  getItem(id: number): Promise<Item | undefined>;
  createItem(item: InsertItem, userId: string): Promise<Item>;
  updateItem(id: number, item: InsertItem): Promise<Item>;

  // Sales operations
  getSales(): Promise<Sale[]>;
  getNextInvoiceNumber(billType: string): Promise<number>;
  createSale(sale: InsertSale, items: InsertSaleItem[], userId: string): Promise<Sale>;

  // Purchase operations
  getPurchases(): Promise<Purchase[]>;
  getNextPurchaseNumber(): Promise<number>;
  createPurchase(purchase: InsertPurchase, userId: string): Promise<Purchase>;

  // Payment operations
  getPayments(): Promise<Payment[]>;
  createPayment(payment: InsertPayment, userId: string): Promise<Payment>;

  // Stock operations
  getStock(): Promise<any[]>;
  updateStock(itemId: number, quantityChange: number): Promise<void>;

  // Report operations
  getDashboardMetrics(): Promise<any>;
  getOutstanding(): Promise<any[]>;
  getSalesReport(startDate?: string, endDate?: string, billType?: string): Promise<any[]>;
  getItemsReport(startDate?: string, endDate?: string): Promise<any[]>;
  getPartyLedger(partyId: number): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // ==================== USER OPERATIONS ====================
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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

  // ==================== PARTY OPERATIONS ====================
  async getParties(): Promise<Party[]> {
    return await db.select().from(parties).orderBy(desc(parties.createdAt));
  }

  async getParty(id: number): Promise<Party | undefined> {
    const [party] = await db.select().from(parties).where(eq(parties.id, id));
    return party;
  }

  async createParty(party: InsertParty, userId: string): Promise<Party> {
    const [newParty] = await db
      .insert(parties)
      .values({ ...party, createdBy: userId })
      .returning();
    return newParty;
  }

  async updateParty(id: number, party: InsertParty): Promise<Party> {
    const [updated] = await db
      .update(parties)
      .set({ ...party, updatedAt: new Date() })
      .where(eq(parties.id, id))
      .returning();
    return updated;
  }

  // ==================== ITEM OPERATIONS ====================
  async getItems(): Promise<Item[]> {
    return await db.select().from(items).orderBy(desc(items.createdAt));
  }

  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async createItem(item: InsertItem, userId: string): Promise<Item> {
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
      })
      .returning();

    // Initialize stock entry
    await db.insert(stock).values({
      itemId: newItem.id,
      quantity: "0",
    });

    return newItem;
  }

  async updateItem(id: number, item: InsertItem): Promise<Item> {
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
      .where(eq(items.id, id))
      .returning();
    return updated;
  }

  // ==================== SALES OPERATIONS ====================
  async getSales(): Promise<Sale[]> {
    return await db.select().from(sales).orderBy(desc(sales.date), desc(sales.id));
  }

  async getNextInvoiceNumber(billType: string): Promise<number> {
    const [result] = await db
      .select({ maxNo: sql<number>`COALESCE(MAX(${sales.invoiceNo}), 0)` })
      .from(sales)
      .where(eq(sales.billType, billType));
    return (result?.maxNo || 0) + 1;
  }

  async createSale(saleData: InsertSale, saleItemsData: InsertSaleItem[], userId: string): Promise<Sale> {
    // Get next invoice number
    const invoiceNo = await this.getNextInvoiceNumber(saleData.billType);

    // Insert sale
    const [newSale] = await db
      .insert(sales)
      .values({
        ...saleData,
        invoiceNo,
        time: new Date().toTimeString().substring(0, 8),
        createdBy: userId,
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
        await this.updateStock(item.itemId, -parseFloat(item.quantity.toString()));
      }
    }

    return newSale;
  }

  // ==================== PURCHASE OPERATIONS ====================
  async getPurchases(): Promise<Purchase[]> {
    return await db.select().from(purchases).orderBy(desc(purchases.date), desc(purchases.id));
  }

  async getNextPurchaseNumber(): Promise<number> {
    const [result] = await db
      .select({ maxNo: sql<number>`COALESCE(MAX(${purchases.purchaseNo}), 0)` })
      .from(purchases);
    return (result?.maxNo || 0) + 1;
  }

  async createPurchase(purchase: InsertPurchase, userId: string): Promise<Purchase> {
    const purchaseNo = await this.getNextPurchaseNumber();

    const [newPurchase] = await db
      .insert(purchases)
      .values({
        ...purchase,
        purchaseNo,
        createdBy: userId,
      })
      .returning();

    return newPurchase;
  }

  // ==================== PAYMENT OPERATIONS ====================
  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.date), desc(payments.id));
  }

  async createPayment(payment: InsertPayment, userId: string): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values({ ...payment, createdBy: userId })
      .returning();
    return newPayment;
  }

  // ==================== STOCK OPERATIONS ====================
  async getStock(): Promise<any[]> {
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
      })
      .from(stock)
      .innerJoin(items, eq(stock.itemId, items.id))
      .orderBy(items.name);
    return result;
  }

  async updateStock(itemId: number, quantityChange: number): Promise<void> {
    await db
      .update(stock)
      .set({
        quantity: sql`${stock.quantity} + ${quantityChange}`,
        lastUpdated: new Date(),
      })
      .where(eq(stock.itemId, itemId));
  }

  // ==================== REPORT OPERATIONS ====================
  async getDashboardMetrics(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];

    // Today's sales
    const [todaySales] = await db
      .select({ total: sql<number>`COALESCE(SUM(${sales.grandTotal}), 0)` })
      .from(sales)
      .where(eq(sales.date, today));

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
      .orderBy(desc(sales.date), desc(sales.id))
      .limit(5);

    // Get outstanding
    const outstanding = await this.getOutstanding();
    const totalOutstanding = outstanding.reduce((sum, p) => sum + p.balance, 0);

    // Low stock count
    const [lowStockResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(stock)
      .where(sql`${stock.quantity} < 10`);

    // Total customers
    const [customersResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(parties);

    return {
      todaysSales: todaySales?.total || 0,
      totalOutstanding,
      lowStockCount: lowStockResult?.count || 0,
      totalCustomers: customersResult?.count || 0,
      recentSales,
    };
  }

  async getOutstanding(): Promise<any[]> {
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
      .leftJoin(sales, eq(parties.id, sales.partyId))
      .leftJoin(purchases, eq(parties.id, purchases.partyId))
      .leftJoin(payments, eq(parties.id, payments.partyId))
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

  async getSalesReport(startDate?: string, endDate?: string, billType?: string): Promise<any[]> {
    let query = db.select().from(sales);

    const conditions = [];
    if (startDate) conditions.push(gte(sales.date, startDate));
    if (endDate) conditions.push(lte(sales.date, endDate));
    if (billType && billType !== 'all') conditions.push(eq(sales.billType, billType));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(sales.date), desc(sales.id));
  }

  async getItemsReport(startDate?: string, endDate?: string): Promise<any[]> {
    let query = db
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
      .innerJoin(sales, eq(saleItems.saleId, sales.id));

    const conditions = [];
    if (startDate) conditions.push(gte(sales.date, startDate));
    if (endDate) conditions.push(lte(sales.date, endDate));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query
      .groupBy(saleItems.itemId, saleItems.itemCode, saleItems.itemName, saleItems.hsnCode)
      .orderBy(sql`SUM(${saleItems.amount}) DESC`);
  }

  async getPartyLedger(partyId: number): Promise<any> {
    const party = await this.getParty(partyId);
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
      .where(eq(sales.partyId, partyId));

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
      .where(eq(purchases.partyId, partyId));

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
      .where(eq(payments.partyId, partyId));

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
