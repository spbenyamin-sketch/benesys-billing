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

## 🚀 Quick Start

### 1. Install PostgreSQL

**Windows**: https://www.postgresql.org/download/windows/
**macOS**: `brew install postgresql@15 && brew services start postgresql@15`
**Linux**: `sudo apt install postgresql postgresql-contrib`

### 2. Clone & Setup
```bash
# Clone repository
git clone <repo-url>
cd billing-system

# Install dependencies
npm install

# Create database
psql -U postgres -c "CREATE DATABASE billing_system;"

# Run setup
npm run db:push

# Start development server
npm run dev
```

### 3. Access Application
Open http://localhost:5000 in your browser

---

## 📚 Complete Operations Guide

See [OFFLINE_INSTALLATION_GUIDE.md](./OFFLINE_INSTALLATION_GUIDE.md) for:
- Detailed installation instructions for all OS
- Complete operations guide for all features
- Database schema overview
- Troubleshooting help
- Backup & restore procedures

---

## 🏗️ Database Schema

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
└── package.json            # Dependencies
```

---

## 🐛 Troubleshooting

### Port 5000 Already in Use
```bash
# Kill process using port 5000 and restart
npm run dev
```

### Database Connection Error
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env file
- Verify credentials

### Cannot Create Company/User
- Ensure you're logged in as Super Admin
- Check database tables exist (run `npm run db:push`)

### Import/Export Issues
- Check file format (CSV for import)
- Verify required columns present

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

1. **Install**: Follow "Quick Start" above
2. **Setup**: Run `npm run db:push`
3. **Start**: Run `npm run dev`
4. **Access**: Open http://localhost:5000
5. **Create**: Your first company and start billing!

**Ready to manage your billing & inventory? Start now!**
