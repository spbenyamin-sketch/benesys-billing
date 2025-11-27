# Store Management & Billing System

## Overview

A comprehensive store management and billing system designed for retail businesses. Its primary purpose is to provide GST-compliant invoicing, robust inventory tracking, and detailed financial reporting. The application facilitates the management of customers (parties), products (items), sales, purchases, payments, and stock levels, offering valuable business insights through various reports. The business vision is to empower retail businesses with an efficient, scalable, and compliant platform for their day-to-day operations, positioning the project for significant market potential in the retail technology sector.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Technology Stack

**Frontend:**
- **Framework:** React 18+ with TypeScript
- **UI Library:** Shadcn/ui (built on Radix UI)
- **Styling:** Tailwind CSS (Material Design-inspired, "New York" variant)
- **State Management:** TanStack Query
- **Routing:** Wouter
- **Forms:** React Hook Form with Zod validation
- **Design System:** Prioritizes information density, uses Inter font for UI and JetBrains Mono for numeric data.

**Backend:**
- **Runtime:** Node.js with Express.js
- **Language:** TypeScript (ES modules)
- **Database ORM:** Drizzle ORM
- **Database:** PostgreSQL (via Neon serverless)
- **Session Management:** Express sessions with PostgreSQL store
- **Build Tool:** Vite (frontend), esbuild (backend)

### Authentication & Authorization

- **Replit Auth Integration:** OpenID Connect (OIDC) via Passport.js strategy.
- **Session Management:** PostgreSQL-backed sessions (`sessions` table) with a 7-day TTL, secure HTTP-only cookies.
- **User Roles:** Supports 'user', 'admin', 'agent'.
- **Multi-Company Implementation:** Enterprise-grade data isolation using `companyId` on all transactional tables, `user_companies` junction table for user-company relationships, `X-Company-Id` headers for API requests, and `validateCompanyAccess` middleware for security. All queries are filtered by `companyId` with defensive joins.

### Database Schema & Design

**Core Entities:**
- **Users:** Authentication and profile data (UUID PK, email, name, role).
- **Parties:** Customer/vendor records (code-based ID, address, GSTIN, agent assignment, opening balance).
- **Items:** Product catalog (code, name, HSN, category, pack type, cost, tax rates, active status).
- **Sales:** Transaction headers (auto-incrementing invoice, party reference, GST type, comprehensive totals).
- **Sale Items:** Line items for sales (links to sales and items, quantity, rate, tax breakdown).
- **Purchases:** Purchase transactions (party reference, amount, details).
- **Payments:** Financial transactions (type, party, amount).
- **Stock:** Inventory levels (item reference, quantity).

**Design Decisions:** Decimal types for precision, generated columns for tax calculations, nullable party references for cash transactions, code-based identification, and user foreign keys for multi-tenancy.

### API Architecture

- **RESTful Endpoints:** Protected by `isAuthenticated` middleware.
- **Modules:** Dedicated endpoints for Authentication, Party Management, Item Management, Sales, Purchases, Payments, Stock, and Reporting.
- **Data Validation:** Zod schemas are used across frontend and backend, ensuring type safety and robust validation.

### Frontend Architecture

- **Component Organization:** `pages/` for routes, `components/ui/` for Shadcn/ui, `components/` for app-specific components, `hooks/` for custom hooks, `lib/` for utilities.
- **State Management:** TanStack Query for all server state with aggressive caching; mutations invalidate related queries for UI updates.
- **Form Handling:** React Hook Form with Zod resolvers for type-safe validation.
- **Routing:** Wouter for client-side routing, with authentication status determining access.
- **Layout:** Sidebar navigation with a mobile drawer, main content area, forms with optimal readability, and responsive tables/dashboard grids.

## External Dependencies

**Database & Infrastructure:**
- **Neon PostgreSQL:** Serverless PostgreSQL database.

**Authentication:**
- **Replit Auth:** OAuth 2.0 / OpenID Connect provider.

**UI Component Libraries:**
- **Radix UI:** Unstyled accessible component primitives.
- **Lucide React:** Icon library.

**Date Handling:**
- **date-fns:** Lightweight date formatting and manipulation library.

**Form Validation:**
- **Zod:** TypeScript-first schema validation.

**Session Storage:**
- **connect-pg-simple:** PostgreSQL session store for Express.

**Styling:**
- **Tailwind CSS:** Utility-first CSS framework.