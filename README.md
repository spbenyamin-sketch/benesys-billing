# Billing & Inventory Management System

Professional B2B/B2C billing software with GST support, inventory management, barcode labels, and comprehensive reporting.

## 🎯 Features

### Core Features
- ✅ **B2B & B2C Sales** - Different invoice formats for business and retail
- ✅ **GST Management** - Automatic tax calculation (CGST/SGST/IGST)
- ✅ **Purchase Management** - Purchase entry with stock inward tracking
- ✅ **Inventory** - Real-time stock management with barcode tracking
- ✅ **Credit/Debit Notes** - Return and claim management
- ✅ **Payment Tracking** - Record receipts and outstanding amounts
- ✅ **Barcode Labels** - BarTender-style visual label designer
- ✅ **Multi-Company** - Manage multiple businesses in one system
- ✅ **User Management** - Role-based and page-level access control

### Advanced Features
- 📊 **Reports** - Sales, Purchase, Outstanding, Ledger, Payment reports
- 🏷️ **Barcode Designer** - Drag-and-drop label template creation
- 💾 **Bill Templates** - Customizable invoice templates
- 👥 **Agent Management** - Sales representative tracking
- 📱 **Responsive UI** - Works on desktop and tablets

---

## 📋 System Requirements

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.14+, Ubuntu 18.04+
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free disk space

### Software
- **Node.js**: v18+ (LTS recommended)
- **PostgreSQL**: v12+
- **npm**: v8+

---

## 🚀 Quick Start - Three Methods

### Method 1: Windows (Easiest - One Click)

**Prerequisites:**
- PostgreSQL installed and running
- Node.js installed

**Steps:**
1. Go to your project folder
2. **Double-click:** `FINAL-START.bat`
3. Wait for setup to complete
4. Open browser: **http://localhost:5000**

The batch file automatically:
- Creates `.env` if missing
- Installs dependencies
- Sets up database
- Starts server

---

### Method 2: Windows/macOS/Linux (Command Line)

#### Step 1: Install PostgreSQL

**Windows:**
- Download: https://www.postgresql.org/download/windows/
- Run installer, remember your `postgres` password
- Default port: 5432

**macOS:**
```bash
brew install postgresql@15 && brew services start postgresql@15
```

**Linux:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Step 2: Clone & Setup

```bash
# Clone or extract project
git clone <repo-url> billing-system
cd billing-system

# Install dependencies
npm install
```

#### Step 3: Create .env File

In your project root, create `.env` file with:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/billing_system
NODE_ENV=development
SESSION_SECRET=your-secret-key-change-in-production
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

#### Step 4: Setup Database

```bash
npm run db:push
```

#### Step 5: Start Application

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm run build
npm run start
```

#### Step 6: Access Application

Open your browser: **http://localhost:5000**

---

### Method 3: Production Deployment with PM2 (Recommended for 24/7 Running)

PM2 keeps your app running in background, auto-restarts on crashes, and survives server restarts.

#### Step 1: Install PM2 Globally

```bash
npm install -g pm2
```

#### Step 2: Build for Production

```bash
npm run build
```

#### Step 3: Start with PM2

```bash
pm2 start "npm run start" --name "billing-system"
```

#### Step 4: Enable Auto-Restart on Boot (Optional)

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

#### Step 5: Monitor Your App

```bash
# View running processes
pm2 list

# View logs
pm2 logs billing-system

# Stop app
pm2 stop billing-system

# Start app
pm2 start billing-system

# Restart app
pm2 restart billing-system

# Stop all
pm2 stop all
```

---

## 🌐 Web Server Deployment

### Option A: Local Network (LAN) Access

#### Using Express (Built-in)

Your app is already accessible on your local network!

**Find Your Computer's IP Address:**

**Windows:**
```powershell
ipconfig
# Look for "IPv4 Address" (usually 192.168.x.x or 10.x.x.x)
```

**macOS/Linux:**
```bash
ifconfig
# Look for inet address
```

**Access from Other Machines:**
- On another computer/phone on the same network:
- Open browser: `http://YOUR_COMPUTER_IP:5000`

**Example:**
- Your computer IP: `192.168.1.100`
- Access from phone/tablet: `http://192.168.1.100:5000`

---

### Option B: Deploy to Web Server (Nginx/Apache)

#### Setup Nginx as Reverse Proxy

**Install Nginx:**

**Windows:**
- Download: http://nginx.org/en/download.html
- Extract to: `C:\nginx`

**macOS:**
```bash
brew install nginx
```

**Linux:**
```bash
sudo apt install nginx
```

