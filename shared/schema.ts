import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
  date,
  index,
  jsonb,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// AUTH TABLES (Required for Replit Auth)
// ============================================================================

// Session storage table (REQUIRED for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (REQUIRED for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 20 }).default("user").notNull(), // user, admin, agent
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ============================================================================
// COMPANY/BUSINESS TABLES
// ============================================================================

export const company = pgTable("company", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  gstNo: varchar("gst_no", { length: 50 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 100 }),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCompanySchema = createInsertSchema(company).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof company.$inferSelect;

// ============================================================================
// PARTY/CUSTOMER TABLES
// ============================================================================

export const parties = pgTable("parties", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  stateCode: varchar("state_code", { length: 10 }),
  gstNo: varchar("gst_no", { length: 50 }),
  phone: varchar("phone", { length: 50 }),
  agent: varchar("agent", { length: 100 }),
  agentCode: integer("agent_code"),
  openingDebit: decimal("opening_debit", { precision: 12, scale: 2 }).default("0").notNull(),
  openingCredit: decimal("opening_credit", { precision: 12, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertPartySchema = createInsertSchema(parties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export type InsertParty = z.infer<typeof insertPartySchema>;
export type Party = typeof parties.$inferSelect;

// ============================================================================
// ITEM/PRODUCT MASTER TABLES
// ============================================================================

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 300 }).notNull(),
  hsnCode: varchar("hsn_code", { length: 50 }),
  category: varchar("category", { length: 100 }),
  packType: varchar("pack_type", { length: 20 }).default("PC").notNull(), // PC or KG
  type: varchar("type", { length: 10 }).default("P").notNull(), // P=piece, M=measured
  cost: decimal("cost", { precision: 12, scale: 2 }).default("0").notNull(),
  tax: decimal("tax", { precision: 5, scale: 2 }).default("0").notNull(), // Total tax percentage
  cgst: decimal("cgst", { precision: 5, scale: 3 }).default("0").notNull(), // CGST rate (half of tax)
  sgst: decimal("sgst", { precision: 5, scale: 3 }).default("0").notNull(), // SGST rate (half of tax)
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

// ============================================================================
// STOCK/INVENTORY TABLES
// ============================================================================

export const stock = pgTable("stock", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).default("0").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertStockSchema = createInsertSchema(stock).omit({
  id: true,
  lastUpdated: true,
});

export type InsertStock = z.infer<typeof insertStockSchema>;
export type Stock = typeof stock.$inferSelect;

// ============================================================================
// SALES TABLES
// ============================================================================

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  invoiceNo: integer("invoice_no").notNull(),
  billType: varchar("bill_type", { length: 10 }).notNull(), // GST or EST
  date: date("date").notNull(),
  time: varchar("time", { length: 10 }),
  partyId: integer("party_id").references(() => parties.id),
  partyName: varchar("party_name", { length: 200 }),
  partyCity: varchar("party_city", { length: 100 }),
  partyAddress: text("party_address"),
  partyGstNo: varchar("party_gst_no", { length: 50 }),
  gstType: integer("gst_type").default(0).notNull(), // 0=local (CGST+SGST), 1=inter-state (IGST)
  saleValue: decimal("sale_value", { precision: 12, scale: 2 }).default("0").notNull(),
  taxValue: decimal("tax_value", { precision: 12, scale: 2 }).default("0").notNull(),
  cgstTotal: decimal("cgst_total", { precision: 12, scale: 2 }).default("0").notNull(),
  sgstTotal: decimal("sgst_total", { precision: 12, scale: 2 }).default("0").notNull(),
  roundOff: decimal("round_off", { precision: 12, scale: 2 }).default("0").notNull(),
  grandTotal: decimal("grand_total", { precision: 12, scale: 2 }).default("0").notNull(),
  totalQty: decimal("total_qty", { precision: 12, scale: 3 }).default("0").notNull(),
  amountGiven: decimal("amount_given", { precision: 12, scale: 2 }).default("0").notNull(),
  amountReturn: decimal("amount_return", { precision: 12, scale: 2 }).default("0").notNull(),
  byCard: decimal("by_card", { precision: 12, scale: 2 }).default("0").notNull(),
  byCash: decimal("by_cash", { precision: 12, scale: 2 }).default("0").notNull(),
  mobile: varchar("mobile", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof sales.$inferSelect;

// Sale Items (line items in invoice)
export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id).notNull(),
  itemId: integer("item_id").references(() => items.id),
  itemCode: varchar("item_code", { length: 50 }),
  itemName: varchar("item_name", { length: 300 }).notNull(),
  hsnCode: varchar("hsn_code", { length: 50 }),
  quality: varchar("quality", { length: 100 }),
  size: varchar("size", { length: 50 }),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
  rate: decimal("rate", { precision: 12, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  saleValue: decimal("sale_value", { precision: 12, scale: 2 }).default("0").notNull(),
  taxValue: decimal("tax_value", { precision: 12, scale: 2 }).default("0").notNull(),
  tax: decimal("tax", { precision: 5, scale: 2 }).default("0").notNull(),
  cgst: decimal("cgst", { precision: 12, scale: 2 }).default("0").notNull(),
  sgst: decimal("sgst", { precision: 12, scale: 2 }).default("0").notNull(),
  cgstRate: decimal("cgst_rate", { precision: 5, scale: 3 }).default("0").notNull(),
  sgstRate: decimal("sgst_rate", { precision: 5, scale: 3 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSaleItemSchema = createInsertSchema(saleItems).omit({
  id: true,
  createdAt: true,
});

export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type SaleItem = typeof saleItems.$inferSelect;

// ============================================================================
// PURCHASE TABLES
// ============================================================================

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  purchaseNo: integer("purchase_no").notNull(),
  date: date("date").notNull(),
  partyId: integer("party_id").references(() => parties.id),
  partyName: varchar("party_name", { length: 200 }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchases.$inferSelect;

// ============================================================================
// PAYMENT TABLES
// ============================================================================

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  partyId: integer("party_id").references(() => parties.id),
  partyName: varchar("party_name", { length: 200 }),
  credit: decimal("credit", { precision: 12, scale: 2 }).default("0").notNull(),
  debit: decimal("debit", { precision: 12, scale: 2 }).default("0").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// ============================================================================
// BILL TEMPLATE/SETTINGS TABLE
// ============================================================================

export const billTemplates = pgTable("bill_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  logoUrl: text("logo_url"), // Company logo URL from object storage
  headerText: text("header_text"), // Company branding text at top
  footerText: text("footer_text"), // Footer notes
  showTaxBreakup: boolean("show_tax_breakup").default(true).notNull(),
  showHsnCode: boolean("show_hsn_code").default(true).notNull(),
  showItemCode: boolean("show_item_code").default(true).notNull(),
  paperSize: varchar("paper_size", { length: 20 }).default("A4").notNull(), // A4, A5, etc
  fontSize: integer("font_size").default(10).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertBillTemplateSchema = createInsertSchema(billTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export type InsertBillTemplate = z.infer<typeof insertBillTemplateSchema>;
export type BillTemplate = typeof billTemplates.$inferSelect;

// ============================================================================
// RELATIONS
// ============================================================================

export const partiesRelations = relations(parties, ({ many }) => ({
  sales: many(sales),
  purchases: many(purchases),
  payments: many(payments),
}));

export const itemsRelations = relations(items, ({ many, one }) => ({
  stock: one(stock, {
    fields: [items.id],
    references: [stock.itemId],
  }),
  saleItems: many(saleItems),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  party: one(parties, {
    fields: [sales.partyId],
    references: [parties.id],
  }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  item: one(items, {
    fields: [saleItems.itemId],
    references: [items.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  party: one(parties, {
    fields: [purchases.partyId],
    references: [parties.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  party: one(parties, {
    fields: [payments.partyId],
    references: [parties.id],
  }),
}));

export const stockRelations = relations(stock, ({ one }) => ({
  item: one(items, {
    fields: [stock.itemId],
    references: [items.id],
  }),
}));
