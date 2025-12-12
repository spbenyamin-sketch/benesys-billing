# Store Management & Billing System

## Overview
A comprehensive store management and billing system designed for retail businesses, providing GST-compliant invoicing, robust inventory tracking, and detailed financial reporting. The system manages customers, products, sales, purchases, payments, and stock levels, offering valuable business insights. The vision is to empower retail businesses with an efficient, scalable, and compliant platform, positioning the project for significant market potential in the retail technology sector.

## User Preferences
- **Communication Style:** Simple, everyday language
- **Deployment:** App will run on localhost (local development)
- **Database Changes:** All database schema changes must be documented in `shared/schema.ts` before implementation

## System Architecture

### Technology Stack
**Frontend:** React 18+ with TypeScript, Shadcn/ui (Radix UI), Tailwind CSS (Material Design, "New York" variant), TanStack Query for state management, Wouter for routing, React Hook Form with Zod for forms. Design system prioritizes information density using Inter font for UI and JetBrains Mono for numeric data.
**Backend:** Node.js with Express.js, TypeScript (ES modules), Drizzle ORM, PostgreSQL (via Neon serverless), Express sessions with PostgreSQL store. Build tools include Vite (frontend) and esbuild (backend).

### Authentication & Authorization
- **Replit Auth Integration:** OpenID Connect (OIDC) via Passport.js.
- **Session Management:** PostgreSQL-backed sessions with 7-day TTL and secure HTTP-only cookies.
- **User Roles:** 'superadmin' (creates companies, manages expiry), 'admin' (manages company, users, all pages), 'user' (restricted access).
- **Multi-Company Implementation:** Enterprise-grade data isolation using `companyId` on all transactional tables, `user_companies` for relationships, `X-Company-Id` headers for API requests, and `validateCompanyAccess` middleware. All queries are filtered by `companyId`.

### Database Schema & Design
**Core Entities:** Users, Companies (with `expiryDate` for licensing), Parties (customers/vendors), Items (products), Sales, Sale Items, Purchases, Payments, and Stock.
**Design Decisions:** Decimal types for precision, generated columns for tax calculations, nullable party references for cash transactions, code-based identification, and user foreign keys for multi-tenancy.

### API Architecture
RESTful Endpoints protected by `isAuthenticated` middleware for modules like Authentication, Party, Item, Sales, Purchases, Payments, Stock, and Reporting. Zod schemas ensure data validation across frontend and backend.

### Frontend Architecture
Organized components (`pages/`, `components/`, `hooks/`, `lib/`), TanStack Query for server state and caching, React Hook Form with Zod for type-safe validation, Wouter for client-side routing. Features a sidebar navigation, responsive layouts, and forms.

### Bill Template System
Supports A4, B4, Thermal 3-inch, and Thermal 4-inch formats. Templates are assignable to B2B Credit Sale, B2C Retail Sale, and Estimate/Quotation. Features include customizable header/footer, logo, tax breakup toggle, HSN/item codes, party balance, bank details, terms, configurable font size, and Tamil language support via `enableTamilPrint` flag.

### Tamil Language Support
Toggleable support for Tamil labels on invoices via the `enableTamilPrint` field in bill templates. Uses `client/src/lib/tamil-translator.ts` for translations of key invoice elements.

### Invoice Management
- **Invoice Numbering:** Separate auto-incrementing counters for B2B, B2C, and ESTIMATE sale types (e.g., `{TYPE}-{YYYY}-{SEQUENCE}`).
- **Invoice Editing:** Allows modification of existing sales with validation for items, quantity, and rate.
- **e-Invoice JSON Generation:** For B2B sales, generates India GST e-Invoice JSON v1.1 for upload to GST portal.
- **Proforma Invoice:** Dummy bill type for quotations/estimates that does NOT affect outstanding balances or stock levels. Displays "PROFORMA INVOICE" heading and is excluded from financial calculations.

### Payment Management
Thermal format payment receipt printing with company details, number-to-words conversion for amounts, and `useReactToPrint` integration.

### Reports & Printing
**Available Reports:** Sales Report (date, type filter), Sales Total Report (daily, payment method, CSV), Outstanding Report, Purchase Report, Party Ledger (transaction history). All reports include print functionality.
**GST Filing Export:** Generates GSTR1.xlsx, HSN-B2B.xlsx, and HSN-B2C.xlsx from sales data, accessible via Sales Report.
**Quick Print Settings:** Configurable auto-print after save, default print copies per sale type (stored in localStorage), and `?print=auto` URL parameter for automatic print dialog.
**Direct Print Service (WebSocket):** Bypasses browser print dialogs by sending print commands to local Windows printers via a WebSocket connection to an authenticated Python service. Tokens are generated per-company for security.

### Software Licensing & Role-Based Access Control
- **Three-Tier Role Hierarchy:** Super Admin, Admin (customer role), Normal User.
- **Company Expiry Date:** `expiryDate` field in the companies table, managed by Super Admin.
- **Expiry Enforcement:** When a company expires, admin and user roles are blocked with "Company license has expired" message. **Superadmin can always login** to expired companies to manage and extend the expiry date.

### Stock Management
- **Item Movement History:** API `GET /api/items/:id/history` provides consolidated item details, stock levels, purchases, sales, and movement summary.

### Barcode & Label Printing
- **PRN File Generation:** Generates Zebra EPL2 format PRN files for direct printing to Zebra barcode printers via `POST /api/barcodes/generate-prn`. Includes barcode, item name, MRP, selling price, and HSN code. Accessible from Barcode Management page with "Generate PRN" button.

## External Dependencies

**Database & Infrastructure:**
- **Neon PostgreSQL:** Serverless PostgreSQL database.

**Authentication:**
- **Replit Auth:** OAuth 2.0 / OpenID Connect provider.

**UI Component Libraries:**
- **Radix UI:** Unstyled accessible component primitives.
- **Lucide React:** Icon library.
- **Shadcn/ui:** UI component library built on Radix UI.

**Date Handling:**
- **date-fns:** Lightweight date formatting and manipulation library.

**Form Validation:**
- **Zod:** TypeScript-first schema validation.
- **React Hook Form:** Form management library.

**Session Storage:**
- **connect-pg-simple:** PostgreSQL session store for Express.

**Styling:**
- **Tailwind CSS:** Utility-first CSS framework.

**Printing:**
- **react-to-print:** Print library for thermal and document printing.

**Python Service:**
- **benesys_print_service.py:** Local Windows print service for direct printing.