# Visual FoxPro 9 DBF Schema Structure
# Complete Database Schema for Store Management & Billing System

This document provides the complete Visual FoxPro 9 DBF structure for the billing system,
showing how the PostgreSQL implementation maps to the original FoxPro database design.

**Legend:**
- C = Character (Text)
- N = Numeric
- D = Date
- L = Logical (Boolean)
- M = Memo (Long Text)

---

## 1. COMPANY.DBF - Company/Business Master
**Purpose:** Store multiple company information for multi-company support

| Field Name      | Type | Width | Decimals | Description                           |
|----------------|------|-------|----------|---------------------------------------|
| COMP_ID        | N    | 10    | 0        | Auto-increment primary key            |
| COMP_NAME      | C    | 200   | -        | Company name                          |
| ADDRESS        | M    | -     | -        | Full address                          |
| CITY           | C    | 100   | -        | City                                  |
| STATE          | C    | 100   | -        | State name                            |
| GST_NO         | C    | 50    | -        | Company GST number                    |
| PHONE          | C    | 50    | -        | Contact phone                         |
| EMAIL          | C    | 100   | -        | Contact email                         |
| LOGO_URL       | M    | -     | -        | Logo image path/URL                   |
| CREATED_AT     | D    | 8     | -        | Record creation date                  |
| UPDATED_AT     | D    | 8     | -        | Last update date                      |
| CREATED_BY     | C    | 36    | -        | User ID who created                   |

---

## 2. USERS.DBF - User Master
**Purpose:** Store user authentication and profile information

| Field Name      | Type | Width | Decimals | Description                           |
|----------------|------|-------|----------|---------------------------------------|
| USER_ID        | C    | 36    | -        | UUID primary key                      |
| USERNAME       | C    | 100   | -        | Login username (unique)               |
| PASS_HASH      | C    | 255   | -        | Password hash (bcrypt)                |
| EMAIL          | C    | 200   | -        | Email address (unique)                |
| FIRST_NAME     | C    | 100   | -        | First name                            |
| LAST_NAME      | C    | 100   | -        | Last name                             |
| PROFILE_IMG    | C    | 255   | -        | Profile image URL                     |
| ROLE           | C    | 20    | -        | Role: user/admin/agent                |
| CREATED_AT     | D    | 8     | -        | Account creation date                 |
| UPDATED_AT     | D    | 8     | -        | Last update date                      |

---

## 3. USERCOMP.DBF - User-Company Assignment
**Purpose:** Many-to-many relationship between users and companies

| Field Name      | Type | Width | Decimals | Description                           |
|----------------|------|-------|----------|---------------------------------------|
| ID             | N    | 10    | 0        | Auto-increment primary key            |
| USER_ID        | C    | 36    | -        | Foreign key to USERS                  |
| COMP_ID        | N    | 10    | 0        | Foreign key to COMPANY                |
| IS_DEFAULT     | L    | 1     | -        | Is this user's default company?       |
| CREATED_AT     | D    | 8     | -        | Assignment date                       |

---

## 4. PARTY.DBF - Customer/Vendor Master
**Purpose:** Store all customers and suppliers (parties)

| Field Name      | Type | Width | Decimals | Description                           |
|----------------|------|-------|----------|---------------------------------------|
| PARTY_ID       | N    | 10    | 0        | Auto-increment primary key            |
| COMP_ID        | N    | 10    | 0        | Foreign key to COMPANY                |
| PARTY_CODE     | C    | 50    | -        | Unique party code                     |
| PARTY_NAME     | C    | 200   | -        | Party name                            |
| ADDRESS        | M    | -     | -        | Full address                          |
| CITY           | C    | 100   | -        | City                                  |
| STATE          | C    | 100   | -        | State name                            |
| STATE_CODE     | C    | 10    | -        | State code (for GST)                  |
| GST_NO         | C    | 50    | -        | GST number                            |
| PHONE          | C    | 50    | -        | Contact phone                         |
| AGENT          | C    | 100   | -        | Agent name                            |
| AGENT_CODE     | N    | 10    | 0        | Agent code                            |
| OPEN_DEBIT     | N    | 12    | 2        | Opening debit balance                 |
| OPEN_CREDIT    | N    | 12    | 2        | Opening credit balance                |
| CREATED_AT     | D    | 8     | -        | Record creation date                  |
| UPDATED_AT     | D    | 8     | -        | Last update date                      |
| CREATED_BY     | C    | 36    | -        | User ID who created                   |

