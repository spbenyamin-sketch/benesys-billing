# Billing & Inventory Management System - Offline Installation Guide

Complete installation guide for running the Billing & Inventory Management System on your local machine with PostgreSQL.

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Installation Steps](#installation-steps)
3. [Database Setup](#database-setup)
4. [Running the Application](#running-the-application)
5. [Operations Guide](#operations-guide)
6. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements
- **Operating System**: Windows 10+, macOS 10.14+, or Ubuntu 18.04+
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free disk space

### Software Requirements
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v12.0 or higher
- **npm**: v8.0.0 or higher (comes with Node.js)
- **Git**: v2.0 or higher (optional, for cloning)

---

## Installation Steps

### Step 1: Install Node.js
**Windows/macOS:**
- Download from: https://nodejs.org/ (Choose LTS version)
- Run the installer and follow the prompts

**Ubuntu/Linux:**
```bash
sudo apt update
sudo apt install nodejs npm
```

### Step 2: Install PostgreSQL

**Windows:**
- Download from: https://www.postgresql.org/download/windows/
- Run installer, remember the password you set for the `postgres` user
- Default port is `5432`

**macOS:**
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 3: Clone/Extract Project Files
```bash
# Clone the repository or extract the ZIP file
git clone <your-repo-url> billing-system
cd billing-system
```

### Step 4: Install Dependencies
```bash
npm install
```

---

## Database Setup

### Step 1: Create Database
```bash
# Open PostgreSQL command line
psql -U postgres

# Inside psql terminal:
CREATE DATABASE billing_system;
\q
```

### Step 2: Run Setup Script

**Option A: Automatic Setup (Recommended)**

**Windows (PowerShell):**
```powershell
.\setup-database.ps1
```

**macOS/Linux:**
```bash
chmod +x setup-database.sh
./setup-database.sh
```

**Option B: Manual Setup**

Create a `.env` file in the project root:
```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/billing_system
NODE_ENV=development
```

Then run:
```bash
npm run db:push
```

### Step 3: Verify Database Setup
```bash
psql -U postgres -d billing_system -c "\dt"
```
You should see 17 tables listed.

---

## Running the Application

### Development Mode
```bash
npm run dev
```

The application will start on http://localhost:5000

### Production Build
```bash
npm run build
npm run start
```

---

## Operations Guide

### Initial Setup (First Time)
1. Open http://localhost:5000 in your browser
2. Click "Setup" to initialize the system
3. Create your first company with:
   - Company Name
   - GST Number
   - Address & Contact Details
4. Create an Admin User:
   - Username: (your choice)
   - Password: (minimum 6 characters)
   - Role: Super Admin

### 1. User Management
**Location**: Settings > User Management (Admin Only)

**Create User:**
- Username: Unique identifier for login
- Password: Minimum 6 characters
- Role: Super Admin or Normal User
- **Page Permissions**: Select which pages the user can access
  - Dashboard: View business overview
  - Parties: Manage customers/suppliers
  - Items: Manage products/inventory
  - Agents: Manage sales agents
  - Sales (B2B/B2C): Create sales invoices
  - Purchases: Record purchase entries
  - Stock: Manage inventory levels
  - Payments: Record payment receipts
  - Reports: View business reports
  - Barcode Management: Design label templates
  - Bill Settings: Configure invoice templates
  - User Management: Manage other users

**Edit User:**
- Click on user in the list to edit role or permissions
- Only Super Admins can manage users

### 2. Company Setup
**Location**: Settings > Companies (Admin Only)

**Create Company:**
- Company Name (Required)
- GST Number (Format: 27ABCTU1234H1Z0)
- Address, City, State
- Email & Phone Number
- Logo URL (Optional)

**Switch Company:**
- Use Company Selector in the sidebar to switch between companies

### 3. Party Master (Customer/Supplier)
**Location**: Sidebar > Parties

**Add Party:**
- Code: Auto-generated
- Short Name: Quick reference name
- Name: Full legal name
- Address: Billing address
- City & Pincode: Required
- GST Number: For B2B transactions
- Agent: Assign sales agent

**Shipping Address:**
- Enable "Has Shipping Address" to add different delivery location
- Useful for online orders

**Opening Balance:**
- Opening Debit: Amount customer owes to you
- Opening Credit: Amount you owe to customer

### 4. Item Master (Product)
**Location**: Sidebar > Items

**Add Item:**
- Code: Auto-generated
- HSN Code: Harmonized System of Nomenclature (Required)
- Name: Product name
- Category: Product category
- Pack Type: PCS, KG, LTR, MTR, BOX, PKT, SET, DZ, GM, ML
- Type: P=Piece, M=Measured
- Cost: Your cost price
- MRP: Maximum Retail Price (rounded)
- Selling Price: Your selling price (rounded)
- Tax: Total GST (5%, 12%, 18%, or 28%)
- CGST & SGST: Calculated automatically

### 5. Stock Management
**Location**: Sidebar > Stock

**View Inventory:**
- See all items with current stock levels
- Click item to view stock history

**Stock Inward:**
1. Go to Sidebar > Stock > Stock Inward
2. Click "New Stock Entry"
3. Select Purchase Entry
4. Add items with:
   - Quantity
   - Cost per unit
   - MRP & Selling Price
5. Save - Stock updates automatically

**Stock Outward:**
- Automatically updated when you make Sales

### 6. Sales Management
**Location**: Sidebar > Sales

#### B2B Sales (With GST Invoice)
1. Click "New B2B Sale"
2. Select Customer (Party)
3. Choose Payment Mode: Cash/Card/Credit
4. Add Items:
   - Scan barcode or select from list
   - Quantity
   - Rate (inclusive/exclusive of tax)
   - Discount (if any)
5. System auto-calculates:
   - Item amount
   - Tax (CGST + SGST)
   - Total
6. Click Print/Save

#### B2C Sales (Retail)
1. Click "New B2C Sale"
2. Enter Customer Mobile (Optional)
3. Payment Mode: Cash/Card/Credit
4. Add Items (same as B2B)
5. Auto-generate Invoice Number
6. Print receipt

#### Sales Estimate
1. Create quote without finalizing as sale
2. Can be converted to actual sale later

#### Credit Note (Return from Customer)
- Issue when customer returns goods
- Reduces customer outstanding

#### Debit Note (Claim to Supplier)
- Issue when supplier charges incorrect amount
- You can claim credit

### 7. Purchase Entry
**Location**: Sidebar > Purchases

**Create Purchase Entry:**
1. Click "New Purchase"
2. Select Supplier (Party)
3. Enter Invoice Number (from supplier)
4. Add Items:
   - Item name/code
   - Quantity
   - Cost per unit
   - Discount % (if any)
5. System calculates tax breakup
6. Save Entry

**Stock Inward (Phase 2):**
- After creating purchase, go to "Stock Inward"
- Allocate received quantities to size ranges (if applicable)
- Mark as completed
- Stock updates automatically

### 8. Payment Recording
**Location**: Sidebar > Payments

**Record Payment Received (From Customer):**
1. Click "New Payment"
2. Select Customer Party
3. Payment Mode: Cash/Check/Card/Transfer
4. Amount
5. Save
- Outstanding reduces automatically

**Record Payment Made (To Supplier):**
1. Click "New Payment"
2. Select Supplier Party
3. Amount
4. Save

### 9. Barcode Management
**Location**: Sidebar > Barcode Management

**Create Label Template:**
1. Design barcode labels with drag-and-drop
2. Select barcode type: CODE 128, QR Code, EAN-13, PDF417, etc.
3. Configure fields:
   - Item Name
   - Rate/MRP
   - Barcode Number
   - Custom fields
4. Set layout: 2x4, 3x4, 4x4 labels per page
5. Configure margins & gaps
6. Save template

**Print Labels:**
1. Go to Items list
2. Select items to print
3. Choose template
4. Select quantity per item
5. Print directly or save as PDF

### 10. Reports & Analysis
**Location**: Sidebar > Reports

**Available Reports:**
- **Outstanding**: Customer/Supplier pending amounts
- **Sales Report**: Sales summary by date/type
- **Purchase Report**: Purchase history
- **Items Report**: Item-wise sales analysis
- **Categories Report**: Category-wise performance
- **Payments Report**: Payment receipts
- **Ledger**: Party-wise detailed transactions

---

## Database Schema Overview

### Core Tables (17 Total)

**Authentication:**
- `users` - User accounts with role and page permissions
- `sessions` - Session management

**Master Data:**
- `companies` - Business entities
- `parties` - Customers & Suppliers
- `agents` - Sales agents/representatives
- `items` - Products/Inventory
- `size_master` - Size variations

**Inventory:**
- `stock` - Current stock levels
- `purchase_items` - Purchase line items with batch details
- `stock_inward_items` - Stock received entries

**Business Transactions:**
- `sales` - Sales invoices header
- `sale_items` - Sales line items
- `purchases` - Purchase entries header
- `payments` - Payment records

**Configuration:**
- `bill_templates` - Invoice templates
- `barcode_label_templates` - Label design templates
- `user_companies` - User-Company assignments

---

## Troubleshooting

### Issue: Cannot Connect to Database
**Solution:**
```bash
# Check PostgreSQL is running
# Windows: Check Services or use
net start postgresql-x64-15

# macOS:
brew services start postgresql@15

# Linux:
sudo systemctl start postgresql
```

### Issue: Port 5000 Already in Use
**Solution:**
```bash
# Find process using port 5000
# Windows:
netstat -ano | findstr :5000

# macOS/Linux:
lsof -i :5000

# Kill the process and restart
npm run dev
```

### Issue: Dependency Installation Error
**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Issue: Database Schema Mismatch
**Solution:**
```bash
# Force sync with schema
npm run db:push -- --force
```

### Issue: Cannot Create Company/User
**Ensure:**
1. You're logged in as Super Admin
2. Database tables are created (run setup script)
3. Check browser console for specific error

---

## File Structure
```
billing-system/
├── client/              # Frontend React app
│   └── src/
│       ├── pages/       # All page components
│       └── components/  # Reusable components
├── server/              # Backend Express server
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Database operations
│   └── localAuth.ts     # Authentication
├── shared/              # Shared types
│   └── schema.ts        # Database schema
├── setup-database.sh    # Linux/macOS setup
├── setup-database.ps1   # Windows setup
└── package.json         # Dependencies
```

---

## Support & Customization

### Common Customizations

**Change Invoice Template:**
1. Go to Settings > Bill Settings
2. Edit company bill settings
3. Configure invoice header/footer
4. Save

**Add Custom Fields to Items:**
Modify `shared/schema.ts` and run `npm run db:push`

**Change Tax Rates:**
1. Edit Item master
2. Update CGST/SGST values
3. Automatically applies to new sales

---

## Security Notes

1. **Change Default Password**: After first login
2. **Backup Database**: Regularly backup PostgreSQL database
3. **User Permissions**: Assign minimal required permissions
4. **API Access**: Backend API authenticated with session tokens

---

## Database Backup & Restore

**Backup:**
```bash
pg_dump -U postgres -d billing_system > backup.sql
```

**Restore:**
```bash
psql -U postgres -d billing_system < backup.sql
```

---

## Next Steps

1. ✓ Database setup complete
2. ✓ Application running
3. → Create your first company
4. → Add parties (customers/suppliers)
5. → Set up products/items
6. → Configure stock levels
7. → Start recording sales & purchases
8. → Generate reports

**You're ready to manage your billing & inventory!**
