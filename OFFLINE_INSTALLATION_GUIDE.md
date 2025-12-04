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

### Step 1: Create .env File

Create a `.env` file in your project root folder with:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/billing_system
NODE_ENV=development
```

**Replace `YOUR_PASSWORD`** with your PostgreSQL password (from installation step).

**Windows Users:** Use Notepad to create the file:
1. Right-click in project folder → New → Text Document
2. Paste the content above
3. Rename to `.env` (with the dot prefix)
4. File type: All Files (*.*)

### Step 2: Create Database

**Windows (PowerShell):**
```powershell
psql -U postgres -c "CREATE DATABASE billing_system;"
```

**macOS/Linux:**
```bash
psql -U postgres -c "CREATE DATABASE billing_system;"
```

If psql command not found on Windows, add PostgreSQL to PATH (see Troubleshooting section).

### Step 3: Run Database Migrations
```bash
npm run db:push
```

You should see:
```
[✓] Pulling schema from database...
[✓] Changes applied
```

### Step 4: Verify Database Setup
```bash
psql -U postgres -d billing_system -c "\dt"
```

You should see all 17 tables listed:
- users, companies, parties, agents, items
- stock, purchases, purchase_items, stock_inward_items
- sales, sale_items, payments
- bill_templates, barcode_label_templates
- user_companies, sessions, size_master

---

## Running the Application

### Windows (Recommended - Use FINAL-START.bat)

The easiest way to start on Windows:

1. Go to your project folder (e.g., `E:\VfpNextConverter`)
2. **Double-click: `FINAL-START.bat`**
3. The server will start on http://localhost:5000

**Or from PowerShell:**
```powershell
cd your-project-folder
.\FINAL-START.bat
```

**FINAL-START.bat automatically:**
- Creates `.env` if missing
- Sets up environment variables
- Starts the server on port 5000

### macOS/Linux - Development Mode
```bash
npm run dev
```

The application will start on http://localhost:5000

### Production Build (All Platforms)
```bash
npm run build
npm run start
```

### Verify Server Started

You should see output like:
```
11:22:21 AM [express] serving on port 5000
```

Then open your browser: **http://localhost:5000**

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

### Issue: "DATABASE_URL must be set" Error

This means the `.env` file is not being found or loaded properly.

**Windows Solution:**
1. Verify `.env` file exists in your project root folder
2. Check file content:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/billing_system
   NODE_ENV=development
   ```
3. Make sure `YOUR_PASSWORD` matches your PostgreSQL password (no quotes)
4. **Use FINAL-START.bat** - it will auto-create .env if missing
5. Restart by running FINAL-START.bat again

**Linux/macOS:**
```bash
# Verify .env file exists
cat .env

# If not found, create it
echo "DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/billing_system" > .env
echo "NODE_ENV=development" >> .env
```

### Issue: PostgreSQL "psql" command not found (Windows Only)

**Solution - Add PostgreSQL to PATH:**
1. Press `Win + X` → Click "System"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "System variables", select "Path" → Click "Edit"
5. Click "New" and add: `C:\Program Files\PostgreSQL\15\bin`
6. Click OK → OK → OK
7. **Restart your computer**
8. Open a new PowerShell and test: `psql --version`

### Issue: Cannot Connect to Database

**Windows Check:**
```powershell
# Check if PostgreSQL is running
Get-Service postgresql-x64-15 | Select Status

# Or in Services.msc: Press Win+R → services.msc
# Look for "postgresql" and ensure it's started
```

**macOS:**
```bash
brew services start postgresql@15
```

**Linux:**
```bash
sudo systemctl start postgresql
```

### Issue: Port 5000 Already in Use

**Windows:**
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with the number from above)
taskkill /PID <PID> /F

# Or just restart your computer
```

**macOS/Linux:**
```bash
lsof -i :5000
# Kill the process
kill -9 <PID>
```

### Issue: Dependency Installation Error

**Windows & All Platforms:**
```bash
# Clear cache and reinstall
rm -r node_modules
del package-lock.json  # Windows command
# or: rm package-lock.json  # macOS/Linux

npm cache clean --force
npm install
```

### Issue: Database Schema Mismatch

```bash
# Force sync - this is safe to run
npm run db:push --force
```

### Issue: Cannot Create Company/User

**Checklist:**
1. ✓ You're logged in as Super Admin (username/password you created)
2. ✓ Database tables exist: Run `npm run db:push`
3. ✓ Check browser console (Press F12 → Console tab) for errors
4. ✓ Refresh browser page (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Application Won't Start (Windows)

Try these in order:

1. **Check .env file:**
   - File must exist in project root
   - Content must have DATABASE_URL with your password
   - Password cannot have special characters (or must be in quotes in URL)

2. **Force database sync:**
   ```
   npm run db:push --force
   ```

3. **Clean and reinstall:**
   ```
   rm -r node_modules
   npm install
   npm run db:push
   ```

4. **Use FINAL-START.bat:**
   - Double-click FINAL-START.bat in your project folder
   - It handles all environment setup automatically

5. **Check PostgreSQL:**
   - Open Services (Win+R → services.msc)
   - Look for "postgresql-x64-15" or similar
   - Ensure it's running (status = Started)

### Issue: .env file not created/recognized

**Windows Users - Create .env manually:**

1. Open Notepad
2. Paste this (replace password):
   ```
   DATABASE_URL=postgresql://postgres:MyPassword123@localhost:5432/billing_system
   NODE_ENV=development
   ```
3. File → Save As
4. Filename: `.env` (with the dot)
5. File type: All Files (*.*)
6. Location: Your project root folder (NOT a subfolder)
7. Click Save

**Verify file was created:**
- Go to your project folder
- You should see `.env` file (hidden by default on Windows)
- Enable "Show hidden files" in View options if you can't see it

---

## File Structure

```
billing-system/
├── client/                       # Frontend React app
│   └── src/
│       ├── pages/              # All page components (15+ pages)
│       └── components/         # Reusable components
├── server/                      # Backend Express server
│   ├── routes.ts               # API endpoints
│   ├── storage.ts              # Database operations
│   ├── db.ts                   # Database connection
│   ├── localAuth.ts            # Authentication
│   ├── index-dev.ts            # Development server entry
│   └── index-prod.ts           # Production server entry
├── shared/                      # Shared code
│   └── schema.ts               # Database schema & types
├── .env                        # Environment config (YOU CREATE THIS)
├── FINAL-START.bat             # Windows startup script (double-click to start)
├── OFFLINE_INSTALLATION_GUIDE.md  # This file
├── README.md                   # Project overview
├── database-schema.sql         # SQL schema dump (reference only)
├── package.json                # Dependencies
└── vite.config.ts              # Build configuration
```

### Important Files to Know

| File | Purpose |
|------|---------|
| `.env` | Your database connection string (YOU CREATE) |
| `FINAL-START.bat` | **Windows only** - Double-click to start app |
| `npm run dev` | macOS/Linux command to start app |
| `server/db.ts` | Database connection - loads from .env |
| `shared/schema.ts` | 17 database tables definition |
| `database-schema.sql` | Reference SQL (for manual setup if needed) |

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