---

## 5. ITEM.DBF - Item/Product Master
**Purpose:** Product catalog with HSN codes and tax rates

| Field Name      | Type | Width | Decimals | Description                           |
|----------------|------|-------|----------|---------------------------------------|
| ITEM_ID        | N    | 10    | 0        | Auto-increment primary key            |
| COMP_ID        | N    | 10    | 0        | Foreign key to COMPANY                |
| ITEM_CODE      | C    | 50    | -        | Unique item code                      |
| ITEM_NAME      | C    | 300   | -        | Item name/description                 |
| HSN_CODE       | C    | 50    | -        | HSN code for GST                      |
| CATEGORY       | C    | 100   | -        | Product category                      |
| PACK_TYPE      | C    | 20    | -        | PC (pieces) or KG (weight)            |
| TYPE           | C    | 10    | -        | P (piece) or M (measured)             |
| COST           | N    | 12    | 2        | Cost price                            |
| TAX            | N    | 5     | 2        | Total tax percentage                  |
| CGST           | N    | 5     | 3        | CGST rate (tax/2)                     |
| SGST           | N    | 5     | 3        | SGST rate (tax/2)                     |
| ACTIVE         | L    | 1     | -        | Is item active?                       |
| CREATED_AT     | D    | 8     | -        | Record creation date                  |
| UPDATED_AT     | D    | 8     | -        | Last update date                      |
| CREATED_BY     | C    | 36    | -        | User ID who created                   |

---

## 6. STOCK.DBF - Stock/Inventory Master
**Purpose:** Current stock levels for each item

| Field Name      | Type | Width | Decimals | Description                           |
|----------------|------|-------|----------|---------------------------------------|
| STOCK_ID       | N    | 10    | 0        | Auto-increment primary key            |
| COMP_ID        | N    | 10    | 0        | Foreign key to COMPANY                |
| ITEM_ID        | N    | 10    | 0        | Foreign key to ITEM                   |
| QUANTITY       | N    | 12    | 3        | Current stock quantity                |
| LAST_UPDATE    | D    | 8     | -        | Last stock update date                |

---

## 7. SALES.DBF - Sales Transaction Header
**Purpose:** Main sales invoice header with totals

| Field Name      | Type | Width | Decimals | Description                           |
|----------------|------|-------|----------|---------------------------------------|
| SALE_ID        | N    | 10    | 0        | Auto-increment primary key            |
| COMP_ID        | N    | 10    | 0        | Foreign key to COMPANY                |
| INVOICE_NO     | N    | 10    | 0        | Invoice number (auto)                 |
| BILL_TYPE      | C    | 10    | -        | GST or EST (Estimate)                 |
| SALE_DATE      | D    | 8     | -        | Sale date                             |
| SALE_TIME      | C    | 10    | -        | Sale time (HH:MM)                     |
| PARTY_ID       | N    | 10    | 0        | Foreign key to PARTY (nullable)       |
| PARTY_NAME     | C    | 200   | -        | Party name (snapshot)                 |
| PARTY_CITY     | C    | 100   | -        | Party city (snapshot)                 |
| PARTY_ADDR     | M    | -     | -        | Party address (snapshot)              |
| PARTY_GST      | C    | 50    | -        | Party GST no (snapshot)               |
| GST_TYPE       | N    | 1     | 0        | 0=Local(CGST+SGST), 1=Interstate(IGST)|
| SALE_VALUE     | N    | 12    | 2        | Taxable amount (before tax)           |
| TAX_VALUE      | N    | 12    | 2        | Total tax amount                      |
| CGST_TOTAL     | N    | 12    | 2        | Total CGST                            |
| SGST_TOTAL     | N    | 12    | 2        | Total SGST                            |
| ROUND_OFF      | N    | 12    | 2        | Rounding adjustment                   |
| GRAND_TOTAL    | N    | 12    | 2        | Final invoice amount                  |
| TOTAL_QTY      | N    | 12    | 3        | Total quantity sold                   |
| AMT_GIVEN      | N    | 12    | 2        | Amount given by customer              |
| AMT_RETURN     | N    | 12    | 2        | Change returned                       |
| BY_CARD        | N    | 12    | 2        | Amount paid by card                   |
| BY_CASH        | N    | 12    | 2        | Amount paid by cash                   |
| MOBILE         | C    | 20    | -        | Customer mobile number                |
| CREATED_AT     | D    | 8     | -        | Record creation date                  |
| UPDATED_AT     | D    | 8     | -        | Last update date                      |
| CREATED_BY     | C    | 36    | -        | User ID who created                   |

