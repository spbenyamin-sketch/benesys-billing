# Store Management & Billing System

## Overview

A comprehensive store management and billing system built for retail businesses, providing GST-compliant invoicing, inventory tracking, and financial reporting capabilities. The application enables businesses to manage customers (parties), products (items), sales transactions, purchases, payments, and stock levels while generating detailed reports for business insights.

**Key Features:**
- GST and estimate invoice generation with automatic tax calculations
- Customer and vendor (party) management
- Product catalog with HSN codes and tax rates
- Sales and purchase transaction tracking
- Payment receipt and recording
- Real-time stock inventory management
- Financial reports including outstanding balances, sales analysis, item reports, and party ledgers

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (November 23, 2025)

**Purchase Management & Stock Tracking - COMPLETED ✅**

Added comprehensive purchase management system with complete stock tracking integration:

- **Purchase List Page** - View all purchases with date, invoice number, party, city, quantities, and amounts
- **Purchase Detail View** - Detailed view of individual purchases showing all items, tax calculations, and party information
- **Purchase Reports** - Date range filtering, tax breakdown summary by rate, CSV export functionality
- **Stock View Page** - Advanced stock lookup with barcode search, item search, expiry tracking (alerts for expired/expiring items), detailed purchase item information
- **Enhanced Sales Billing** - Added real-time stock availability column showing current quantities and low stock alerts to prevent overselling
- **Company Switcher** - Added dropdown menu in header to easily switch between companies (shows company name and switch button)

**Multi-Company Implementation - COMPLETED ✅**

Successfully converted the billing system to support multiple companies in a single application with enterprise-grade data isolation:

- **Database Schema** - Added companyId to all transactional tables, user_companies junction table for many-to-many relationships
- **Frontend** - CompanyContext with forced refetch on mount/focus, X-Company-Id headers on all requests, company selector UI, company switcher dropdown
- **Backend Security** - validateCompanyAccess middleware validates user access via user_companies table before allowing any operations
- **Storage Layer** - All methods accept and filter by companyId, defensive joins filter both sides
- **Critical Security Fixes**:
  - Stock joins filter both stock AND items tables by companyId to prevent cross-company visibility
  - Double-layer item validation: createSale validates items belong to company before stock update, updateStock validates internally
  - No direct API routes to stock updates (only accessible through validated sales flow)
  - Query caching fixed (staleTime: 0, refetchOnMount, refetchOnWindowFocus, no-cache headers)
  - Bill template defaults properly scoped to current company

**Security Model:**
- **Frontend Layer:** X-Company-Id header from localStorage added to all API requests, company switcher in header
- **Middleware Layer:** validateCompanyAccess checks user_companies table for authorization
- **Storage Layer:** All queries filter by companyId with defensive joins on both sides
- **Stock Updates:** Double validation (caller + internal) prevents cross-company manipulation
- **Complete Data Isolation:** When switching companies, all data (parties, items, sales, purchases, stock, reports) automatically filters to show only that company's information

**Documentation:** See `MULTI_COMPANY_IMPLEMENTATION.md` for complete technical documentation, security model, testing recommendations, and migration notes.

## System Architecture

### Technology Stack

**Frontend Architecture:**
- **Framework:** React 18+ with TypeScript
- **UI Library:** Shadcn/ui components built on Radix UI primitives
- **Styling:** Tailwind CSS with Material Design-inspired system
- **State Management:** TanStack Query (React Query) for server state
- **Routing:** Wouter (lightweight client-side routing)
- **Forms:** React Hook Form with Zod validation
- **Design System:** "New York" variant of Shadcn/ui with neutral base color

**Backend Architecture:**
- **Runtime:** Node.js with Express.js
- **Language:** TypeScript with ES modules
- **Database ORM:** Drizzle ORM
- **Database:** PostgreSQL via Neon serverless
- **Session Management:** Express sessions with PostgreSQL store (connect-pg-simple)
- **Build Tool:** Vite for frontend, esbuild for backend production builds

**Design Rationale:**
The Material Design system was chosen for its proven effectiveness in data-dense enterprise applications. The architecture prioritizes information density over decorative elements, with clear visual hierarchy for financial data. Inter font is used for UI elements while JetBrains Mono provides clarity for numeric data display.

### Authentication & Authorization

**Replit Auth Integration:**
- OpenID Connect (OIDC) flow via Passport.js strategy
- Session-based authentication stored in PostgreSQL
- User profiles include email, name, profile image, and role
- Three role levels: user, admin, agent (stored but enforcement pending)
- 7-day session TTL with secure HTTP-only cookies
- Issuer URL: `https://replit.com/oidc` (configurable via environment)

**Session Storage:**
- Dedicated `sessions` table with automatic expiration via TTL
- Session data stored as JSONB for flexibility
- Index on expiration column for efficient cleanup

### Database Schema & Design

**Core Entities:**

1. **Users Table** - Authentication and profile data
   - UUID primary key (generated)
   - Email, name, profile image URL
   - Role-based access control field
   - Timestamps for audit trail

2. **Parties Table** - Customer and vendor records
   - Code-based identification system
   - Complete address details (address, city, state, state code)
   - GST number for tax compliance
   - Agent assignment with code tracking
   - Opening balance tracking (debit/credit)
   - User ownership via foreign key

3. **Items Table** - Product catalog
   - Code and name identification
   - HSN code for GST compliance
   - Category and pack type (PC/KG) classification
   - Type indicator (P/M - likely Product/Material)
   - Cost and tax rate configuration
   - Computed CGST/SGST (tax/2) via generated columns
   - Active status flag
   - User ownership

