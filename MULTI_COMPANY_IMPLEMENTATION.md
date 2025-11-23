# Multi-Company Implementation Documentation

## Overview
The billing system has been successfully converted to support multiple companies within a single application instance. Each user can be associated with multiple companies and switch between them seamlessly.

## Architecture

### Database Schema
- **companies** table: Stores company information (name, GST, address, logo)
- **user_companies** junction table: Many-to-many relationship between users and companies
- **companyId** foreign key: Added to all transactional tables (parties, items, sales, purchases, payments, stock, billTemplates)

### Security Model
All data is isolated by company using a multi-layered approach:

1. **Frontend Layer** (CompanyContext)
   - Selected companyId stored in localStorage
   - X-Company-Id header added to all API requests
   - Company selector UI for switching companies

2. **Backend Layer** (validateCompanyAccess middleware)
   - Validates user has access to requested company via user_companies table
   - Extracts companyId and adds to `req.companyId`
   - All protected routes use this middleware

3. **Storage Layer** (DatabaseStorage)
   - All methods accept companyId parameter
   - All queries filter by companyId
   - Defensive joins filter BOTH sides by companyId
   - Item validation before stock updates

## Security Features Implemented

### Critical Security Validations
1. **Stock Joins** - Both stock and items tables filtered by companyId to prevent cross-company visibility
2. **Sale Item Validation** - All items validated against current company BEFORE creating sale or updating stock
3. **Stock Updates** - Filtered by both itemId AND companyId to prevent cross-company manipulation
4. **Report Joins** - Outstanding reports join sales/purchases/payments with companyId filters
5. **Bill Template Defaults** - Scoped to company when unsetting defaults

### Example: Sale Creation Security
```typescript
// Step 1: Validate all items belong to company BEFORE creating sale
for (const item of saleItemsData) {
  if (item.itemId) {
    const dbItem = await this.getItem(item.itemId, companyId);
    if (!dbItem) {
      throw new Error(`Item ${item.itemId} not found or does not belong to this company`);
    }
  }
}

// Step 2: Create sale (validation passed)
const newSale = await db.insert(sales).values({...});

// Step 3: Update stock ONLY after validation passed
await this.updateStock(item.itemId, quantityChange, companyId);
```

### Stock Update Security Model
The `updateStock` method is **INTERNAL ONLY** and must never be exposed via direct API routes. It trusts that callers have already validated item ownership. Security enforcement happens at the caller level:

1. **No direct stock adjustment routes** - Prevents malicious direct calls
2. **Item validation before stock updates** - All callers must validate items belong to company
3. **Defensive filtering** - updateStock still filters by both itemId and companyId as final safeguard

**Current Stock Update Paths:**
- ✅ createSale → validates items → updateStock (SECURE)
- ❌ createPurchase → NO stock updates (purchases don't have line items)
- ❌ Manual adjustments → NO such routes exist

**Future Enhancement Warning:**
If adding purchase line items or manual stock adjustments:
```typescript
// REQUIRED: Validate items before stock update
const item = await storage.getItem(itemId, companyId);
if (!item) throw new Error("Item not found or unauthorized");
await storage.updateStock(itemId, quantity, companyId);
```

## API Usage

### Headers Required
All protected API endpoints require:
```
Authorization: Bearer <token>
X-Company-Id: <companyId>
```

### Example Requests
```bash
# Get sales for company 1
curl -H "Authorization: Bearer TOKEN" \
     -H "X-Company-Id: 1" \
     https://api.example.com/api/sales

# Create item for company 2  
curl -X POST \
     -H "Authorization: Bearer TOKEN" \
     -H "X-Company-Id: 2" \
     -H "Content-Type: application/json" \
     -d '{"code":"ITM001","name":"Widget"}' \
     https://api.example.com/api/items
```

## User Flow

### New User Registration
1. User registers/logs in via Replit Auth
2. System creates default company for user
3. User redirected to dashboard

### Company Management
1. Navigate to Companies page
2. Create/edit/delete companies
3. Upload company logo (requires object storage setup)

### Company Switching
1. Click company selector in header
2. Select different company
3. All data refreshes for new company context

## Storage Layer Methods
All storage methods follow this pattern:
```typescript
async getItems(companyId: number): Promise<Item[]>
async createSale(saleData, saleItems, userId, companyId): Promise<Sale>
async getOutstanding(companyId: number): Promise<OutstandingReport[]>
```

## Routes Protected
All routes use validateCompanyAccess middleware:
- /api/dashboard/*
- /api/parties/*
- /api/items/*
- /api/sales/*
- /api/purchases/*
- /api/payments/*
- /api/stock/*
- /api/reports/*
- /api/bill-templates/*
- /api/companies/* (validates user owns company for edit/delete)

## Current Limitations

### Purchase Stock Updates
The current implementation does NOT update stock when purchases are created. Purchases are simple transaction records with:
- purchaseNo, date, partyId, partyName, amount, details

**Future Enhancement**: To add purchase line items and stock updates, you would need to:
1. Create purchaseItems table (similar to saleItems)
2. Add item validation in createPurchase (like createSale)
3. Update stock after validating items belong to company

### Object Storage
Company logos use Replit's object storage integration. Manual setup required:
1. Set PRIVATE_OBJECT_DIR environment variable
2. Upload logos via Companies page
3. Logos stored at: `${PRIVATE_OBJECT_DIR}/company-logos/${companyId}-${filename}`

## Testing Recommendations

### Multi-Company Isolation Tests
1. Create two companies with same user
2. Create items in company A
3. Switch to company B
4. Verify company A items not visible
5. Attempt to create sale with company A item ID while in company B context
6. Should fail with "Item not found or does not belong to this company"

### Cross-Company Attack Prevention
Test that malicious requests cannot:
- View other company's data by changing X-Company-Id
- Create sales with other company's items
- Update other company's stock
- Access companies user doesn't belong to

## Migration Notes

### Database Migration Steps
1. Renamed company → companies (backup and restore)
2. Added companyId to all tables
3. Created user_companies junction table
4. Seeded default company for existing users
5. Ran `npm run db:push --force` to sync schema

### Data Integrity
- All existing data assigned to first company (id=1)
- User-company relationships created for all users
- No data loss during migration

## Security Best Practices

### Adding New Features
When adding new transactional tables:
1. Add companyId foreign key to schema
2. Update IStorage interface with companyId parameter
3. Filter all queries by companyId
4. Add validateCompanyAccess middleware to routes
5. Validate foreign key references belong to company
6. Use defensive joins filtering both sides

### Code Review Checklist
- [ ] All storage methods accept companyId
- [ ] All queries filter by companyId
- [ ] Foreign key items validated before insert/update
- [ ] Joins filter both sides by companyId
- [ ] Routes use validateCompanyAccess middleware
- [ ] Error messages don't leak cross-company data

## Conclusion
The multi-company implementation provides enterprise-grade data isolation with multiple security layers. All transactional data is scoped by company with defensive programming to prevent cross-company data leakage or manipulation.