---

## 8. SALEITEM.DBF - Sales Transaction Line Items
**Purpose:** Individual items in a sales invoice

| Field Name      | Type | Width | Decimals | Description                           |
|----------------|------|-------|----------|---------------------------------------|
| SALEITEM_ID    | N    | 10    | 0        | Auto-increment primary key            |
| SALE_ID        | N    | 10    | 0        | Foreign key to SALES                  |
| ITEM_ID        | N    | 10    | 0        | Foreign key to ITEM (nullable)        |
| ITEM_CODE      | C    | 50    | -        | Item code (snapshot)                  |
| ITEM_NAME      | C    | 300   | -        | Item name (snapshot)                  |
| HSN_CODE       | C    | 50    | -        | HSN code (snapshot)                   |
| QUALITY        | C    | 100   | -        | Quality description                   |
| SIZE           | C    | 50    | -        | Size specification                    |
| QUANTITY       | N    | 12    | 3        | Quantity sold                         |
| RATE           | N    | 12    | 2        | Rate per unit                         |
| AMOUNT         | N    | 12    | 2        | Total amount (qty × rate)             |
| SALE_VALUE     | N    | 12    | 2        | Taxable value                         |
| TAX_VALUE      | N    | 12    | 2        | Tax amount                            |
| TAX            | N    | 5     | 2        | Tax percentage                        |
| CGST           | N    | 12    | 2        | CGST amount                           |
| SGST           | N    | 12    | 2        | SGST amount                           |
| CGST_RATE      | N    | 5     | 3        | CGST rate percentage                  |
| SGST_RATE      | N    | 5     | 3        | SGST rate percentage                  |
| CREATED_AT     | D    | 8     | -        | Record creation date                  |

---

## 9. PURCHASE.DBF - Purchase Transaction Header
**Purpose:** Purchase invoice header with tax breakdown by rate slabs

