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

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 100 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
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

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  gstNo: varchar("gst_no", { length: 50 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 100 }),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// User-Company relationship (many-to-many)
export const userCompanies = pgTable("user_companies", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserCompany = typeof userCompanies.$inferSelect;

// ============================================================================
// PARTY/CUSTOMER TABLES
// ============================================================================

export const parties = pgTable("parties", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  code: varchar("code", { length: 50 }).notNull(), // Auto-generated numeric code per company
  shortName: varchar("short_name", { length: 50 }), // Short name for quick reference
  name: varchar("name", { length: 200 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }).notNull(), // Mandatory
  pincode: varchar("pincode", { length: 10 }).notNull(), // Mandatory
  state: varchar("state", { length: 100 }),
  stateCode: varchar("state_code", { length: 10 }),
  gstNo: varchar("gst_no", { length: 50 }),
  phone: varchar("phone", { length: 50 }),
  // Shipping address fields (optional)
  hasShippingAddress: boolean("has_shipping_address").default(false).notNull(),
  shipName: varchar("ship_name", { length: 200 }),
  shipAddress: text("ship_address"),
  shipCity: varchar("ship_city", { length: 100 }),
  shipPincode: varchar("ship_pincode", { length: 10 }),
  shipState: varchar("ship_state", { length: 100 }),
  shipStateCode: varchar("ship_state_code", { length: 10 }),
  // Agent reference
  agentId: integer("agent_id").references(() => agents.id),
  openingDebit: decimal("opening_debit", { precision: 12, scale: 2 }).default("0").notNull(),
  openingCredit: decimal("opening_credit", { precision: 12, scale: 2 }).default("0").notNull(),
  isShared: boolean("is_shared").default(false).notNull(), // If true, visible to all companies
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertPartySchema = createInsertSchema(parties).omit({
  id: true,
  companyId: true,
  code: true, // Auto-generated
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export type InsertParty = z.infer<typeof insertPartySchema>;
export type Party = typeof parties.$inferSelect;

// ============================================================================
// AGENT MASTER TABLE
// ============================================================================

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  code: integer("code").notNull(), // Auto-increment code per company
  name: varchar("name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 100 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  commission: decimal("commission", { precision: 5, scale: 2 }).default("0").notNull(), // Commission percentage
  active: boolean("active").default(true).notNull(),
  isShared: boolean("is_shared").default(false).notNull(), // If true, visible to all companies
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  companyId: true,
  code: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

// ============================================================================
// ITEM/PRODUCT MASTER TABLES
// ============================================================================

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  code: varchar("code", { length: 50 }).notNull(), // Auto-generated numeric code per company
  name: varchar("name", { length: 300 }).notNull(),
  hsnCode: varchar("hsn_code", { length: 50 }).notNull(), // Mandatory
  category: varchar("category", { length: 100 }),
  floor: varchar("floor", { length: 50 }), // Optional floor/location
  packType: varchar("pack_type", { length: 20 }).default("PCS").notNull(), // PCS, KG, LTR, MTR, BOX, PKT, SET, DZ, GM, ML
  type: varchar("type", { length: 10 }).default("P").notNull(), // P=piece, M=measured
  cost: decimal("cost", { precision: 12, scale: 2 }).default("0").notNull(),
  tax: decimal("tax", { precision: 5, scale: 2 }).default("0").notNull(), // Total tax percentage (mandatory)
  cgst: decimal("cgst", { precision: 5, scale: 3 }).default("0").notNull(), // CGST rate (half of tax)
  sgst: decimal("sgst", { precision: 5, scale: 3 }).default("0").notNull(), // SGST rate (half of tax)
  active: boolean("active").default(true).notNull(),
  isShared: boolean("is_shared").default(false).notNull(), // If true, visible to all companies
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  companyId: true,
  code: true, // Auto-generated
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
  companyId: integer("company_id").references(() => companies.id).notNull(),
  itemId: integer("item_id").references(() => items.id).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).default("0").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insertStockSchema = createInsertSchema(stock).omit({
  id: true,
  companyId: true,
  lastUpdated: true,
});

export type InsertStock = z.infer<typeof insertStockSchema>;
export type Stock = typeof stock.$inferSelect;

// ============================================================================
// SALES TABLES
// ============================================================================

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  invoiceNo: integer("invoice_no").notNull(),
  billType: varchar("bill_type", { length: 10 }).notNull(), // GST or EST
  saleType: varchar("sale_type", { length: 10 }).default("B2C").notNull(), // B2B, B2C, ESTIMATE
  paymentMode: varchar("payment_mode", { length: 10 }).default("CASH").notNull(), // CASH, CARD, CREDIT
  inclusiveTax: boolean("inclusive_tax").default(false).notNull(), // true=rate includes tax
  date: date("date").notNull(),
  time: varchar("time", { length: 10 }),
  partyId: integer("party_id").references(() => parties.id),
  partyName: varchar("party_name", { length: 200 }),
  partyCity: varchar("party_city", { length: 100 }),
  partyAddress: text("party_address"),
  partyGstNo: varchar("party_gst_no", { length: 50 }),
  gstType: integer("gst_type").default(0).notNull(), // 0=local (CGST+SGST), 1=inter-state (IGST)
  saleValue: decimal("sale_value", { precision: 12, scale: 2 }).default("0").notNull(),
  discountTotal: decimal("discount_total", { precision: 12, scale: 2 }).default("0").notNull(), // Total discount
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
  printOutstanding: boolean("print_outstanding").default(false).notNull(), // B2B: print outstanding on invoice
  partyOutstanding: decimal("party_outstanding", { precision: 12, scale: 2 }).default("0").notNull(), // Outstanding at time of sale
  mobile: varchar("mobile", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  companyId: true,
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
  purchaseItemId: integer("purchase_item_id").references(() => purchaseItems.id), // Link to inventory for barcode scanned items
  itemCode: varchar("item_code", { length: 50 }),
  barcode: varchar("barcode", { length: 100 }), // Barcode if scanned from inventory
  itemName: varchar("item_name", { length: 300 }).notNull(),
  hsnCode: varchar("hsn_code", { length: 50 }),
  quality: varchar("quality", { length: 100 }),
  size: varchar("size", { length: 50 }),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
  rate: decimal("rate", { precision: 12, scale: 2 }).notNull(), // Could be inclusive or exclusive rate
  mrp: decimal("mrp", { precision: 12, scale: 2 }).default("0").notNull(), // MRP from inventory
  discount: decimal("discount", { precision: 12, scale: 2 }).default("0").notNull(), // Discount amount per item
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0").notNull(), // Discount percentage
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(), // After discount
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
  companyId: integer("company_id").references(() => companies.id).notNull(),
  purchaseNo: integer("purchase_no").notNull(),
  date: date("date").notNull(),
  invoiceNo: varchar("invoice_no", { length: 50 }),
  partyId: integer("party_id").references(() => parties.id),
  partyName: varchar("party_name", { length: 200 }),
  city: varchar("city", { length: 100 }),
  totalQty: decimal("total_qty", { precision: 12, scale: 2 }).default("0").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).default("0").notNull(),
  val0: decimal("val_0", { precision: 12, scale: 2 }).default("0").notNull(),
  val5: decimal("val_5", { precision: 12, scale: 2 }).default("0").notNull(),
  val12: decimal("val_12", { precision: 12, scale: 2 }).default("0").notNull(),
  val18: decimal("val_18", { precision: 12, scale: 2 }).default("0").notNull(),
  val28: decimal("val_28", { precision: 12, scale: 2 }).default("0").notNull(),
  ctax0: decimal("ctax_0", { precision: 12, scale: 2 }).default("0").notNull(),
  ctax5: decimal("ctax_5", { precision: 12, scale: 2 }).default("0").notNull(),
  ctax12: decimal("ctax_12", { precision: 12, scale: 2 }).default("0").notNull(),
  ctax18: decimal("ctax_18", { precision: 12, scale: 2 }).default("0").notNull(),
  ctax28: decimal("ctax_28", { precision: 12, scale: 2 }).default("0").notNull(),
  stax0: decimal("stax_0", { precision: 12, scale: 2 }).default("0").notNull(),
  stax5: decimal("stax_5", { precision: 12, scale: 2 }).default("0").notNull(),
  stax12: decimal("stax_12", { precision: 12, scale: 2 }).default("0").notNull(),
  stax18: decimal("stax_18", { precision: 12, scale: 2 }).default("0").notNull(),
  stax28: decimal("stax_28", { precision: 12, scale: 2 }).default("0").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  companyId: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchases.$inferSelect;

export const purchaseItems = pgTable("purchase_items", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id").references(() => purchases.id).notNull(),
  itemId: integer("item_id").references(() => items.id),
  serial: integer("serial").notNull(),
  barcode: varchar("barcode", { length: 100 }),
  itname: varchar("itname", { length: 300 }).notNull(),
  brandname: varchar("brandname", { length: 200 }),
  name: varchar("name", { length: 200 }),
  qty: decimal("qty", { precision: 12, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 12, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 5, scale: 2 }).default("0").notNull(),
  arate: decimal("arate", { precision: 12, scale: 2 }).default("0").notNull(),
  rrate: decimal("rrate", { precision: 12, scale: 2 }).default("0").notNull(),
  brate: decimal("brate", { precision: 12, scale: 2 }).default("0").notNull(),
  profit: decimal("profit", { precision: 12, scale: 2 }).default("0").notNull(),
  prper: decimal("prper", { precision: 5, scale: 2 }).default("0").notNull(),
  expdate: date("expdate"),
  dqty: decimal("dqty", { precision: 12, scale: 2 }).default("0").notNull(),
  saleqty: decimal("saleqty", { precision: 12, scale: 2 }).default("0").notNull(),
  stockqty: decimal("stockqty", { precision: 12, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPurchaseItemSchema = createInsertSchema(purchaseItems).omit({
  id: true,
  createdAt: true,
});

export type InsertPurchaseItem = z.infer<typeof insertPurchaseItemSchema>;
export type PurchaseItem = typeof purchaseItems.$inferSelect;

// ============================================================================
// PAYMENT TABLES
// ============================================================================

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
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
  companyId: true,
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
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  logoUrl: text("logo_url"), // Company logo URL from object storage
  headerText: text("header_text"), // Company branding text at top
  footerText: text("footer_text"), // Footer notes
  showTaxBreakup: boolean("show_tax_breakup").default(true).notNull(),
  showHsnCode: boolean("show_hsn_code").default(true).notNull(),
  showItemCode: boolean("show_item_code").default(true).notNull(),
  showOutstandingDefault: boolean("show_outstanding_default").default(true).notNull(), // B2B: default setting to print outstanding
  showCashReturn: boolean("show_cash_return").default(true).notNull(), // B2C: show cash given/return on invoice
  paperSize: varchar("paper_size", { length: 20 }).default("A4").notNull(), // A4, A5, etc
  fontSize: integer("font_size").default(10).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertBillTemplateSchema = createInsertSchema(billTemplates).omit({
  id: true,
  companyId: true,
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

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  party: one(parties, {
    fields: [purchases.partyId],
    references: [parties.id],
  }),
  items: many(purchaseItems),
}));

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchaseItems.purchaseId],
    references: [purchases.id],
  }),
  item: one(items, {
    fields: [purchaseItems.itemId],
    references: [items.id],
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
