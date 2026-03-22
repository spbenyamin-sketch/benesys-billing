var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  agents: () => agents,
  barcodeLabelTemplates: () => barcodeLabelTemplates,
  billSequences: () => billSequences,
  billTemplates: () => billTemplates,
  billTemplatesAutoPrintSchema: () => billTemplatesAutoPrintSchema,
  companies: () => companies,
  financialYears: () => financialYears,
  insertAgentSchema: () => insertAgentSchema,
  insertBarcodeLabelTemplateSchema: () => insertBarcodeLabelTemplateSchema,
  insertBillSequenceSchema: () => insertBillSequenceSchema,
  insertBillTemplateSchema: () => insertBillTemplateSchema,
  insertCompanySchema: () => insertCompanySchema,
  insertFinancialYearSchema: () => insertFinancialYearSchema,
  insertItemSchema: () => insertItemSchema,
  insertPartySchema: () => insertPartySchema,
  insertPaymentSchema: () => insertPaymentSchema,
  insertPrintTokenSchema: () => insertPrintTokenSchema,
  insertPurchaseItemSchema: () => insertPurchaseItemSchema,
  insertPurchaseSchema: () => insertPurchaseSchema,
  insertSaleItemSchema: () => insertSaleItemSchema,
  insertSaleSchema: () => insertSaleSchema,
  insertStockInwardItemSchema: () => insertStockInwardItemSchema,
  insertStockSchema: () => insertStockSchema,
  items: () => items,
  itemsRelations: () => itemsRelations,
  parties: () => parties,
  partiesRelations: () => partiesRelations,
  payments: () => payments,
  paymentsRelations: () => paymentsRelations,
  printSettings: () => printSettings,
  printTokens: () => printTokens,
  purchaseItems: () => purchaseItems,
  purchaseItemsRelations: () => purchaseItemsRelations,
  purchases: () => purchases,
  purchasesRelations: () => purchasesRelations,
  saleItems: () => saleItems,
  saleItemsRelations: () => saleItemsRelations,
  sales: () => sales,
  salesRelations: () => salesRelations,
  sessions: () => sessions,
  sizeMaster: () => sizeMaster,
  stock: () => stock,
  stockInwardItems: () => stockInwardItems,
  stockInwardItemsRelations: () => stockInwardItemsRelations,
  stockRelations: () => stockRelations,
  updateStockInwardItemSchema: () => updateStockInwardItemSchema,
  userCompanies: () => userCompanies,
  users: () => users
});
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
  serial
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var sessions, users, companies, printSettings, insertCompanySchema, userCompanies, financialYears, insertFinancialYearSchema, billSequences, insertBillSequenceSchema, parties, insertPartySchema, agents, insertAgentSchema, items, insertItemSchema, stock, insertStockSchema, sales, insertSaleSchema, saleItems, insertSaleItemSchema, purchases, insertPurchaseSchema, purchaseItems, insertPurchaseItemSchema, stockInwardItems, insertStockInwardItemSchema, sizeMaster, payments, insertPaymentSchema, billTemplates, insertBillTemplateSchema, billTemplatesAutoPrintSchema, printTokens, insertPrintTokenSchema, barcodeLabelTemplates, insertBarcodeLabelTemplateSchema, updateStockInwardItemSchema, partiesRelations, itemsRelations, salesRelations, saleItemsRelations, purchasesRelations, purchaseItemsRelations, stockInwardItemsRelations, paymentsRelations, stockRelations;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    sessions = pgTable(
      "sessions",
      {
        sid: varchar("sid").primaryKey(),
        sess: jsonb("sess").notNull(),
        expire: timestamp("expire").notNull()
      },
      (table) => [index("IDX_session_expire").on(table.expire)]
    );
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      username: varchar("username", { length: 100 }).unique(),
      passwordHash: varchar("password_hash", { length: 255 }),
      email: varchar("email").unique(),
      firstName: varchar("first_name"),
      lastName: varchar("last_name"),
      profileImageUrl: varchar("profile_image_url"),
      role: varchar("role", { length: 20 }).default("user").notNull(),
      // superadmin, admin, user
      pagePermissions: jsonb("page_permissions").default(sql`'[]'::jsonb`).notNull(),
      // Array of accessible page routes
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    companies = pgTable("companies", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 200 }).notNull(),
      address: text("address"),
      city: varchar("city", { length: 100 }),
      state: varchar("state", { length: 100 }),
      gstNo: varchar("gst_no", { length: 50 }),
      phone: varchar("phone", { length: 50 }),
      email: varchar("email", { length: 100 }),
      logoUrl: text("logo_url"),
      expiryDate: timestamp("expiry_date"),
      // Software license expiry date
      // Financial Year settings
      currentFinancialYearId: integer("current_financial_year_id"),
      // Active financial year
      fyStartMonth: integer("fy_start_month").default(4).notNull(),
      // Default April (4)
      fyStartDay: integer("fy_start_day").default(1).notNull(),
      // Default 1st
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull(),
      createdBy: varchar("created_by").references(() => users.id)
    });
    printSettings = pgTable("print_settings", {
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
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    insertCompanySchema = createInsertSchema(companies).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      createdBy: true
    }).extend({
      expiryDate: z.coerce.date().optional(),
      currentFinancialYearId: z.number().optional(),
      fyStartMonth: z.number().default(4).optional(),
      fyStartDay: z.number().default(1).optional()
    });
    userCompanies = pgTable("user_companies", {
      id: serial("id").primaryKey(),
      userId: varchar("user_id").references(() => users.id).notNull(),
      companyId: integer("company_id").references(() => companies.id).notNull(),
      isDefault: boolean("is_default").default(false).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    financialYears = pgTable("financial_years", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").references(() => companies.id).notNull(),
      label: varchar("label", { length: 20 }).notNull(),
      // e.g., "2024-25"
      startDate: date("start_date").notNull(),
      endDate: date("end_date").notNull(),
      isActive: boolean("is_active").default(false).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    insertFinancialYearSchema = createInsertSchema(financialYears).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    billSequences = pgTable("bill_sequences", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").references(() => companies.id).notNull(),
      financialYearId: integer("financial_year_id").references(() => financialYears.id).notNull(),
      billType: varchar("bill_type", { length: 20 }).notNull(),
      // B2B, B2C, ESTIMATE, CREDIT_NOTE, DEBIT_NOTE, PURCHASE
      nextNumber: integer("next_number").default(1).notNull(),
      prefix: varchar("prefix", { length: 20 }),
      // Optional custom prefix
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    insertBillSequenceSchema = createInsertSchema(billSequences).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    parties = pgTable("parties", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").references(() => companies.id).notNull(),
      code: varchar("code", { length: 50 }).notNull(),
      // Auto-generated numeric code per company
      shortName: varchar("short_name", { length: 50 }),
      // Short name for quick reference
      name: varchar("name", { length: 200 }).notNull(),
      address: text("address"),
      city: varchar("city", { length: 100 }).notNull(),
      // Mandatory
      pincode: varchar("pincode", { length: 10 }).notNull(),
      // Mandatory
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
      isShared: boolean("is_shared").default(false).notNull(),
      // If true, visible to all companies
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull(),
      createdBy: varchar("created_by").references(() => users.id)
    });
    insertPartySchema = createInsertSchema(parties).omit({
      id: true,
      companyId: true,
      code: true,
      // Auto-generated
      createdAt: true,
      updatedAt: true,
      createdBy: true
    });
    agents = pgTable("agents", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").references(() => companies.id).notNull(),
      code: integer("code").notNull(),
      // Auto-increment code per company
      name: varchar("name", { length: 200 }).notNull(),
      phone: varchar("phone", { length: 50 }),
      email: varchar("email", { length: 100 }),
      address: text("address"),
      city: varchar("city", { length: 100 }),
      commission: decimal("commission", { precision: 5, scale: 2 }).default("0").notNull(),
      // Commission percentage
      active: boolean("active").default(true).notNull(),
      isShared: boolean("is_shared").default(false).notNull(),
      // If true, visible to all companies
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull(),
      createdBy: varchar("created_by").references(() => users.id)
    });
    insertAgentSchema = createInsertSchema(agents).omit({
      id: true,
      companyId: true,
      code: true,
      createdAt: true,
      updatedAt: true,
      createdBy: true
    });
    items = pgTable("items", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").references(() => companies.id).notNull(),
      code: varchar("code", { length: 50 }).notNull(),
      // Auto-generated numeric code per company
      name: varchar("name", { length: 300 }).notNull(),
      hsnCode: varchar("hsn_code", { length: 50 }).notNull(),
      // Mandatory
      category: varchar("category", { length: 100 }),
      floor: varchar("floor", { length: 50 }),
      // Optional floor/location
      packType: varchar("pack_type", { length: 20 }).default("PCS").notNull(),
      // PCS, KG, LTR, MTR, BOX, PKT, SET, DZ, GM, ML
      type: varchar("type", { length: 10 }).default("P").notNull(),
      // P=piece, M=measured
      cost: decimal("cost", { precision: 12, scale: 2 }).default("0").notNull(),
      mrp: decimal("mrp", { precision: 12, scale: 2 }).default("0").notNull(),
      // MRP - rounded figure
      sellingPrice: decimal("selling_price", { precision: 12, scale: 2 }).default("0").notNull(),
      // Selling price - rounded figure
      tax: decimal("tax", { precision: 5, scale: 2 }).default("0").notNull(),
      // Total tax percentage (mandatory)
      cgst: decimal("cgst", { precision: 5, scale: 3 }).default("0").notNull(),
      // CGST rate (half of tax)
      sgst: decimal("sgst", { precision: 5, scale: 3 }).default("0").notNull(),
      // SGST rate (half of tax)
      active: boolean("active").default(true).notNull(),
      isShared: boolean("is_shared").default(false).notNull(),
      // If true, visible to all companies
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull(),
      createdBy: varchar("created_by").references(() => users.id)
    });
    insertItemSchema = createInsertSchema(items).omit({
      id: true,
      companyId: true,
      code: true,
      // Auto-generated
      createdAt: true,
      updatedAt: true,
      createdBy: true
    }).extend({
      mrp: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "MRP must be a valid number"),
      sellingPrice: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Selling Price must be a valid number")
    });
    stock = pgTable("stock", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").references(() => companies.id).notNull(),
      itemId: integer("item_id").references(() => items.id).notNull(),
      quantity: decimal("quantity", { precision: 12, scale: 3 }).default("0").notNull(),
      lastUpdated: timestamp("last_updated").defaultNow().notNull()
    });
    insertStockSchema = createInsertSchema(stock).omit({
      id: true,
      companyId: true,
      lastUpdated: true
    });
    sales = pgTable("sales", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").references(() => companies.id).notNull(),
      financialYearId: integer("financial_year_id").references(() => financialYears.id),
      // Financial year for this sale
      invoiceNo: integer("invoice_no").notNull(),
      invoiceCode: varchar("invoice_code", { length: 50 }),
      // Formatted invoice code e.g., B2B-2024-25-0001
      billType: varchar("bill_type", { length: 10 }).notNull(),
      // GST or EST
      saleType: varchar("sale_type", { length: 20 }).default("B2C").notNull(),
      // B2B, B2C, ESTIMATE, CREDIT_NOTE, DEBIT_NOTE
      paymentMode: varchar("payment_mode", { length: 10 }).default("CASH").notNull(),
      // CASH, CARD, CREDIT
      inclusiveTax: boolean("inclusive_tax").default(false).notNull(),
      // true=rate includes tax
      date: date("date").notNull(),
      time: varchar("time", { length: 10 }),
      partyId: integer("party_id").references(() => parties.id),
      partyName: varchar("party_name", { length: 200 }),
      partyCity: varchar("party_city", { length: 100 }),
      partyAddress: text("party_address"),
      partyGstNo: varchar("party_gst_no", { length: 50 }),
      gstType: integer("gst_type").default(0).notNull(),
      // 0=local (CGST+SGST), 1=inter-state (IGST)
      saleValue: decimal("sale_value", { precision: 12, scale: 2 }).default("0").notNull(),
      discountTotal: decimal("discount_total", { precision: 12, scale: 2 }).default("0").notNull(),
      // Total discount
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
      printOutstanding: boolean("print_outstanding").default(false).notNull(),
      // B2B: print outstanding on invoice
      partyOutstanding: decimal("party_outstanding", { precision: 12, scale: 2 }).default("0").notNull(),
      // Outstanding at time of sale
      mobile: varchar("mobile", { length: 20 }),
      // E-Invoice fields (India GST)
      einvoiceStatus: varchar("einvoice_status", { length: 20 }),
      // pending, generated, cancelled, failed
      irn: varchar("irn", { length: 100 }),
      // Invoice Reference Number from e-invoice portal
      ackNumber: varchar("ack_number", { length: 50 }),
      // Acknowledgement number
      ackDate: timestamp("ack_date"),
      // Acknowledgement date
      qrCode: text("qr_code"),
      // QR code data (base64 or raw text)
      signedInvoice: text("signed_invoice"),
      // Signed invoice JSON from portal
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull(),
      createdBy: varchar("created_by").references(() => users.id)
    });
    insertSaleSchema = createInsertSchema(sales).omit({
      id: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
      createdBy: true
    });
    saleItems = pgTable("sale_items", {
      id: serial("id").primaryKey(),
      saleId: integer("sale_id").references(() => sales.id).notNull(),
      itemId: integer("item_id").references(() => items.id),
      purchaseItemId: integer("purchase_item_id").references(() => purchaseItems.id),
      // Link to inventory for barcode scanned items
      stockInwardId: integer("stock_inward_id").references(() => stockInwardItems.id),
      // Track which barcode was sold
      itemCode: varchar("item_code", { length: 50 }),
      barcode: varchar("barcode", { length: 100 }),
      // Barcode if scanned from inventory
      itemName: varchar("item_name", { length: 300 }).notNull(),
      hsnCode: varchar("hsn_code", { length: 50 }),
      quality: varchar("quality", { length: 100 }),
      size: varchar("size", { length: 50 }),
      quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
      rate: decimal("rate", { precision: 12, scale: 2 }).notNull(),
      // Could be inclusive or exclusive rate
      mrp: decimal("mrp", { precision: 12, scale: 2 }).default("0").notNull(),
      // MRP from inventory
      discount: decimal("discount", { precision: 12, scale: 2 }).default("0").notNull(),
      // Discount amount per item
      discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0").notNull(),
      // Discount percentage
      amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
      // After discount
      saleValue: decimal("sale_value", { precision: 12, scale: 2 }).default("0").notNull(),
      taxValue: decimal("tax_value", { precision: 12, scale: 2 }).default("0").notNull(),
      tax: decimal("tax", { precision: 5, scale: 2 }).default("0").notNull(),
      cgst: decimal("cgst", { precision: 12, scale: 2 }).default("0").notNull(),
      sgst: decimal("sgst", { precision: 12, scale: 2 }).default("0").notNull(),
      cgstRate: decimal("cgst_rate", { precision: 5, scale: 3 }).default("0").notNull(),
      sgstRate: decimal("sgst_rate", { precision: 5, scale: 3 }).default("0").notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    insertSaleItemSchema = createInsertSchema(saleItems).omit({
      id: true,
      createdAt: true
    });
    purchases = pgTable("purchases", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").references(() => companies.id).notNull(),
      financialYearId: integer("financial_year_id").references(() => financialYears.id),
      // Financial year for this purchase
      purchaseNo: integer("purchase_no").notNull(),
      // Entry number for stock inward
      purchaseCode: varchar("purchase_code", { length: 50 }),
      // Formatted purchase code e.g., PUR-2024-25-0001
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
      profitPercent: decimal("profit_percent", { precision: 5, scale: 2 }).default("0").notNull(),
      // RST profit %
      rstPercent: decimal("rst_percent", { precision: 5, scale: 2 }).default("0").notNull(),
      // Additional % 
      surchargePercent: decimal("surcharge_percent", { precision: 5, scale: 2 }).default("0").notNull(),
      // SC %
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
      status: varchar("status", { length: 20 }).default("pending").notNull(),
      // pending, completed
      stockInwardCompleted: boolean("stock_inward_completed").default(false).notNull(),
      details: text("details"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull(),
      createdBy: varchar("created_by").references(() => users.id)
    });
    insertPurchaseSchema = createInsertSchema(purchases).omit({
      id: true,
      companyId: true,
      purchaseNo: true,
      // Auto-generated
      status: true,
      // Set by system
      stockInwardCompleted: true,
      // Set by system
      createdAt: true,
      updatedAt: true,
      createdBy: true
    }).extend({
      beforeTaxAmount: z.string().or(z.number()).optional(),
      billTotalAmount: z.string().or(z.number()).optional()
    });
    purchaseItems = pgTable("purchase_items", {
      id: serial("id").primaryKey(),
      purchaseId: integer("purchase_id").references(() => purchases.id).notNull(),
      itemId: integer("item_id").references(() => items.id),
      serial: integer("serial").notNull(),
      itname: varchar("itname", { length: 300 }).notNull(),
      brandname: varchar("brandname", { length: 200 }),
      name: varchar("name", { length: 200 }),
      // Quality/Size description
      // Cost breakdown (from BARIDNX)
      cost: decimal("cost", { precision: 12, scale: 2 }).notNull(),
      // Bill cost
      qty: decimal("qty", { precision: 12, scale: 2 }).notNull(),
      // Total qty for this entry
      pcs: decimal("pcs", { precision: 12, scale: 2 }).default("0").notNull(),
      // Pieces (for measured items)
      // Rate differences and discounts
      rd: decimal("rd", { precision: 12, scale: 2 }).default("0").notNull(),
      // Rate difference 1
      dis: decimal("dis", { precision: 5, scale: 2 }).default("0").notNull(),
      // Discount % 1
      rd1: decimal("rd1", { precision: 12, scale: 2 }).default("0").notNull(),
      // Rate difference 2
      dis1: decimal("dis1", { precision: 5, scale: 2 }).default("0").notNull(),
      // Discount % 2
      ag: decimal("ag", { precision: 5, scale: 2 }).default("0").notNull(),
      // Agent %
      addc: decimal("addc", { precision: 12, scale: 2 }).default("0").notNull(),
      // Additional cost
      // Calculated costs
      ncost: decimal("ncost", { precision: 12, scale: 2 }).default("0").notNull(),
      // Net cost after discounts
      lcost: decimal("lcost", { precision: 12, scale: 2 }).default("0").notNull(),
      // Landing cost
      netcost: decimal("netcost", { precision: 12, scale: 2 }).default("0").notNull(),
      // Final net cost
      // Tax and pricing
      tax: decimal("tax", { precision: 5, scale: 2 }).default("0").notNull(),
      prft: decimal("prft", { precision: 5, scale: 2 }).default("0").notNull(),
      // Profit %
      rrate: decimal("rrate", { precision: 12, scale: 2 }).default("0").notNull(),
      // Retail rate (MRP)
      mrp: decimal("mrp", { precision: 12, scale: 2 }).default("0").notNull(),
      // MRP
      // Legacy fields for compatibility
      arate: decimal("arate", { precision: 12, scale: 2 }).default("0").notNull(),
      brate: decimal("brate", { precision: 12, scale: 2 }).default("0").notNull(),
      profit: decimal("profit", { precision: 12, scale: 2 }).default("0").notNull(),
      prper: decimal("prper", { precision: 5, scale: 2 }).default("0").notNull(),
      // Product details
      quality: varchar("quality", { length: 100 }),
      // TAG field
      dno1: varchar("dno1", { length: 50 }),
      // Design number
      pattern: varchar("pattern", { length: 100 }),
      sleeve: varchar("sleeve", { length: 100 }),
      // Color
      sl: varchar("sl", { length: 50 }),
      // Short code
      // Size details
      size1: varchar("size1", { length: 10 }),
      // Starting size
      size2: varchar("size2", { length: 10 }),
      // Ending size
      jc: varchar("jc", { length: 1 }).default("J"),
      // J=Jump, C=Continuous, M=Manual
      fv: varchar("fv", { length: 1 }).default("F"),
      // F=Fixed, V=Variable
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
      dqty: decimal("dqty", { precision: 12, scale: 2 }).default("0").notNull(),
      // Damaged qty
      saleqty: decimal("saleqty", { precision: 12, scale: 2 }).default("0").notNull(),
      stockqty: decimal("stockqty", { precision: 12, scale: 2 }).default("0").notNull(),
      barcodeGenerated: boolean("barcode_generated").default(false).notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    insertPurchaseItemSchema = createInsertSchema(purchaseItems).omit({
      id: true,
      createdAt: true
    });
    stockInwardItems = pgTable("stock_inward_items", {
      id: serial("id").primaryKey(),
      purchaseItemId: integer("purchase_item_id").references(() => purchaseItems.id).notNull(),
      purchaseId: integer("purchase_id").references(() => purchases.id).notNull(),
      companyId: integer("company_id").references(() => companies.id).notNull(),
      itemId: integer("item_id").references(() => items.id),
      // Unique identification
      serial: integer("serial").notNull(),
      // Global serial number
      barcode: varchar("barcode", { length: 100 }).notNull(),
      // Unique barcode per unit
      // Product info (copied from purchaseItems for quick lookup)
      itname: varchar("itname", { length: 300 }).notNull(),
      brandname: varchar("brandname", { length: 200 }),
      quality: varchar("quality", { length: 100 }),
      // TAG
      dno1: varchar("dno1", { length: 50 }),
      // Design number
      pattern: varchar("pattern", { length: 100 }),
      sleeve: varchar("sleeve", { length: 100 }),
      // Color
      // Size for this specific unit
      size: varchar("size", { length: 10 }),
      sizeCode: integer("size_code"),
      // Numeric code (45, 47, 49, etc.)
      // Pricing for this unit
      cost: decimal("cost", { precision: 12, scale: 2 }).notNull(),
      ncost: decimal("ncost", { precision: 12, scale: 2 }).notNull(),
      // Net cost
      lcost: decimal("lcost", { precision: 12, scale: 2 }).notNull(),
      // Landing cost
      rate: decimal("rate", { precision: 12, scale: 2 }).notNull(),
      // Sale rate
      mrp: decimal("mrp", { precision: 12, scale: 2 }).notNull(),
      // MRP
      tax: decimal("tax", { precision: 5, scale: 2 }).default("0").notNull(),
      // Quantity for this barcode (for bulk barcodes this can be > 1)
      qty: decimal("qty", { precision: 12, scale: 2 }).default("1").notNull(),
      // Stock status
      status: varchar("status", { length: 20 }).default("available").notNull(),
      // available, sold, returned, damaged
      soldAt: timestamp("sold_at"),
      saleId: integer("sale_id").references(() => sales.id),
      saleItemId: integer("sale_item_id").references(() => saleItems.id),
      expdate: date("expdate"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    }, (table) => [
      index("idx_stock_inward_barcode").on(table.barcode),
      index("idx_stock_inward_status").on(table.status),
      index("idx_stock_inward_company").on(table.companyId)
    ]);
    insertStockInwardItemSchema = createInsertSchema(stockInwardItems).omit({
      id: true,
      createdAt: true
    });
    sizeMaster = pgTable("size_master", {
      id: serial("id").primaryKey(),
      code: varchar("code", { length: 10 }).notNull().unique(),
      // F, S, M, L, XL, 2L, 3L, etc.
      numericCode: integer("numeric_code").notNull(),
      // 45, 47, 49, 51, 53, 55, 57, etc.
      description: varchar("description", { length: 50 }),
      sortOrder: integer("sort_order").default(0).notNull()
    });
    payments = pgTable("payments", {
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
      createdBy: varchar("created_by").references(() => users.id)
    });
    insertPaymentSchema = createInsertSchema(payments).omit({
      id: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
      createdBy: true
    });
    billTemplates = pgTable("bill_templates", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").references(() => companies.id).notNull(),
      name: varchar("name", { length: 100 }).notNull(),
      formatType: varchar("format_type", { length: 20 }).default("A4").notNull(),
      // A4, B4, thermal_3inch, thermal_4inch
      assignedTo: varchar("assigned_to", { length: 20 }),
      // b2b, b2c, estimate - null means not assigned
      logoUrl: text("logo_url"),
      // Company logo URL from object storage
      headerText: text("header_text"),
      // Company branding text at top
      footerText: text("footer_text"),
      // Footer notes
      showTaxBreakup: boolean("show_tax_breakup").default(true).notNull(),
      showHsnCode: boolean("show_hsn_code").default(true).notNull(),
      showItemCode: boolean("show_item_code").default(true).notNull(),
      showOutstandingDefault: boolean("show_outstanding_default").default(true).notNull(),
      // B2B: default setting to print outstanding
      showCashReturn: boolean("show_cash_return").default(true).notNull(),
      // B2C: show cash given/return on invoice
      showPartyBalance: boolean("show_party_balance").default(false).notNull(),
      // Show party outstanding balance
      showBankDetails: boolean("show_bank_details").default(false).notNull(),
      // Show company bank details
      enableTamilPrint: boolean("enable_tamil_print").default(false).notNull(),
      // Enable Tamil language labels on invoice
      bankDetails: text("bank_details"),
      // Bank account details for payment
      termsAndConditions: text("terms_and_conditions"),
      // Terms and conditions text
      paperSize: varchar("paper_size", { length: 20 }).default("A4").notNull(),
      // A4, B4, 3inch, 4inch
      fontSize: integer("font_size").default(10).notNull(),
      isDefault: boolean("is_default").default(false).notNull(),
      autoPrintThisTemplate: boolean("auto_print_this_template").default(false).notNull(),
      // Quick print - auto print when saved
      directPrintThisTemplate: boolean("direct_print_this_template").default(false).notNull(),
      // Quick print - skip preview, print directly
      printCopiesThisTemplate: integer("print_copies_this_template").default(1).notNull(),
      // Quick print - number of copies for this template
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull(),
      createdBy: varchar("created_by").references(() => users.id)
    });
    insertBillTemplateSchema = createInsertSchema(billTemplates).omit({
      id: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
      createdBy: true
    });
    billTemplatesAutoPrintSchema = createInsertSchema(billTemplates).pick({
      autoPrintThisTemplate: true,
      directPrintThisTemplate: true
    });
    printTokens = pgTable("print_tokens", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").references(() => companies.id).notNull(),
      token: varchar("token", { length: 255 }).notNull().unique(),
      // Unique token for authentication
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    insertPrintTokenSchema = createInsertSchema(printTokens).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    barcodeLabelTemplates = pgTable("barcode_label_templates", {
      id: serial("id").primaryKey(),
      companyId: integer("company_id").references(() => companies.id).notNull(),
      name: varchar("name", { length: 100 }).notNull(),
      // Label dimensions in mm
      labelWidth: decimal("label_width", { precision: 6, scale: 2 }).default("50").notNull(),
      labelHeight: decimal("label_height", { precision: 6, scale: 2 }).default("25").notNull(),
      // Layout configuration stored as JSON
      config: text("config").notNull(),
      // JSON: { elements: [{ type, x, y, width, height, fontSize, field }] }
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
      createdBy: varchar("created_by").references(() => users.id)
    });
    insertBarcodeLabelTemplateSchema = createInsertSchema(barcodeLabelTemplates).omit({
      id: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
      createdBy: true
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
      name: z.string()
    });
    updateStockInwardItemSchema = z.object({
      rate: z.string().optional(),
      mrp: z.string().optional(),
      size: z.string().optional(),
      sizeCode: z.number().optional()
    });
    partiesRelations = relations(parties, ({ many }) => ({
      sales: many(sales),
      purchases: many(purchases),
      payments: many(payments)
    }));
    itemsRelations = relations(items, ({ many, one }) => ({
      stock: one(stock, {
        fields: [items.id],
        references: [stock.itemId]
      }),
      saleItems: many(saleItems)
    }));
    salesRelations = relations(sales, ({ one, many }) => ({
      party: one(parties, {
        fields: [sales.partyId],
        references: [parties.id]
      }),
      items: many(saleItems)
    }));
    saleItemsRelations = relations(saleItems, ({ one }) => ({
      sale: one(sales, {
        fields: [saleItems.saleId],
        references: [sales.id]
      }),
      item: one(items, {
        fields: [saleItems.itemId],
        references: [items.id]
      })
    }));
    purchasesRelations = relations(purchases, ({ one, many }) => ({
      party: one(parties, {
        fields: [purchases.partyId],
        references: [parties.id]
      }),
      items: many(purchaseItems)
    }));
    purchaseItemsRelations = relations(purchaseItems, ({ one, many }) => ({
      purchase: one(purchases, {
        fields: [purchaseItems.purchaseId],
        references: [purchases.id]
      }),
      item: one(items, {
        fields: [purchaseItems.itemId],
        references: [items.id]
      }),
      stockInwardItems: many(stockInwardItems)
    }));
    stockInwardItemsRelations = relations(stockInwardItems, ({ one }) => ({
      purchaseItem: one(purchaseItems, {
        fields: [stockInwardItems.purchaseItemId],
        references: [purchaseItems.id]
      }),
      purchase: one(purchases, {
        fields: [stockInwardItems.purchaseId],
        references: [purchases.id]
      }),
      item: one(items, {
        fields: [stockInwardItems.itemId],
        references: [items.id]
      }),
      sale: one(sales, {
        fields: [stockInwardItems.saleId],
        references: [sales.id]
      })
    }));
    paymentsRelations = relations(payments, ({ one }) => ({
      party: one(parties, {
        fields: [payments.partyId],
        references: [parties.id]
      })
    }));
    stockRelations = relations(stock, ({ one }) => ({
      item: one(items, {
        fields: [stock.itemId],
        references: [items.id]
      })
    }));
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  pool: () => pool,
  runMigrations: () => runMigrations
});
import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
async function runMigrations() {
  try {
    const fs2 = await import("node:fs");
    const path2 = await import("node:path");
    const migrationsPath = path2.resolve(process.cwd(), "./migrations");
    const migrationsFolderExists = fs2.existsSync(migrationsPath);
    if (!migrationsFolderExists) {
      console.log("\u{1F4DD} No migrations folder found - database schema will be created on first use");
      try {
        await db.execute("SELECT 1");
        console.log("\u2705 Database connection verified");
      } catch (dbError) {
        console.error("\u274C Database connection failed:", dbError);
        throw dbError;
      }
      return;
    }
    console.log("\u{1F504} Running database migrations...");
    await migrate(db, { migrationsFolder: "./migrations" });
    console.log("\u2705 Migrations completed successfully");
  } catch (error) {
    console.error("\u26A0\uFE0F  Migration warning:", error.message);
    console.log("\u2705 Continuing startup - schema will be created as needed");
  }
}
var Pool, pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?"
      );
    }
    ({ Pool } = pg);
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      idleTimeoutMillis: 3e4,
      connectionTimeoutMillis: 5e3,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
    });
    pool.on("error", (err) => {
      console.error("Unexpected error on idle client", err);
    });
    db = drizzle({ client: pool, schema: schema_exports });
  }
});