| Field Name      | Type | Width | Decimals | Description                           |
|----------------|------|-------|----------|---------------------------------------|
| PURCH_ID       | N    | 10    | 0        | Auto-increment primary key            |
| COMP_ID        | N    | 10    | 0        | Foreign key to COMPANY                |
| PURCH_NO       | N    | 10    | 0        | Purchase number (auto)                |
| PURCH_DATE     | D    | 8     | -        | Purchase date                         |
| INVOICE_NO     | C    | 50    | -        | Supplier invoice number               |
| PARTY_ID       | N    | 10    | 0        | Foreign key to PARTY (nullable)       |
| PARTY_NAME     | C    | 200   | -        | Supplier name (snapshot)              |
| CITY           | C    | 100   | -        | Supplier city                         |
| TOTAL_QTY      | N    | 12    | 2        | Total quantity purchased              |
| AMOUNT         | N    | 12    | 2        | Total purchase amount                 |
| VAL_0          | N    | 12    | 2        | Value of items @ 0% tax               |
| VAL_5          | N    | 12    | 2        | Value of items @ 5% tax               |
| VAL_12         | N    | 12    | 2        | Value of items @ 12% tax              |
| VAL_18         | N    | 12    | 2        | Value of items @ 18% tax              |
| VAL_28         | N    | 12    | 2        | Value of items @ 28% tax              |
| CTAX_0         | N    | 12    | 2        | CGST @ 0% (₹0)                        |
| CTAX_5         | N    | 12    | 2        | CGST @ 2.5% (5% ÷ 2)                  |
| CTAX_12        | N    | 12    | 2        | CGST @ 6% (12% ÷ 2)                   |
| CTAX_18        | N    | 12    | 2        | CGST @ 9% (18% ÷ 2)                   |
| CTAX_28        | N    | 12    | 2        | CGST @ 14% (28% ÷ 2)                  |
| STAX_0         | N    | 12    | 2        | SGST @ 0% (₹0)                        |
| STAX_5         | N    | 12    | 2        | SGST @ 2.5% (5% ÷ 2)                  |
| STAX_12        | N    | 12    | 2        | SGST @ 6% (12% ÷ 2)                   |
| STAX_18        | N    | 12    | 2        | SGST @ 9% (18% ÷ 2)                   |
| STAX_28        | N    | 12    | 2        | SGST @ 14% (28% ÷ 2)                  |
| DETAILS        | M    | -     | -        | Additional notes                      |
| CREATED_AT     | D    | 8     | -        | Record creation date                  |
| UPDATED_AT     | D    | 8     | -        | Last update date                      |
| CREATED_BY     | C    | 36    | -        | User ID who created                   |

---

## 10. PURCHITM.DBF - Purchase Transaction Line Items
**Purpose:** Individual items in a purchase with detailed tracking

| Field Name      | Type | Width | Decimals | Description                           |
|----------------|------|-------|----------|---------------------------------------|
| PURCHITM_ID    | N    | 10    | 0        | Auto-increment primary key            |
| PURCH_ID       | N    | 10    | 0        | Foreign key to PURCHASE               |
| ITEM_ID        | N    | 10    | 0        | Foreign key to ITEM (nullable)        |
| SERIAL         | N    | 10    | 0        | Serial number in purchase             |
| BARCODE        | C    | 100   | -        | Item barcode                          |
| ITNAME         | C    | 300   | -        | Item full name                        |
| BRANDNAME      | C    | 200   | -        | Brand name                            |
| NAME           | C    | 200   | -        | Short name                            |
| QTY            | N    | 12    | 2        | Quantity purchased                    |
| COST           | N    | 12    | 2        | Cost per unit                         |
| TAX            | N    | 5     | 2        | Tax percentage                        |
| ARATE          | N    | 12    | 2        | A-Rate (price level 1)                |
| RRATE          | N    | 12    | 2        | R-Rate (retail price)                 |
| BRATE          | N    | 12    | 2        | B-Rate (price level 2)                |
| PROFIT         | N    | 12    | 2        | Profit amount                         |
| PRPER          | N    | 5     | 2        | Profit percentage                     |
| EXPDATE        | D    | 8     | -        | Expiry date                           |
| DQTY           | N    | 12    | 2        | Damaged quantity                      |
| SALEQTY        | N    | 12    | 2        | Quantity sold                         |
| STOCKQTY       | N    | 12    | 2        | Current stock quantity                |
| CREATED_AT     | D    | 8     | -        | Record creation date                  |

---

## 11. PAYMENT.DBF - Payment Receipts
**Purpose:** Track all payment transactions (receipts and payments)

| Field Name      | Type | Width | Decimals | Description                           |
|----------------|------|-------|----------|---------------------------------------|
| PAYMENT_ID     | N    | 10    | 0        | Auto-increment primary key            |
| COMP_ID        | N    | 10    | 0        | Foreign key to COMPANY                |
| PAY_DATE       | D    | 8     | -        | Payment date                          |
| PARTY_ID       | N    | 10    | 0        | Foreign key to PARTY (nullable)       |
| PARTY_NAME     | C    | 200   | -        | Party name (snapshot)                 |
| CREDIT         | N    | 12    | 2        | Credit amount (receipt)               |
| DEBIT          | N    | 12    | 2        | Debit amount (payment)                |
| DETAILS        | M    | -     | -        | Payment notes                         |
| CREATED_AT     | D    | 8     | -        | Record creation date                  |
| UPDATED_AT     | D    | 8     | -        | Last update date                      |
| CREATED_BY     | C    | 36    | -        | User ID who created                   |

