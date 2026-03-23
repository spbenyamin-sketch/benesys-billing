-- Billing & Inventory Management System - Database Schema
-- PostgreSQL 12+
-- Complete schema with all 21 tables including Financial Year management
-- For offline Windows installations - use this to initialize fresh databases

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- AUTH TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS sessions (
  sid varchar PRIMARY KEY,
  sess jsonb NOT NULL,
  expire timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_expire ON sessions(expire);

CREATE TABLE IF NOT EXISTS users (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username varchar(100) UNIQUE,
  password_hash varchar(255),
  email varchar UNIQUE,
  first_name varchar,
  last_name varchar,
  profile_image_url varchar,
  role varchar(20) DEFAULT 'user' NOT NULL,
  page_permissions jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- COMPANY TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS companies (
  id serial PRIMARY KEY,
  name varchar(200) NOT NULL,
  address text,
  city varchar(100),
  state varchar(100),
  gst_no varchar(50),
  phone varchar(50),
  email varchar(100),
  logo_url text,
  expiry_date timestamp,
  current_financial_year_id integer,
  fy_start_month integer DEFAULT 4 NOT NULL,
  fy_start_day integer DEFAULT 1 NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  created_by varchar REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_companies (
  id serial PRIMARY KEY,
  user_id varchar REFERENCES users(id) NOT NULL,
  company_id integer REFERENCES companies(id) NOT NULL,
  is_default boolean DEFAULT false NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- MASTER DATA TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS agents (
  id serial PRIMARY KEY,
  company_id integer REFERENCES companies(id) NOT NULL,
  code integer NOT NULL,
  name varchar(200) NOT NULL,
  phone varchar(50),
  email varchar(100),
  address text,
  city varchar(100),
  commission decimal(5,2) DEFAULT 0 NOT NULL,
  active boolean DEFAULT true NOT NULL,
  is_shared boolean DEFAULT false NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  created_by varchar REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS parties (
  id serial PRIMARY KEY,
  company_id integer REFERENCES companies(id) NOT NULL,
  code varchar(50) NOT NULL,
  short_name varchar(50),
  name varchar(200) NOT NULL,
  address text,
  city varchar(100) NOT NULL,
  pincode varchar(10) NOT NULL,
  state varchar(100),
  state_code varchar(10),
  gst_no varchar(50),
  phone varchar(50),
  has_shipping_address boolean DEFAULT false NOT NULL,
  ship_name varchar(200),
  ship_address text,
  ship_city varchar(100),
  ship_pincode varchar(10),
  ship_state varchar(100),
  ship_state_code varchar(10),
  agent_id integer REFERENCES agents(id),
  opening_debit decimal(12,2) DEFAULT 0 NOT NULL,
  opening_credit decimal(12,2) DEFAULT 0 NOT NULL,
  is_shared boolean DEFAULT false NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  created_by varchar REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS items (
  id serial PRIMARY KEY,
  company_id integer REFERENCES companies(id) NOT NULL,
  code varchar(50) NOT NULL,
  name varchar(300) NOT NULL,
  hsn_code varchar(50) NOT NULL,
  category varchar(100),
  floor varchar(50),
  pack_type varchar(20) DEFAULT 'PCS' NOT NULL,
  type varchar(10) DEFAULT 'P' NOT NULL,
  cost decimal(12,2) DEFAULT 0 NOT NULL,
  mrp decimal(12,2) DEFAULT 0 NOT NULL,
  selling_price decimal(12,2) DEFAULT 0 NOT NULL,
  tax decimal(5,2) DEFAULT 0 NOT NULL,
  cgst decimal(5,3) DEFAULT 0 NOT NULL,
  sgst decimal(5,3) DEFAULT 0 NOT NULL,
  active boolean DEFAULT true NOT NULL,
  is_shared boolean DEFAULT false NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  created_by varchar REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS size_master (
  id serial PRIMARY KEY,
  company_id integer REFERENCES companies(id) NOT NULL,
  name varchar(50) NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL
);

-- ============================================================================
-- INVENTORY TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS stock (
  id serial PRIMARY KEY,
  company_id integer REFERENCES companies(id) NOT NULL,
  item_id integer REFERENCES items(id) NOT NULL,
  quantity decimal(12,3) DEFAULT 0 NOT NULL,
  last_updated timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- FINANCIAL YEAR MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS financial_years (
  id serial PRIMARY KEY,
  company_id integer REFERENCES companies(id) NOT NULL,
  label varchar(20) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT false NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  created_by varchar REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_financial_years_company ON financial_years(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_years_active ON financial_years(company_id, is_active);

CREATE TABLE IF NOT EXISTS bill_sequences (
  id serial PRIMARY KEY,
  company_id integer REFERENCES companies(id) NOT NULL,
  financial_year_id integer REFERENCES financial_years(id) NOT NULL,
  bill_type varchar(20) NOT NULL,
  last_number integer DEFAULT 0 NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bill_sequences_company_fy ON bill_sequences(company_id, financial_year_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bill_sequences_unique ON bill_sequences(company_id, financial_year_id, bill_type);

-- ============================================================================
-- PURCHASE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchases (
  id serial PRIMARY KEY,
  company_id integer REFERENCES companies(id) NOT NULL,
  financial_year_id integer REFERENCES financial_years(id),
  purchase_no integer NOT NULL,
  purchase_code varchar(50),
  date date NOT NULL,
  invoice_no varchar(50),
  party_id integer REFERENCES parties(id),
  party_name varchar(200),
  city varchar(100),
  invoice_amount decimal(12,2) DEFAULT 0 NOT NULL,
  discount_amount decimal(12,2) DEFAULT 0 NOT NULL,
  packing_amount decimal(12,2) DEFAULT 0 NOT NULL,
  other_charges decimal(12,2) DEFAULT 0 NOT NULL,
  profit_percent decimal(5,2) DEFAULT 0 NOT NULL,
  rst_percent decimal(5,2) DEFAULT 0 NOT NULL,
  surcharge_percent decimal(5,2) DEFAULT 0 NOT NULL,
  total_qty decimal(12,2) DEFAULT 0 NOT NULL,
  amount decimal(12,2) DEFAULT 0 NOT NULL,
  before_tax_amount decimal(12,2) DEFAULT 0 NOT NULL,
  bill_total_amount decimal(12,2) DEFAULT 0 NOT NULL,
  val_0 decimal(12,2) DEFAULT 0 NOT NULL,
  val_5 decimal(12,2) DEFAULT 0 NOT NULL,
  val_12 decimal(12,2) DEFAULT 0 NOT NULL,
  val_18 decimal(12,2) DEFAULT 0 NOT NULL,
  val_28 decimal(12,2) DEFAULT 0 NOT NULL,
  ctax_0 decimal(12,2) DEFAULT 0 NOT NULL,
  ctax_5 decimal(12,2) DEFAULT 0 NOT NULL,
  ctax_12 decimal(12,2) DEFAULT 0 NOT NULL,
  ctax_18 decimal(12,2) DEFAULT 0 NOT NULL,
  ctax_28 decimal(12,2) DEFAULT 0 NOT NULL,
  stax_0 decimal(12,2) DEFAULT 0 NOT NULL,
  stax_5 decimal(12,2) DEFAULT 0 NOT NULL,
  stax_12 decimal(12,2) DEFAULT 0 NOT NULL,
  stax_18 decimal(12,2) DEFAULT 0 NOT NULL,
  stax_28 decimal(12,2) DEFAULT 0 NOT NULL,
  itax_0 decimal(12,2) DEFAULT 0 NOT NULL,
  itax_5 decimal(12,2) DEFAULT 0 NOT NULL,
  itax_12 decimal(12,2) DEFAULT 0 NOT NULL,
  itax_18 decimal(12,2) DEFAULT 0 NOT NULL,
  itax_28 decimal(12,2) DEFAULT 0 NOT NULL,
  status varchar(20) DEFAULT 'pending' NOT NULL,
  stock_inward_completed boolean DEFAULT false NOT NULL,
  details text,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  created_by varchar REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id serial PRIMARY KEY,
  purchase_id integer REFERENCES purchases(id) NOT NULL,
  item_id integer REFERENCES items(id),
  serial integer NOT NULL,
  itname varchar(300) NOT NULL,
  brandname varchar(200),
  name varchar(200),
  cost decimal(12,2) NOT NULL,
  qty decimal(12,2) NOT NULL,
  pcs decimal(12,2) DEFAULT 0 NOT NULL,
  rd decimal(12,2) DEFAULT 0 NOT NULL,
  dis decimal(5,2) DEFAULT 0 NOT NULL,
  rd1 decimal(12,2) DEFAULT 0 NOT NULL,
  dis1 decimal(5,2) DEFAULT 0 NOT NULL,
  ag decimal(5,2) DEFAULT 0 NOT NULL,
  addc decimal(12,2) DEFAULT 0 NOT NULL,
  ncost decimal(12,2) DEFAULT 0 NOT NULL,
  lcost decimal(12,2) DEFAULT 0 NOT NULL,
  netcost decimal(12,2) DEFAULT 0 NOT NULL,
  tax decimal(5,2) DEFAULT 0 NOT NULL,
  prft decimal(5,2) DEFAULT 0 NOT NULL,
  rrate decimal(12,2) DEFAULT 0 NOT NULL,
  mrp decimal(12,2) DEFAULT 0 NOT NULL,
  arate decimal(12,2) DEFAULT 0 NOT NULL,
  brate decimal(12,2) DEFAULT 0 NOT NULL,
  profit decimal(12,2) DEFAULT 0 NOT NULL,
  prper decimal(5,2) DEFAULT 0 NOT NULL,
  quality varchar(100),
  dno1 varchar(50),
  pattern varchar(100),
  sleeve varchar(100),
  sl varchar(50),
  size1 varchar(10),
  size2 varchar(10),
  jc varchar(1) DEFAULT 'J',
  fv varchar(1) DEFAULT 'F',
  s1 integer DEFAULT 0,
  s2 integer DEFAULT 0,
  s3 integer DEFAULT 0,
  s4 integer DEFAULT 0,
  s5 integer DEFAULT 0,
  s6 integer DEFAULT 0,
  s7 integer DEFAULT 0,
  s8 integer DEFAULT 0,
  s9 integer DEFAULT 0,
  s10 integer DEFAULT 0,
  s11 integer DEFAULT 0,
  s12 integer DEFAULT 0,
  r1 decimal(12,2) DEFAULT 0,
  r2 decimal(12,2) DEFAULT 0,
  r3 decimal(12,2) DEFAULT 0,
  r4 decimal(12,2) DEFAULT 0,
  r5 decimal(12,2) DEFAULT 0,
  r6 decimal(12,2) DEFAULT 0,
  r7 decimal(12,2) DEFAULT 0,
  r8 decimal(12,2) DEFAULT 0,
  r9 decimal(12,2) DEFAULT 0,
  r10 decimal(12,2) DEFAULT 0,
  r11 decimal(12,2) DEFAULT 0,
  r12 decimal(12,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS stock_inward_items (
  id serial PRIMARY KEY,
  purchase_item_id integer REFERENCES purchase_items(id) NOT NULL,
  purchase_id integer REFERENCES purchases(id) NOT NULL,
  company_id integer REFERENCES companies(id) NOT NULL,
  item_id integer REFERENCES items(id),
  serial integer NOT NULL,
  barcode varchar(100) NOT NULL,
  itname varchar(300) NOT NULL,
  brandname varchar(200),
  quality varchar(100),
  dno1 varchar(50),
  pattern varchar(100),
  sleeve varchar(100),
  size varchar(10),
  size_code integer,
  cost decimal(12,2) NOT NULL,
  ncost decimal(12,2) NOT NULL,
  lcost decimal(12,2) NOT NULL,
  rate decimal(12,2) NOT NULL,
  mrp decimal(12,2) NOT NULL,
  tax decimal(5,2) DEFAULT 0 NOT NULL,
  qty decimal(12,2) DEFAULT 1 NOT NULL,
  status varchar(20) DEFAULT 'available' NOT NULL,
  sold_at timestamp,
  sale_id integer REFERENCES sales(id),
  sale_item_id integer REFERENCES sale_items(id),
  expdate date,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stock_inward_barcode ON stock_inward_items(barcode);
CREATE INDEX IF NOT EXISTS idx_stock_inward_status ON stock_inward_items(status);
CREATE INDEX IF NOT EXISTS idx_stock_inward_company ON stock_inward_items(company_id);

-- ============================================================================
-- SALES TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS sales (
  id serial PRIMARY KEY,
  company_id integer REFERENCES companies(id) NOT NULL,
  financial_year_id integer REFERENCES financial_years(id),
  invoice_no integer NOT NULL,
  invoice_code varchar(50),
  bill_type varchar(10) NOT NULL,
  sale_type varchar(20) DEFAULT 'B2C' NOT NULL,
  payment_mode varchar(10) DEFAULT 'CASH' NOT NULL,
  inclusive_tax boolean DEFAULT false NOT NULL,
  date date NOT NULL,
  time varchar(10),
  party_id integer REFERENCES parties(id),
  party_name varchar(200),
  party_city varchar(100),
  party_address text,
  party_gst_no varchar(50),
  gst_type integer DEFAULT 0 NOT NULL,
  sale_value decimal(12,2) DEFAULT 0 NOT NULL,
  discount_total decimal(12,2) DEFAULT 0 NOT NULL,
  tax_value decimal(12,2) DEFAULT 0 NOT NULL,
  cgst_total decimal(12,2) DEFAULT 0 NOT NULL,
  sgst_total decimal(12,2) DEFAULT 0 NOT NULL,
  round_off decimal(12,2) DEFAULT 0 NOT NULL,
  grand_total decimal(12,2) DEFAULT 0 NOT NULL,
  total_qty decimal(12,3) DEFAULT 0 NOT NULL,
  amount_given decimal(12,2) DEFAULT 0 NOT NULL,
  amount_return decimal(12,2) DEFAULT 0 NOT NULL,
  by_card decimal(12,2) DEFAULT 0 NOT NULL,
  by_cash decimal(12,2) DEFAULT 0 NOT NULL,
  print_outstanding boolean DEFAULT false NOT NULL,
  party_outstanding decimal(12,2) DEFAULT 0 NOT NULL,
  mobile varchar(20),
  einvoice_status varchar(20),
  irn varchar(100),
  ack_number varchar(50),
  ack_date timestamp,
  qr_code text,
  signed_invoice text,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  created_by varchar REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sale_items (
  id serial PRIMARY KEY,
  sale_id integer REFERENCES sales(id) NOT NULL,
  item_id integer REFERENCES items(id),
  purchase_item_id integer REFERENCES purchase_items(id),
  stock_inward_id integer REFERENCES stock_inward_items(id),
  item_code varchar(50),
  barcode varchar(100),
  item_name varchar(300) NOT NULL,
  hsn_code varchar(50),
  quality varchar(100),
  size varchar(50),
  quantity decimal(12,3) NOT NULL,
  rate decimal(12,2) NOT NULL,
  mrp decimal(12,2) DEFAULT 0 NOT NULL,
  discount decimal(12,2) DEFAULT 0 NOT NULL,
  discount_percent decimal(5,2) DEFAULT 0 NOT NULL,
  amount decimal(12,2) NOT NULL,
  sale_value decimal(12,2) DEFAULT 0 NOT NULL,
  tax_value decimal(12,2) DEFAULT 0 NOT NULL,
  tax decimal(5,2) DEFAULT 0 NOT NULL,
  cgst decimal(12,2) DEFAULT 0 NOT NULL,
  sgst decimal(12,2) DEFAULT 0 NOT NULL,
  cgst_rate decimal(5,3) DEFAULT 0 NOT NULL,
  sgst_rate decimal(5,3) DEFAULT 0 NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- PAYMENT & CONFIGURATION TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id serial PRIMARY KEY,
  company_id integer REFERENCES companies(id) NOT NULL,
  party_id integer REFERENCES parties(id) NOT NULL,
  payment_type varchar(20) NOT NULL,
  mode varchar(20) DEFAULT 'CASH' NOT NULL,
  amount decimal(12,2) NOT NULL,
  debit decimal(12,2) DEFAULT 0 NOT NULL,
  credit decimal(12,2) DEFAULT 0 NOT NULL,
  date date NOT NULL,
  reference_no varchar(100),
  notes text,
  created_at timestamp DEFAULT now() NOT NULL,
  created_by varchar REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS bill_templates (
  id serial PRIMARY KEY,
  company_id integer REFERENCES companies(id) NOT NULL,
  name varchar(200) NOT NULL,
  is_default boolean DEFAULT false NOT NULL,
  template_data jsonb NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  created_by varchar REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS barcode_label_templates (
  id serial PRIMARY KEY,
  company_id integer REFERENCES companies(id) NOT NULL,
  name varchar(100) NOT NULL,
  label_width decimal(6,2) DEFAULT '50' NOT NULL,
  label_height decimal(6,2) DEFAULT '25' NOT NULL,
  config text NOT NULL,
  prn_program text,
  paper_size varchar(20) DEFAULT 'A4' NOT NULL,
  labels_per_row integer DEFAULT 4 NOT NULL,
  labels_per_column integer DEFAULT 10 NOT NULL,
  margin_top decimal(6,2) DEFAULT '10' NOT NULL,
  margin_left decimal(6,2) DEFAULT '5' NOT NULL,
  gap_horizontal decimal(6,2) DEFAULT '2' NOT NULL,
  gap_vertical decimal(6,2) DEFAULT '2' NOT NULL,
  is_default boolean DEFAULT false NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  created_by varchar REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS print_settings (
  id serial PRIMARY KEY,
  company_id integer REFERENCES companies(id) NOT NULL,
  auto_print_b2b boolean DEFAULT false NOT NULL,
  auto_print_b2c boolean DEFAULT true NOT NULL,
  auto_print_estimate boolean DEFAULT false NOT NULL,
  auto_print_credit_note boolean DEFAULT false NOT NULL,
  auto_print_debit_note boolean DEFAULT false NOT NULL,
  print_copies_b2b integer DEFAULT 2 NOT NULL,
  print_copies_b2c integer DEFAULT 1 NOT NULL,
  print_copies_estimate integer DEFAULT 1 NOT NULL,
  print_copies_credit_note integer DEFAULT 2 NOT NULL,
  print_copies_debit_note integer DEFAULT 2 NOT NULL,
  show_print_confirmation boolean DEFAULT true NOT NULL,
  default_printer_name varchar(255) DEFAULT '' NOT NULL,
  enable_tamil_print boolean DEFAULT false NOT NULL,
  direct_print_b2b boolean DEFAULT false NOT NULL,
  direct_print_b2c boolean DEFAULT false NOT NULL,
  direct_print_estimate boolean DEFAULT false NOT NULL,
  direct_print_credit_note boolean DEFAULT false NOT NULL,
  direct_print_debit_note boolean DEFAULT false NOT NULL,
  enable_web_socket_print boolean DEFAULT false NOT NULL,
  web_socket_printer_name varchar(255) DEFAULT '' NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_parties_company_id ON parties(company_id);
CREATE INDEX IF NOT EXISTS idx_items_company_id ON items(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_company_id ON stock(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_company_id ON sales(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_party_id ON sales(party_id);
CREATE INDEX IF NOT EXISTS idx_sales_company_date ON sales(company_id, date);
CREATE INDEX IF NOT EXISTS idx_purchases_company_id ON purchases(company_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date);
CREATE INDEX IF NOT EXISTS idx_purchases_party_id ON purchases(party_id);
CREATE INDEX IF NOT EXISTS idx_purchases_company_date ON purchases(company_id, date);
CREATE INDEX IF NOT EXISTS idx_payments_company_id ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_party_id ON payments(party_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_item_id ON sale_items(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_inward_company_status ON stock_inward_items(company_id, status);
CREATE INDEX IF NOT EXISTS idx_stock_inward_purchase_id ON stock_inward_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_companies_user_id ON user_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_companies_company_id ON user_companies(company_id);

-- ============================================================================
-- MIGRATION SCRIPTS FOR EXISTING INSTALLATIONS
-- Run these to update schema if upgrading from an older version
-- ============================================================================

-- Add missing columns to companies table if not exists
ALTER TABLE companies ADD COLUMN IF NOT EXISTS current_financial_year_id integer;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS fy_start_month integer DEFAULT 4;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS fy_start_day integer DEFAULT 1;

-- Add missing columns to sales table if not exists
ALTER TABLE sales ADD COLUMN IF NOT EXISTS financial_year_id integer REFERENCES financial_years(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS invoice_code varchar(50);

-- Add missing columns to purchases table if not exists
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS financial_year_id integer REFERENCES financial_years(id);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS purchase_code varchar(50);

-- Add missing columns to payments table if not exists
ALTER TABLE payments ADD COLUMN IF NOT EXISTS debit decimal(12,2) DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS credit decimal(12,2) DEFAULT 0;

-- ============================================================================
-- SETUP COMPLETE - 21 TABLES CREATED
-- ============================================================================

-- ============================================================================
-- KEY FEATURES IMPLEMENTED:
-- ============================================================================
-- 1. Financial Year Management (Dec 2024)
--    - financial_years: Tracks FY periods with start/end dates and active flag
--    - bill_sequences: Auto-incrementing bill numbers per FY and bill type
--    - Format: TYPE-FY_LABEL-SEQUENCE (e.g., B2B-2024-25-0001)
--
-- 2. Multi-Company Support
--    - All transactional tables scoped by company_id
--    - user_companies: Maps users to companies
--    - Financial years per company
--
-- 3. GST E-Invoice Support (India)
--    - einvoice_status, irn, ack_number, ack_date, qr_code, signed_invoice
--
-- 4. Stock & Inventory Management
--    - stock_inward_items: Barcode-tracked inventory with status
--    - Supports: available, in_stock, sold tracking
--
-- 5. Bill Printing & Templates
--    - A4, B4, and Thermal (3-inch, 4-inch) formats
--    - Tamil language support via enable_tamil_print flag
--    - Direct printer integration via WebSocket
--
-- 6. Transaction Date Validation
--    - All sales/purchases must have dates within active FY period
--    - Enforced at backend via date validation
--
-- ============================================================================
-- FOR OFFLINE WINDOWS INSTALLATION:
-- ============================================================================
-- 1. Install PostgreSQL 12+ on Windows
-- 2. Create a database: createdb "inventory_system"
-- 3. Run this script: psql -U username -d inventory_system -f database-schema.sql
-- 4. Configure connection in app (.env file)
-- 5. Run app startup script to initialize data
--
-- ============================================================================