// server/index-prod.ts
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import express2 from "express";

// server/app.ts
import express from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// server/storage.ts
init_schema();
init_db();
import { eq, and, desc, gte, lte, lt, sql as sql2, or, isNotNull, ne } from "drizzle-orm";
var DatabaseStorage = class {
  // ==================== USER OPERATIONS ====================
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const existingUser = await db.select().from(users).where(eq(users.id, userData.id)).limit(1);
    if (existingUser.length > 0) {
      const [updated] = await db.update(users).set({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        // Preserve existing role
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(users.id, userData.id)).returning();
      return updated;
    } else {
      const [newUser] = await db.insert(users).values(userData).returning();
      return newUser;
    }
  }
  async getAllUsers() {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  async updateUserRole(id, role) {
    const [updated] = await db.update(users).set({ role, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return updated;
  }
  async updateUserPermissions(id, role, pagePermissions) {
    const [updated] = await db.update(users).set({
      role,
      pagePermissions: pagePermissions || [],
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id)).returning();
    return updated;
  }
  async updateUserPassword(id, passwordHash) {
    const [updated] = await db.update(users).set({
      passwordHash,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id)).returning();
    return updated;
  }
  async deleteUser(id) {
    await db.delete(users).where(eq(users.id, id));
  }
  async getUserByUsername(username) {
    const results = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return results[0];
  }
  async createUser(user) {
    console.log("[STORAGE] createUser called with:", {
      username: user.username,
      role: user.role,
      firstName: user.firstName
    });
    const results = await db.insert(users).values({
      username: user.username,
      passwordHash: user.passwordHash,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role || "user",
      // Ensure role is explicitly set
      pagePermissions: user.pagePermissions || []
    }).returning();
    console.log("[STORAGE] createUser result:", {
      id: results[0]?.id,
      username: results[0]?.username,
      role: results[0]?.role
    });
    return results[0];
  }
  async updateUser(id, user) {
    const results = await db.update(users).set({ ...user, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return results[0];
  }
  async needsInitialSetup() {
    try {
      const superadminUsers = await db.select({ id: users.id }).from(users).where(
        and(
          eq(users.role, "superadmin"),
          isNotNull(users.passwordHash)
        )
      ).limit(1);
      return superadminUsers.length === 0;
    } catch (error) {
      console.error("Error checking setup status:", error);
      return true;
    }
  }
  async getUserCompanies(userId) {
    const results = await db.select({
      id: userCompanies.id,
      userId: userCompanies.userId,
      companyId: userCompanies.companyId,
      isDefault: userCompanies.isDefault,
      company: companies
    }).from(userCompanies).innerJoin(companies, eq(userCompanies.companyId, companies.id)).where(eq(userCompanies.userId, userId)).orderBy(desc(userCompanies.isDefault));
    return results;
  }
  async assignUserToDefaultCompany(userId) {
    let existingCompanies = await db.select().from(companies).limit(1);
    let companyId;
    if (existingCompanies.length === 0) {
      const newCompany = await db.insert(companies).values({
        name: "Default Company",
        address: "Default Address",
        city: "Default City",
        state: "Default State",
        gstNo: "DEFAULT-GST",
        createdBy: userId
      }).returning();
      companyId = newCompany[0].id;
    } else {
      companyId = existingCompanies[0].id;
    }
    const existing = await db.select().from(userCompanies).where(and(eq(userCompanies.userId, userId), eq(userCompanies.companyId, companyId))).limit(1);
    if (existing.length === 0) {
      await db.insert(userCompanies).values({
        userId,
        companyId,
        isDefault: true
      });
    }
  }
  async assignUserToCompany(userId, companyId, isDefault = false) {
    const existing = await db.select().from(userCompanies).where(and(eq(userCompanies.userId, userId), eq(userCompanies.companyId, companyId))).limit(1);
    if (existing.length > 0) {
      if (isDefault) {
        await db.update(userCompanies).set({ isDefault: false }).where(eq(userCompanies.userId, userId));
        await db.update(userCompanies).set({ isDefault: true }).where(and(eq(userCompanies.userId, userId), eq(userCompanies.companyId, companyId)));
      }
      return;
    }
    if (isDefault) {
      await db.update(userCompanies).set({ isDefault: false }).where(eq(userCompanies.userId, userId));
    }
    await db.insert(userCompanies).values({
      userId,
      companyId,
      isDefault
    });
  }
  async removeUserFromCompany(userId, companyId) {
    await db.delete(userCompanies).where(and(eq(userCompanies.userId, userId), eq(userCompanies.companyId, companyId)));
  }
  // ==================== COMPANY OPERATIONS ====================
  async getCompanies() {
    return await db.select().from(companies).orderBy(desc(companies.createdAt));
  }
  async getCompany(id) {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }
  async createCompany(company, userId) {
    const [newCompany] = await db.insert(companies).values({ ...company, createdBy: userId }).returning();
    await db.insert(userCompanies).values({
      userId,
      companyId: newCompany.id,
      isDefault: false
    });
    return newCompany;
  }
  async updateCompany(id, company) {
    const [updated] = await db.update(companies).set({ ...company, updatedAt: /* @__PURE__ */ new Date() }).where(eq(companies.id, id)).returning();
    return updated;
  }
  async deleteCompany(id) {
    await db.delete(userCompanies).where(eq(userCompanies.companyId, id));
    await db.delete(companies).where(eq(companies.id, id));
  }
  // ==================== FINANCIAL YEAR OPERATIONS ====================
  async getFinancialYears(companyId) {
    return await db.select().from(financialYears).where(eq(financialYears.companyId, companyId)).orderBy(desc(financialYears.startDate));
  }
  async getFinancialYear(id, companyId) {
    const [fy] = await db.select().from(financialYears).where(and(eq(financialYears.id, id), eq(financialYears.companyId, companyId)));
    return fy;
  }
  async getActiveFinancialYear(companyId) {
    const [fy] = await db.select().from(financialYears).where(and(eq(financialYears.companyId, companyId), eq(financialYears.isActive, true)));
    return fy;
  }
  async createFinancialYear(data) {
    const existingFYs = await this.getFinancialYears(data.companyId);
    const shouldBeActive = existingFYs.length === 0 || data.isActive;
    if (shouldBeActive) {
      await db.update(financialYears).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(financialYears.companyId, data.companyId));
    }
    const [newFY] = await db.insert(financialYears).values({ ...data, isActive: shouldBeActive }).returning();
    if (shouldBeActive) {
      await db.update(companies).set({ currentFinancialYearId: newFY.id, updatedAt: /* @__PURE__ */ new Date() }).where(eq(companies.id, data.companyId));
    }
    const billTypes = ["B2B", "B2C", "ESTIMATE", "CREDIT_NOTE", "DEBIT_NOTE", "PURCHASE"];
    for (const billType of billTypes) {
      await db.insert(billSequences).values({
        companyId: data.companyId,
        financialYearId: newFY.id,
        billType,
        nextNumber: 1
      });
    }
    return newFY;
  }
  async updateFinancialYear(id, data, companyId) {
    if (data.isActive === true) {
      const { isActive, ...otherData } = data;
      if (Object.keys(otherData).length > 0) {
        await db.update(financialYears).set({ ...otherData, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(financialYears.id, id), eq(financialYears.companyId, companyId)));
      }
      return await this.setActiveFinancialYear(id, companyId);
    }
    const [updated] = await db.update(financialYears).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(financialYears.id, id), eq(financialYears.companyId, companyId))).returning();
    return updated;
  }
  async setActiveFinancialYear(id, companyId) {
    await db.update(financialYears).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(financialYears.companyId, companyId));
    const [activated] = await db.update(financialYears).set({ isActive: true, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(financialYears.id, id), eq(financialYears.companyId, companyId))).returning();
    await db.update(companies).set({ currentFinancialYearId: id, updatedAt: /* @__PURE__ */ new Date() }).where(eq(companies.id, companyId));
    return activated;
  }
  async deleteFinancialYear(id, companyId) {
    const fy = await this.getFinancialYear(id, companyId);
    if (!fy) {
      throw new Error("Financial year not found");
    }
    if (fy.isActive) {
      throw new Error("Cannot delete the active financial year. Please activate another FY first.");
    }
    await db.delete(billSequences).where(and(
      eq(billSequences.financialYearId, id),
      eq(billSequences.companyId, companyId)
    ));
    await db.delete(financialYears).where(and(eq(financialYears.id, id), eq(financialYears.companyId, companyId)));
  }
  async getNextBillNumber(companyId, financialYearId, billType) {
    let [sequence] = await db.select().from(billSequences).where(and(
      eq(billSequences.companyId, companyId),
      eq(billSequences.financialYearId, financialYearId),
      eq(billSequences.billType, billType)
    ));
    if (!sequence) {
      [sequence] = await db.insert(billSequences).values({
        companyId,
        financialYearId,
        billType,
        nextNumber: 1
      }).returning();
    }
    const currentNumber = sequence.nextNumber;
    await db.update(billSequences).set({ nextNumber: currentNumber + 1, updatedAt: /* @__PURE__ */ new Date() }).where(eq(billSequences.id, sequence.id));
    const fy = await this.getFinancialYear(financialYearId, companyId);
    const fyLabel = fy?.label || "";
    const prefix = sequence.prefix || billType;
    const code = `${prefix}-${fyLabel}-${String(currentNumber).padStart(4, "0")}`;
    return { number: currentNumber, code };
  }
  // ==================== PARTY OPERATIONS ====================
  async getParties(companyId) {
    return await db.select().from(parties).where(or(eq(parties.companyId, companyId), eq(parties.isShared, true))).orderBy(desc(parties.createdAt));
  }
  async getParty(id, companyId) {
    const [party] = await db.select().from(parties).where(and(eq(parties.id, id), or(eq(parties.companyId, companyId), eq(parties.isShared, true))));
    return party;
  }
  async getPartyByCode(code, companyId) {
    const [party] = await db.select().from(parties).where(and(eq(parties.code, code), eq(parties.companyId, companyId)));
    return party;
  }
  async getNextPartyCode(companyId) {
    const [result] = await db.select({ maxCode: sql2`COALESCE(MAX(CAST(${parties.code} AS INTEGER)), 0)` }).from(parties).where(eq(parties.companyId, companyId));
    return String((result?.maxCode || 0) + 1);
  }
  async createParty(party, userId, companyId) {
    const code = await this.getNextPartyCode(companyId);
    const [newParty] = await db.insert(parties).values({ ...party, code, createdBy: userId, companyId }).returning();
    return newParty;
  }
  async updateParty(id, party, companyId) {
    const [updated] = await db.update(parties).set({ ...party, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(parties.id, id), eq(parties.companyId, companyId))).returning();
    return updated;
  }
  // ==================== ITEM OPERATIONS ====================
  async getItems(companyId) {
    return await db.select().from(items).where(or(eq(items.companyId, companyId), eq(items.isShared, true))).orderBy(desc(items.createdAt));
  }
  async getItem(id, companyId) {
    const [item] = await db.select().from(items).where(and(eq(items.id, id), or(eq(items.companyId, companyId), eq(items.isShared, true))));
    return item;
  }
  async getItemByCode(code, companyId) {
    const [item] = await db.select().from(items).where(and(eq(items.code, code), eq(items.companyId, companyId)));
    return item;
  }
  async getNextItemCode(companyId) {
    const [result] = await db.select({ maxCode: sql2`COALESCE(MAX(CAST(${items.code} AS INTEGER)), 0)` }).from(items).where(eq(items.companyId, companyId));
    return String((result?.maxCode || 0) + 1);
  }
  async createItem(item, userId, companyId) {
    const code = await this.getNextItemCode(companyId);
    const tax = parseFloat(item.tax?.toString() || "0");
    const cgst = tax / 2;
    const sgst = tax / 2;
    const [newItem] = await db.insert(items).values({
      ...item,
      code,
      cgst: cgst.toString(),
      sgst: sgst.toString(),
      createdBy: userId,
      companyId
    }).returning();
    await db.insert(stock).values({
      itemId: newItem.id,
      quantity: "0",
      companyId
    });
    return newItem;
  }
  async updateItem(id, item, companyId) {
    const tax = parseFloat(item.tax?.toString() || "0");
    const cgst = tax / 2;
    const sgst = tax / 2;
    const [updated] = await db.update(items).set({
      ...item,
      cgst: cgst.toString(),
      sgst: sgst.toString(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and(eq(items.id, id), eq(items.companyId, companyId))).returning();
    return updated;
  }
  async updateItemRates(id, sellingPrice, mrp, companyId) {
    await db.update(items).set({ sellingPrice, mrp, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(items.id, id), eq(items.companyId, companyId)));
  }
  // ==================== SALES OPERATIONS ====================
  async getSales(companyId) {
    return await db.select().from(sales).where(eq(sales.companyId, companyId)).orderBy(desc(sales.date), desc(sales.id));
  }
  async getSale(id, companyId) {
    const [sale] = await db.select().from(sales).where(and(eq(sales.id, id), eq(sales.companyId, companyId)));
    return sale;
  }
  async getSaleItems(saleId, companyId) {
    const sale = await this.getSale(saleId, companyId);
    if (!sale) {
      return [];
    }
    const items2 = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));
    return items2;
  }
  async getNextInvoiceNumber(saleType, companyId) {
    const result = await db.select({ maxNo: sql2`COALESCE(MAX(${sales.invoiceNo}), 0)` }).from(sales).where(and(eq(sales.saleType, saleType), eq(sales.companyId, companyId)));
    return (result[0]?.maxNo || 0) + 1;
  }
  async createSale(saleData, saleItemsData, userId, companyId) {
    const invoiceNo = await this.getNextInvoiceNumber(saleData.saleType, companyId);
    const activeFY = await this.getActiveFinancialYear(companyId);
    if (!activeFY) {
      throw new Error("No active Financial Year set for this company");
    }
    const { code: invoiceCode } = await this.getNextBillNumber(companyId, activeFY.id, saleData.billType || "B2C");
    for (const item of saleItemsData) {
      if (item.itemId) {
        const dbItem = await this.getItem(item.itemId, companyId);
        if (!dbItem) {
          throw new Error(`Item ${item.itemId} not found or does not belong to this company`);
        }
      }
    }
    const [newSale] = await db.insert(sales).values({
      ...saleData,
      invoiceNo,
      invoiceCode,
      financialYearId: activeFY.id,
      time: (/* @__PURE__ */ new Date()).toTimeString().substring(0, 8),
      createdBy: userId,
      companyId
    }).returning();
    for (const item of saleItemsData) {
      const saleItem = await db.insert(saleItems).values({
        ...item,
        saleId: newSale.id
      }).returning();
      if (item.stockInwardId) {
        const [barcode] = await db.select().from(stockInwardItems).where(eq(stockInwardItems.id, item.stockInwardId));
        if (barcode) {
          const currentQty = parseFloat(barcode.qty?.toString() || "1");
          const soldQty = parseFloat(item.quantity.toString());
          const remainingQty = currentQty - soldQty;
          if (remainingQty > 0) {
            await db.update(stockInwardItems).set({ qty: remainingQty.toString(), saleId: newSale.id, soldAt: /* @__PURE__ */ new Date() }).where(eq(stockInwardItems.id, item.stockInwardId));
          } else {
            await db.update(stockInwardItems).set({ status: "sold", qty: "0", saleId: newSale.id, soldAt: /* @__PURE__ */ new Date() }).where(eq(stockInwardItems.id, item.stockInwardId));
          }
        }
      }
      if (item.itemId) {
        await this.updateStock(item.itemId, -parseFloat(item.quantity.toString()), companyId);
      }
    }
    return newSale;
  }
  async updateSale(id, saleData, saleItemsData, companyId) {
    const existingSale = await this.getSale(id, companyId);
    if (!existingSale) {
      throw new Error("Sale not found");
    }
    const existingItems = await this.getSaleItems(id, companyId);
    for (const item of saleItemsData) {
      if (item.itemId) {
        const dbItem = await this.getItem(item.itemId, companyId);
        if (!dbItem) {
          throw new Error(`Item ${item.itemId} not found or does not belong to this company`);
        }
      }
    }
    for (const item of existingItems) {
      if (item.stockInwardId) {
        const [barcode] = await db.select().from(stockInwardItems).where(eq(stockInwardItems.id, item.stockInwardId));
        if (barcode) {
          const currentQty = parseFloat(barcode.qty?.toString() || "0");
          const itemQty = parseFloat(item.quantity.toString());
          const restoredQty = currentQty + itemQty;
          await db.update(stockInwardItems).set({ qty: restoredQty.toString(), status: "available" }).where(eq(stockInwardItems.id, item.stockInwardId));
        }
      }
      if (item.itemId) {
        await this.updateStock(item.itemId, parseFloat(item.quantity.toString()), companyId);
      }
    }
    await db.delete(saleItems).where(eq(saleItems.saleId, id));
    const mergedSaleData = {
      billType: saleData.billType ?? existingSale.billType,
      saleType: saleData.saleType ?? existingSale.saleType,
      date: saleData.date ?? existingSale.date,
      partyId: saleData.partyId !== void 0 ? saleData.partyId : existingSale.partyId,
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
      byCard: saleData.byCard ?? existingSale.byCard
    };
    const [updatedSale] = await db.update(sales).set({
      ...mergedSaleData,
      invoiceNo: existingSale.invoiceNo
    }).where(and(eq(sales.id, id), eq(sales.companyId, companyId))).returning();
    for (const item of saleItemsData) {
      await db.insert(saleItems).values({
        ...item,
        saleId: id
      });
      if (item.stockInwardId) {
        const [barcode] = await db.select().from(stockInwardItems).where(eq(stockInwardItems.id, item.stockInwardId));
        if (barcode) {
          const currentQty = parseFloat(barcode.qty?.toString() || "1");
          const soldQty = parseFloat(item.quantity.toString());
          const remainingQty = currentQty - soldQty;
          if (remainingQty > 0) {
            await db.update(stockInwardItems).set({ qty: remainingQty.toString(), saleId: id, soldAt: /* @__PURE__ */ new Date() }).where(eq(stockInwardItems.id, item.stockInwardId));
          } else {
            await db.update(stockInwardItems).set({ status: "sold", qty: "0", saleId: id, soldAt: /* @__PURE__ */ new Date() }).where(eq(stockInwardItems.id, item.stockInwardId));
          }
        }
      }
      if (item.itemId) {
        await this.updateStock(item.itemId, -parseFloat(item.quantity.toString()), companyId);
      }
    }
    return updatedSale;
  }
  async updateSaleEinvoice(id, companyId, einvoiceData) {
    const existingSale = await this.getSale(id, companyId);
    if (!existingSale) {
      throw new Error("Sale not found");
    }
    const [updatedSale] = await db.update(sales).set({
      irn: einvoiceData.irn,
      ackNumber: einvoiceData.ackNumber,
      ackDate: einvoiceData.ackDate,
      qrCode: einvoiceData.qrCode,
      einvoiceStatus: einvoiceData.einvoiceStatus,
      signedInvoice: einvoiceData.signedInvoice,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and(eq(sales.id, id), eq(sales.companyId, companyId))).returning();
    return updatedSale;
  }
  // ==================== PURCHASE OPERATIONS ====================
  async getPurchases(companyId) {
    const allPurchases = await db.select().from(purchases).where(eq(purchases.companyId, companyId)).orderBy(desc(purchases.date), desc(purchases.id));
    const purchasesWithTallyStatus = await Promise.all(
      allPurchases.map(async (purchase) => {
        const items2 = await db.select().from(purchaseItems).where(eq(purchaseItems.purchaseId, purchase.id));
        const itemTotalQty = items2.reduce((sum, item) => sum + parseFloat(item.qty.toString()), 0);
        const itemTotalAmount = items2.reduce((sum, item) => {
          const cost = parseFloat(item.cost.toString());
          const qty = parseFloat(item.qty.toString());
          const tax = parseFloat((item.tax || 0).toString());
          return sum + cost * qty + cost * qty * tax / 100;
        }, 0);
        const purchaseTotalQty = parseFloat(purchase.totalQty.toString());
        const purchaseTotalAmount = parseFloat(purchase.amount.toString());
        const qtyMatch = Math.abs(itemTotalQty - purchaseTotalQty) < 0.01;
        const amountMatch = Math.abs(itemTotalAmount - purchaseTotalAmount) < 0.01;
        const isTallied = qtyMatch && amountMatch;
        return {
          id: purchase.id,
          companyId: purchase.companyId,
          purchaseNo: purchase.purchaseNo,
          date: purchase.date,
          invoiceNo: purchase.invoiceNo,
          partyId: purchase.partyId,
          partyName: purchase.partyName,
          city: purchase.city,
          state: purchase.state,
          gstNo: purchase.gstNo,
          phone: purchase.phone,
          address: purchase.address,
          totalQty: purchase.totalQty,
          amount: purchase.amount,
          beforeTaxAmount: purchase.beforeTaxAmount,
          billTotalAmount: purchase.billTotalAmount,
          cgst: purchase.cgst,
          sgst: purchase.sgst,
          igst: purchase.igst,
          cess: purchase.cess,
          gstType: purchase.gstType,
          val0: purchase.val0,
          val5: purchase.val5,
          val12: purchase.val12,
          val18: purchase.val18,
          val28: purchase.val28,
          ctax0: purchase.ctax0,
          ctax5: purchase.ctax5,
          ctax12: purchase.ctax12,
          ctax18: purchase.ctax18,
          ctax28: purchase.ctax28,
          stax0: purchase.stax0,
          stax5: purchase.stax5,
          stax12: purchase.stax12,
          stax18: purchase.stax18,
          stax28: purchase.stax28,
          itax0: purchase.itax0,
          itax5: purchase.itax5,
          itax12: purchase.itax12,
          itax18: purchase.itax18,
          itax28: purchase.itax28,
          remarks: purchase.remarks,
          status: purchase.status,
          stockInwardCompleted: purchase.stockInwardCompleted,
          createdBy: purchase.createdBy,
          createdAt: purchase.createdAt,
          updatedAt: purchase.updatedAt,
          isTallied
        };
      })
    );
    return purchasesWithTallyStatus;
  }
  async getPurchase(id, companyId) {
    const [purchase] = await db.select().from(purchases).where(and(eq(purchases.id, id), eq(purchases.companyId, companyId)));
    if (!purchase) {
      return void 0;
    }
    const items2 = await db.select().from(purchaseItems).where(eq(purchaseItems.purchaseId, id));
    return { ...purchase, items: items2 };
  }
  async getNextPurchaseNumber(companyId) {
    const [result] = await db.select({ maxNo: sql2`COALESCE(MAX(${purchases.purchaseNo}), 0)` }).from(purchases).where(eq(purchases.companyId, companyId));
    return (result?.maxNo || 0) + 1;
  }
  async getNextSerial(companyId) {
    const [result] = await db.select({ maxSerial: sql2`COALESCE(MAX(${purchaseItems.serial}), 0)` }).from(purchaseItems).innerJoin(purchases, eq(purchaseItems.purchaseId, purchases.id)).where(eq(purchases.companyId, companyId));
    return (result?.maxSerial || 0) + 1;
  }
  async createPurchase(purchaseData, itemsData, userId, companyId) {
    const purchaseNo = await this.getNextPurchaseNumber(companyId);
    let totalQty = 0;
    let totalAmount = 0;
    const taxBreakdown = { val0: 0, val5: 0, val12: 0, val18: 0, val28: 0, ctax0: 0, ctax5: 0, ctax12: 0, ctax18: 0, ctax28: 0, stax0: 0, stax5: 0, stax12: 0, stax18: 0, stax28: 0 };
    for (const item of itemsData) {
      totalQty += parseFloat(item.qty.toString());
      const itemTotal = parseFloat(item.cost.toString()) * parseFloat(item.qty.toString());
      const taxRate = parseFloat((item.tax || 0).toString());
      const taxAmount = itemTotal * taxRate / 100;
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
    const [newPurchase] = await db.insert(purchases).values({
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
      companyId
    }).returning();
    for (const item of itemsData) {
      const qty = parseFloat(item.qty.toString());
      const stockQty = qty - parseFloat((item.dqty || 0).toString());
      await db.insert(purchaseItems).values({
        ...item,
        purchaseId: newPurchase.id,
        stockqty: stockQty.toString()
      });
      if (item.itemId) {
        await this.updateStock(item.itemId, qty, companyId);
      }
    }
    return newPurchase;
  }
  // ==================== PAYMENT OPERATIONS ====================
  async getPayments(companyId) {
    return await db.select().from(payments).where(eq(payments.companyId, companyId)).orderBy(desc(payments.date), desc(payments.id));
  }
  async createPayment(payment, userId, companyId) {
    const [newPayment] = await db.insert(payments).values({ ...payment, createdBy: userId, companyId }).returning();
    return newPayment;
  }
  async updatePayment(id, payment, companyId) {
    const [updatedPayment] = await db.update(payments).set(payment).where(and(eq(payments.id, id), eq(payments.companyId, companyId))).returning();
    if (!updatedPayment) {
      throw new Error("Payment not found or access denied");
    }
    return updatedPayment;
  }
  async deletePayment(id, companyId) {
    await db.delete(payments).where(and(eq(payments.id, id), eq(payments.companyId, companyId)));
  }
  // ==================== STOCK OPERATIONS ====================
  async getStock(companyId, partyId, itemId) {
    const conditions = [
      eq(stockInwardItems.companyId, companyId),
      or(
        eq(stockInwardItems.status, "available"),
        eq(stockInwardItems.status, "in_stock")
      )
      // Show all unsold stock
    ];
    if (partyId) conditions.push(eq(purchases.partyId, partyId));
    if (itemId) conditions.push(eq(stockInwardItems.itemId, itemId));
    const result = await db.select({
      stockInwardId: sql2`MIN(${stockInwardItems.id})`,
      itemId: stockInwardItems.itemId,
      itemCode: items.code,
      itemName: stockInwardItems.itname,
      category: items.category,
      packType: items.packType,
      brandName: stockInwardItems.brandname,
      quality: stockInwardItems.quality,
      size: stockInwardItems.size,
      designNo: stockInwardItems.dno1,
      pattern: stockInwardItems.pattern,
      color: stockInwardItems.sleeve,
      hsnCode: items.hsnCode,
      partyId: purchases.partyId,
      partyName: purchases.partyName,
      quantity: sql2`CAST(COALESCE(SUM(CAST(${stockInwardItems.qty} AS NUMERIC)), 0) AS VARCHAR)`,
      cost: sql2`CAST(AVG(${stockInwardItems.cost}) AS VARCHAR)`,
      ncost: sql2`CAST(AVG(${stockInwardItems.ncost}) AS VARCHAR)`,
      rate: sql2`CAST(AVG(${stockInwardItems.rate}) AS VARCHAR)`,
      status: stockInwardItems.status
    }).from(stockInwardItems).leftJoin(items, eq(stockInwardItems.itemId, items.id)).leftJoin(purchases, eq(stockInwardItems.purchaseId, purchases.id)).where(and(...conditions)).groupBy(
      stockInwardItems.itemId,
      items.code,
      stockInwardItems.itname,
      items.category,
      items.packType,
      stockInwardItems.brandname,
      stockInwardItems.quality,
      stockInwardItems.size,
      stockInwardItems.dno1,
      stockInwardItems.pattern,
      stockInwardItems.sleeve,
      items.hsnCode,
      purchases.partyId,
      purchases.partyName,
      stockInwardItems.status
    ).orderBy(purchases.partyName, stockInwardItems.itname);
    return result;
  }
  async updateStock(itemId, quantityChange, companyId) {
    const item = await this.getItem(itemId, companyId);
    if (!item) {
      throw new Error(`Stock update rejected: Item ${itemId} not found or does not belong to company ${companyId}`);
    }
    await db.update(stock).set({
      quantity: sql2`${stock.quantity} + ${quantityChange}`,
      lastUpdated: /* @__PURE__ */ new Date()
    }).where(and(eq(stock.itemId, itemId), eq(stock.companyId, companyId)));
  }
  async getInventoryByBarcode(barcode, companyId) {
    const [result] = await db.select({
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
      saleItemId: stockInwardItems.saleItemId
    }).from(stockInwardItems).leftJoin(items, eq(stockInwardItems.itemId, items.id)).leftJoin(purchases, eq(stockInwardItems.purchaseId, purchases.id)).leftJoin(parties, eq(purchases.partyId, parties.id)).where(
      and(
        eq(stockInwardItems.barcode, barcode),
        eq(stockInwardItems.companyId, companyId)
      )
    ).limit(1);
    if (!result) return void 0;
    let saleDetails = null;
    if (result.saleId) {
      const [sale] = await db.select({
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
        billType: sales.billType
      }).from(sales).leftJoin(parties, eq(sales.partyId, parties.id)).where(eq(sales.id, result.saleId));
      saleDetails = sale;
    }
    return {
      ...result,
      stockQty: result.qty,
      sale: saleDetails
    };
  }
  async getPartyOutstanding(partyId, companyId) {
    const [party] = await db.select({
      openingDebit: parties.openingDebit,
      openingCredit: parties.openingCredit
    }).from(parties).where(and(eq(parties.id, partyId), eq(parties.companyId, companyId)));
    if (!party) return 0;
    const [salesTotal] = await db.select({ total: sql2`COALESCE(SUM(${sales.grandTotal}), 0)` }).from(sales).where(and(
      eq(sales.partyId, partyId),
      eq(sales.companyId, companyId),
      ne(sales.saleType, "PROFORMA")
    ));
    const [purchasesTotal] = await db.select({ total: sql2`COALESCE(SUM(${purchases.amount}), 0)` }).from(purchases).where(and(eq(purchases.partyId, partyId), eq(purchases.companyId, companyId)));
    const [paymentsTotal] = await db.select({
      credit: sql2`COALESCE(SUM(${payments.credit}), 0)`,
      debit: sql2`COALESCE(SUM(${payments.debit}), 0)`
    }).from(payments).where(and(eq(payments.partyId, partyId), eq(payments.companyId, companyId)));
    const openingBal = parseFloat(party.openingDebit || "0") - parseFloat(party.openingCredit || "0");
    const salesAmt = parseFloat(salesTotal?.total || "0");
    const purchasesAmt = parseFloat(purchasesTotal?.total || "0");
    const paymentsCredit = parseFloat(paymentsTotal?.credit || "0");
    const paymentsDebit = parseFloat(paymentsTotal?.debit || "0");
    const outstanding = openingBal + salesAmt - purchasesAmt - paymentsCredit + paymentsDebit;
    return outstanding;
  }
  // ==================== REPORT OPERATIONS ====================
  async getDashboardMetrics(companyId) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const todayDate = /* @__PURE__ */ new Date();
    const [todaySales] = await db.select({ total: sql2`COALESCE(SUM(CASE WHEN ${sales.saleType} = 'CREDIT_NOTE' THEN -${sales.grandTotal} ELSE ${sales.grandTotal} END), 0)` }).from(sales).where(and(
      eq(sales.date, today),
      eq(sales.companyId, companyId),
      ne(sales.saleType, "PROFORMA")
    ));
    const recentSales = await db.select({
      id: sales.id,
      invoiceNo: sales.invoiceNo,
      billType: sales.billType,
      date: sales.date,
      partyName: sales.partyName,
      grandTotal: sales.grandTotal
    }).from(sales).where(eq(sales.companyId, companyId)).orderBy(desc(sales.date), desc(sales.id)).limit(5);
    const outstanding = await this.getOutstanding(companyId);
    const totalOutstanding = outstanding.reduce((sum, p) => sum + p.balance, 0);
    const [lowStockResult] = await db.select({ count: sql2`COUNT(*)` }).from(stock).where(and(sql2`${stock.quantity} < 10`, eq(stock.companyId, companyId)));
    const [customersResult] = await db.select({ count: sql2`COUNT(*)` }).from(parties).where(eq(parties.companyId, companyId));
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date2 = new Date(todayDate);
      date2.setDate(date2.getDate() - i);
      last7Days.push(date2.toISOString().split("T")[0]);
    }
    const salesTrend = await Promise.all(
      last7Days.map(async (date2) => {
        const [result] = await db.select({ total: sql2`COALESCE(SUM(CASE WHEN ${sales.saleType} = 'CREDIT_NOTE' THEN -${sales.grandTotal} ELSE ${sales.grandTotal} END), 0)` }).from(sales).where(and(
          eq(sales.date, date2),
          eq(sales.companyId, companyId),
          ne(sales.saleType, "PROFORMA")
        ));
        return {
          date: date2,
          day: new Date(date2).toLocaleDateString("en-US", { weekday: "short" }),
          amount: parseFloat(result?.total?.toString() || "0")
        };
      })
    );
    const salesByType = await db.select({
      saleType: sales.saleType,
      total: sql2`COALESCE(SUM(CASE WHEN ${sales.saleType} = 'CREDIT_NOTE' THEN -${sales.grandTotal} ELSE ${sales.grandTotal} END), 0)`,
      count: sql2`COUNT(*)`
    }).from(sales).where(eq(sales.companyId, companyId)).groupBy(sales.saleType);
    const topSellingItems = await db.select({
      itemId: saleItems.itemId,
      itemName: saleItems.itemName,
      totalQty: sql2`COALESCE(SUM(${saleItems.quantity}), 0)`,
      totalAmount: sql2`COALESCE(SUM(${saleItems.amount}), 0)`
    }).from(saleItems).innerJoin(sales, eq(saleItems.saleId, sales.id)).where(and(
      eq(sales.companyId, companyId),
      ne(sales.saleType, "PROFORMA")
    )).groupBy(saleItems.itemId, saleItems.itemName).orderBy(desc(sql2`SUM(${saleItems.quantity})`)).limit(5);
    const thirtyDaysFromNow = new Date(todayDate);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiryDateStr = thirtyDaysFromNow.toISOString().split("T")[0];
    const expiringStock = await db.select({
      id: stockInwardItems.id,
      barcode: stockInwardItems.barcode,
      itemName: stockInwardItems.itname,
      expiryDate: stockInwardItems.expdate,
      rate: stockInwardItems.rate,
      status: stockInwardItems.status
    }).from(stockInwardItems).where(
      and(
        eq(stockInwardItems.companyId, companyId),
        eq(stockInwardItems.status, "available"),
        isNotNull(stockInwardItems.expdate),
        lte(stockInwardItems.expdate, expiryDateStr)
      )
    ).orderBy(stockInwardItems.expdate).limit(10);
    const firstDayOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1).toISOString().split("T")[0];
    const [monthSales] = await db.select({ total: sql2`COALESCE(SUM(${sales.grandTotal}), 0)` }).from(sales).where(and(
      gte(sales.date, firstDayOfMonth),
      eq(sales.companyId, companyId),
      ne(sales.saleType, "PROFORMA")
    ));
    const [monthPurchases] = await db.select({ total: sql2`COALESCE(SUM(${purchases.amount}), 0)` }).from(purchases).where(and(gte(purchases.date, firstDayOfMonth), eq(purchases.companyId, companyId)));
    return {
      todaysSales: todaySales?.total || 0,
      totalOutstanding,
      lowStockCount: lowStockResult?.count || 0,
      totalCustomers: customersResult?.count || 0,
      recentSales,
      salesTrend,
      salesByType: salesByType.map((s) => ({
        type: s.saleType || "Other",
        total: parseFloat(s.total?.toString() || "0"),
        count: parseInt(s.count?.toString() || "0")
      })),
      topSellingItems: topSellingItems.map((item) => ({
        itemId: item.itemId,
        itemName: item.itemName || "Unknown",
        totalQty: parseFloat(item.totalQty?.toString() || "0"),
        totalAmount: parseFloat(item.totalAmount?.toString() || "0")
      })),
      expiringStock: expiringStock.map((item) => ({
        id: item.id,
        barcode: item.barcode,
        itemName: item.itemName,
        expiryDate: item.expiryDate,
        rate: item.rate,
        daysUntilExpiry: Math.ceil((new Date(item.expiryDate).getTime() - todayDate.getTime()) / (1e3 * 60 * 60 * 24))
      })),
      monthSales: parseFloat(monthSales?.total?.toString() || "0"),
      monthPurchases: parseFloat(monthPurchases?.total?.toString() || "0")
    };
  }
  async getOutstanding(companyId) {
    const allParties = await db.select({
      partyId: parties.id,
      partyCode: parties.code,
      partyName: parties.name,
      partyCity: parties.city,
      openingDebit: parties.openingDebit,
      openingCredit: parties.openingCredit
    }).from(parties).where(eq(parties.companyId, companyId));
    const result = await Promise.all(allParties.map(async (party) => {
      const [salesResult] = await db.select({ total: sql2`COALESCE(SUM(CASE WHEN ${sales.saleType} = 'CREDIT_NOTE' THEN -${sales.grandTotal} ELSE ${sales.grandTotal} END), 0)` }).from(sales).where(and(eq(sales.partyId, party.partyId), eq(sales.companyId, companyId), ne(sales.saleType, "PROFORMA")));
      const [purchasesResult] = await db.select({ total: sql2`COALESCE(SUM(${purchases.amount}), 0)` }).from(purchases).where(and(eq(purchases.partyId, party.partyId), eq(purchases.companyId, companyId)));
      const [paymentsResult] = await db.select({
        totalCredit: sql2`COALESCE(SUM(${payments.credit}), 0)`,
        totalDebit: sql2`COALESCE(SUM(${payments.debit}), 0)`
      }).from(payments).where(and(eq(payments.partyId, party.partyId), eq(payments.companyId, companyId)));
      const openingBal = parseFloat(party.openingDebit) - parseFloat(party.openingCredit);
      const salesAmt = parseFloat(salesResult?.total || "0");
      const purchasesAmt = parseFloat(purchasesResult?.total || "0");
      const paymentsCredit = parseFloat(paymentsResult?.totalCredit || "0");
      const paymentsDebit = parseFloat(paymentsResult?.totalDebit || "0");
      const balance = openingBal + salesAmt - purchasesAmt - paymentsCredit + paymentsDebit;
      return {
        ...party,
        totalSales: salesAmt,
        totalPurchases: purchasesAmt,
        totalPaymentsCredit: paymentsCredit,
        totalPaymentsDebit: paymentsDebit,
        balance
      };
    }));
    return result;
  }
  async getSalesReport(companyId, startDate, endDate, saleType, itemId) {
    const conditions = [eq(sales.companyId, companyId)];
    if (startDate) conditions.push(gte(sales.date, startDate));
    if (endDate) conditions.push(lte(sales.date, endDate));
    if (saleType && saleType !== "all") conditions.push(eq(sales.saleType, saleType));
    if (itemId) {
      const itemIdNum = parseInt(itemId);
      const salesWithItem = await db.selectDistinct({
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
        gstType: sales.gstType
      }).from(sales).innerJoin(saleItems, eq(saleItems.saleId, sales.id)).where(and(and(...conditions), eq(saleItems.itemId, itemIdNum))).orderBy(desc(sales.date), desc(sales.id));
      return salesWithItem.map((row) => ({
        ...row,
        igstTotal: row.gstType === 1 ? row.taxValue : "0",
        cgstTotal: row.gstType === 1 ? "0" : row.cgstTotal,
        sgstTotal: row.gstType === 1 ? "0" : row.sgstTotal
      }));
    }
    const salesData = await db.select().from(sales).where(and(...conditions)).orderBy(desc(sales.date), desc(sales.id));
    return salesData.map((row) => ({
      ...row,
      igstTotal: row.gstType === 1 ? row.taxValue : "0",
      cgstTotal: row.gstType === 1 ? "0" : row.cgstTotal,
      sgstTotal: row.gstType === 1 ? "0" : row.sgstTotal
    }));
  }
  async getPurchasesReport(companyId, startDate, endDate) {
    const conditions = [eq(purchases.companyId, companyId)];
    if (startDate) conditions.push(gte(purchases.date, startDate));
    if (endDate) conditions.push(lte(purchases.date, endDate));
    const purchasesList = await db.select().from(purchases).where(and(...conditions)).orderBy(desc(purchases.date), desc(purchases.id));
    const result = await Promise.all(purchasesList.map(async (purchase) => {
      const items2 = await db.select().from(purchaseItems).where(eq(purchaseItems.purchaseId, purchase.id));
      const party = purchase.partyId ? await db.select().from(parties).where(eq(parties.id, purchase.partyId)).limit(1) : null;
      return {
        ...purchase,
        items: items2,
        partyName: party?.[0]?.name || null,
        city: party?.[0]?.city || null
      };
    }));
    return result;
  }
  async getSalesTotalReport(companyId, startDate, endDate, billType) {
    const conditions = [eq(sales.companyId, companyId)];
    if (startDate) conditions.push(gte(sales.date, startDate));
    if (endDate) conditions.push(lte(sales.date, endDate));
    if (billType && billType !== "ALL") conditions.push(eq(sales.saleType, billType));
    const salesData = await db.select({
      date: sales.date,
      saleType: sales.saleType,
      grandTotal: sales.grandTotal
    }).from(sales).where(and(...conditions)).orderBy(sales.date);
    const groupedByDate = {};
    salesData.forEach((sale) => {
      const dateKey = sale.date;
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = { cashTotal: 0, cardTotal: 0, netTotal: 0 };
      }
      const amount = parseFloat(String(sale.grandTotal || 0));
      if (sale.saleType === "B2C" || sale.saleType === "ESTIMATE") {
        groupedByDate[dateKey].cashTotal += amount;
      } else if (sale.saleType === "B2B") {
        groupedByDate[dateKey].cardTotal += amount;
      }
      groupedByDate[dateKey].netTotal += amount;
    });
    const data = Object.entries(groupedByDate).map(([date2, totals2]) => ({
      date: date2,
      cashTotal: Number(totals2.cashTotal.toFixed(2)),
      cardTotal: Number(totals2.cardTotal.toFixed(2)),
      netTotal: Number(totals2.netTotal.toFixed(2))
    }));
    const totals = {
      cashTotal: Number(data.reduce((sum, row) => sum + row.cashTotal, 0).toFixed(2)),
      cardTotal: Number(data.reduce((sum, row) => sum + row.cardTotal, 0).toFixed(2)),
      netTotal: Number(data.reduce((sum, row) => sum + row.netTotal, 0).toFixed(2))
    };
    return { data, totals };
  }
  async getItemsReport(companyId, startDate, endDate, saleType, itemId, category) {
    const conditions = [eq(sales.companyId, companyId)];
    if (startDate) conditions.push(gte(sales.date, startDate));
    if (endDate) conditions.push(lte(sales.date, endDate));
    if (saleType) conditions.push(eq(sales.saleType, saleType));
    if (itemId) conditions.push(eq(saleItems.itemId, parseInt(itemId)));
    if (category) conditions.push(eq(items.category, category));
    return await db.select({
      itemId: saleItems.itemId,
      itemCode: saleItems.itemCode,
      itemName: saleItems.itemName,
      hsnCode: saleItems.hsnCode,
      category: items.category,
      packType: items.packType,
      tax: saleItems.tax,
      totalQty: sql2`SUM(${saleItems.quantity})`,
      totalAmount: sql2`SUM(${saleItems.amount})`,
      totalSaleValue: sql2`SUM(${saleItems.saleValue})`,
      totalTaxValue: sql2`SUM(${saleItems.taxValue})`,
      invoiceCount: sql2`COUNT(DISTINCT ${saleItems.saleId})`
    }).from(saleItems).innerJoin(sales, eq(saleItems.saleId, sales.id)).leftJoin(items, eq(saleItems.itemId, items.id)).where(and(...conditions)).groupBy(saleItems.itemId, saleItems.itemCode, saleItems.itemName, saleItems.hsnCode, items.category, items.packType, saleItems.tax).orderBy(sql2`SUM(${saleItems.amount}) DESC`);
  }
  async getCategoriesReport(companyId, startDate, endDate, saleType) {
    const conditions = [eq(sales.companyId, companyId)];
    if (startDate) conditions.push(gte(sales.date, startDate));
    if (endDate) conditions.push(lte(sales.date, endDate));
    if (saleType) conditions.push(eq(sales.saleType, saleType));
    return await db.select({
      category: items.category,
      totalQty: sql2`SUM(${saleItems.quantity})`,
      totalAmount: sql2`SUM(${saleItems.amount})`,
      totalSaleValue: sql2`SUM(${saleItems.saleValue})`,
      totalTaxValue: sql2`SUM(${saleItems.taxValue})`,
      invoiceCount: sql2`COUNT(DISTINCT ${saleItems.saleId})`,
      itemCount: sql2`COUNT(DISTINCT ${saleItems.itemId})`
    }).from(saleItems).innerJoin(sales, eq(saleItems.saleId, sales.id)).leftJoin(items, eq(saleItems.itemId, items.id)).where(and(...conditions)).groupBy(items.category).orderBy(sql2`SUM(${saleItems.amount}) DESC`);
  }
  async getGSTR1Data(companyId, startDate, endDate, saleType) {
    const conditions = [eq(sales.companyId, companyId)];
    if (startDate) conditions.push(gte(sales.date, startDate));
    if (endDate) conditions.push(lte(sales.date, endDate));
    if (saleType && saleType !== "ALL") {
      conditions.push(eq(sales.saleType, saleType));
    } else {
      conditions.push(sql2`${sales.saleType} IN ('B2B', 'B2C')`);
    }
    const salesData = await db.select({
      id: sales.id,
      invoiceNo: sales.invoiceNo,
      saleType: sales.saleType,
      date: sales.date,
      partyName: sales.partyName,
      partyGstNo: sales.partyGstNo,
      partyCity: sales.partyCity,
      saleValue: sales.saleValue,
      taxValue: sales.taxValue,
      cgstTotal: sales.cgstTotal,
      sgstTotal: sales.sgstTotal,
      grandTotal: sales.grandTotal,
      gstType: sales.gstType
    }).from(sales).where(and(...conditions)).orderBy(sales.date, sales.invoiceNo);
    const getStateFromGstin = (gstin) => {
      if (!gstin || gstin.length < 2) return "Tamil Nadu";
      const stateCode = gstin.substring(0, 2);
      const stateCodes = {
        "01": "Jammu & Kashmir",
        "02": "Himachal Pradesh",
        "03": "Punjab",
        "04": "Chandigarh",
        "05": "Uttarakhand",
        "06": "Haryana",
        "07": "Delhi",
        "08": "Rajasthan",
        "09": "Uttar Pradesh",
        "10": "Bihar",
        "11": "Sikkim",
        "12": "Arunachal Pradesh",
        "13": "Nagaland",
        "14": "Manipur",
        "15": "Mizoram",
        "16": "Tripura",
        "17": "Meghalaya",
        "18": "Assam",
        "19": "West Bengal",
        "20": "Jharkhand",
        "21": "Odisha",
        "22": "Chhattisgarh",
        "23": "Madhya Pradesh",
        "24": "Gujarat",
        "26": "Dadra & Nagar Haveli",
        "27": "Maharashtra",
        "29": "Karnataka",
        "30": "Goa",
        "31": "Lakshadweep",
        "32": "Kerala",
        "33": "Tamil Nadu",
        "34": "Puducherry",
        "35": "Andaman & Nicobar",
        "36": "Telangana",
        "37": "Andhra Pradesh",
        "38": "Ladakh"
      };
      return stateCodes[stateCode] || "Tamil Nadu";
    };
    return salesData.map((sale) => ({
      gstin: sale.partyGstNo || "",
      partyName: sale.partyName || "Cash Sale",
      invoiceNo: `${sale.saleType}-${sale.invoiceNo}`,
      date: sale.date,
      totalValue: parseFloat(String(sale.grandTotal || 0)),
      placeOfSupply: getStateFromGstin(sale.partyGstNo),
      reverseCharge: "N",
      invoiceType: "Regular",
      ecomGstin: "",
      taxRate: 0,
      taxableValue: parseFloat(String(sale.saleValue || 0)),
      cgst: parseFloat(String(sale.cgstTotal || 0)),
      sgst: parseFloat(String(sale.sgstTotal || 0)),
      igst: sale.gstType === 1 ? parseFloat(String(sale.taxValue || 0)) : 0,
      cess: 0,
      gstType: sale.gstType === 1 ? "IGST" : "CGST/SGST",
      saleType: sale.saleType
    }));
  }
  async generateEInvoiceJSON(saleId, companyId) {
    const sale = await this.getSale(saleId, companyId);
    if (!sale) {
      throw new Error("Sale not found");
    }
    if (sale.saleType !== "B2B") {
      throw new Error("e-Invoice can only be generated for B2B sales");
    }
    const saleItemsList = await this.getSaleItems(saleId, companyId);
    const company = await this.getCompany(companyId);
    let party = null;
    if (sale.partyId) {
      party = await this.getParty(sale.partyId, companyId);
    }
    if (!party?.gstNo || party.gstNo.length !== 15) {
      throw new Error("Valid 15-character GSTIN required for buyer to generate e-Invoice");
    }
    const sellerStateCode = company?.gstNo?.substring(0, 2) || "33";
    const buyerStateCode = party.gstNo.substring(0, 2);
    const isInterState = sellerStateCode !== buyerStateCode;
    const assessableValue = parseFloat(String(sale.saleValue || 0));
    const cgstValue = isInterState ? 0 : parseFloat(String(sale.cgstTotal || 0));
    const sgstValue = isInterState ? 0 : parseFloat(String(sale.sgstTotal || 0));
    const igstValue = isInterState ? parseFloat(String(sale.taxValue || 0)) : 0;
    const totalValue = parseFloat(String(sale.grandTotal || 0));
    const roundOff = parseFloat(String(sale.roundOff || 0));
    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };
    const itemList = saleItemsList.map((item, index2) => {
      const qty = parseFloat(String(item.quantity || 0));
      const rate = parseFloat(String(item.rate || 0));
      const amount = parseFloat(String(item.amount || 0));
      const saleValue = parseFloat(String(item.saleValue || 0));
      const taxRate = parseFloat(String(item.tax || 0));
      const itemCgst = isInterState ? 0 : parseFloat(String(item.cgst || 0));
      const itemSgst = isInterState ? 0 : parseFloat(String(item.sgst || 0));
      const itemIgst = isInterState ? parseFloat(String(item.taxValue || 0)) : 0;
      const itemTotal = saleValue + itemCgst + itemSgst + itemIgst;
      return {
        SlNo: String(index2 + 1),
        PrdDesc: item.itemName || "Product",
        IsServc: "N",
        HsnCd: item.hsnCode || "",
        Barcde: item.barcode || null,
        Qty: qty,
        FreeQty: 0,
        Unit: "NOS",
        UnitPrice: rate,
        TotAmt: amount,
        Discount: parseFloat(String(item.discount || 0)),
        PreTaxVal: 0,
        AssAmt: saleValue,
        GstRt: taxRate,
        IgstAmt: itemIgst,
        CgstAmt: itemCgst,
        SgstAmt: itemSgst,
        CesRt: 0,
        CesAmt: 0,
        CesNonAdvlAmt: 0,
        StateCesRt: 0,
        StateCesAmt: 0,
        StateCesNonAdvlAmt: 0,
        OthChrg: 0,
        TotItemVal: Math.round(itemTotal),
        OrdLineRef: null,
        OrgCntry: null,
        PrdSlNo: null,
        BchDtls: null
      };
    });
    const eInvoiceJSON = {
      Version: "1.1",
      TranDtls: {
        TaxSch: "GST",
        SupTyp: "B2B",
        IgstOnIntra: isInterState ? "Y" : "N",
        RegRev: null,
        EcmGstin: null
      },
      DocDtls: {
        Typ: "INV",
        No: String(sale.invoiceNo),
        Dt: formatDate(sale.date)
      },
      SellerDtls: {
        Gstin: company?.gstNo || "",
        LglNm: company?.name || "",
        TrdNm: null,
        Addr1: company?.address || "",
        Addr2: "",
        Loc: company?.city || "",
        Pin: parseInt(company?.address?.match(/\d{6}/)?.[0] || "600001"),
        Stcd: sellerStateCode,
        Ph: company?.phone || null,
        Em: company?.email || null
      },
      BuyerDtls: {
        Gstin: party.gstNo,
        LglNm: party.name || "",
        TrdNm: null,
        Pos: buyerStateCode,
        Addr1: party.address || "",
        Addr2: "",
        Loc: party.city || "",
        Pin: parseInt(party.pincode || "600001"),
        Stcd: buyerStateCode,
        Ph: party.phone || null,
        Em: null
      },
      DispDtls: null,
      ShipDtls: party.hasShippingAddress ? {
        Gstin: party.gstNo,
        LglNm: party.shipName || party.name || "",
        TrdNm: null,
        Addr1: party.shipAddress || "",
        Addr2: "",
        Loc: party.shipCity || party.city || "",
        Pin: parseInt(party.shipPincode || party.pincode || "600001"),
        Stcd: party.shipStateCode || buyerStateCode
      } : null,
      ValDtls: {
        AssVal: assessableValue,
        IgstVal: igstValue,
        CgstVal: cgstValue,
        SgstVal: sgstValue,
        CesVal: 0,
        StCesVal: 0,
        Discount: 0,
        OthChrg: 0,
        RndOffAmt: roundOff,
        TotInvVal: totalValue,
        TotInvValFc: 0
      },
      ExpDtls: null,
      EwbDtls: null,
      PayDtls: null,
      RefDtls: null,
      AddlDocDtls: [{
        Url: "https://einv-apisandbox.nic.in",
        Docs: "Invoice",
        Info: "Generated from BeneSys Billing System"
      }],
      ItemList: itemList
    };
    return eInvoiceJSON;
  }
  async getHSNSummaryData(companyId, startDate, endDate, saleType) {
    const conditions = [eq(sales.companyId, companyId)];
    if (startDate) conditions.push(gte(sales.date, startDate));
    if (endDate) conditions.push(lte(sales.date, endDate));
    if (saleType && saleType !== "ALL") {
      conditions.push(eq(sales.saleType, saleType));
    } else {
      conditions.push(sql2`${sales.saleType} IN ('B2B', 'B2C')`);
    }
    const fetchHSNData = async (isB2B) => {
      const baseConditions = [...conditions];
      if (isB2B) {
        baseConditions.push(sql2`CHAR_LENGTH(COALESCE(${sales.partyGstNo}, '')) = 15`);
      } else {
        baseConditions.push(sql2`CHAR_LENGTH(COALESCE(${sales.partyGstNo}, '')) != 15`);
      }
      const hsnData = await db.select({
        hsnCode: saleItems.hsnCode,
        uqc: sql2`'NOS-NUMBERS'`,
        totalQty: sql2`SUM(${saleItems.quantity})`,
        totalValue: sql2`SUM(${saleItems.amount})`,
        taxRate: saleItems.tax,
        taxableValue: sql2`SUM(${saleItems.saleValue})`,
        cgst: sql2`SUM(${saleItems.cgst})`,
        sgst: sql2`SUM(${saleItems.sgst})`
      }).from(saleItems).innerJoin(sales, eq(saleItems.saleId, sales.id)).where(and(...baseConditions)).groupBy(saleItems.hsnCode, saleItems.tax).orderBy(saleItems.hsnCode);
      return hsnData.map((row) => ({
        hsnCode: row.hsnCode || "",
        description: "",
        uqc: row.uqc,
        totalQty: parseFloat(String(row.totalQty || 0)),
        totalValue: parseFloat(String(row.totalValue || 0)),
        taxRate: parseFloat(String(row.taxRate || 0)),
        taxableValue: parseFloat(String(row.taxableValue || 0)),
        igst: 0,
        cgst: parseFloat(String(row.cgst || 0)),
        sgst: parseFloat(String(row.sgst || 0)),
        cess: 0
      }));
    };
    const [b2b, b2c] = await Promise.all([
      fetchHSNData(true),
      fetchHSNData(false)
    ]);
    return { b2b, b2c };
  }
  async getPaymentsReport(companyId, startDate, endDate, type) {
    const conditions = [eq(payments.companyId, companyId)];
    if (startDate) conditions.push(gte(payments.date, startDate));
    if (endDate) conditions.push(lte(payments.date, endDate));
    let data = await db.select({
      id: payments.id,
      date: payments.date,
      partyId: payments.partyId,
      partyName: payments.partyName,
      credit: payments.credit,
      debit: payments.debit,
      details: payments.details
    }).from(payments).where(and(...conditions)).orderBy(desc(payments.date), desc(payments.id));
    const transformed = data.map((row) => ({
      ...row,
      type: parseFloat(row.credit) > 0 ? "RECEIVED" : "PAID",
      amount: parseFloat(row.credit) > 0 ? row.credit : row.debit
    }));
    if (type) {
      return transformed.filter((row) => row.type === type);
    }
    return transformed;
  }
  // ==================== BILL TEMPLATE OPERATIONS ====================
  async getBillTemplates(companyId) {
    return await db.select().from(billTemplates).where(eq(billTemplates.companyId, companyId)).orderBy(desc(billTemplates.createdAt));
  }
  async getDefaultBillTemplate(companyId) {
    const [template] = await db.select().from(billTemplates).where(and(eq(billTemplates.isDefault, true), eq(billTemplates.companyId, companyId))).limit(1);
    return template;
  }
  async getBillTemplateByAssignment(assignedTo, companyId) {
    const [template] = await db.select().from(billTemplates).where(and(eq(billTemplates.assignedTo, assignedTo), eq(billTemplates.companyId, companyId))).limit(1);
    if (!template && assignedTo === "b2b") {
      return await this.createDefaultTallyB2BTemplate(companyId);
    }
    return template || await this.getDefaultBillTemplate(companyId);
  }
  async createDefaultTallyB2BTemplate(companyId) {
    const [newTemplate] = await db.insert(billTemplates).values({
      companyId,
      name: "Tally B2B Invoice",
      formatType: "A4",
      assignedTo: "b2b",
      headerText: null,
      footerText: "Thank you for your business!",
      showTaxBreakup: true,
      showHsnCode: true,
      showItemCode: true,
      showPartyBalance: false,
      showBankDetails: false,
      showCashReturn: true,
      bankDetails: null,
      termsAndConditions: "1. Goods once sold are not returnable.\n2. Subject to jurisdiction.",
      fontSize: 10,
      logoUrl: null,
      isDefault: false,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return newTemplate;
  }
  async createBillTemplate(template, userId, companyId) {
    if (template.isDefault) {
      await db.update(billTemplates).set({ isDefault: false }).where(and(eq(billTemplates.isDefault, true), eq(billTemplates.companyId, companyId)));
    }
    const [newTemplate] = await db.insert(billTemplates).values({ ...template, createdBy: userId, companyId }).returning();
    return newTemplate;
  }
  async updateBillTemplate(id, template, companyId) {
    if (template.isDefault) {
      await db.update(billTemplates).set({ isDefault: false }).where(and(eq(billTemplates.isDefault, true), eq(billTemplates.companyId, companyId)));
    }
    const [updated] = await db.update(billTemplates).set({ ...template, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(billTemplates.id, id), eq(billTemplates.companyId, companyId))).returning();
    return updated;
  }
  async deleteBillTemplate(id, companyId) {
    await db.delete(billTemplates).where(and(eq(billTemplates.id, id), eq(billTemplates.companyId, companyId)));
  }
  async getPartyLedger(partyId, companyId, startDate, endDate) {
    const party = await this.getParty(partyId, companyId);
    if (!party) return null;
    let openingBalance = parseFloat(party.openingDebit) - parseFloat(party.openingCredit);
    if (startDate) {
      const priorSales = await db.select({ total: sql2`COALESCE(SUM(${sales.grandTotal}), 0)` }).from(sales).where(and(eq(sales.partyId, partyId), eq(sales.companyId, companyId), lt(sales.date, startDate), ne(sales.saleType, "PROFORMA")));
      const priorPurchases = await db.select({ total: sql2`COALESCE(SUM(${purchases.amount}), 0)` }).from(purchases).where(and(eq(purchases.partyId, partyId), eq(purchases.companyId, companyId), lt(purchases.date, startDate)));
      const priorPayments = await db.select({
        totalDebit: sql2`COALESCE(SUM(${payments.debit}), 0)`,
        totalCredit: sql2`COALESCE(SUM(${payments.credit}), 0)`
      }).from(payments).where(and(eq(payments.partyId, partyId), eq(payments.companyId, companyId), lt(payments.date, startDate)));
      openingBalance += parseFloat(priorSales[0]?.total || "0");
      openingBalance -= parseFloat(priorPurchases[0]?.total || "0");
      openingBalance += parseFloat(priorPayments[0]?.totalCredit || "0");
      openingBalance -= parseFloat(priorPayments[0]?.totalDebit || "0");
    }
    const salesConditions = [eq(sales.partyId, partyId), eq(sales.companyId, companyId), ne(sales.saleType, "PROFORMA")];
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
    const salesData = await db.select({
      id: sales.id,
      date: sales.date,
      type: sql2`'sale'`.as("type"),
      reference: sql2`CONCAT(${sales.saleType}, '-', ${sales.invoiceNo})`.as("reference"),
      details: sql2`NULL`.as("details"),
      debit: sql2`CASE WHEN ${sales.saleType} = 'CREDIT_NOTE' THEN '0' ELSE ${sales.grandTotal} END`,
      credit: sql2`CASE WHEN ${sales.saleType} = 'CREDIT_NOTE' THEN ${sales.grandTotal} ELSE '0' END`
    }).from(sales).where(and(...salesConditions));
    const purchasesData = await db.select({
      id: purchases.id,
      date: purchases.date,
      type: sql2`'purchase'`.as("type"),
      reference: sql2`CONCAT('P-', ${purchases.purchaseNo})`.as("reference"),
      details: purchases.details,
      debit: sql2`'0'`.as("debit"),
      credit: purchases.amount
    }).from(purchases).where(and(...purchasesConditions));
    const paymentsData = await db.select({
      id: payments.id,
      date: payments.date,
      type: sql2`'payment'`.as("type"),
      reference: sql2`'PAYMENT'`.as("reference"),
      details: payments.details,
      debit: payments.debit,
      credit: payments.credit
    }).from(payments).where(and(...paymentsConditions));
    const allTransactions = [
      ...salesData.map((t) => ({ ...t, debit: parseFloat(t.debit), credit: parseFloat(t.credit) })),
      ...purchasesData.map((t) => ({ ...t, debit: parseFloat(t.debit), credit: parseFloat(t.credit) })),
      ...paymentsData.map((t) => ({ ...t, debit: parseFloat(t.debit), credit: parseFloat(t.credit) }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runningBalance = openingBalance;
    const entries = allTransactions.map((t) => {
      runningBalance = runningBalance + t.credit - t.debit;
      return {
        ...t,
        balance: runningBalance
      };
    });
    return {
      partyId: party.id,
      partyCode: party.code,
      partyName: party.name,
      openingBalance,
      entries,
      closingBalance: runningBalance
    };
  }
  // ==================== AGENT OPERATIONS ====================
  async getAgents(companyId) {
    return await db.select().from(agents).where(or(eq(agents.companyId, companyId), eq(agents.isShared, true))).orderBy(agents.code);
  }
  async getAgent(id, companyId) {
    const [agent] = await db.select().from(agents).where(and(eq(agents.id, id), or(eq(agents.companyId, companyId), eq(agents.isShared, true))));
    return agent;
  }
  async getNextAgentCode(companyId) {
    const [result] = await db.select({ maxCode: sql2`COALESCE(MAX(${agents.code}), 0)` }).from(agents).where(eq(agents.companyId, companyId));
    return (result?.maxCode || 0) + 1;
  }
  async createAgent(agent, userId, companyId) {
    const code = await this.getNextAgentCode(companyId);
    const [newAgent] = await db.insert(agents).values({ ...agent, code, createdBy: userId, companyId }).returning();
    return newAgent;
  }
  async updateAgent(id, agent, companyId) {
    const [updated] = await db.update(agents).set({ ...agent, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(agents.id, id), eq(agents.companyId, companyId))).returning();
    return updated;
  }
  // ==================== STOCK INWARD OPERATIONS ====================
  async getPendingPurchases(companyId) {
    const pending = await db.select().from(purchases).where(and(
      eq(purchases.companyId, companyId),
      eq(purchases.stockInwardCompleted, false)
    )).orderBy(desc(purchases.date), desc(purchases.purchaseNo));
    const pendingWithTallyStatus = await Promise.all(
      pending.map(async (purchase) => {
        const items2 = await db.select().from(purchaseItems).where(eq(purchaseItems.purchaseId, purchase.id));
        const itemTotalQty = items2.reduce((sum, item) => sum + parseFloat(item.qty.toString()), 0);
        const itemTotalAmount = items2.reduce((sum, item) => {
          const cost = parseFloat(item.cost.toString());
          const qty = parseFloat(item.qty.toString());
          const tax = parseFloat((item.tax || 0).toString());
          return sum + cost * qty + cost * qty * tax / 100;
        }, 0);
        const purchaseTotalQty = parseFloat(purchase.totalQty.toString());
        const purchaseTotalAmount = parseFloat(purchase.amount.toString());
        const qtyMatch = Math.abs(itemTotalQty - purchaseTotalQty) < 0.01;
        const amountMatch = Math.abs(itemTotalAmount - purchaseTotalAmount) < 0.01;
        const isTallied = qtyMatch && amountMatch;
        return {
          id: purchase.id,
          companyId: purchase.companyId,
          purchaseNo: purchase.purchaseNo,
          date: purchase.date,
          invoiceNo: purchase.invoiceNo,
          partyId: purchase.partyId,
          partyName: purchase.partyName,
          city: purchase.city,
          state: purchase.state,
          gstNo: purchase.gstNo,
          phone: purchase.phone,
          address: purchase.address,
          totalQty: purchase.totalQty,
          amount: purchase.amount,
          beforeTaxAmount: purchase.beforeTaxAmount,
          billTotalAmount: purchase.billTotalAmount,
          cgst: purchase.cgst,
          sgst: purchase.sgst,
          igst: purchase.igst,
          cess: purchase.cess,
          gstType: purchase.gstType,
          val0: purchase.val0,
          val5: purchase.val5,
          val12: purchase.val12,
          val18: purchase.val18,
          val28: purchase.val28,
          ctax0: purchase.ctax0,
          ctax5: purchase.ctax5,
          ctax12: purchase.ctax12,
          ctax18: purchase.ctax18,
          ctax28: purchase.ctax28,
          stax0: purchase.stax0,
          stax5: purchase.stax5,
          stax12: purchase.stax12,
          stax18: purchase.stax18,
          stax28: purchase.stax28,
          itax0: purchase.itax0,
          itax5: purchase.itax5,
          itax12: purchase.itax12,
          itax18: purchase.itax18,
          itax28: purchase.itax28,
          remarks: purchase.remarks,
          status: purchase.status,
          stockInwardCompleted: purchase.stockInwardCompleted,
          createdBy: purchase.createdBy,
          createdAt: purchase.createdAt,
          updatedAt: purchase.updatedAt,
          isTallied
        };
      })
    );
    return pendingWithTallyStatus;
  }
  async getPurchaseItems(purchaseId, companyId) {
    const purchase = await this.getPurchase(purchaseId, companyId);
    if (!purchase) return [];
    return await db.select().from(purchaseItems).where(eq(purchaseItems.purchaseId, purchaseId)).orderBy(purchaseItems.serial);
  }
  async addPurchaseItem(item, companyId) {
    const purchase = await this.getPurchase(item.purchaseId, companyId);
    if (!purchase) {
      throw new Error("Purchase not found or does not belong to this company");
    }
    const [newItem] = await db.insert(purchaseItems).values(item).returning();
    return newItem;
  }
  async updatePurchaseItem(id, item, companyId) {
    const [existingItem] = await db.select().from(purchaseItems).where(eq(purchaseItems.id, id));
    if (!existingItem) {
      throw new Error("Purchase item not found");
    }
    const purchase = await this.getPurchase(existingItem.purchaseId, companyId);
    if (!purchase) {
      throw new Error("Purchase not found or does not belong to this company");
    }
    const [updated] = await db.update(purchaseItems).set(item).where(eq(purchaseItems.id, id)).returning();
    return updated;
  }
  async deletePurchaseItem(id, companyId) {
    const [existingItem] = await db.select().from(purchaseItems).where(eq(purchaseItems.id, id));
    if (!existingItem) return;
    const purchase = await this.getPurchase(existingItem.purchaseId, companyId);
    if (!purchase) {
      throw new Error("Purchase not found or does not belong to this company");
    }
    await db.delete(stockInwardItems).where(eq(stockInwardItems.purchaseItemId, id));
    await db.delete(purchaseItems).where(eq(purchaseItems.id, id));
  }
  async createStockInwardItems(purchaseItemId, items2, companyId) {
    const [purchaseItem] = await db.select().from(purchaseItems).where(eq(purchaseItems.id, purchaseItemId));
    if (!purchaseItem) {
      throw new Error("Purchase item not found");
    }
    const purchase = await this.getPurchase(purchaseItem.purchaseId, companyId);
    if (!purchase) {
      throw new Error("Purchase not found or does not belong to this company");
    }
    const createdItems = [];
    for (const item of items2) {
      const [created] = await db.insert(stockInwardItems).values({
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
        tax: purchaseItem.tax || "0"
      }).returning();
      createdItems.push(created);
    }
    await db.update(purchaseItems).set({ barcodeGenerated: true }).where(eq(purchaseItems.id, purchaseItemId));
    return createdItems;
  }
  async getStockInwardItems(purchaseItemId, companyId) {
    return await db.select().from(stockInwardItems).where(and(
      eq(stockInwardItems.purchaseItemId, purchaseItemId),
      eq(stockInwardItems.companyId, companyId)
    )).orderBy(stockInwardItems.serial);
  }
  async getNextGlobalSerial(companyId) {
    const [result] = await db.select({ maxSerial: sql2`COALESCE(MAX(${stockInwardItems.serial}), 0)` }).from(stockInwardItems).where(eq(stockInwardItems.companyId, companyId));
    return (result?.maxSerial || 0) + 1;
  }
  async completePurchase(purchaseId, companyId) {
    const purchase = await this.getPurchase(purchaseId, companyId);
    if (!purchase) {
      throw new Error("Purchase not found or does not belong to this company");
    }
    const items2 = await this.getPurchaseItems(purchaseId, companyId);
    let totalQty = 0;
    let totalAmount = 0;
    for (const item of items2) {
      totalQty += parseFloat(item.qty.toString());
      totalAmount += parseFloat(item.cost.toString()) * parseFloat(item.qty.toString());
    }
    await db.update(purchases).set({
      stockInwardCompleted: true,
      status: "completed",
      totalQty: totalQty.toString(),
      amount: totalAmount.toString(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and(eq(purchases.id, purchaseId), eq(purchases.companyId, companyId)));
  }
  async getSizeMaster() {
    return await db.select().from(sizeMaster).orderBy(sizeMaster.sortOrder);
  }
  async createPurchaseEntry(purchaseData, userId, companyId) {
    const purchaseNo = await this.getNextPurchaseNumber(companyId);
    const [newPurchase] = await db.insert(purchases).values({
      ...purchaseData,
      purchaseNo,
      status: "pending",
      stockInwardCompleted: false,
      createdBy: userId,
      companyId
    }).returning();
    return newPurchase;
  }
  async getPurchaseTallyStatus(companyId) {
    const result = await db.select({
      purchaseId: purchases.id,
      purchaseNo: purchases.purchaseNo,
      date: purchases.date,
      invoiceNo: purchases.invoiceNo,
      partyName: purchases.partyName,
      totalItems: sql2`COUNT(DISTINCT ${purchaseItems.id})`,
      matchedItems: sql2`COUNT(DISTINCT CASE WHEN ${stockInwardItems.id} IS NOT NULL THEN ${purchaseItems.id} END)`,
      unmatchedItems: sql2`COUNT(DISTINCT CASE WHEN ${stockInwardItems.id} IS NULL THEN ${purchaseItems.id} END)`,
      totalQty: purchases.totalQty,
      receivedQty: sql2`COALESCE(SUM(${stockInwardItems.qty}), 0)`
    }).from(purchases).leftJoin(purchaseItems, eq(purchases.id, purchaseItems.purchaseId)).leftJoin(stockInwardItems, eq(purchaseItems.id, stockInwardItems.purchaseItemId)).where(eq(purchases.companyId, companyId)).groupBy(purchases.id, purchases.purchaseNo, purchases.date, purchases.invoiceNo, purchases.partyName, purchases.totalQty);
    const detailed = await Promise.all(result.map(async (purchase) => {
      const items2 = await db.select({
        id: purchaseItems.id,
        itemName: purchaseItems.itname,
        billQty: purchaseItems.qty,
        receivedQty: sql2`COALESCE(SUM(${stockInwardItems.qty}), 0)`,
        cost: purchaseItems.cost,
        tax: purchaseItems.tax,
        matched: sql2`${stockInwardItems.id} IS NOT NULL`
      }).from(purchaseItems).leftJoin(stockInwardItems, eq(purchaseItems.id, stockInwardItems.purchaseItemId)).where(eq(purchaseItems.purchaseId, purchase.purchaseId)).groupBy(purchaseItems.id);
      return {
        ...purchase,
        items: items2.map((item) => ({
          ...item,
          billQty: parseFloat(item.billQty.toString()),
          receivedQty: parseFloat(item.receivedQty.toString()),
          cost: parseFloat(item.cost.toString()),
          tax: parseFloat(item.tax.toString())
        }))
      };
    }));
    return detailed;
  }
  async updatePurchase(id, purchaseData, companyId) {
    const [updated] = await db.update(purchases).set({
      ...purchaseData,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and(eq(purchases.id, id), eq(purchases.companyId, companyId))).returning();
    return updated;
  }
  // ==================== STOCK INWARD BARCODE MANAGEMENT ====================
  async getAllStockInwardItems(companyId, filters) {
    let query = db.select().from(stockInwardItems).where(eq(stockInwardItems.companyId, companyId));
    const conditions = [eq(stockInwardItems.companyId, companyId)];
    if (filters?.purchaseId) {
      conditions.push(eq(stockInwardItems.purchaseId, filters.purchaseId));
    }
    if (filters?.status) {
      conditions.push(eq(stockInwardItems.status, filters.status));
    }
    if (filters?.size) {
      conditions.push(eq(stockInwardItems.size, filters.size));
    }
    return await db.select().from(stockInwardItems).where(and(...conditions)).orderBy(desc(stockInwardItems.createdAt));
  }
  async getStockInwardItem(id, companyId) {
    const [item] = await db.select().from(stockInwardItems).where(and(
      eq(stockInwardItems.id, id),
      eq(stockInwardItems.companyId, companyId)
    ));
    return item;
  }
  async updateStockInwardItem(id, updates, companyId) {
    const [updated] = await db.update(stockInwardItems).set(updates).where(and(
      eq(stockInwardItems.id, id),
      eq(stockInwardItems.companyId, companyId)
    )).returning();
    return updated;
  }
  async createBulkStockInwardItems(purchaseItemId, sizeEntries, baseData, companyId) {
    const purchaseItem = await db.select().from(purchaseItems).innerJoin(purchases, eq(purchaseItems.purchaseId, purchases.id)).where(and(
      eq(purchaseItems.id, purchaseItemId),
      eq(purchases.companyId, companyId)
    ));
    if (purchaseItem.length === 0) {
      throw new Error("Purchase item not found or does not belong to this company");
    }
    const pItem = purchaseItem[0].purchase_items;
    const purchase = purchaseItem[0].purchases;
    const createdItems = [];
    let currentSerial = await this.getNextGlobalSerial(companyId);
    for (const entry of sizeEntries) {
      for (let i = 0; i < entry.quantity; i++) {
        const barcode = `${companyId}${currentSerial.toString().padStart(10, "0")}`;
        const [created] = await db.insert(stockInwardItems).values({
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
          status: "available"
        }).returning();
        createdItems.push(created);
        currentSerial++;
      }
    }
    await db.update(purchaseItems).set({ barcodeGenerated: true }).where(eq(purchaseItems.id, purchaseItemId));
    return createdItems;
  }
  async deleteStockInwardItem(id, companyId) {
    const [item] = await db.select().from(stockInwardItems).where(and(
      eq(stockInwardItems.id, id),
      eq(stockInwardItems.companyId, companyId)
    ));
    if (!item) {
      throw new Error("Barcode not found");
    }
    if (item.status === "sold") {
      throw new Error("Cannot delete a sold barcode");
    }
    await db.delete(stockInwardItems).where(and(
      eq(stockInwardItems.id, id),
      eq(stockInwardItems.companyId, companyId)
    ));
  }
  async bulkDeleteStockInwardItems(ids, companyId) {
    for (const id of ids) {
      await this.deleteStockInwardItem(id, companyId);
    }
  }
  // ==================== BARCODE LABEL TEMPLATE OPERATIONS ====================
  async getBarcodeLabelTemplates(companyId) {
    return await db.select().from(barcodeLabelTemplates).where(eq(barcodeLabelTemplates.companyId, companyId)).orderBy(desc(barcodeLabelTemplates.createdAt));
  }
  async getBarcodeLabelTemplate(id) {
    const [template] = await db.select().from(barcodeLabelTemplates).where(eq(barcodeLabelTemplates.id, id));
    return template;
  }
  async getDefaultBarcodeLabelTemplate(companyId) {
    const [template] = await db.select().from(barcodeLabelTemplates).where(and(
      eq(barcodeLabelTemplates.companyId, companyId),
      eq(barcodeLabelTemplates.isDefault, true)
    ));
    return template;
  }
  async createBarcodeLabelTemplate(template, userId, companyId) {
    if (template.isDefault) {
      await db.update(barcodeLabelTemplates).set({ isDefault: false }).where(eq(barcodeLabelTemplates.companyId, companyId));
    }
    const [created] = await db.insert(barcodeLabelTemplates).values({
      ...template,
      companyId,
      createdBy: userId
    }).returning();
    return created;
  }
  async updateBarcodeLabelTemplate(id, template, companyId) {
    if (template.isDefault) {
      await db.update(barcodeLabelTemplates).set({ isDefault: false }).where(eq(barcodeLabelTemplates.companyId, companyId));
    }
    const [updated] = await db.update(barcodeLabelTemplates).set({
      ...template,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and(
      eq(barcodeLabelTemplates.id, id),
      eq(barcodeLabelTemplates.companyId, companyId)
    )).returning();
    return updated;
  }
  async deleteBarcodeLabelTemplate(id, companyId) {
    await db.delete(barcodeLabelTemplates).where(and(
      eq(barcodeLabelTemplates.id, id),
      eq(barcodeLabelTemplates.companyId, companyId)
    ));
  }
  async getItemMovementHistory(itemId, companyId) {
    const [item] = await db.select().from(items).where(and(eq(items.id, itemId), eq(items.companyId, companyId)));
    if (!item) {
      throw new Error("Item not found");
    }
    const [currentStock] = await db.select().from(stock).where(and(eq(stock.itemId, itemId), eq(stock.companyId, companyId)));
    const currentQty = currentStock ? parseFloat(currentStock.quantity) : 0;
    const avgCost = parseFloat(item.cost);
    const valuation = currentQty * avgCost;
    const purchaseHistory = await db.select({
      purchaseId: purchases.id,
      purchaseNo: purchases.purchaseNo,
      date: purchases.date,
      partyName: parties.name,
      quantity: purchaseItems.quantity,
      rate: purchaseItems.rate,
      mrp: purchaseItems.mrp,
      amount: purchaseItems.amount,
      barcode: purchaseItems.barcode
    }).from(purchaseItems).innerJoin(purchases, eq(purchaseItems.purchaseId, purchases.id)).leftJoin(parties, eq(purchases.partyId, parties.id)).where(and(
      eq(purchaseItems.itemId, itemId),
      eq(purchases.companyId, companyId)
    )).orderBy(desc(purchases.date));
    const salesHistory = await db.select({
      saleId: sales.id,
      invoiceNo: sales.invoiceNo,
      billType: sales.billType,
      date: sales.date,
      partyName: parties.name,
      quantity: saleItems.quantity,
      rate: saleItems.rate,
      amount: saleItems.amount,
      barcode: saleItems.barcode
    }).from(saleItems).innerJoin(sales, eq(saleItems.saleId, sales.id)).leftJoin(parties, eq(sales.partyId, parties.id)).where(and(
      eq(saleItems.itemId, itemId),
      eq(sales.companyId, companyId)
    )).orderBy(desc(sales.date));
    const totalPurchasedQty = purchaseHistory.reduce((sum, p) => sum + parseFloat(p.quantity || "0"), 0);
    const totalSoldQty = salesHistory.reduce((sum, s) => sum + parseFloat(s.quantity || "0"), 0);
    const balanceQty = totalPurchasedQty - totalSoldQty;
    return {
      item,
      stock: { currentQty, avgCost, valuation },
      purchases: purchaseHistory,
      sales: salesHistory,
      movement: { totalPurchasedQty, totalSoldQty, balanceQty }
    };
  }
  // Get stock info for bill entry - available qty and barcode flag
  async getStockInfoForBillEntry(companyId) {
    const result = {};
    const itemsWithStock = await db.select({
      itemId: items.id,
      quantity: stock.quantity
    }).from(items).leftJoin(stock, and(eq(items.id, stock.itemId), eq(stock.companyId, companyId))).where(eq(items.companyId, companyId));
    for (const item of itemsWithStock) {
      const qty = item.quantity ? parseFloat(item.quantity) : 0;
      const [barcodedItem] = await db.select({ id: stockInwardItems.id }).from(stockInwardItems).where(and(eq(stockInwardItems.itemId, item.itemId), eq(stockInwardItems.companyId, companyId))).limit(1);
      result[item.itemId] = {
        itemId: item.itemId,
        availableQty: qty,
        isBarcoded: !!barcodedItem
      };
    }
    return result;
  }
  // ==================== PRINT TOKEN OPERATIONS ====================
  async getPrintToken(companyId) {
    const [token] = await db.select().from(printTokens).where(eq(printTokens.companyId, companyId));
    return token;
  }
  async createOrUpdatePrintToken(companyId, token) {
    await db.delete(printTokens).where(eq(printTokens.companyId, companyId));
    const [newToken] = await db.insert(printTokens).values({ companyId, token }).returning();
    return newToken;
  }
  async deletePrintToken(companyId) {
    await db.delete(printTokens).where(eq(printTokens.companyId, companyId));
  }
  // ==================== PRINT SETTINGS OPERATIONS ====================
  async getPrintSettings(companyId) {
    const [settings] = await db.select().from(printSettings).where(eq(printSettings.companyId, companyId));
    return settings;
  }
  async upsertPrintSettings(companyId, settings) {
    const existing = await this.getPrintSettings(companyId);
    if (existing) {
      const [updated] = await db.update(printSettings).set({ ...settings, updatedAt: /* @__PURE__ */ new Date() }).where(eq(printSettings.companyId, companyId)).returning();
      return updated;
    } else {
      const [created] = await db.insert(printSettings).values({ companyId, ...settings }).returning();
      return created;
    }
  }
  async getAgentCommissionReport(companyId) {
    try {
      const agentsData = await db.select().from(agentsTable).where(eq(agentsTable.companyId, companyId));
      const salesData = await db.select().from(salesTable).where(eq(salesTable.companyId, companyId));
      const paymentsData = await db.select().from(paymentsTable).where(eq(paymentsTable.companyId, companyId));
      const partiesData = await db.select().from(partiesTable).where(eq(partiesTable.companyId, companyId));
      return agentsData.map((agent) => {
        const agentParties = partiesData.filter((p) => p.agentId === agent.id);
        const agentPartyIds = agentParties.map((p) => p.id);
        const totalSalesAmount = salesData.filter((s) => agentPartyIds.includes(s.partyId || -1)).reduce((sum, s) => sum + parseFloat(s.totalAmount || "0"), 0);
        const totalPaymentReceived = paymentsData.filter((p) => agentPartyIds.includes(p.partyId || -1)).reduce((sum, p) => sum + parseFloat(p.credit || "0"), 0);
        const commissionAmount = totalPaymentReceived * (parseFloat(agent.commission || "0") / 100);
        return {
          agentId: agent.id,
          agentCode: agent.code,
          agentName: agent.name,
          commissionPercentage: parseFloat(agent.commission || "0"),
          totalSalesAmount: totalSalesAmount.toString(),
          totalPaymentReceived: totalPaymentReceived.toString(),
          commissionAmount
        };
      });
    } catch (error) {
      console.error("Error fetching agent commission report:", error);
      return [];
    }
  }
  async getBarcodesByIds(ids) {
    return await db.select({
      id: stockInwardItems.id,
      barcode: stockInwardItems.barcode,
      itemName: stockInwardItems.itemName,
      itemCode: items.code,
      mrp: items.mrp,
      sellingPrice: items.sellingPrice,
      hsnCode: items.hsnCode
    }).from(stockInwardItems).leftJoin(items, eq(stockInwardItems.itemId, items.id)).where(inArray(stockInwardItems.id, ids));
  }
};
var storage = new DatabaseStorage();

// server/localAuth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
async function ensureSessionsTable() {
  try {
    const { pool: pool2 } = await Promise.resolve().then(() => (init_db(), db_exports));
    await pool2.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid varchar NOT NULL COLLATE "default",
        sess json NOT NULL,
        expire timestamp(6) NOT NULL,
        PRIMARY KEY (sid)
      ) WITH (OIDS=FALSE);
      
      CREATE INDEX IF NOT EXISTS "IDX_sessions_expire" on "sessions" ("expire");
    `);
    console.log("\u2705 Sessions table ready");
  } catch (error) {
    console.error("\u26A0\uFE0F  Warning: Could not ensure sessions table:", error);
  }
}
function getSession() {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    if (process.env.NODE_ENV === "production") {
      console.error("FATAL: SESSION_SECRET environment variable is required in production");
      process.exit(1);
    }
    console.warn("\u26A0\uFE0F  WARNING: SESSION_SECRET not set. Using insecure fallback for development only.");
    console.warn("\u26A0\uFE0F  Set SESSION_SECRET environment variable for production deployment.");
  }
  const secret = sessionSecret || "dev-insecure-secret-change-in-production";
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  const shouldUseSecureCookies = process.env.NODE_ENV === "production";
  console.log("[SESSION] \u2705 Session initialized");
  console.log("[SESSION] Node environment:", process.env.NODE_ENV);
  console.log("[SESSION] Using secure cookies:", shouldUseSecureCookies);
  console.log("[SESSION] Session path: /");
  return session({
    secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: shouldUseSecureCookies,
      sameSite: "lax",
      maxAge: sessionTtl,
      path: "/"
    }
  });
}
async function setupAuth(app2) {
  await ensureSessionsTable();
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !user.passwordHash) {
          return done(null, false, { message: "Invalid username or password" });
        }
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(null, false);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    console.log("[AUTH] ========== LOGIN REQUEST RECEIVED ==========");
    console.log("[AUTH] Body:", JSON.stringify(req.body));
    console.log("[AUTH] Username:", req.body?.username);
    if (!req.body?.username || !req.body?.password) {
      console.log("[AUTH] Missing username or password");
      return res.status(400).json({ message: "Username and password required" });
    }
    passport.authenticate("local", async (err, user, info) => {
      console.log("[AUTH] Passport authenticate callback");
      console.log("[AUTH] Error:", err);
      console.log("[AUTH] User found:", !!user);
      console.log("[AUTH] Info:", info);
      if (err) {
        console.error("[AUTH] Authentication error:", err);
        return res.status(500).json({ message: "Login error" });
      }
      if (!user) {
        console.log("[AUTH] No user found - invalid credentials");
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      if (user.role !== "superadmin") {
        try {
          const userCompanies2 = await storage.getUserCompanies(user.id);
          const now = /* @__PURE__ */ new Date();
          const hasValidCompany = userCompanies2.some((uc) => {
            const expiryDate = new Date(uc.company.expiryDate);
            return expiryDate > now;
          });
          if (!hasValidCompany) {
            console.log("[AUTH] Non-superadmin user login denied - all companies expired");
            return res.status(403).json({ message: "Company license has expired. Please recharge to login." });
          }
        } catch (error) {
          console.error("[AUTH] Error checking company expiry:", error);
          return res.status(500).json({ message: "Error checking company status" });
        }
      }
      console.log("[AUTH] User authenticated, creating session...");
      req.login(user, (err2) => {
        if (err2) {
          console.error("[AUTH] Session creation error:", err2);
          return res.status(500).json({ message: "Login error" });
        }
        console.log("[AUTH] \u2705 LOGIN SUCCESSFUL! User:", user.username);
        return res.json({ user });
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout error" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
}
var isAuthenticated = async (req, res, next) => {
  const isAuth = req.isAuthenticated();
  if (!isAuth) {
    console.log("[AUTH] Unauthorized request to:", req.path, "Session:", !!req.session, "User:", !!req.user);
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = req.user;
  if (user?.role !== "superadmin") {
    try {
      const userCompanies2 = await storage.getUserCompanies(user.id);
      const now = /* @__PURE__ */ new Date();
      const hasValidCompany = userCompanies2.some((uc) => {
        const expiryDate = new Date(uc.company.expiryDate);
        return expiryDate > now;
      });
      if (!hasValidCompany) {
        console.log("[AUTH] Session expiry check: Company expired for user", user.username);
        req.logout((err) => {
          if (err) {
            console.error("[AUTH] Error logging out expired user:", err);
          }
          return res.status(403).json({
            message: "Company license has expired. Please recharge to login.",
            expired: true
          });
        });
        return;
      }
    } catch (error) {
      console.error("[AUTH] Error checking company expiry:", error);
      return next();
    }
  }
  return next();
};

// server/companyMiddleware.ts
init_db();
init_schema();
import { and as and2, eq as eq2 } from "drizzle-orm";
async function validateCompanyAccess(req, res, next) {
  const companyIdHeader = req.headers["x-company-id"];
  if (!companyIdHeader) {
    return res.status(400).json({ message: "Company ID is required" });
  }
  const companyId = parseInt(companyIdHeader);
  if (isNaN(companyId)) {
    return res.status(400).json({ message: "Invalid company ID" });
  }
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const [userCompany] = await db.select().from(userCompanies).where(
    and2(
      eq2(userCompanies.userId, userId),
      eq2(userCompanies.companyId, companyId)
    )
  ).limit(1);
  if (!userCompany) {
    return res.status(403).json({ message: "Access to this company is forbidden" });
  }
  const [currentUser] = await db.select({ role: users.role }).from(users).where(eq2(users.id, userId)).limit(1);
  const isSuperAdmin = currentUser?.role === "superadmin";
  if (!isSuperAdmin) {
    const [company] = await db.select({ expiryDate: companies.expiryDate }).from(companies).where(eq2(companies.id, companyId)).limit(1);
    if (company?.expiryDate) {
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(company.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      if (expiryDate < today) {
        return res.status(403).json({
          message: "Company license has expired. Please contact administrator.",
          expired: true
        });
      }
    }
  }
  req.companyId = companyId;
  next();
}

// server/routes.ts
init_db();
init_schema();
import { z as z2 } from "zod";
import bcrypt2 from "bcryptjs";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import archiver from "archiver";

// server/objectStorage.ts
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";
var REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
var objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token"
      }
    },
    universe_domain: "googleapis.com"
  },
  projectId: ""
});
var ObjectStorageService = class {
  constructor() {
  }
  getPublicObjectSearchPaths() {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const paths = Array.from(
      new Set(
        pathsStr.split(",").map((path2) => path2.trim()).filter((path2) => path2.length > 0)
      )
    );
    return paths;
  }
  getPrivateObjectDir() {
    const dir = process.env.PRIVATE_OBJECT_DIR || "";
    return dir;
  }
  async searchPublicObject(filePath) {
    const searchPaths = this.getPublicObjectSearchPaths();
    if (searchPaths.length === 0) {
      return null;
    }
    for (const searchPath of searchPaths) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      const [exists] = await file.exists();
      if (exists) {
        return file;
      }
    }
    return null;
  }
  async downloadObject(file, res, cacheTtlSec = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": metadata.size,
        "Cache-Control": `public, max-age=${cacheTtlSec}`
      });
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }
  async getObjectEntityUploadURL() {
    const privateObjectDir = this.getPrivateObjectDir();
    if (!privateObjectDir) {
      throw new Error("PRIVATE_OBJECT_DIR not set");
    }
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900
    });
  }
  normalizeObjectEntityPath(rawPath) {
    if (!rawPath.startsWith("https://storage.googleapis.com/")) {
      return rawPath;
    }
    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;
    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith("/")) {
      objectEntityDir = `${objectEntityDir}/`;
    }
    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }
    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }
};
function parseObjectPath(path2) {
  if (!path2.startsWith("/")) {
    path2 = `/${path2}`;
  }
  const pathParts = path2.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}

// server/routes.ts
var printClients = /* @__PURE__ */ new Map();
function isAdminRole(role) {
  return role === "admin" || role === "superadmin";
}
async function registerRoutes(app2) {
  try {
    await runMigrations();
  } catch (error) {
    console.error("Failed to run migrations:", error);
    process.exit(1);
  }
  await setupAuth(app2);
  app2.get("/api/check-setup", async (req, res) => {
    try {
      const needsSetup = await storage.needsInitialSetup();
      res.json({ needsSetup });
    } catch (error) {
      console.error("Error checking setup:", error);
      res.status(500).json({ message: "Failed to check setup status" });
    }
  });
  app2.post("/api/setup", async (req, res) => {
    try {
      console.log("[SETUP] Setup POST request initiated");
      const needsSetup = await storage.needsInitialSetup();
      console.log("[SETUP] Needs setup check:", needsSetup);
      if (!needsSetup) {
        return res.status(400).json({ message: "System is already set up" });
      }
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const passwordHash = await bcrypt2.hash(password, 10);
      const userRole = "superadmin";
      const userFirstName = "Super";
      const userLastName = "Admin";
      console.log("[SETUP] Creating superadmin with role:", userRole, "username:", username);
      const user = await storage.createUser({
        username,
        passwordHash,
        role: userRole,
        firstName: userFirstName,
        lastName: userLastName
      });
      console.log("[SETUP] User created:", { id: user.id, username: user.username, role: user.role });
      req.logIn(user, async (err) => {
        if (err) {
          console.error("[SETUP] Error logging in user:", err);
          return res.status(500).json({ message: "User created but login failed: " + err.message });
        }
        try {
          await storage.assignUserToDefaultCompany(user.id);
          console.log("[SETUP] User assigned to default company");
        } catch (companyErr) {
          console.error("[SETUP] Error assigning company:", companyErr);
        }
        res.json({
          message: "Setup complete! Super admin account created successfully.",
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        });
      });
    } catch (error) {
      console.error("[SETUP] Error during setup:", error);
      res.status(500).json({ message: "Failed to complete setup: " + (error instanceof Error ? error.message : "Unknown error") });
    }
  });
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only admin users can access user management" });
      }
      const allUsers = await storage.getAllUsers();
      let filteredUsers = allUsers;
      if (currentUser?.role === "admin") {
        filteredUsers = allUsers.filter((u) => u.role !== "superadmin");
      }
      res.json(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.put("/api/users/:id/role", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only super admin can manage roles" });
      }
      const { role } = req.body;
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const user = await storage.updateUserRole(req.params.id, role);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  app2.put("/api/users/:id/permissions", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only super admin can manage permissions" });
      }
      const { role, pagePermissions } = req.body;
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const user = await storage.updateUserPermissions(req.params.id, role, pagePermissions);
      res.json(user);
    } catch (error) {
      console.error("Error updating user permissions:", error);
      res.status(500).json({ message: "Failed to update user permissions" });
    }
  });
  app2.put("/api/users/:id/password", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only super admin can update passwords" });
      }
      const { password } = req.body;
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const passwordHash = await bcrypt2.hash(password, 10);
      const user = await storage.updateUserPassword(req.params.id, passwordHash);
      res.json(user);
    } catch (error) {
      console.error("Error updating user password:", error);
      res.status(500).json({ message: "Failed to update user password" });
    }
  });
  app2.post("/api/users/create", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only admin users can create users" });
      }
      const createUserSchema = z2.object({
        username: z2.string().min(1, "Username is required"),
        password: z2.string().min(6, "Password must be at least 6 characters"),
        firstName: z2.string().optional(),
        lastName: z2.string().optional(),
        email: z2.string().email().optional().or(z2.literal("")),
        role: z2.enum(["user", "admin"]),
        pagePermissions: z2.array(z2.string()).optional(),
        companyIds: z2.array(z2.number()).optional()
      });
      const validated = createUserSchema.parse(req.body);
      if (validated.role === "superadmin") {
        return res.status(403).json({ message: "Cannot create superadmin users" });
      }
      if (validated.email === "") validated.email = void 0;
      if (validated.firstName === "") validated.firstName = void 0;
      if (validated.lastName === "") validated.lastName = void 0;
      const passwordHash = await bcrypt2.hash(validated.password, 10);
      const newUser = await storage.createUser({
        username: validated.username,
        passwordHash,
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email,
        role: validated.role,
        pagePermissions: validated.pagePermissions || []
      });
      if (validated.companyIds && validated.companyIds.length > 0) {
        for (let i = 0; i < validated.companyIds.length; i++) {
          await storage.assignUserToCompany(
            newUser.id,
            validated.companyIds[i],
            i === 0
            // First company is default
          );
        }
      }
      res.json(newUser);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  app2.delete("/api/users/:id", isAuthenticated, async (req, res) => {
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
  app2.get("/api/user-companies", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const userCompanies2 = await storage.getUserCompanies(userId);
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(userCompanies2);
    } catch (error) {
      console.error("Error fetching user companies:", error);
      res.status(500).json({ message: "Failed to fetch user companies" });
    }
  });
  app2.get("/api/users/:id/companies", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only super admin can view user companies" });
      }
      const userCompanies2 = await storage.getUserCompanies(req.params.id);
      res.json(userCompanies2);
    } catch (error) {
      console.error("Error fetching user companies:", error);
      res.status(500).json({ message: "Failed to fetch user companies" });
    }
  });
  app2.post("/api/users/:id/companies", isAuthenticated, async (req, res) => {
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
  app2.delete("/api/users/:id/companies/:companyId", isAuthenticated, async (req, res) => {
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
  app2.get("/api/companies", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only super admin can view all companies" });
      }
      const companies2 = await storage.getCompanies();
      res.json(companies2);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });
  app2.post("/api/companies", isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only super admin can create companies" });
      }
      const validated = insertCompanySchema.parse(req.body);
      const companyData = {
        ...validated,
        fyStartMonth: validated.fyStartMonth ?? 4,
        fyStartDay: validated.fyStartDay ?? 1
      };
      const userId = req.user.id;
      const company = await storage.createCompany(companyData, userId);
      res.json(company);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });
  app2.put("/api/companies/:id", isAuthenticated, async (req, res) => {
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
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });
  app2.delete("/api/companies/:id", isAuthenticated, async (req, res) => {
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
  app2.get("/api/financial-years", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const financialYears2 = await storage.getFinancialYears(req.companyId);
      res.json(financialYears2);
    } catch (error) {
      console.error("Error fetching financial years:", error);
      res.status(500).json({ message: "Failed to fetch financial years" });
    }
  });
  app2.get("/api/financial-years/active", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const activeFY = await storage.getActiveFinancialYear(req.companyId);
      res.json(activeFY || null);
    } catch (error) {
      console.error("Error fetching active financial year:", error);
      res.status(500).json({ message: "Failed to fetch active financial year" });
    }
  });
  app2.get("/api/financial-years/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
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
  app2.post("/api/financial-years", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only admin can create financial years" });
      }
      const validated = insertFinancialYearSchema.parse({
        ...req.body,
        companyId: req.companyId
      });
      const fy = await storage.createFinancialYear(validated);
      res.json(fy);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating financial year:", error);
      res.status(500).json({ message: "Failed to create financial year" });
    }
  });
  app2.put("/api/financial-years/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
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
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating financial year:", error);
      res.status(500).json({ message: "Failed to update financial year" });
    }
  });
  app2.post("/api/financial-years/:id/activate", isAuthenticated, validateCompanyAccess, async (req, res) => {
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
  app2.delete("/api/financial-years/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only admin can delete financial years" });
      }
      const id = parseInt(req.params.id);
      await storage.deleteFinancialYear(id, req.companyId);
      res.json({ success: true, message: "Financial year deleted successfully" });
    } catch (error) {
      console.error("Error deleting financial year:", error);
      res.status(500).json({ message: error.message || "Failed to delete financial year" });
    }
  });
  app2.get("/api/parties", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const parties2 = await storage.getParties(req.companyId);
      res.json(parties2);
    } catch (error) {
      console.error("Error fetching parties:", error);
      res.status(500).json({ message: "Failed to fetch parties" });
    }
  });
  app2.get("/api/parties/export", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const parties2 = await storage.getParties(req.companyId);
      const exportData = parties2.map((party) => ({
        Code: party.code || "",
        Name: party.name || "",
        City: party.city || "",
        State: party.state || "",
        StateCode: party.stateCode || "",
        Address: party.address || "",
        GSTNo: party.gstNo || "",
        Phone: party.phone || "",
        OpeningDebit: parseFloat(party.openingDebit) || 0,
        OpeningCredit: parseFloat(party.openingCredit) || 0
      }));
      res.json(exportData);
    } catch (error) {
      console.error("Export parties error:", error?.message || error);
      res.status(500).json({ message: "Failed to export parties: " + (error?.message || "Unknown error") });
    }
  });
  app2.get("/api/parties/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
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
  app2.post("/api/parties", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const validated = insertPartySchema.parse(req.body);
      const userId = req.user.id;
      const party = await storage.createParty(validated, userId, req.companyId);
      res.json(party);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating party:", error);
      res.status(500).json({ message: "Failed to create party" });
    }
  });
  app2.put("/api/parties/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertPartySchema.parse(req.body);
      const party = await storage.updateParty(id, validated, req.companyId);
      res.json(party);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating party:", error);
      res.status(500).json({ message: "Failed to update party" });
    }
  });
  app2.get("/api/agents", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const agents2 = await storage.getAgents(req.companyId);
      res.json(agents2);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });
  app2.get("/api/agents/next-code", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const nextCode = await storage.getNextAgentCode(req.companyId);
      res.json({ nextCode });
    } catch (error) {
      console.error("Error fetching next agent code:", error);
      res.status(500).json({ message: "Failed to fetch next agent code" });
    }
  });
  app2.get("/api/agents/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
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
  app2.post("/api/agents", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const validated = insertAgentSchema.parse(req.body);
      const userId = req.user.id;
      const agent = await storage.createAgent(validated, userId, req.companyId);
      res.json(agent);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating agent:", error);
      res.status(500).json({ message: "Failed to create agent" });
    }
  });
  app2.put("/api/agents/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertAgentSchema.parse(req.body);
      const agent = await storage.updateAgent(id, validated, req.companyId);
      res.json(agent);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating agent:", error);
      res.status(500).json({ message: "Failed to update agent" });
    }
  });
  app2.get("/api/items", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const items2 = await storage.getItems(req.companyId);
      res.json(items2);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });
  app2.get("/api/items/export", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const items2 = await storage.getItems(req.companyId);
      const exportData = items2.map((item) => ({
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
        Active: item.active ? "Yes" : "No"
      }));
      res.json(exportData);
    } catch (error) {
      console.error("Export items error:", error?.message || error);
      res.status(500).json({ message: "Failed to export items: " + (error?.message || "Unknown error") });
    }
  });
  app2.get("/api/items/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
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
  app2.post("/api/items", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const validated = insertItemSchema.parse(req.body);
      const userId = req.user.id;
      const item = await storage.createItem(validated, userId, req.companyId);
      res.json(item);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating item:", error);
      res.status(500).json({ message: "Failed to create item" });
    }
  });
  app2.put("/api/items/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertItemSchema.parse(req.body);
      const item = await storage.updateItem(id, validated, req.companyId);
      res.json(item);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating item:", error);
      res.status(500).json({ message: "Failed to update item" });
    }
  });
  app2.get("/api/items/:id/history", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const history = await storage.getItemMovementHistory(id, req.companyId);
      res.json(history);
    } catch (error) {
      if (error.message === "Item not found") {
        return res.status(404).json({ message: "Item not found" });
      }
      console.error("Error fetching item history:", error);
      res.status(500).json({ message: "Failed to fetch item history" });
    }
  });
  app2.post("/api/items/import", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ message: "No data provided" });
      }
      const userId = req.user.id;
      let created = 0, updated = 0;
      const errors = [];
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
            active: String(row.Active || "Yes").toLowerCase() !== "no"
          };
          if (!itemData.name) {
            errors.push("Row skipped: missing Name");
            continue;
          }
          if (itemData.code) {
            const existing = await storage.getItemByCode(itemData.code, req.companyId);
            if (existing) {
              await storage.updateItem(existing.id, itemData, req.companyId);
              updated++;
              continue;
            }
          }
          await storage.createItem(itemData, userId, req.companyId);
          created++;
        } catch (e) {
          errors.push(e.message);
        }
      }
      res.json({ message: "Import complete", created, updated, errors: errors.slice(0, 10) });
    } catch (error) {
      res.status(500).json({ message: "Failed to import items" });
    }
  });
  app2.post("/api/parties/import", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const { rows } = req.body;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ message: "No data provided" });
      }
      const userId = req.user.id;
      let created = 0, updated = 0;
      const errors = [];
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
            openingCredit: String(parseFloat(row.OpeningCredit || row.openingCredit || 0))
          };
          if (!partyData.name) {
            errors.push("Row skipped: missing Name");
            continue;
          }
          if (partyData.code) {
            const existing = await storage.getPartyByCode(partyData.code, req.companyId);
            if (existing) {
              await storage.updateParty(existing.id, partyData, req.companyId);
              updated++;
              continue;
            }
          }
          await storage.createParty(partyData, userId, req.companyId);
          created++;
        } catch (e) {
          errors.push(e.message);
        }
      }
      res.json({ message: "Import complete", created, updated, errors: errors.slice(0, 10) });
    } catch (error) {
      res.status(500).json({ message: "Failed to import parties" });
    }
  });
  app2.get("/api/sales", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const sales2 = await storage.getSales(req.companyId);
      res.json(sales2);
    } catch (error) {
      console.error("Error fetching sales:", error);
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });
  app2.post("/api/sales", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const { items: saleItems2, ...saleData } = req.body;
      if (!saleItems2 || saleItems2.length === 0) {
        return res.status(400).json({ message: "At least one item is required" });
      }
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
      const sale = await storage.createSale(saleData, saleItems2, userId, req.companyId);
      res.json(sale);
    } catch (error) {
      console.error("Error creating sale:", error);
      res.status(500).json({ message: "Failed to create sale" });
    }
  });
  app2.get("/api/sales/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
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
  app2.get("/api/sales/:id/items", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const items2 = await storage.getSaleItems(parseInt(req.params.id), req.companyId);
      res.json(items2);
    } catch (error) {
      console.error("Error fetching sale items:", error);
      res.status(500).json({ message: "Failed to fetch sale items" });
    }
  });
  app2.put("/api/sales/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const { items: saleItems2, ...saleData } = req.body;
      if (!saleItems2 || !Array.isArray(saleItems2) || saleItems2.length === 0) {
        return res.status(400).json({ message: "At least one item is required" });
      }
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
      for (const item of saleItems2) {
        if (!item.itemName || item.quantity === void 0 || item.rate === void 0) {
          return res.status(400).json({ message: "Each item must have itemName, quantity, and rate" });
        }
        if (typeof item.quantity !== "number" || item.quantity <= 0) {
          return res.status(400).json({ message: "Quantity must be a positive number" });
        }
        if (typeof item.rate !== "number" || item.rate < 0) {
          return res.status(400).json({ message: "Rate must be a non-negative number" });
        }
      }
      const sale = await storage.updateSale(parseInt(req.params.id), saleData, saleItems2, req.companyId);
      res.json(sale);
    } catch (error) {
      console.error("Error updating sale:", error);
      res.status(500).json({ message: "Failed to update sale" });
    }
  });
  app2.get("/api/purchases", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const purchases2 = await storage.getPurchases(req.companyId);
      res.json(purchases2);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      res.status(500).json({ message: "Failed to fetch purchases" });
    }
  });
  app2.get("/api/purchases/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
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
  app2.get("/api/next-serial", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const nextSerial = await storage.getNextSerial(req.companyId);
      res.json({ serial: nextSerial });
    } catch (error) {
      console.error("Error fetching next serial:", error);
      res.status(500).json({ message: "Failed to fetch next serial" });
    }
  });
  app2.post("/api/purchases", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const { purchase, items: items2 } = req.body;
      if (!purchase || !items2 || !Array.isArray(items2)) {
        return res.status(400).json({ message: "Purchase and items array required" });
      }
      const validatedPurchase = insertPurchaseSchema.parse(purchase);
      const userId = req.user.id;
      const newPurchase = await storage.createPurchase(validatedPurchase, items2, userId, req.companyId);
      res.json(newPurchase);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating purchase:", error);
      res.status(500).json({ message: "Failed to create purchase" });
    }
  });
  app2.get("/api/payments", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const payments2 = await storage.getPayments(req.companyId);
      res.json(payments2);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });
  app2.post("/api/payments", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const validated = insertPaymentSchema.parse(req.body);
      const userId = req.user.id;
      const payment = await storage.createPayment(validated, userId, req.companyId);
      res.json(payment);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });
  app2.put("/api/payments/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertPaymentSchema.parse(req.body);
      const payment = await storage.updatePayment(id, validated, req.companyId);
      res.json(payment);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating payment:", error);
      res.status(500).json({ message: "Failed to update payment" });
    }
  });
  app2.delete("/api/payments/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePayment(id, req.companyId);
      res.json({ message: "Payment deleted successfully" });
    } catch (error) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ message: "Failed to delete payment" });
    }
  });
  app2.get("/api/stock", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const { partyId, itemId } = req.query;
      const stock2 = await storage.getStock(
        req.companyId,
        partyId ? parseInt(partyId) : void 0,
        itemId ? parseInt(itemId) : void 0
      );
      res.json(stock2);
    } catch (error) {
      console.error("Error fetching stock:", error);
      res.status(500).json({ message: "Failed to fetch stock" });
    }
  });
  app2.get("/api/stock/info/:companyId", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const stockInfo = await storage.getStockInfoForBillEntry(req.companyId);
      res.json(stockInfo);
    } catch (error) {
      console.error("Error fetching stock info:", error);
      res.status(500).json({ message: "Failed to fetch stock info" });
    }
  });
  app2.get("/api/inventory/barcode/:barcode", isAuthenticated, validateCompanyAccess, async (req, res) => {
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
  app2.get("/api/parties/:id/outstanding", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const partyId = parseInt(req.params.id);
      const outstanding = await storage.getPartyOutstanding(partyId, req.companyId);
      res.json({ partyId, outstanding });
    } catch (error) {
      console.error("Error fetching party outstanding:", error);
      res.status(500).json({ message: "Failed to fetch party outstanding" });
    }
  });
  app2.get("/api/dashboard/metrics", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics(req.companyId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });
  app2.get("/api/reports/outstanding", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const outstanding = await storage.getOutstanding(req.companyId);
      res.json(outstanding);
    } catch (error) {
      console.error("Error fetching outstanding:", error);
      res.status(500).json({ message: "Failed to fetch outstanding" });
    }
  });
  app2.get("/api/reports/sales", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const { startDate, endDate, saleType, itemId } = req.query;
      const salesData = await storage.getSalesReport(
        req.companyId,
        startDate,
        endDate,
        saleType,
        itemId
      );
      res.json(salesData);
    } catch (error) {
      console.error("Error fetching sales report:", error);
      res.status(500).json({ message: "Failed to fetch sales report" });
    }
  });
  app2.get("/api/reports/purchases", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const purchasesData = await storage.getPurchasesReport(
        req.companyId,
        startDate,
        endDate
      );
      res.json(purchasesData);
    } catch (error) {
      console.error("Error fetching purchases report:", error);
      res.status(500).json({ message: "Failed to fetch purchases report" });
    }
  });
  app2.get("/api/reports/items", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const { startDate, endDate, saleType, itemId, category } = req.query;
      const items2 = await storage.getItemsReport(
        req.companyId,
        startDate,
        endDate,
        saleType,
        itemId,
        category
      );
      res.json(items2);
    } catch (error) {
      console.error("Error fetching items report:", error);
      res.status(500).json({ message: "Failed to fetch items report" });
    }
  });
  app2.get("/api/reports/categories", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const { startDate, endDate, saleType } = req.query;
      const categories = await storage.getCategoriesReport(
        req.companyId,
        startDate,
        endDate,
        saleType
      );
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories report:", error);
      res.status(500).json({ message: "Failed to fetch categories report" });
    }
  });
  app2.get("/api/reports/payments", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const { startDate, endDate, type } = req.query;
      const paymentsData = await storage.getPaymentsReport(
        req.companyId,
        startDate,
        endDate,
        type
      );
      res.json(paymentsData);
    } catch (error) {
      console.error("Error fetching payments report:", error);
      res.status(500).json({ message: "Failed to fetch payments report" });
    }
  });
  app2.get("/api/reports/sales-total", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const { fromDate, toDate, billType } = req.query;
      const reportData = await storage.getSalesTotalReport(
        req.companyId,
        fromDate,
        toDate,
        billType
      );
      res.json(reportData);
    } catch (error) {
      console.error("Error fetching sales total report:", error);
      res.status(500).json({ message: "Failed to fetch sales total report" });
    }
  });
  app2.get("/api/reports/gstr1", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      console.log("[GSTR1] User:", req.user?.id, "Company:", req.companyId);
      const { startDate, endDate, saleType } = req.query;
      console.log("[GSTR1] Params:", { startDate, endDate, saleType });
      const gstrData = await storage.getGSTR1Data(
        req.companyId,
        startDate,
        endDate,
        saleType
      );
      console.log("[GSTR1] Data count:", gstrData?.length);
      res.json(gstrData);
    } catch (error) {
      console.error("Error fetching GSTR1 data:", error);
      res.status(500).json({ message: "Failed to fetch GSTR1 data" });
    }
  });
  app2.get("/api/reports/hsn-summary", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const { startDate, endDate, saleType } = req.query;
      const hsnData = await storage.getHSNSummaryData(
        req.companyId,
        startDate,
        endDate,
        saleType
      );
      res.json(hsnData);
    } catch (error) {
      console.error("Error fetching HSN summary data:", error);
      res.status(500).json({ message: "Failed to fetch HSN summary data" });
    }
  });
  app2.get("/api/sales/:id/einvoice-json", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const saleId = parseInt(req.params.id);
      const eInvoiceJSON = await storage.generateEInvoiceJSON(saleId, req.companyId);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="einvoice-${saleId}.json"`);
      res.json([eInvoiceJSON]);
    } catch (error) {
      console.error("Error generating e-Invoice JSON:", error);
      res.status(400).json({ message: error.message || "Failed to generate e-Invoice JSON" });
    }
  });
  app2.patch("/api/sales/:id/einvoice", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const saleId = parseInt(req.params.id);
      const { irn, ackNumber, ackDate, qrCode, einvoiceStatus, signedInvoice } = req.body;
      const updatedSale = await storage.updateSaleEinvoice(saleId, req.companyId, {
        irn,
        ackNumber,
        ackDate: ackDate ? new Date(ackDate) : null,
        qrCode,
        einvoiceStatus: einvoiceStatus || "generated",
        signedInvoice
      });
      res.json(updatedSale);
    } catch (error) {
      console.error("Error updating e-Invoice details:", error);
      res.status(400).json({ message: error.message || "Failed to update e-Invoice details" });
    }
  });
  app2.get("/api/reports/ledger/:partyId", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const partyId = parseInt(req.params.partyId);
      const { startDate, endDate } = req.query;
      const ledger = await storage.getPartyLedger(
        partyId,
        req.companyId,
        startDate,
        endDate
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
  app2.get("/api/bill-templates", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const templates = await storage.getBillTemplates(req.companyId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching bill templates:", error);
      res.status(500).json({ message: "Failed to fetch bill templates" });
    }
  });
  app2.get("/api/bill-templates/assigned/:type", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const { type } = req.params;
      const template = await storage.getBillTemplateByAssignment(type, req.companyId);
      res.json(template || null);
    } catch (error) {
      console.error("Error fetching assigned bill template:", error);
      res.status(500).json({ message: "Failed to fetch bill template" });
    }
  });
  app2.post("/api/bill-templates", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only admin can create bill templates" });
      }
      const validated = insertBillTemplateSchema.parse(req.body);
      const template = await storage.createBillTemplate(validated, req.user.id, req.companyId);
      res.json(template);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating bill template:", error);
      res.status(500).json({ message: "Failed to create bill template" });
    }
  });
  app2.put("/api/bill-templates/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user.id);
      if (!isAdminRole(currentUser?.role)) {
        return res.status(403).json({ message: "Only admin can update bill templates" });
      }
      const validated = insertBillTemplateSchema.parse(req.body);
      const template = await storage.updateBillTemplate(parseInt(req.params.id), validated, req.companyId);
      res.json(template);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating bill template:", error);
      res.status(500).json({ message: "Failed to update bill template" });
    }
  });
  app2.delete("/api/bill-templates/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
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
  app2.post("/api/purchase-entries", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const validated = insertPurchaseSchema.parse(req.body);
      const userId = req.user.id;
      const purchase = await storage.createPurchaseEntry(validated, userId, req.companyId);
      res.json(purchase);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating purchase entry:", error);
      res.status(500).json({ message: "Failed to create purchase entry" });
    }
  });
  app2.put("/api/purchase-entries/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const purchase = await storage.updatePurchase(id, req.body, req.companyId);
      res.json(purchase);
    } catch (error) {
      console.error("Error updating purchase entry:", error);
      res.status(500).json({ message: "Failed to update purchase entry" });
    }
  });
  app2.get("/api/pending-purchases", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const purchases2 = await storage.getPendingPurchases(req.companyId);
      res.json(purchases2);
    } catch (error) {
      console.error("Error fetching pending purchases:", error);
      res.status(500).json({ message: "Failed to fetch pending purchases" });
    }
  });
  app2.get("/api/purchase-tally", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const tallyStatus = await storage.getPurchaseTallyStatus(req.companyId);
      res.json(tallyStatus);
    } catch (error) {
      console.error("Error fetching purchase tally status:", error);
      res.status(500).json({ message: "Failed to fetch purchase tally status" });
    }
  });
  app2.get("/api/size-master", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const sizes = await storage.getSizeMaster();
      res.json(sizes);
    } catch (error) {
      console.error("Error fetching size master:", error);
      res.status(500).json({ message: "Failed to fetch size master" });
    }
  });
  app2.get("/api/next-global-serial", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const serial2 = await storage.getNextGlobalSerial(req.companyId);
      res.json({ serial: serial2 });
    } catch (error) {
      console.error("Error fetching next global serial:", error);
      res.status(500).json({ message: "Failed to fetch next global serial" });
    }
  });
  app2.get("/api/purchases/:id/items", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const purchaseId = parseInt(req.params.id);
      const items2 = await storage.getPurchaseItems(purchaseId, req.companyId);
      res.json(items2);
    } catch (error) {
      console.error("Error fetching purchase items:", error);
      res.status(500).json({ message: "Failed to fetch purchase items" });
    }
  });
  app2.post("/api/purchase-items", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const item = await storage.addPurchaseItem(req.body, req.companyId);
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
  app2.put("/api/purchase-items/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.updatePurchaseItem(id, req.body, req.companyId);
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
  app2.delete("/api/purchase-items/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePurchaseItem(id, req.companyId);
      res.json({ message: "Purchase item deleted successfully" });
    } catch (error) {
      console.error("Error deleting purchase item:", error);
      res.status(500).json({ message: "Failed to delete purchase item" });
    }
  });
  app2.post("/api/purchase-items/:id/generate-barcodes", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const purchaseItemId = parseInt(req.params.id);
      const { items: items2 } = req.body;
      if (!items2 || !Array.isArray(items2)) {
        return res.status(400).json({ message: "Items array required" });
      }
      const createdItems = await storage.createStockInwardItems(purchaseItemId, items2, req.companyId);
      res.json(createdItems);
    } catch (error) {
      console.error("Error generating barcodes:", error);
      res.status(500).json({ message: "Failed to generate barcodes" });
    }
  });
  app2.get("/api/purchase-items/:id/stock-inward-items", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const purchaseItemId = parseInt(req.params.id);
      const items2 = await storage.getStockInwardItems(purchaseItemId, req.companyId);
      res.json(items2);
    } catch (error) {
      console.error("Error fetching stock inward items:", error);
      res.status(500).json({ message: "Failed to fetch stock inward items" });
    }
  });
  app2.post("/api/purchases/:id/complete", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const purchaseId = parseInt(req.params.id);
      await storage.completePurchase(purchaseId, req.companyId);
      res.json({ message: "Purchase completed successfully" });
    } catch (error) {
      console.error("Error completing purchase:", error);
      res.status(500).json({ message: "Failed to complete purchase" });
    }
  });
  app2.get("/api/stock-inward-items", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const filters = {};
      if (req.query.purchaseId) filters.purchaseId = parseInt(req.query.purchaseId);
      if (req.query.status) filters.status = req.query.status;
      if (req.query.size) filters.size = req.query.size;
      const items2 = await storage.getAllStockInwardItems(req.companyId, filters);
      res.json(items2);
    } catch (error) {
      console.error("Error fetching stock inward items:", error);
      res.status(500).json({ message: "Failed to fetch stock inward items" });
    }
  });
  app2.get("/api/stock-inward-items/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
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
  app2.patch("/api/stock-inward-items/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = updateStockInwardItemSchema.parse(req.body);
      const updated = await storage.updateStockInwardItem(id, validated, req.companyId);
      res.json(updated);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating stock inward item:", error);
      res.status(500).json({ message: "Failed to update stock inward item" });
    }
  });
  app2.delete("/api/stock-inward-items/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteStockInwardItem(id, req.companyId);
      res.json({ message: "Barcode deleted successfully" });
    } catch (error) {
      console.error("Error deleting stock inward item:", error);
      res.status(500).json({ message: "Failed to delete barcode" });
    }
  });
  app2.post("/api/stock-inward-items/bulk-delete", isAuthenticated, validateCompanyAccess, async (req, res) => {
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
  app2.post("/api/purchase-items/:id/generate-bulk-barcodes", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const purchaseItemId = parseInt(req.params.id);
      const { sizeEntries, baseData } = req.body;
      if (!sizeEntries || !Array.isArray(sizeEntries)) {
        return res.status(400).json({ message: "sizeEntries array required" });
      }
      for (const entry of sizeEntries) {
        if (!entry.size || typeof entry.quantity !== "number" || entry.quantity < 1) {
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
  app2.get("/api/barcode-label-templates", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const templates = await storage.getBarcodeLabelTemplates(req.companyId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching barcode label templates:", error);
      res.status(500).json({ message: "Failed to fetch barcode label templates" });
    }
  });
  app2.get("/api/barcode-label-templates/default", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const template = await storage.getDefaultBarcodeLabelTemplate(req.companyId);
      res.json(template || null);
    } catch (error) {
      console.error("Error fetching default barcode label template:", error);
      res.status(500).json({ message: "Failed to fetch default barcode label template" });
    }
  });
  app2.post("/api/barcode-label-templates", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const validated = insertBarcodeLabelTemplateSchema.parse(req.body);
      const template = await storage.createBarcodeLabelTemplate(validated, req.user.id, req.companyId);
      res.json(template);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating barcode label template:", error);
      res.status(500).json({ message: "Failed to create barcode label template" });
    }
  });
  app2.patch("/api/barcode-label-templates/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.updateBarcodeLabelTemplate(id, req.body, req.companyId);
      res.json(template);
    } catch (error) {
      console.error("Error updating barcode label template:", error);
      res.status(500).json({ message: "Failed to update barcode label template" });
    }
  });
  app2.delete("/api/barcode-label-templates/:id", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBarcodeLabelTemplate(id, req.companyId);
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Error deleting barcode label template:", error);
      res.status(500).json({ message: "Failed to delete barcode label template" });
    }
  });
  app2.post("/api/objects/upload", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL. Make sure object storage is configured." });
    }
  });
  app2.post("/api/print/generate-token", isAuthenticated, async (req, res) => {
    try {
      const companyId = parseInt(req.headers["x-company-id"]) || req.user?.companyId;
      if (!companyId) {
        return res.status(400).json({ success: false, message: "Company ID required" });
      }
      const token = Array.from(crypto.getRandomValues(new Uint8Array(32))).map((b) => b.toString(16).padStart(2, "0")).join("");
      const savedToken = await storage.createOrUpdatePrintToken(companyId, token);
      for (const [clientToken, client] of printClients.entries()) {
        if (client && client.readyState === WebSocket.OPEN) {
          client.close(1e3, "Token rotated");
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
  app2.get("/api/print/validate-token", isAuthenticated, async (req, res) => {
    try {
      const token = req.query.token;
      const companyId = parseInt(req.headers["x-company-id"]) || req.user?.companyId;
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
  app2.get("/api/print-settings", isAuthenticated, validateCompanyAccess, async (req, res) => {
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
          webSocketPrinterName: ""
        });
      }
      res.json(settings);
    } catch (error) {
      console.error("Error getting print settings:", error);
      res.status(500).json({ message: "Failed to get print settings" });
    }
  });
  app2.post("/api/print-settings", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const settings = await storage.upsertPrintSettings(req.companyId, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error saving print settings:", error);
      res.status(500).json({ message: "Failed to save print settings" });
    }
  });
  app2.get("/api/print/status", isAuthenticated, async (req, res) => {
    try {
      const companyId = parseInt(req.headers["x-company-id"]) || req.user?.companyId;
      const savedToken = await storage.getPrintToken(companyId);
      const companyToken = savedToken?.token || null;
      const client = companyToken ? printClients.get(companyToken) : null;
      const isConnected = client && client.readyState === WebSocket.OPEN;
      res.json({
        connected: isConnected,
        hasToken: !!companyToken,
        message: isConnected ? "Local print service connected" : companyToken ? "Token exists but service not connected. Run the Python script on your Windows PC." : "No token generated. Generate a token first."
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
  app2.post("/api/print/send", isAuthenticated, async (req, res) => {
    try {
      const { content, format, printerName } = req.body;
      const companyId = parseInt(req.headers["x-company-id"]) || req.user?.companyId;
      const savedToken = await storage.getPrintToken(companyId);
      const companyToken = savedToken?.token || null;
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
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      client.send(JSON.stringify(printData));
      res.json({ success: true, message: "Print command sent" });
    } catch (error) {
      console.error("Error sending print command:", error);
      res.status(500).json({ success: false, message: "Failed to send print command" });
    }
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/print" });
  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token") || "";
    if (!token) {
      console.log("Print client rejected: missing token");
      ws.close(4001, "Invalid or missing authentication token");
      return;
    }
    let companyId = null;
    try {
      companyId = null;
    } catch (error) {
      console.log("Print client rejected: token validation error");
      ws.close(4001, "Token validation failed");
      return;
    }
    console.log(`Print client connected with token: ${token.substring(0, 8)}...`);
    const existingClient = printClients.get(token);
    if (existingClient && existingClient.readyState === WebSocket.OPEN) {
      existingClient.close(1e3, "Replaced by new connection");
    }
    printClients.set(token, ws);
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
  app2.get("/api/download/benesys_print_service.py", (req, res) => {
    try {
      const filePath = join(process.cwd(), "attached_assets", "benesys_print_service.py");
      const fileContent = readFileSync(filePath, "utf-8");
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", 'attachment; filename="benesys_print_service.py"');
      res.send(fileContent);
    } catch (error) {
      console.error("Error downloading print service:", error);
      res.status(404).json({ message: "File not found" });
    }
  });
  app2.get("/api/download/install_dependencies.bat", (req, res) => {
    try {
      const filePath = join(process.cwd(), "attached_assets", "install_dependencies.bat");
      const fileContent = readFileSync(filePath, "utf-8");
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", 'attachment; filename="install_dependencies.bat"');
      res.send(fileContent);
    } catch (error) {
      console.error("Error downloading installer:", error);
      res.status(404).json({ message: "File not found" });
    }
  });
  app2.get("/api/download/benesys-setup-complete.zip", (req, res) => {
    try {
      const assetsDir = join(process.cwd(), "attached_assets");
      const files = [
        "install_dependencies.bat",
        "setup_autostart.bat",
        "benesys_print_service.py",
        "SETUP_GUIDE.txt"
      ];
      for (const file of files) {
        if (!existsSync(join(assetsDir, file))) {
          console.warn(`Warning: ${file} not found, will skip in ZIP`);
        }
      }
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="BeneSys-Print-Service-Setup.zip"');
      const archive = archiver("zip", { zlib: { level: 9 } });
      archive.pipe(res);
      files.forEach((file) => {
        const filePath = join(assetsDir, file);
        if (existsSync(filePath)) {
          archive.file(filePath, { name: file });
        }
      });
      archive.finalize();
    } catch (error) {
      console.error("Error creating ZIP:", error);
      res.status(500).json({ message: "Failed to create ZIP file" });
    }
  });
  app2.get("/api/reports/agent-commission", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const commissions = await storage.getAgentCommissionReport(req.companyId);
      res.json(commissions);
    } catch (error) {
      console.error("Error fetching agent commission report:", error);
      res.status(500).json({ message: "Failed to fetch agent commission report" });
    }
  });
  app2.post("/api/barcodes/generate-prn", isAuthenticated, validateCompanyAccess, async (req, res) => {
    try {
      const { barcodeIds, templateId } = req.body;
      if (!barcodeIds || !Array.isArray(barcodeIds) || barcodeIds.length === 0) {
        return res.status(400).json({ message: "No barcodes selected" });
      }
      const barcodes = await storage.getBarcodesByIds(barcodeIds);
      let prnProgram = null;
      if (templateId) {
        const template = await storage.getBarcodeLabelTemplate(templateId);
        if (template && template.prnProgram) {
          prnProgram = template.prnProgram;
        }
      } else {
        const defaultTemplate = await storage.getDefaultBarcodeLabelTemplate(req.companyId);
        if (defaultTemplate && defaultTemplate.prnProgram) {
          prnProgram = defaultTemplate.prnProgram;
        }
      }
      let prnContent = "";
      barcodes.forEach((barcode) => {
        const itemName = (barcode.itemName || "").substring(0, 30);
        const mrp = barcode.mrp || "0";
        const sellingPrice = barcode.sellingPrice || "0";
        const barcodeNum = barcode.barcode || "";
        const hsnCode = barcode.hsnCode || "";
        const size = barcode.size || "";
        const sizeCode = barcode.sizeCode || "";
        if (prnProgram) {
          let labelContent = prnProgram.replace(/\{barcode\}/g, barcodeNum).replace(/\{itemName\}/g, itemName).replace(/\{mrp\}/g, mrp).replace(/\{sellingPrice\}/g, sellingPrice).replace(/\{hsnCode\}/g, hsnCode).replace(/\{size\}/g, size).replace(/\{sizeCode\}/g, sizeCode);
          prnContent += labelContent + "\n";
        } else {
          prnContent += "\nN\n";
          prnContent += "q400\n";
          prnContent += "Q200,24\n";
          prnContent += `B50,20,0,1,2,7,80,B,"${barcodeNum}"
`;
          prnContent += `A50,110,0,2,1,1,N,"${itemName}"
`;
          prnContent += `A50,135,0,2,1,1,N,"MRP: ${mrp}  Rate: ${sellingPrice}"
`;
          if (hsnCode) {
            prnContent += `A50,160,0,1,1,1,N,"HSN: ${hsnCode}"
`;
          }
          prnContent += "P1\n";
        }
      });
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", `attachment; filename="LABELS_${Date.now()}.PRN"`);
      res.send(prnContent);
    } catch (error) {
      console.error("Error generating PRN file:", error);
      res.status(500).json({ message: "Failed to generate PRN file" });
    }
  });
  return httpServer;
}

// server/app.ts
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
var app = express();
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path2 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path2.startsWith("/api")) {
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
async function runApp(setup) {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  await setup(app, server);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on http://0.0.0.0:${port}`);
  });
}

// server/index-prod.ts
async function serveStatic(app2, _server) {
  const distPath = path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
(async () => {
  await runApp(serveStatic);
})();
export {
  serveStatic
};