---

## 12. BILLTMPL.DBF - Bill Template/Settings
**Purpose:** Store invoice template settings per company

| Field Name      | Type | Width | Decimals | Description                           |
|----------------|------|-------|----------|---------------------------------------|
| TEMPLATE_ID    | N    | 10    | 0        | Auto-increment primary key            |
| COMP_ID        | N    | 10    | 0        | Foreign key to COMPANY                |
| TMPL_NAME      | C    | 100   | -        | Template name                         |
| LOGO_URL       | M    | -     | -        | Company logo path                     |
| HEADER_TEXT    | M    | -     | -        | Header text for invoice               |
| FOOTER_TEXT    | M    | -     | -        | Footer text for invoice               |
| SHOW_TAX       | L    | 1     | -        | Show tax breakup?                     |
| SHOW_HSN       | L    | 1     | -        | Show HSN codes?                       |
| SHOW_CODE      | L    | 1     | -        | Show item codes?                      |
| PAPER_SIZE     | C    | 20    | -        | A4, A5, THERMAL, etc                  |
| FONT_SIZE      | N    | 2     | 0        | Font size (8-14)                      |
| IS_DEFAULT     | L    | 1     | -        | Is default template?                  |
| CREATED_AT     | D    | 8     | -        | Record creation date                  |
| UPDATED_AT     | D    | 8     | -        | Last update date                      |
| CREATED_BY     | C    | 36    | -        | User ID who created                   |

---

## Index Files (.CDX)

### COMPANY.CDX
- **Primary Key:** COMP_ID (Unique)
- **Index:** COMP_NAME (Regular)

### USERS.CDX
- **Primary Key:** USER_ID (Unique)
- **Index:** USERNAME (Unique)
- **Index:** EMAIL (Unique)

### USERCOMP.CDX
- **Primary Key:** ID (Unique)
- **Index:** USER_ID (Regular)
- **Index:** COMP_ID (Regular)

### PARTY.CDX
- **Primary Key:** PARTY_ID (Unique)
- **Index:** COMP_ID + PARTY_CODE (Unique Compound)
- **Index:** PARTY_NAME (Regular)
- **Index:** CITY (Regular)

### ITEM.CDX
- **Primary Key:** ITEM_ID (Unique)
- **Index:** COMP_ID + ITEM_CODE (Unique Compound)
- **Index:** ITEM_NAME (Regular)
- **Index:** CATEGORY (Regular)

### STOCK.CDX
- **Primary Key:** STOCK_ID (Unique)
- **Index:** COMP_ID + ITEM_ID (Unique Compound)

### SALES.CDX
- **Primary Key:** SALE_ID (Unique)
- **Index:** COMP_ID + INVOICE_NO + BILL_TYPE (Unique Compound)
- **Index:** SALE_DATE (Regular)
- **Index:** PARTY_ID (Regular)

### SALEITEM.CDX
- **Primary Key:** SALEITEM_ID (Unique)
- **Index:** SALE_ID (Regular)
- **Index:** ITEM_ID (Regular)

### PURCHASE.CDX
- **Primary Key:** PURCH_ID (Unique)
- **Index:** COMP_ID + PURCH_NO (Unique Compound)
- **Index:** PURCH_DATE (Regular)
- **Index:** PARTY_ID (Regular)

### PURCHITM.CDX
- **Primary Key:** PURCHITM_ID (Unique)
- **Index:** PURCH_ID (Regular)
- **Index:** ITEM_ID (Regular)
- **Index:** BARCODE (Regular)

### PAYMENT.CDX
- **Primary Key:** PAYMENT_ID (Unique)
- **Index:** COMP_ID (Regular)
- **Index:** PAY_DATE (Regular)
- **Index:** PARTY_ID (Regular)

