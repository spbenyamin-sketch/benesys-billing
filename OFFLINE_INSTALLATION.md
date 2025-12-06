# Offline Installation Guide - Billing & Inventory Management System

This guide will help you install and run the application offline on a Windows machine with a local PostgreSQL database.

## Prerequisites

Before starting, ensure you have these installed on your Windows machine:

1. **Node.js** (v20 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **PostgreSQL** (v14 or higher)
   - Download from: https://www.postgresql.org/download/windows/
   - Install with default settings
   - Default port: 5432

3. **PM2** (for production mode)
   - Install globally: `npm install -g pm2`

## Installation Steps

### Step 1: Extract and Setup Project

```bash
# Extract the project folder
# Navigate to the project directory
cd your-project-folder

# Install dependencies
npm install
```

### Step 2: Configure PostgreSQL Database

1. **Create Database:**
   - Open PostgreSQL pgAdmin (comes with PostgreSQL)
   - Or use command line:
   
   ```bash
   psql -U postgres
   
   CREATE DATABASE billing_system;
   ```

2. **Set Environment Variables:**
   - Create a `.env` file in the project root:
   
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/billing_system
   NODE_ENV=development
   ```
   
   Replace `password` with your PostgreSQL password.

### Step 3: Run the Application

Use the provided batch files:

#### **For Development Mode** (with hot reload):
```bash
npm run dev
```
Or use the batch file:
```bash
dev.bat
```

The app will be available at: `http://localhost:5000`

#### **For Production Mode** (24/7 with PM2):
```bash
npm run build
npm run start
```
Or use the batch file:
```bash
prod.bat
```

## Batch Files Included

### `dev.bat` - Development Mode
- Starts the app with hot reload
- Perfect for testing and development
- Data persists in local PostgreSQL database
- Stop with: `Ctrl + C`

### `prod.bat` - Production Mode  
- Uses PM2 for process management
- Runs 24/7 automatically
- Survives system reboots (if PM2 startup is enabled)
- Logs saved to `pm2-logs/`

## First Time Setup

1. **Initial Admin Account:**
   - When you first run the app, you'll see an "Initial Setup" screen
   - Create a username and password for the super admin account
   - This account can create companies and manage users

2. **Create Company:**
   - Log in with admin account
   - Go to User Management → Companies
   - Create your first company

3. **Assign Users to Company:**
   - Go to User Management
   - Create new users
   - Assign them to your company with appropriate permissions

## Troubleshooting

### Port 5000 Already in Use
```bash
# Find and kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <process-id> /F
```

### Database Connection Error
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env` file
- Ensure database exists

### npm install fails
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

### Port 5432 (PostgreSQL) Already in Use
- PostgreSQL is already running
- Or another service is using it
- Change port in CONNECTION STRING or stop the conflicting service

## Database Backup & Restore

### Backup:
```bash
pg_dump -U postgres billing_system > backup.sql
```

### Restore:
```bash
psql -U postgres billing_system < backup.sql
```

## Logs

### Development Mode:
- Logs appear in terminal
- Live hot reload notifications

### Production Mode (PM2):
- Logs: `pm2-logs/` folder
- View: `pm2 logs`
- Restart: `pm2 restart all`
- Stop: `pm2 stop all`

## Features Available Offline

✅ Complete Sales Management (B2B, B2C, Estimate, Credit/Debit Notes)
✅ Inventory Management  
✅ Purchase Management
✅ Payment Tracking
✅ Stock Inward Processing
✅ Label Designer with Barcode Support
✅ Advanced Reporting (Sales, Purchase, Outstanding, Ledger)
✅ User Management with Role-Based Access
✅ Multi-Company Support
✅ Excel & PDF Export

## Performance Tips

1. **Database Maintenance:**
   - Regular backups
   - Clean old data periodically

2. **System Resources:**
   - Minimum 2GB RAM
   - 100MB disk space (varies with data volume)

3. **Network:**
   - No internet required after initial installation
   - Completely offline operation

## Need Help?

- Check logs in development mode (console output)
- Review `prod.bat` logs in PM2
- Verify database connectivity
- Ensure all ports are available

---

**Last Updated:** December 2024
**Version:** 1.0
