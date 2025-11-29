# Offline Installation Guide

This guide explains how to set up the Store Management & Billing System for offline/local deployment.

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or pnpm package manager

## Installation Steps

### 1. Database Setup

1. Create a new PostgreSQL database:
```sql
CREATE DATABASE store_billing;
```

2. Run the table creation script (see database-schema.sql or run the app to auto-migrate):
```bash
npm run db:push
```

### 2. Environment Configuration

Create a `.env` file in the project root with:

```env
# Database connection
DATABASE_URL=postgresql://username:password@localhost:5432/store_billing
PGHOST=localhost
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=store_billing

# Session secret (generate a random 32+ character string)
SESSION_SECRET=your-super-secret-key-change-this
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Initialize Database

Push the schema to your database:
```bash
npm run db:push
```

### 5. Start the Application

For development:
```bash
npm run dev
```

For production:
```bash
npm run build
npm start
```

The application will be available at `http://localhost:5000`

## Database Tables Overview

The system uses the following main tables:

| Table | Purpose |
|-------|---------|
| users | User accounts and authentication |
| companies | Company/business information |
| user_companies | User-company relationships |
| parties | Customers and vendors |
| items | Product catalog |
| purchases | Purchase transactions |
| purchase_items | Purchase line items with barcodes |
| sales | Sales transactions |
| sale_items | Sales line items |
| payments | Payment records |
| stock | Current inventory levels |
| bill_templates | Invoice print templates |
| sessions | User session storage |

## Features

### Multi-Company Support
- Create and manage multiple companies
- Data isolation between companies
- Switch between companies seamlessly

### Inventory Management
- Product catalog with HSN codes
- Barcode generation and scanning
- Stock tracking with low-stock alerts
- Category and pack type organization

### Sales & Billing
- B2B (Credit) Sales with GST
- B2C (Retail) Sales
- Estimates/Quotations
- Credit Notes
- Multiple payment modes

### Invoice Printing
- A4 format for standard printers
- B4 format (Tally-style)
- 3-inch thermal (80mm POS)
- 4-inch thermal (112mm POS)

### Reports
- Sales reports with date filters
- Item-wise analysis
- Outstanding report
- Party ledger
- Payments report
- Stock inventory report

## Backup & Restore

### Backup
Use pg_dump to create database backups:
```bash
pg_dump -U username -d store_billing -f backup_$(date +%Y%m%d).sql
```

### Restore
```bash
psql -U username -d store_billing -f backup_file.sql
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in .env file
- Ensure database exists

### Port Conflicts
If port 5000 is in use, modify `server/index.ts` to use a different port.

### Session Issues
Clear browser cookies if experiencing authentication problems.

## Support

For technical support or customization requests, contact your system administrator.