#### Configure Nginx

Edit Nginx config file:

**Windows:** `C:\nginx\conf\nginx.conf`
**macOS/Linux:** `/etc/nginx/sites-available/default`

Replace content with:
```nginx
server {
    listen 80;
    server_name localhost;  # Or your domain name

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
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

- Local: `http://localhost`
- Network: `http://YOUR_COMPUTER_IP`

---

### Option C: Cloud Deployment (For Remote Access)

#### Deploy to Replit

1. Push code to GitHub
2. Go to https://replit.com
3. Import from GitHub
4. Add environment variables (DATABASE_URL, SESSION_SECRET)
5. Deploy with one-click publishing

#### Deploy to Heroku/Railway/Render

1. Create account on platform
2. Connect GitHub repository
3. Set environment variables
4. Deploy

---

## 📝 Complete Setup Examples

### Example 1: Windows Single-Machine Setup

```powershell
# 1. Install PostgreSQL (one-time)
# Download and install from postgresql.org

# 2. Clone project
git clone <repo-url>
cd billing-system

# 3. Install dependencies
npm install

# 4. Create .env file (use Notepad)
# Content:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/billing_system
# NODE_ENV=development

# 5. Setup database
npm run db:push

# 6. Start with FINAL-START.bat
.\FINAL-START.bat

# Result: App at http://localhost:5000
```

### Example 2: Linux Multi-Machine Setup

```bash
# 1. Install PostgreSQL & Node.js
sudo apt update
sudo apt install postgresql nodejs npm nginx

# 2. Clone project
git clone <repo-url>
cd billing-system
npm install

# 3. Create .env
echo "DATABASE_URL=postgresql://postgres:password@localhost:5432/billing_system" > .env
echo "NODE_ENV=production" >> .env

# 4. Setup database
npm run db:push

# 5. Build production
npm run build

# 6. Install PM2
npm install -g pm2

# 7. Start with PM2
pm2 start "npm run start" --name "billing-system"

# 8. Configure Nginx (see nginx section)

# Result: App accessible on network
```

### Example 3: Windows Network Setup (Small Office)

```powershell
# Same as Example 1, but use your computer's IP
# Get IP: ipconfig

# Share app with team:
# 1. Run FINAL-START.bat
# 2. Teammates access: http://YOUR_IP:5000
# 3. Use PM2 to keep running 24/7

pm2 start "npm run start" --name "billing-system"
pm2 save
```

---

## 📊 Database Schema

### 17 Core Tables
- **users** - User accounts with role-based access
- **companies** - Business entities
- **parties** - Customers & Suppliers
- **agents** - Sales representatives
- **items** - Products/inventory
- **stock** - Inventory levels
- **purchases** - Purchase entries
- **purchase_items** - Purchase line items with batch details
- **stock_inward_items** - Received stock tracking
- **sales** - Sales invoices
- **sale_items** - Sales line items
- **payments** - Payment records
- **bill_templates** - Invoice templates
- **barcode_label_templates** - Label designs
- **user_companies** - User-company assignments
- **sessions** - Session management
- **size_master** - Size variations

### Key Features
- GST/tax breakup for each purchase/sale
- Size-wise quantity tracking (s1-s12)
- Batch-wise rate tracking (r1-r12)
- Multi-company support
- Role-based access control with page permissions

---

## 🔧 Available Commands

```bash
# Development
npm run dev              # Start dev server with hot reload

# Production
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:push          # Sync schema to database
npm run db:push -- --force  # Force sync (use with caution)

# Other
npm run lint             # Lint code
npm run type-check       # TypeScript type checking
```

---

## 📖 Usage Examples

### Create a Sale
1. Go to Sales > New B2B Sale
2. Select customer from parties
3. Add items with quantity & rate
4. System auto-calculates tax
5. Choose payment mode
6. Print/Save invoice

### Record Purchase
1. Go to Purchases > New Purchase
2. Select supplier
3. Add items with cost & tax
4. Save purchase entry
5. Go to Stock Inward to allocate quantities
6. Stock updates automatically

### Generate Report
1. Go to Reports > [Report Type]
2. Select date range (optional)
3. View/Download report
4. Export to PDF

---

## 🎨 Barcode Label Designer

**Create Label Template:**
1. Go to Barcode Management
2. Drag & drop fields on canvas
3. Select barcode type (CODE 128, QR, EAN-13, etc.)
4. Configure layout (2x4, 3x4, 4x4 labels per page)
5. Save template

