-- Billing & Inventory Management System - Database Schema
-- PostgreSQL 12+
-- Complete schema with all 17 tables

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
  expiry_date timestamp,  -- Software license expiry date
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

CREATE TABLE IF NOT EXISTS purchase_items (
  id serial PRIMARY KEY,
  purchase_id integer NOT NULL,
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
  invoice_no integer NOT NULL,
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
-- PURCHASE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchases (
  id serial PRIMARY KEY,
  company_id integer REFERENCES companies(id) NOT NULL,
  purchase_no integer NOT NULL,
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
  print_copies_credit_note integer DEFAULT 1 NOT NULL,
  print_copies_debit_note integer DEFAULT 1 NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_purchases_company_id ON purchases(company_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date);
CREATE INDEX IF NOT EXISTS idx_payments_company_id ON payments(company_id);

-- ============================================================================
-- SETUP COMPLETE - 17 TABLES CREATED
-- ============================================================================

-- ============================================================================
-- MIGRATION SCRIPTS FOR EXISTING INSTALLATIONS
-- Run these if upgrading from an older version
-- ============================================================================

-- Add expiry_date to companies if not exists
ALTER TABLE companies ADD COLUMN IF NOT EXISTS expiry_date timestamp;

-- Add missing columns to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS debit decimal(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS credit decimal(12,2) DEFAULT 0 NOT NULL;

-- Add missing columns to stock_inward_items
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS purchase_id integer REFERENCES purchases(id);
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS serial integer;
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS itname varchar(300);
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS brandname varchar(200);
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS quality varchar(100);
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS dno1 varchar(50);
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS pattern varchar(100);
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS sleeve varchar(100);
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS size varchar(10);
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS size_code integer;
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS cost decimal(12,2);
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS ncost decimal(12,2);
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS lcost decimal(12,2);
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS rate decimal(12,2);
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS tax decimal(5,2) DEFAULT 0;
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS qty decimal(12,2) DEFAULT 1;
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'available';
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS sold_at timestamp;
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS sale_id integer REFERENCES sales(id);
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS sale_item_id integer REFERENCES sale_items(id);
ALTER TABLE stock_inward_items ADD COLUMN IF NOT EXISTS expdate date;

-- Create print_settings table if not exists
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
  print_copies_credit_note integer DEFAULT 1 NOT NULL,
  print_copies_debit_note integer DEFAULT 1 NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_stock_inward_barcode ON stock_inward_items(barcode);
CREATE INDEX IF NOT EXISTS idx_stock_inward_status ON stock_inward_items(status);
CREATE INDEX IF NOT EXISTS idx_stock_inward_company ON stock_inward_items(company_id);

-- Add prn_program column to barcode_label_templates for storing EPL2/ZPL printer programs
-- Supports placeholders: {barcode}, {itemName}, {mrp}, {sellingPrice}, {hsnCode}, {size}, {sizeCode}
ALTER TABLE barcode_label_templates ADD COLUMN IF NOT EXISTS prn_program text;
ALTER TABLE barcode_label_templates ADD COLUMN IF NOT EXISTS label_width decimal(6,2) DEFAULT '50';
ALTER TABLE barcode_label_templates ADD COLUMN IF NOT EXISTS label_height decimal(6,2) DEFAULT '25';
ALTER TABLE barcode_label_templates ADD COLUMN IF NOT EXISTS config text;
ALTER TABLE barcode_label_templates ADD COLUMN IF NOT EXISTS paper_size varchar(20) DEFAULT 'A4';
ALTER TABLE barcode_label_templates ADD COLUMN IF NOT EXISTS labels_per_row integer DEFAULT 4;
ALTER TABLE barcode_label_templates ADD COLUMN IF NOT EXISTS labels_per_column integer DEFAULT 10;
ALTER TABLE barcode_label_templates ADD COLUMN IF NOT EXISTS margin_top decimal(6,2) DEFAULT '10';
ALTER TABLE barcode_label_templates ADD COLUMN IF NOT EXISTS margin_left decimal(6,2) DEFAULT '5';
ALTER TABLE barcode_label_templates ADD COLUMN IF NOT EXISTS gap_horizontal decimal(6,2) DEFAULT '2';
ALTER TABLE barcode_label_templates ADD COLUMN IF NOT EXISTS gap_vertical decimal(6,2) DEFAULT '2';

-- E-Invoice fields for sales (India GST e-invoice response data)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS einvoice_status varchar(20);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS irn varchar(100);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS ack_number varchar(50);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS ack_date timestamp;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS qr_code text;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS signed_invoice text;
