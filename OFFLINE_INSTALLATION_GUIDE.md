# Billing & Inventory Management System - Complete Installation Guide

Complete offline installation guide for running the Billing & Inventory Management System on your local machine with PostgreSQL. Includes localhost setup, LAN deployment, and webserver configuration.

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Installation Steps](#installation-steps)
3. [Database Setup](#database-setup)
4. [Running the Application](#running-the-application)
5. [Localhost Access](#localhost-access)
6. [Network & Web Server Deployment](#network--web-server-deployment)
7. [PM2 Setup (24/7 Running)](#pm2-setup-247-running)
8. [Operations Guide](#operations-guide)
9. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements
- **Operating System**: Windows 10+, macOS 10.14+, or Ubuntu 18.04+
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free disk space
- **Internet**: For downloading dependencies (first time only)

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
- Verify installation: `node --version && npm --version`

**Ubuntu/Linux:**
```bash
sudo apt update
sudo apt install nodejs npm
```

### Step 2: Install PostgreSQL

**Windows:**
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer
3. **Important:** Remember the password you set for the `postgres` user
4. Default port is `5432`
5. Verify installation: `psql --version`

**macOS:**
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Verify
psql --version
```

**Ubuntu/Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Verify
psql --version
```

### Step 3: Clone/Extract Project Files

**Using Git:**
```bash
git clone <your-repo-url> billing-system
cd billing-system
```

**Or Extract ZIP:**
1. Download project ZIP file
2. Extract to your desired location
3. Open terminal/PowerShell in that folder

### Step 4: Install Dependencies

```bash
npm install
```

This installs all required packages (React, Express, Drizzle ORM, etc.)

---

## Database Setup

### Step 1: Create .env File

Create a `.env` file in your project root with:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/billing_system
NODE_ENV=development
SESSION_SECRET=your-secret-key-change-in-production
```

**Replace `YOUR_PASSWORD`** with your PostgreSQL password (from Step 2 installation).

**Windows Users - Creating .env with Notepad:**
1. Right-click in project folder → New → Text Document
2. Paste the content above
3. Rename to `.env` (with the dot prefix)
4. Change file type to "All Files (*.*)"

**Example .env File:**
```
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/billing_system
NODE_ENV=development
SESSION_SECRET=dev-secret-key-12345
```

### Step 2: Create Database

**Windows (PowerShell):**
```powershell
psql -U postgres -c "CREATE DATABASE billing_system;"
```

**macOS/Linux (Terminal):**
```bash
psql -U postgres -c "CREATE DATABASE billing_system;"
```

If `psql` command not found on Windows, see Troubleshooting section.

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

### Option 1: Windows (Recommended - FINAL-START.bat)

**The easiest way to start on Windows:**

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
- Installs dependencies
- Runs database sync
- Starts the server on port 5000

### Option 2: Development Mode (All Platforms)

```bash
npm run dev
```

The application will start on http://localhost:5000 with hot reload enabled.

Perfect for development and testing.

### Option 3: Production Build (All Platforms)

```bash
# Build for production
npm run build

# Start production server
npm run start
```

This creates optimized builds for better performance.

### Option 4: Production with PM2 (24/7 Running)

See [PM2 Setup](#pm2-setup-247-running) section below.

---

## Localhost Access

### On Same Machine

After starting the server, open your browser and go to:
```
http://localhost:5000
```

Or:
```
http://127.0.0.1:5000
```

### Verify Server Started

You should see output like:
```
11:22:21 AM [express] serving on port 5000
```

If you see any errors, check the Troubleshooting section.

### First-Time Setup

1. Open http://localhost:5000
2. You'll see the Setup Page
3. Enter your first admin username and password
4. Click "Setup"
5. You'll be logged in to the dashboard!

---

## Network & Web Server Deployment

### Access From Other Machines on Same Network (LAN)

Your app is accessible to other computers/phones on the same network!

#### Step 1: Find Your Computer's IP Address

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" (usually 192.168.x.x or 10.x.x.x)

**macOS/Linux:**
```bash
ifconfig
```
Look for "inet" address

#### Step 2: Access From Other Machines

On another computer/phone on the same network, open:
```
http://YOUR_COMPUTER_IP:5000
```

**Example:**
- Your computer IP: `192.168.1.100`
- Access from phone/tablet: `http://192.168.1.100:5000`

**Troubleshooting LAN Access:**
- Ensure both machines are on the same network
- Check Windows Firewall allows port 5000
- Disable VPN on both machines if present

---

### Setup Nginx as Reverse Proxy (Port 80)

Nginx is a lightweight webserver that can proxy requests to your Node.js app.

#### Install Nginx

**Windows:**
1. Download: http://nginx.org/en/download.html
2. Extract to: `C:\nginx`

**macOS:**
```bash
brew install nginx
```

**Linux:**
```bash
sudo apt install nginx
```

#### Configure Nginx

Create/edit the Nginx configuration file:

**Windows:** `C:\nginx\conf\nginx.conf`
**macOS/Linux:** `/etc/nginx/sites-available/default` (edit with `sudo`)

Replace the `http` block with:

```nginx
http {
    # Default MIME types
    include mime.types;
    default_type application/octet-stream;

    sendfile on;
    keepalive_timeout 65;

    # Your app upstream
    upstream billing_app {
        server localhost:5000;
    }

    server {
        listen 80;
        server_name localhost;  # Change to your domain or IP if needed

        # Frontend static files
        location / {
            proxy_pass http://billing_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # API requests
        location /api/ {
            proxy_pass http://billing_app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### Start Nginx

**Windows:**
```powershell
cd C:\nginx
nginx.exe
```

**macOS:**
```bash
brew services start nginx
```

**Linux:**
```bash
sudo systemctl start nginx
```

#### Access Through Nginx

Now your app is accessible without port number:

- Local: `http://localhost`
- Network: `http://YOUR_COMPUTER_IP`

Stop Nginx:
- **Windows:** `nginx -s stop`
- **macOS:** `brew services stop nginx`
- **Linux:** `sudo systemctl stop nginx`

---

### Setup Apache as Reverse Proxy

**Windows (WampServer/XAMPP):**

Edit Apache config:
```apache
<VirtualHost *:80>
    ServerName localhost
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/
</VirtualHost>
```

Enable required modules:
```apache
a2enmod proxy
a2enmod proxy_http
```

Restart Apache.

---

## PM2 Setup (24/7 Running)

PM2 keeps your app running in background, auto-restarts on crashes, and survives server restarts.

### Step 1: Install PM2 Globally

```bash
npm install -g pm2
```

### Step 2: Build for Production

```bash
npm run build
```

### Step 3: Start with PM2

```bash
pm2 start "npm run start" --name "billing-system"
```

### Step 4: Monitor Your App

```bash
# View running processes
pm2 list

# View logs
pm2 logs billing-system

# View specific log entries
pm2 logs billing-system --lines 100
```

### Step 5: Enable Auto-Restart on Boot (Optional)

**Windows (Run as Administrator):**
```powershell
pm2 install pm2-windows-startup
pm2 save
```

**macOS/Linux:**
```bash
pm2 startup
pm2 save
```

After this, your app will auto-start when you restart your computer!

### Common PM2 Commands

```bash
# Stop app
pm2 stop billing-system

# Start app
pm2 start billing-system

# Restart app
pm2 restart billing-system

# Delete from PM2
pm2 delete billing-system

# Stop all apps
pm2 stop all

# Start all apps
pm2 start all

# View process details
pm2 info billing-system

# Watch app for changes (development)
pm2 start "npm run dev" --watch
```

---

## Operations Guide

### Initial Setup (First Time)

1. Open http://localhost:5000 in your browser
2. You'll see the Setup Page
3. Create your first admin user:
   - Username: (your choice, e.g., `admin`)
   - Password: (minimum 6 characters, e.g., `admin123`)
   - Click **Setup**
4. You're now logged in!
5. Create your first company:
   - Go to Settings > Companies
   - Company Name, GST Number, Address, etc.
   - Save

### 1. User Management
**Location**: Settings > User Management (Admin Only)

**Create User:**
- Username: Unique identifier for login
- Password: Minimum 6 characters
- Role: Super Admin or Normal User
- **Page Permissions**: Select which pages the user can access
  - Dashboard, Parties, Items, Agents
  - Sales, Purchases, Stock, Payments
  - Reports, Barcode Management
  - Bill Settings, User Management

### 2. Company Setup
**Location**: Settings > Companies (Admin Only)

**Create Company:**
- Company Name (Required)
- GST Number (Format: 27ABCTU1234H1Z0)
- Address, City, State
- Email & Phone Number
- Logo URL (Optional)

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

### 4. Item Master (Product)
**Location**: Sidebar > Items

**Add Item:**
- Code: Auto-generated
- HSN Code: Harmonized System of Nomenclature (Required)
- Name: Product name
- Category: Product category
- Pack Type: PCS, KG, LTR, MTR, BOX, PKT, SET, DZ, GM, ML
- Cost: Your cost price
- MRP: Maximum Retail Price
- Selling Price: Your selling price
- Tax: Total GST (5%, 12%, 18%, or 28%)

### 5. Stock Management
**Location**: Sidebar > Stock

**View Inventory:**
- See all items with current stock levels
- Click item to view stock history

**Stock Inward:**
1. Go to Sidebar > Stock > Stock Inward
2. Click "New Stock Entry"
3. Select Purchase Entry
4. Add items with quantity, cost, MRP
5. Save - Stock updates automatically

### 6. Sales Management
**Location**: Sidebar > Sales

**B2B Sales (With GST Invoice):**
1. Click "New B2B Sale"
2. Select Customer (Party)
3. Choose Payment Mode: Cash/Card/Credit
4. Add Items (with quantity & rate)
5. System auto-calculates tax
6. Click Print/Save

**B2C Sales (Retail):**
1. Click "New B2C Sale"
2. Enter Customer Mobile (Optional)
3. Payment Mode: Cash/Card/Credit
4. Add Items
5. Auto-generate Invoice Number
6. Print receipt

### 7. Purchase Entry
**Location**: Sidebar > Purchases

**Create Purchase Entry:**
1. Click "New Purchase"
2. Select Supplier (Party)
3. Enter Invoice Number
4. Add Items with quantity & cost
5. System calculates tax breakup
6. Save Entry
7. Go to Stock Inward to allocate received quantities

### 8. Payment Recording
**Location**: Sidebar > Payments

**Record Payment Received (From Customer):**
1. Click "New Payment"
2. Select Customer Party
3. Payment Mode: Cash/Check/Card/Transfer
4. Amount
5. Save - Outstanding reduces automatically

### 9. Barcode Management
**Location**: Sidebar > Barcode Management

**Create Label Template:**
1. Design barcode labels with drag-and-drop
2. Select barcode type: CODE 128, QR Code, EAN-13, PDF417, etc.
3. Configure fields: Item Name, Rate/MRP, Barcode Number
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
- **Categories Report**: Category performance
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

**Windows Solution:**
1. Verify `.env` file exists in your project root folder (NOT in a subfolder)
2. Check file content - should have exactly:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/billing_system
   NODE_ENV=development
   ```
3. Make sure `YOUR_PASSWORD` matches your PostgreSQL password (no quotes)
4. Use `FINAL-START.bat` - it will auto-create .env if missing
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

**All Platforms:**
```bash
# Clear cache and reinstall
rm -r node_modules
del package-lock.json  # Windows command
# or: rm package-lock.json  # macOS/Linux

npm cache clean --force
npm install
```

### Issue: Database Connection Timeout

**Solution:**
1. Ensure PostgreSQL is running (see above)
2. Check DATABASE_URL format is correct:
   ```
   postgresql://postgres:PASSWORD@localhost:5432/billing_system
   ```
3. Test connection:
   ```bash
   psql -U postgres -c "SELECT 1"
   ```
4. If testing fails, your password is wrong or PostgreSQL isn't running

### Issue: Application Won't Start (Windows)

Try these in order:
1. Check .env file exists and is readable
2. Run: `npm run db:push --force`
3. Delete `node_modules` and run: `npm install`
4. Use `FINAL-START.bat` (handles everything automatically)
5. Check if port 5000 is already in use (see above)

### Issue: Pages Load but Nothing Shows

**Solution:**
1. Press `F12` to open browser Developer Console
2. Check for error messages in red
3. Take a screenshot of the error
4. Verify user is logged in (look for username in top-right)
5. Check database has data: `psql -U postgres -d billing_system -c "SELECT COUNT(*) FROM users;"`

### Issue: PM2 App Won't Start

```bash
# Check logs
pm2 logs billing-system

# Check if port 5000 is already in use
netstat -ano | findstr :5000

# Delete and restart
pm2 delete billing-system
pm2 start "npm run start" --name "billing-system"
```

---

## Complete Setup Checklist

- [ ] Node.js installed and verified
- [ ] PostgreSQL installed and running
- [ ] `.env` file created with correct DATABASE_URL
- [ ] `npm install` completed
- [ ] `npm run db:push` completed successfully
- [ ] Server started (npm run dev or FINAL-START.bat)
- [ ] http://localhost:5000 opens in browser
- [ ] Setup page appears (or you're logged in)
- [ ] First admin user created
- [ ] First company created
- [ ] Can create parties/items/sales

**If all checkboxes are checked, your system is ready to use!**

---

## Quick Reference Commands

```bash
# Install dependencies
npm install

# Setup database
npm run db:push

# Start development
npm run dev

# Build production
npm run build

# Start production
npm run start

# Check database
psql -U postgres -d billing_system -c "\dt"

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start "npm run start" --name "billing-system"

# View PM2 logs
pm2 logs billing-system

# Stop PM2 app
pm2 stop billing-system
```

---

**Your billing & inventory system is ready for local deployment!**