**Print Labels:**
1. Select items to label
2. Choose template
3. Quantity per item
4. Print or save as PDF

---

## 👤 User Management

**Create User (Super Admin Only):**
1. Go to Settings > User Management
2. Click "Create User"
3. Enter username & password
4. Select role (Admin or Normal User)
5. **Assign page permissions** - Select which pages user can access:
   - Dashboard, Parties, Items, Agents
   - Sales, Purchases, Stock, Payments
   - Reports, Barcode Management
   - Bill Settings, User Management

**User Roles:**
- **Super Admin**: Full access to all pages and settings
- **Normal User**: Access only to assigned pages

---

## 🔐 Security Features

- Username/password authentication
- Session-based authorization
- Role-based access control
- Page-level permissions
- Password hashing with bcrypt
- CSRF protection

---

## 📱 Supported Barcode Types

- CODE 128 (Standard barcode)
- QR Code
- EAN-13 (Retail)
- EAN-8 (Small items)
- UPC-A (US)
- PDF417 (2D)
- Data Matrix

---

## 📊 Reports Available

- **Outstanding** - Customer/supplier pending amounts
- **Sales Report** - Sales summary by date/type
- **Purchase Report** - Purchase history
- **Items Report** - Item-wise sales analysis
- **Categories Report** - Category performance
- **Payments Report** - Payment records
- **Party Ledger** - Detailed party transactions

---

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form
- **Routing**: Wouter
- **Build**: Vite

---

## 📁 Project Structure

```
billing-system/
├── client/                  # Frontend React app
│   └── src/
│       ├── pages/          # Page components
│       ├── components/     # Reusable components
│       ├── hooks/          # Custom hooks
│       ├── lib/            # Utilities
│       └── contexts/       # React contexts
├── server/                 # Backend Express server
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # Database operations
│   ├── localAuth.ts        # Authentication
│   └── db.ts               # Database connection
├── shared/                 # Shared code
│   └── schema.ts           # Database schema & types
├── OFFLINE_INSTALLATION_GUIDE.md  # Full setup guide
├── database-schema.sql      # SQL schema dump
├── FINAL-START.bat         # Windows auto-start script
└── package.json            # Dependencies
```

---

## 🐛 Troubleshooting

### Windows: "DATABASE_URL must be set" Error
**Solution:**
1. Create `.env` file in project root (NOT in a subfolder)
2. Add these lines exactly:
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/billing_system
   NODE_ENV=development
   ```
3. Replace `YOUR_PASSWORD` with your actual PostgreSQL password
4. Use `FINAL-START.bat` to start (it will auto-create .env if missing)

### Windows: PostgreSQL psql command not found
**Solution:**
1. Add PostgreSQL to your PATH:
   - Press `Win + X` → System
   - Advanced system settings → Environment Variables
   - Add: `C:\Program Files\PostgreSQL\15\bin` to PATH
   - Restart your computer

### Port 5000 Already in Use
**Solution:**
```powershell
# Windows PowerShell:
netstat -ano | findstr :5000
# Kill the process and restart

# macOS/Linux:
lsof -i :5000
```

### Database Connection Error
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env file:
  ```
  psql -U postgres -l
  ```
- Verify password is correct (test: `psql -U postgres -c "SELECT 1"`)

### Cannot Create Company/User
- Ensure you're logged in as Super Admin
- Check database tables exist:
  ```
  npm run db:push
  ```
- Check browser console (F12) for error messages

### Application Won't Start (Windows)
Try these in order:
1. Check .env file exists and is readable
2. Run: `npm run db:push --force`
3. Delete `node_modules` and run: `npm install`
4. Use `FINAL-START.bat` (handles environment setup automatically)

---

## 📞 Support

For detailed help:
1. Check [OFFLINE_INSTALLATION_GUIDE.md](./OFFLINE_INSTALLATION_GUIDE.md)
2. Review database schema in `shared/schema.ts`
3. Check API endpoints in `server/routes.ts`

---

## 📄 License

This software is proprietary. All rights reserved.

---

## 🚀 Getting Started Now

### Quick Start (Choose One):

**Option 1 - Windows (Easiest):**
1. Double-click `FINAL-START.bat`
2. Open http://localhost:5000

**Option 2 - Command Line:**
1. `npm install`
2. `npm run db:push`
3. `npm run dev`
4. Open http://localhost:5000

**Option 3 - Production (24/7):**
1. `npm install -g pm2`
2. `npm run build`
3. `pm2 start "npm run start" --name "billing-system"`
4. Open http://localhost:5000

**Ready to manage your billing & inventory? Start now!**