4. **Sales Table** - Transaction headers
   - Auto-incrementing invoice numbers by bill type
   - Support for multiple bill types (GST, Estimate)
   - Party reference (nullable for cash sales)
   - GST type indicator (intra/inter-state)
   - Comprehensive totals: quantity, base amount, CGST, SGST, IGST, grand total
   - User tracking

5. **Sale Items Table** - Transaction line items
   - Links to sales and items
   - Quantity, rate, and computed amount
   - Tax breakdown (CGST, SGST, IGST)
   - HSN code snapshot for historical accuracy

6. **Purchases Table** - Purchase transactions
   - Party reference (nullable)
   - Amount and details tracking
   - User ownership

7. **Payments Table** - Financial transactions
   - Type indicator (credit/debit)
   - Party reference (nullable for general entries)
   - Amount and details
   - User tracking

8. **Stock Table** - Inventory levels
   - Item reference with quantity tracking
   - User ownership for multi-tenant scenarios

**Design Decisions:**
- Decimal types for all monetary and quantity fields ensure precision
- Generated columns for CGST/SGST avoid calculation errors and ensure consistency
- Nullable party references support both account-based and cash transactions
- Code-based identification alongside IDs provides business-friendly references
- User foreign keys on all operational tables support multi-tenant architecture
- Timestamps track record creation and updates for audit purposes

### API Architecture

**RESTful Endpoints:**
All routes protected by `isAuthenticated` middleware.

**Authentication Routes:**
- `GET /api/auth/user` - Retrieve current authenticated user profile

**Party Management:**
- `GET /api/parties` - List all parties
- `GET /api/parties/:id` - Retrieve single party
- `POST /api/parties` - Create new party (validated with Zod schema)
- `PUT /api/parties/:id` - Update existing party

**Item Management:**
- Similar CRUD pattern for items with code/name/HSN/category/tax configuration

**Sales Operations:**
- `GET /api/sales` - List sales transactions
- `POST /api/sales` - Create sale with line items (atomic transaction)
- `GET /api/sales/next-invoice/:billType` - Generate next invoice number

**Purchase & Payment Operations:**
- Standard CRUD endpoints following same pattern
- Validated with respective Zod schemas from shared schema definitions

**Stock & Reporting:**
- `GET /api/stock` - Current inventory levels
- `GET /api/dashboard/metrics` - Aggregated business metrics
- Report endpoints for outstanding, sales analysis, items, and ledgers

**Data Validation:**
Zod schemas defined in shared schema module using `createInsertSchema` from drizzle-zod, ensuring type safety between database and API layers.

### Frontend Architecture

**Component Organization:**
- `pages/` - Route-level components (dashboard, parties, items, sales, etc.)
- `components/ui/` - Shadcn/ui component library
- `components/` - Application-specific components (app-sidebar)
- `hooks/` - Custom React hooks (useAuth, use-toast, use-mobile)
- `lib/` - Utilities (queryClient, utils, authUtils)

**State Management Pattern:**
- TanStack Query for all server state with aggressive caching (staleTime: Infinity)
- Query keys mirror API endpoints for consistency
- Mutations invalidate related queries for automatic UI updates
- Optimistic updates not currently implemented
- Custom query functions handle 401 responses (return null vs throw)

**Form Handling:**
React Hook Form with Zod resolvers ensures type-safe form validation matching backend schemas. Forms use controlled components with immediate validation feedback.

**Routing Strategy:**
Wouter provides lightweight client-side routing. Authentication status determines route availability - unauthenticated users see landing page, authenticated users access full application via sidebar navigation.

**Layout System:**
- Sidebar navigation (240px fixed width) with mobile drawer variant
- Main content area uses flex-1 for responsive sizing
- Forms constrained to max-w-2xl for optimal readability
- Tables use full width with horizontal scroll
- Dashboard uses responsive grid (lg:grid-cols-2)

## External Dependencies

**Database & Infrastructure:**
- **Neon PostgreSQL** - Serverless PostgreSQL database
  - WebSocket connection via `@neondatabase/serverless`
  - Connection pooling enabled
  - DATABASE_URL environment variable required

**Authentication:**
- **Replit Auth** - OAuth 2.0 / OpenID Connect provider
  - ISSUER_URL: configurable, defaults to `https://replit.com/oidc`
  - REPL_ID: required for client identification
  - SESSION_SECRET: required for session encryption

**UI Component Libraries:**
- **Radix UI** - Unstyled accessible component primitives
  - 20+ component packages for dialogs, dropdowns, forms, etc.
  - Provides ARIA compliance and keyboard navigation
- **Lucide React** - Icon library (implied from component usage)

**Development Tools:**
- **Vite** - Frontend development server and build tool
  - HMR for rapid development
  - esbuild for production builds
- **Replit Plugins** (development only):
  - Runtime error overlay
  - Cartographer for code navigation
  - Dev banner

**Date Handling:**
- **date-fns** - Date formatting and manipulation (lightweight alternative to moment.js)

**Form Validation:**
- **Zod** - TypeScript-first schema validation
  - Shared between frontend and backend
  - Integration with React Hook Form and Drizzle ORM

**Session Storage:**
- **connect-pg-simple** - PostgreSQL session store for Express
  - 7-day TTL configuration
  - Automatic session cleanup via database expiration

**Styling:**
- **Tailwind CSS** - Utility-first CSS framework
  - Custom color system with HSL values
  - Extended spacing and border radius scales
  - Autoprefixer for browser compatibility

**Build Configuration:**
- Development: tsx for TypeScript execution with hot reload
- Production: esbuild bundles server, Vite bundles client
- Database migrations: drizzle-kit for schema management