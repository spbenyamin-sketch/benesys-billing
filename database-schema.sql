-- Store Management & Billing System
-- Database Schema for Offline Installation
-- PostgreSQL 14+

-- Create database (run as superuser)
-- CREATE DATABASE store_billing;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- SESSIONS TABLE (for auth)
-- ===========================================
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);

-- ===========================================
-- USERS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ===========================================
-- COMPANIES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    gst_no VARCHAR(50),
    phone VARCHAR(50),
    email VARCHAR(100),
    logo_url TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR REFERENCES users(id)
);

-- ===========================================
-- USER_COMPANIES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS user_companies (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    company_id INTEGER NOT NULL REFERENCES companies(id),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ===========================================
-- AGENTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS agents (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    code INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    commission DECIMAL(5,2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR REFERENCES users(id)
);

-- ===========================================
-- PARTIES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS parties (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    code VARCHAR(50) NOT NULL,
    short_name VARCHAR(50),
    name VARCHAR(200) NOT NULL,
    address TEXT,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    state VARCHAR(100),
    state_code VARCHAR(10),
    gst_no VARCHAR(50),
    phone VARCHAR(50),
    has_shipping_address BOOLEAN NOT NULL DEFAULT FALSE,
    ship_name VARCHAR(200),
    ship_address TEXT,
    ship_city VARCHAR(100),
    ship_pincode VARCHAR(10),
    ship_state VARCHAR(100),
    ship_state_code VARCHAR(10),
    agent_id INTEGER REFERENCES agents(id),
    opening_debit DECIMAL(12,2) NOT NULL DEFAULT 0,
    opening_credit DECIMAL(12,2) NOT NULL DEFAULT 0,
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR REFERENCES users(id)
);

-- ===========================================
-- ITEMS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    hsn_code VARCHAR(20),
    category VARCHAR(100),
    pack_type VARCHAR(50) NOT NULL DEFAULT 'PCS',
    cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    mrp DECIMAL(12,2) NOT NULL DEFAULT 0,
    gst DECIMAL(5,2) NOT NULL DEFAULT 0,
    cess DECIMAL(5,2) NOT NULL DEFAULT 0,
    discount DECIMAL(5,2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    min_stock INTEGER DEFAULT 10,
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR REFERENCES users(id)
);

-- ===========================================
-- PURCHASES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    invoice_no INTEGER NOT NULL,
    party_id INTEGER REFERENCES parties(id),
    party_name VARCHAR(200),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    bill_no VARCHAR(50),
    bill_date DATE,
    eway_no VARCHAR(50),
    eway_date DATE,
    vehicle_no VARCHAR(50),
    gst_type INTEGER DEFAULT 0,
    total_qty DECIMAL(12,3) NOT NULL DEFAULT 0,
    total_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    cgst_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    sgst_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    round_off DECIMAL(5,2) DEFAULT 0,
    grand_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR REFERENCES users(id)
);

-- ===========================================
-- PURCHASE_ITEMS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id),
    item_code VARCHAR(50),
    item_name VARCHAR(200) NOT NULL,
    hsn_code VARCHAR(20),
    barcode VARCHAR(100),
    pack_type VARCHAR(50),
    quantity DECIMAL(12,3) NOT NULL,
    free_qty DECIMAL(12,3) DEFAULT 0,
    rate DECIMAL(12,2) NOT NULL,
    mrp DECIMAL(12,2),
    rrate DECIMAL(12,2),
    discount DECIMAL(12,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    amount DECIMAL(12,2) NOT NULL,
    tax DECIMAL(5,2) DEFAULT 0,
    tax_value DECIMAL(12,2) DEFAULT 0,
    cgst_rate DECIMAL(5,2) DEFAULT 0,
    cgst DECIMAL(12,2) DEFAULT 0,
    sgst_rate DECIMAL(5,2) DEFAULT 0,
    sgst DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2) NOT NULL,
    batch VARCHAR(50),
    expiry DATE,
    sold_qty DECIMAL(12,3) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ===========================================
