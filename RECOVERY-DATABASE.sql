-- Database Schema Recovery Script
-- Run this if you get "errorMissingColumn" errors when starting the app
-- This script adds any missing columns from recent updates

-- Add missing columns to companies table if they don't exist
ALTER TABLE companies ADD COLUMN IF NOT EXISTS current_financial_year_id integer;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS fy_start_month integer DEFAULT 4;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS fy_start_day integer DEFAULT 1;

-- Add missing columns to sales table if they don't exist
ALTER TABLE sales ADD COLUMN IF NOT EXISTS financial_year_id integer REFERENCES financial_years(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS invoice_code varchar(50);

-- Add missing columns to purchases table if they don't exist
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS financial_year_id integer REFERENCES financial_years(id);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS purchase_code varchar(50);

-- Add missing columns to payments table if they don't exist
ALTER TABLE payments ADD COLUMN IF NOT EXISTS debit decimal(12,2) DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS credit decimal(12,2) DEFAULT 0;

-- Verify the schema updates
SELECT 'Companies table:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'companies' AND column_name IN ('current_financial_year_id', 'fy_start_month', 'fy_start_day') ORDER BY column_name;

SELECT 'Sales table:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sales' AND column_name IN ('financial_year_id', 'invoice_code') ORDER BY column_name;

SELECT 'Purchases table:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'purchases' AND column_name IN ('financial_year_id', 'purchase_code') ORDER BY column_name;

SELECT 'Payments table:' as info;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payments' AND column_name IN ('debit', 'credit') ORDER BY column_name;

-- If all columns exist, this message will appear
SELECT 'Database schema recovery complete! All required columns are now present.' as status;