### BILLTMPL.CDX
- **Primary Key:** TEMPLATE_ID (Unique)
- **Index:** COMP_ID (Regular)

---

## PostgreSQL to DBF Type Mapping

| PostgreSQL Type           | DBF Type | Notes                                    |
|--------------------------|----------|------------------------------------------|
| serial                   | N        | Auto-increment numeric                   |
| integer                  | N        | Numeric (10,0)                           |
| varchar(n)               | C        | Character, width = n                     |
| text                     | M        | Memo field (unlimited text)              |
| decimal(p,s)             | N        | Numeric with precision and scale         |
| boolean                  | L        | Logical (True/False)                     |
| date                     | D        | Date (8 bytes, YYYYMMDD)                 |
| timestamp                | D        | Date only (time stored separately)       |
| jsonb                    | M        | Stored as memo field                     |

---

## Data Validation Rules

### Field Length Limits
- **Codes:** Max 50 characters (PARTY_CODE, ITEM_CODE, etc.)
- **Names:** Max 200-300 characters
- **GST Numbers:** Max 50 characters (15 char standard format)
- **Phone:** Max 50 characters
- **Email:** Max 100-200 characters

### Numeric Precision
- **Currency/Amount:** 12 digits, 2 decimals (₹99,99,99,999.99)
- **Quantity:** 12 digits, 2-3 decimals
- **Tax Rates:** 5 digits, 2-3 decimals (allows 999.99% max)

### Business Rules
1. **Invoice Numbers:** Auto-increment per company + bill type
2. **GST Type:** 0 = Local (CGST+SGST), 1 = Interstate (IGST)
3. **Party Codes:** Must be unique within company
4. **Item Codes:** Must be unique within company
5. **Stock Updates:** Automatic via sales and purchases
6. **Tax Calculation:** CGST = SGST = TAX ÷ 2

---

## Migration Notes

### From Visual FoxPro to PostgreSQL
1. **Auto-increment Fields:** DBF uses counters, PostgreSQL uses `serial`
2. **Memo Fields:** DBF memo stored in .FPT, PostgreSQL uses `text` type
3. **Date/Time:** DBF stores separately, PostgreSQL uses `timestamp`
4. **Indexes:** DBF .CDX files map to PostgreSQL indexes
5. **Relations:** DBF SET RELATION maps to foreign keys
6. **Deleted Records:** DBF marks deleted, PostgreSQL hard deletes

### Data Import Process
1. Export DBF to CSV using `COPY TO ... TYPE DELIMITED`
2. Clean data (remove deleted records)
3. Import to PostgreSQL using `COPY` or bulk insert
4. Verify foreign key relationships
5. Rebuild indexes and constraints

---

## File Naming Convention

### Original FoxPro Files
```
COMPANY.DBF  + COMPANY.CDX  + COMPANY.FPT
USERS.DBF    + USERS.CDX    + USERS.FPT
PARTY.DBF    + PARTY.CDX    + PARTY.FPT
ITEM.DBF     + ITEM.CDX     + ITEM.FPT
STOCK.DBF    + STOCK.CDX
SALES.DBF    + SALES.CDX    + SALES.FPT
SALEITEM.DBF + SALEITEM.CDX
PURCHASE.DBF + PURCHASE.CDX + PURCHASE.FPT
PURCHITM.DBF + PURCHITM.CDX
PAYMENT.DBF  + PAYMENT.CDX  + PAYMENT.FPT
BILLTMPL.DBF + BILLTMPL.CDX + BILLTMPL.FPT
```

### PostgreSQL Tables
```sql
companies
users
user_companies
parties
items
stock
sales
sale_items
purchases
purchase_items
payments
bill_templates
sessions (auth only)
```

---

## Summary

This schema provides complete data isolation for multi-company operations while maintaining
compatibility with the original Visual FoxPro structure. All tax calculations, inventory
tracking, and financial reporting follow standard GST compliance requirements for India.

**Total Tables:** 12 main tables + 1 session table
**Total Fields:** 200+ fields across all tables
**Supported Operations:** Sales, Purchases, Payments, Stock Management, Multi-Company, Reporting