-- SALES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    invoice_no INTEGER NOT NULL,
    bill_type VARCHAR(10) NOT NULL DEFAULT 'GST',
    sale_type VARCHAR(20),
    payment_mode VARCHAR(20),
    inclusive_tax BOOLEAN DEFAULT FALSE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    party_id INTEGER REFERENCES parties(id),
    party_name VARCHAR(200),
    party_city VARCHAR(100),
    party_address TEXT,
    party_gst_no VARCHAR(50),
    mobile VARCHAR(50),
    gst_type INTEGER DEFAULT 0,
    sale_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_total DECIMAL(12,2) DEFAULT 0,
    tax_value DECIMAL(12,2) DEFAULT 0,
    cgst_total DECIMAL(12,2) DEFAULT 0,
    sgst_total DECIMAL(12,2) DEFAULT 0,
    round_off DECIMAL(5,2) DEFAULT 0,
    grand_total DECIMAL(12,2) NOT NULL,
    total_qty DECIMAL(12,3) NOT NULL DEFAULT 0,
    amount_given DECIMAL(12,2) DEFAULT 0,
    amount_return DECIMAL(12,2) DEFAULT 0,
    by_cash DECIMAL(12,2) DEFAULT 0,
    by_card DECIMAL(12,2) DEFAULT 0,
    print_outstanding BOOLEAN DEFAULT FALSE,
    party_outstanding DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR REFERENCES users(id)
);

-- ===========================================
-- SALE_ITEMS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id),
    purchase_item_id INTEGER REFERENCES purchase_items(id),
    barcode VARCHAR(100),
    item_code VARCHAR(50),
    item_name VARCHAR(200) NOT NULL,
    hsn_code VARCHAR(20),
    quantity DECIMAL(12,3) NOT NULL,
    rate DECIMAL(12,2) NOT NULL,
    mrp DECIMAL(12,2),
    discount DECIMAL(12,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    amount DECIMAL(12,2) NOT NULL,
    sale_value DECIMAL(12,2) NOT NULL,
    tax_value DECIMAL(12,2) DEFAULT 0,
    tax DECIMAL(5,2) DEFAULT 0,
    cgst DECIMAL(12,2) DEFAULT 0,
    sgst DECIMAL(12,2) DEFAULT 0,
    cgst_rate DECIMAL(5,2) DEFAULT 0,
    sgst_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ===========================================
-- PAYMENTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    receipt_no INTEGER NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type VARCHAR(20) NOT NULL,
    party_id INTEGER REFERENCES parties(id),
    party_name VARCHAR(200),
    amount DECIMAL(12,2) NOT NULL,
    mode VARCHAR(20) DEFAULT 'CASH',
    reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR REFERENCES users(id)
);

-- ===========================================
-- STOCK TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS stock (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ===========================================
-- BILL_TEMPLATES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS bill_templates (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    name VARCHAR(100) NOT NULL,
    format_type VARCHAR(20) NOT NULL DEFAULT 'A4',
    assigned_to VARCHAR(20),
    logo_url TEXT,
    header_text TEXT,
    footer_text TEXT,
    show_tax_breakup BOOLEAN NOT NULL DEFAULT TRUE,
    show_hsn_code BOOLEAN NOT NULL DEFAULT TRUE,
    show_item_code BOOLEAN NOT NULL DEFAULT FALSE,
    show_outstanding_default BOOLEAN NOT NULL DEFAULT TRUE,
    show_cash_return BOOLEAN NOT NULL DEFAULT TRUE,
    show_party_balance BOOLEAN NOT NULL DEFAULT FALSE,
    show_bank_details BOOLEAN NOT NULL DEFAULT FALSE,
    bank_details TEXT,
    terms_and_conditions TEXT,
    paper_size VARCHAR(20) NOT NULL DEFAULT 'A4',
    font_size INTEGER NOT NULL DEFAULT 10,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ===========================================
-- INVOICE COUNTERS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS invoice_counters (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    counter_type VARCHAR(20) NOT NULL,
    current_value INTEGER NOT NULL DEFAULT 0,
    prefix VARCHAR(20),
    financial_year VARCHAR(10),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, counter_type, financial_year)
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_parties_company ON parties(company_id);
CREATE INDEX IF NOT EXISTS idx_items_company ON items(company_id);
CREATE INDEX IF NOT EXISTS idx_purchases_company ON purchases(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_company ON sales(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_company ON stock(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_barcode ON purchase_items(barcode);

-- ===========================================
-- INITIAL DATA (Optional)
-- ===========================================
-- You can add initial data like default templates, sample categories etc. here

COMMENT ON DATABASE store_billing IS 'Store Management & Billing System Database';
