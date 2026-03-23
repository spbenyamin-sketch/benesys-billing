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
  role: varchar("role", { length: 20 }).default("user").notNull(), // superadmin, admin, user
  pagePermissions: jsonb("page_permissions").default(sql`'[]'::jsonb`).notNull(), // Array of accessible page routes
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
  expiryDate: timestamp("expiry_date"), // Software license expiry date
  // Financial Year settings
  currentFinancialYearId: integer("current_financial_year_id"), // Active financial year
  fyStartMonth: integer("fy_start_month").default(4).notNull(), // Default April (4)
  fyStartDay: integer("fy_start_day").default(1).notNull(), // Default 1st
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

// ============================================================================
// PRINT SETTINGS TABLE (Quick Print Configuration)
// ============================================================================

export const printSettings = pgTable("print_settings", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  autoPrintB2B: boolean("auto_print_b2b").default(false).notNull(),
  autoPrintB2C: boolean("auto_print_b2c").default(true).notNull(),
  autoPrintEstimate: boolean("auto_print_estimate").default(false).notNull(),
  autoPrintCreditNote: boolean("auto_print_credit_note").default(false).notNull(),
  autoPrintDebitNote: boolean("auto_print_debit_note").default(false).notNull(),
  printCopiesB2B: integer("print_copies_b2b").default(2).notNull(),
  printCopiesB2C: integer("print_copies_b2c").default(1).notNull(),
  printCopiesEstimate: integer("print_copies_estimate").default(1).notNull(),
  printCopiesCreditNote: integer("print_copies_credit_note").default(2).notNull(),
  printCopiesDebitNote: integer("print_copies_debit_note").default(2).notNull(),
  showPrintConfirmation: boolean("show_print_confirmation").default(true).notNull(),
  defaultPrinterName: varchar("default_printer_name", { length: 255 }).default("").notNull(),
  enableTamilPrint: boolean("enable_tamil_print").default(false).notNull(),
  directPrintB2B: boolean("direct_print_b2b").default(false).notNull(),
  directPrintB2C: boolean("direct_print_b2c").default(false).notNull(),
  directPrintEstimate: boolean("direct_print_estimate").default(false).notNull(),
  directPrintCreditNote: boolean("direct_print_credit_note").default(false).notNull(),
  directPrintDebitNote: boolean("direct_print_debit_note").default(false).notNull(),
  enableWebSocketPrint: boolean("enable_web_socket_print").default(false).notNull(),
  webSocketPrinterName: varchar("web_socket_printer_name", { length: 255 }).default("").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PrintSettings = typeof printSettings.$inferSelect;
export type InsertPrintSettings = typeof printSettings.$inferInsert;

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
}).extend({
  expiryDate: z.coerce.date().optional(),
  currentFinancialYearId: z.number().optional(),
  fyStartMonth: z.number().default(4).optional(),
  fyStartDay: z.number().default(1).optional(),
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
// FINANCIAL YEAR MANAGEMENT
// ============================================================================

export const financialYears = pgTable("financial_years", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  label: varchar("label", { length: 20 }).notNull(), // e.g., "2024-25"
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFinancialYearSchema = createInsertSchema(financialYears).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFinancialYear = z.infer<typeof insertFinancialYearSchema>;
export type FinancialYear = typeof financialYears.$inferSelect;

// Bill sequences per financial year
export const billSequences = pgTable("bill_sequences", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  financialYearId: integer("financial_year_id").references(() => financialYears.id).notNull(),
  billType: varchar("bill_type", { length: 20 }).notNull(), // B2B, B2C, ESTIMATE, CREDIT_NOTE, DEBIT_NOTE, PURCHASE
  nextNumber: integer("next_number").default(1).notNull(),
  prefix: varchar("prefix", { length: 20 }), // Optional custom prefix
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBillSequenceSchema = createInsertSchema(billSequences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBillSequence = z.infer<typeof insertBillSequenceSchema>;
export type BillSequence = typeof billSequences.$inferSelect;

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

// GSTIN regex: 2-digit state code + 5 PAN letters + 4 PAN digits + 1 letter +
// 1 entity number + 'Z' + 1 checksum char (all uppercase)
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const insertPartySchema = createInsertSchema(parties).omit({
  id: true,
  companyId: true,
  code: true, // Auto-generated
  createdAt: true,
  updatedAt: true,
  createdBy: true,
}).extend({
  // Optional field — but if provided and non-empty, must be a valid 15-char GSTIN
  gstNo: z.string()
    .refine(val => !val || GSTIN_REGEX.test(val), {
      message: "Invalid GSTIN — must be 15 characters, e.g. 29AAAAA0000A1Z5",
    })
    .optional()
    .nullable(),
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
  mrp: decimal("mrp", { precision: 12, scale: 2 }).default("0").notNull(), // MRP - rounded figure
  sellingPrice: decimal("selling_price", { precision: 12, scale: 2 }).default("0").notNull(), // Selling price - rounded figure
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
}).extend({
  mrp: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "MRP must be a valid number"),
  sellingPrice: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Selling Price must be a valid number"),
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
  financialYearId: integer("financial_year_id").references(() => financialYears.id), // Financial year for this sale
  invoiceNo: integer("invoice_no").notNull(),
  invoiceCode: varchar("invoice_code", { length: 50 }), // Formatted invoice code e.g., B2B-2024-25-0001
  billType: varchar("bill_type", { length: 10 }).notNull(), // GST or EST
  saleType: varchar("sale_type", { length: 20 }).default("B2C").notNull(), // B2B, B2C, ESTIMATE, CREDIT_NOTE, DEBIT_NOTE
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
  // E-Invoice fields (India GST)
  einvoiceStatus: varchar("einvoice_status", { length: 20 }), // pending, generated, cancelled, failed
  irn: varchar("irn", { length: 100 }), // Invoice Reference Number from e-invoice portal
  ackNumber: varchar("ack_number", { length: 50 }), // Acknowledgement number
  ackDate: timestamp("ack_date"), // Acknowledgement date
  qrCode: text("qr_code"), // QR code data (base64 or raw text)
  signedInvoice: text("signed_invoice"), // Signed invoice JSON from portal
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  version: integer("version").default(1).notNull(),
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
  stockInwardId: integer("stock_inward_id").references(() => stockInwardItems.id), // Track which barcode was sold
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
// PURCHASE TABLES (Bill Header - Phase 1)
// ============================================================================

export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  financialYearId: integer("financial_year_id").references(() => financialYears.id), // Financial year for this purchase
  purchaseNo: integer("purchase_no").notNull(), // Entry number for stock inward
  purchaseCode: varchar("purchase_code", { length: 50 }), // Formatted purchase code e.g., PUR-2024-25-0001
  date: date("date").notNull(),
  invoiceNo: varchar("invoice_no", { length: 50 }),
  partyId: integer("party_id").references(() => parties.id),
  partyName: varchar("party_name", { length: 200 }),
  city: varchar("city", { length: 100 }),
  // Bill totals
  invoiceAmount: decimal("invoice_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  packingAmount: decimal("packing_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  otherCharges: decimal("other_charges", { precision: 12, scale: 2 }).default("0").notNull(),
  profitPercent: decimal("profit_percent", { precision: 5, scale: 2 }).default("0").notNull(), // RST profit %
  rstPercent: decimal("rst_percent", { precision: 5, scale: 2 }).default("0").notNull(), // Additional % 
  surchargePercent: decimal("surcharge_percent", { precision: 5, scale: 2 }).default("0").notNull(), // SC %
  // Calculated totals (updated from stock inward)
  totalQty: decimal("total_qty", { precision: 12, scale: 2 }).default("0").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).default("0").notNull(),
  beforeTaxAmount: decimal("before_tax_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  billTotalAmount: decimal("bill_total_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  // Tax breakdown by rate
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
  itax0: decimal("itax_0", { precision: 12, scale: 2 }).default("0").notNull(),
  itax5: decimal("itax_5", { precision: 12, scale: 2 }).default("0").notNull(),
  itax12: decimal("itax_12", { precision: 12, scale: 2 }).default("0").notNull(),
  itax18: decimal("itax_18", { precision: 12, scale: 2 }).default("0").notNull(),
  itax28: decimal("itax_28", { precision: 12, scale: 2 }).default("0").notNull(),
  // Status
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, completed
  stockInwardCompleted: boolean("stock_inward_completed").default(false).notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  version: integer("version").default(1).notNull(),
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  companyId: true,
  purchaseNo: true, // Auto-generated
  status: true, // Set by system
  stockInwardCompleted: true, // Set by system
  createdAt: true,
  updatedAt: true,
  createdBy: true,
}).extend({
  beforeTaxAmount: z.string().or(z.number()).optional(),
  billTotalAmount: z.string().or(z.number()).optional(),
});

export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchases.$inferSelect;

// ============================================================================
// STOCK INWARD BATCHES (Item Entry - Phase 2)
// ============================================================================

export const purchaseItems = pgTable("purchase_items", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id").references(() => purchases.id).notNull(),
  itemId: integer("item_id").references(() => items.id),
  serial: integer("serial").notNull(),
  itname: varchar("itname", { length: 300 }).notNull(),
  brandname: varchar("brandname", { length: 200 }),
  name: varchar("name", { length: 200 }), // Quality/Size description
  // Cost breakdown (from BARIDNX)
  cost: decimal("cost", { precision: 12, scale: 2 }).notNull(), // Bill cost
  qty: decimal("qty", { precision: 12, scale: 2 }).notNull(), // Total qty for this entry
  pcs: decimal("pcs", { precision: 12, scale: 2 }).default("0").notNull(), // Pieces (for measured items)
  // Rate differences and discounts
  rd: decimal("rd", { precision: 12, scale: 2 }).default("0").notNull(), // Rate difference 1
  dis: decimal("dis", { precision: 5, scale: 2 }).default("0").notNull(), // Discount % 1
  rd1: decimal("rd1", { precision: 12, scale: 2 }).default("0").notNull(), // Rate difference 2
  dis1: decimal("dis1", { precision: 5, scale: 2 }).default("0").notNull(), // Discount % 2
  ag: decimal("ag", { precision: 5, scale: 2 }).default("0").notNull(), // Agent %
  addc: decimal("addc", { precision: 12, scale: 2 }).default("0").notNull(), // Additional cost
  // Calculated costs
  ncost: decimal("ncost", { precision: 12, scale: 2 }).default("0").notNull(), // Net cost after discounts
  lcost: decimal("lcost", { precision: 12, scale: 2 }).default("0").notNull(), // Landing cost
  netcost: decimal("netcost", { precision: 12, scale: 2 }).default("0").notNull(), // Final net cost
  // Tax and pricing
  tax: decimal("tax", { precision: 5, scale: 2 }).default("0").notNull(),
  prft: decimal("prft", { precision: 5, scale: 2 }).default("0").notNull(), // Profit %
  rrate: decimal("rrate", { precision: 12, scale: 2 }).default("0").notNull(), // Retail rate (MRP)
  mrp: decimal("mrp", { precision: 12, scale: 2 }).default("0").notNull(), // MRP
  // Legacy fields for compatibility
  arate: decimal("arate", { precision: 12, scale: 2 }).default("0").notNull(),
  brate: decimal("brate", { precision: 12, scale: 2 }).default("0").notNull(),
  profit: decimal("profit", { precision: 12, scale: 2 }).default("0").notNull(),
  prper: decimal("prper", { precision: 5, scale: 2 }).default("0").notNull(),
  // Product details
  quality: varchar("quality", { length: 100 }), // TAG field
  dno1: varchar("dno1", { length: 50 }), // Design number
  pattern: varchar("pattern", { length: 100 }),
  sleeve: varchar("sleeve", { length: 100 }), // Color
  sl: varchar("sl", { length: 50 }), // Short code
  // Size details
  size1: varchar("size1", { length: 10 }), // Starting size
  size2: varchar("size2", { length: 10 }), // Ending size
  jc: varchar("jc", { length: 1 }).default("J"), // J=Jump, C=Continuous, M=Manual
  fv: varchar("fv", { length: 1 }).default("F"), // F=Fixed, V=Variable
  // Size-wise quantities (s1-s12)
  s1: integer("s1").default(0).notNull(),
  s2: integer("s2").default(0).notNull(),
  s3: integer("s3").default(0).notNull(),
  s4: integer("s4").default(0).notNull(),
  s5: integer("s5").default(0).notNull(),
  s6: integer("s6").default(0).notNull(),
  s7: integer("s7").default(0).notNull(),
  s8: integer("s8").default(0).notNull(),
  s9: integer("s9").default(0).notNull(),
  s10: integer("s10").default(0).notNull(),
  s11: integer("s11").default(0).notNull(),
  s12: integer("s12").default(0).notNull(),
  // Size-wise rates (r1-r12)
  r1: decimal("r1", { precision: 12, scale: 2 }).default("0").notNull(),
  r2: decimal("r2", { precision: 12, scale: 2 }).default("0").notNull(),
  r3: decimal("r3", { precision: 12, scale: 2 }).default("0").notNull(),
  r4: decimal("r4", { precision: 12, scale: 2 }).default("0").notNull(),
  r5: decimal("r5", { precision: 12, scale: 2 }).default("0").notNull(),
  r6: decimal("r6", { precision: 12, scale: 2 }).default("0").notNull(),
  r7: decimal("r7", { precision: 12, scale: 2 }).default("0").notNull(),
  r8: decimal("r8", { precision: 12, scale: 2 }).default("0").notNull(),
  r9: decimal("r9", { precision: 12, scale: 2 }).default("0").notNull(),
  r10: decimal("r10", { precision: 12, scale: 2 }).default("0").notNull(),
  r11: decimal("r11", { precision: 12, scale: 2 }).default("0").notNull(),
  r12: decimal("r12", { precision: 12, scale: 2 }).default("0").notNull(),
  // Size-wise MRP (mrp1-mrp12)
  mrp1: decimal("mrp1", { precision: 12, scale: 2 }).default("0").notNull(),
  mrp2: decimal("mrp2", { precision: 12, scale: 2 }).default("0").notNull(),
  mrp3: decimal("mrp3", { precision: 12, scale: 2 }).default("0").notNull(),
  mrp4: decimal("mrp4", { precision: 12, scale: 2 }).default("0").notNull(),
  mrp5: decimal("mrp5", { precision: 12, scale: 2 }).default("0").notNull(),
  mrp6: decimal("mrp6", { precision: 12, scale: 2 }).default("0").notNull(),
  mrp7: decimal("mrp7", { precision: 12, scale: 2 }).default("0").notNull(),
  mrp8: decimal("mrp8", { precision: 12, scale: 2 }).default("0").notNull(),
  mrp9: decimal("mrp9", { precision: 12, scale: 2 }).default("0").notNull(),
  mrp10: decimal("mrp10", { precision: 12, scale: 2 }).default("0").notNull(),
  mrp11: decimal("mrp11", { precision: 12, scale: 2 }).default("0").notNull(),
  mrp12: decimal("mrp12", { precision: 12, scale: 2 }).default("0").notNull(),
  // Status
  expdate: date("expdate"),
  dqty: decimal("dqty", { precision: 12, scale: 2 }).default("0").notNull(), // Damaged qty
  saleqty: decimal("saleqty", { precision: 12, scale: 2 }).default("0").notNull(),
  stockqty: decimal("stockqty", { precision: 12, scale: 2 }).default("0").notNull(),
  barcodeGenerated: boolean("barcode_generated").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPurchaseItemSchema = createInsertSchema(purchaseItems).omit({
  id: true,
  createdAt: true,
});

export type InsertPurchaseItem = z.infer<typeof insertPurchaseItemSchema>;
export type PurchaseItem = typeof purchaseItems.$inferSelect;

// ============================================================================
// STOCK INWARD ITEMS (Individual Barcodes - One per unit)
// ============================================================================

export const stockInwardItems = pgTable("stock_inward_items", {
  id: serial("id").primaryKey(),
  purchaseItemId: integer("purchase_item_id").references(() => purchaseItems.id).notNull(),
  purchaseId: integer("purchase_id").references(() => purchases.id).notNull(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  itemId: integer("item_id").references(() => items.id),
  // Unique identification
  serial: integer("serial").notNull(), // Global serial number
  barcode: varchar("barcode", { length: 100 }).notNull(), // Unique barcode per unit
  // Product info (copied from purchaseItems for quick lookup)
  itname: varchar("itname", { length: 300 }).notNull(),
  brandname: varchar("brandname", { length: 200 }),
  quality: varchar("quality", { length: 100 }), // TAG
  dno1: varchar("dno1", { length: 50 }), // Design number
  pattern: varchar("pattern", { length: 100 }),
  sleeve: varchar("sleeve", { length: 100 }), // Color
  // Size for this specific unit
  size: varchar("size", { length: 10 }),
  sizeCode: integer("size_code"), // Numeric code (45, 47, 49, etc.)
  // Pricing for this unit
  cost: decimal("cost", { precision: 12, scale: 2 }).notNull(),
  ncost: decimal("ncost", { precision: 12, scale: 2 }).notNull(), // Net cost
  lcost: decimal("lcost", { precision: 12, scale: 2 }).notNull(), // Landing cost
  rate: decimal("rate", { precision: 12, scale: 2 }).notNull(), // Sale rate
  mrp: decimal("mrp", { precision: 12, scale: 2 }).notNull(), // MRP
  tax: decimal("tax", { precision: 5, scale: 2 }).default("0").notNull(),
  // Quantity for this barcode (for bulk barcodes this can be > 1)
  qty: decimal("qty", { precision: 12, scale: 2 }).default("1").notNull(),
  // Stock status
  status: varchar("status", { length: 20 }).default("available").notNull(), // available, sold, returned, damaged
  soldAt: timestamp("sold_at"),
  saleId: integer("sale_id").references(() => sales.id),
  saleItemId: integer("sale_item_id").references(() => saleItems.id),
  expdate: date("expdate"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_stock_inward_barcode").on(table.barcode),
  index("idx_stock_inward_status").on(table.status),
  index("idx_stock_inward_company").on(table.companyId),
]);

export const insertStockInwardItemSchema = createInsertSchema(stockInwardItems).omit({
  id: true,
  createdAt: true,
});

export type InsertStockInwardItem = z.infer<typeof insertStockInwardItemSchema>;
export type StockInwardItem = typeof stockInwardItems.$inferSelect;

// ============================================================================
// SIZE MASTER (Size code conversion from VFP)
// ============================================================================

export const sizeMaster = pgTable("size_master", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(), // F, S, M, L, XL, 2L, 3L, etc.
  numericCode: integer("numeric_code").notNull(), // 45, 47, 49, 51, 53, 55, 57, etc.
  description: varchar("description", { length: 50 }),
  sortOrder: integer("sort_order").default(0).notNull(),
});

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
  formatType: varchar("format_type", { length: 20 }).default("A4").notNull(), // A4, B4, thermal_3inch, thermal_4inch
  assignedTo: varchar("assigned_to", { length: 20 }), // b2b, b2c, estimate - null means not assigned
  logoUrl: text("logo_url"), // Company logo URL from object storage
  headerText: text("header_text"), // Company branding text at top
  footerText: text("footer_text"), // Footer notes
  showTaxBreakup: boolean("show_tax_breakup").default(true).notNull(),
  showHsnCode: boolean("show_hsn_code").default(true).notNull(),
  showItemCode: boolean("show_item_code").default(true).notNull(),
  showOutstandingDefault: boolean("show_outstanding_default").default(true).notNull(), // B2B: default setting to print outstanding
  showCashReturn: boolean("show_cash_return").default(true).notNull(), // B2C: show cash given/return on invoice
  showPartyBalance: boolean("show_party_balance").default(false).notNull(), // Show party outstanding balance
  showBankDetails: boolean("show_bank_details").default(false).notNull(), // Show company bank details
  enableTamilPrint: boolean("enable_tamil_print").default(false).notNull(), // Enable Tamil language labels on invoice
  bankDetails: text("bank_details"), // Bank account details for payment
  termsAndConditions: text("terms_and_conditions"), // Terms and conditions text
  paperSize: varchar("paper_size", { length: 20 }).default("A4").notNull(), // A4, B4, 3inch, 4inch
  fontSize: integer("font_size").default(10).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  autoPrintThisTemplate: boolean("auto_print_this_template").default(false).notNull(), // Quick print - auto print when saved
  directPrintThisTemplate: boolean("direct_print_this_template").default(false).notNull(), // Quick print - skip preview, print directly
  printCopiesThisTemplate: integer("print_copies_this_template").default(1).notNull(), // Quick print - number of copies for this template
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
export const billTemplatesAutoPrintSchema = createInsertSchema(billTemplates).pick({
  autoPrintThisTemplate: true,
  directPrintThisTemplate: true,
});

export type BillTemplate = typeof billTemplates.$inferSelect;

// ============================================================================
// PRINT TOKENS TABLE (for Direct Print Service)
// ============================================================================

export const printTokens = pgTable("print_tokens", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(), // Unique token for authentication
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPrintTokenSchema = createInsertSchema(printTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPrintToken = z.infer<typeof insertPrintTokenSchema>;
export type PrintToken = typeof printTokens.$inferSelect;

// ============================================================================
// BARCODE LABEL TEMPLATES
// ============================================================================

export const barcodeLabelTemplates = pgTable("barcode_label_templates", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  // Label dimensions in mm
  labelWidth: decimal("label_width", { precision: 6, scale: 2 }).default("50").notNull(),
  labelHeight: decimal("label_height", { precision: 6, scale: 2 }).default("25").notNull(),
  // Layout configuration stored as JSON
  config: text("config").notNull(), // JSON: { elements: [{ type, x, y, width, height, fontSize, field }] }
  // PRN Program template for Zebra printers (EPL2/ZPL format)
  // Supports placeholders: {barcode}, {itemName}, {mrp}, {sellingPrice}, {hsnCode}, {size}, {sizeCode}
  prnProgram: text("prn_program"),
  // Print settings
  paperSize: varchar("paper_size", { length: 20 }).default("A4").notNull(),
  labelsPerRow: integer("labels_per_row").default(4).notNull(),
  labelsPerColumn: integer("labels_per_column").default(10).notNull(),
  marginTop: decimal("margin_top", { precision: 6, scale: 2 }).default("10").notNull(),
  marginLeft: decimal("margin_left", { precision: 6, scale: 2 }).default("5").notNull(),
  gapHorizontal: decimal("gap_horizontal", { precision: 6, scale: 2 }).default("2").notNull(),
  gapVertical: decimal("gap_vertical", { precision: 6, scale: 2 }).default("2").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const insertBarcodeLabelTemplateSchema = createInsertSchema(barcodeLabelTemplates).omit({
  id: true,
  companyId: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
}).extend({
  labelWidth: z.coerce.number().or(z.string()),
  labelHeight: z.coerce.number().or(z.string()),
  labelsPerRow: z.coerce.number().optional(),
  labelsPerColumn: z.coerce.number().optional(),
  marginTop: z.coerce.number().or(z.string()).optional(),
  marginLeft: z.coerce.number().or(z.string()).optional(),
  gapHorizontal: z.coerce.number().or(z.string()).optional(),
  gapVertical: z.coerce.number().or(z.string()).optional(),
  config: z.string(),
  prnProgram: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
  paperSize: z.string().optional(),
  name: z.string(),
});

export type InsertBarcodeLabelTemplate = z.infer<typeof insertBarcodeLabelTemplateSchema>;
export type BarcodeLabelTemplate = typeof barcodeLabelTemplates.$inferSelect;

// Schema for updating stock inward item prices
export const updateStockInwardItemSchema = z.object({
  rate: z.string().optional(),
  mrp: z.string().optional(),
  size: z.string().optional(),
  sizeCode: z.number().optional(),
});

export type UpdateStockInwardItem = z.infer<typeof updateStockInwardItemSchema>;

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

export const purchaseItemsRelations = relations(purchaseItems, ({ one, many }) => ({
  purchase: one(purchases, {
    fields: [purchaseItems.purchaseId],
    references: [purchases.id],
  }),
  item: one(items, {
    fields: [purchaseItems.itemId],
    references: [items.id],
  }),
  stockInwardItems: many(stockInwardItems),
}));

export const stockInwardItemsRelations = relations(stockInwardItems, ({ one }) => ({
  purchaseItem: one(purchaseItems, {
    fields: [stockInwardItems.purchaseItemId],
    references: [purchaseItems.id],
  }),
  purchase: one(purchases, {
    fields: [stockInwardItems.purchaseId],
    references: [purchases.id],
  }),
  item: one(items, {
    fields: [stockInwardItems.itemId],
    references: [items.id],
  }),
  sale: one(sales, {
    fields: [stockInwardItems.saleId],
    references: [sales.id],
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

// ============================================================================
// AUDIT LOGS
// ============================================================================

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // sale, purchase, payment, party, item
  entityId: integer("entity_id").notNull(),
  action: varchar("action", { length: 20 }).notNull(), // create, update, delete
  oldData: jsonb("old_data"),
  newData: jsonb("new_data"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
