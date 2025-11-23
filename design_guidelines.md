# Design Guidelines: Store Management & Billing System

## Design Approach
**Material Design System** - Selected for its robust data-dense UI patterns, clear visual hierarchy, and proven effectiveness in enterprise business applications. The system provides established patterns for forms, tables, and data visualization essential for billing/inventory management.

## Core Design Principles
1. **Data First**: Information density over decorative elements
2. **Efficiency**: Minimize clicks, maximize keyboard navigation
3. **Clarity**: Unambiguous visual hierarchy for financial data
4. **Consistency**: Predictable patterns across all modules

---

## Typography System

**Font Stack**: Inter for UI, JetBrains Mono for numeric data
- **Headings**: 
  - H1: 32px, semibold (Page titles)
  - H2: 24px, semibold (Section headers)
  - H3: 18px, medium (Card titles)
- **Body**: 
  - Primary: 15px, regular (Forms, descriptions)
  - Secondary: 13px, regular (Helper text, captions)
- **Data Display**: 
  - Numbers: 16px, medium, monospace (Invoice amounts, quantities)
  - Table cells: 14px, regular

---

## Layout & Spacing System

**Spacing Scale**: Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-6
- Card spacing: gap-4
- Form field gaps: space-y-4
- Section margins: my-8
- Table cell padding: px-4 py-3

**Grid System**:
- Main layout: Sidebar (240px fixed) + Content (flex-1)
- Forms: Single column (max-w-2xl) for data entry
- Reports: Full width tables with horizontal scroll
- Dashboard: 2-column grid (lg:grid-cols-2) for metrics cards

---

## Component Library

### Navigation
- **Sidebar Navigation** (Persistent, left-aligned)
  - Grouped menu items: Sales, Inventory, Reports, Masters, Settings
  - Active state: Bold text with indicator line
  - Icons: 20px, aligned left of labels
  
### Forms
- **Input Fields**: Full-width with labels above
  - Label: 14px, medium, mb-2
  - Input height: h-10
  - Focus state: Prominent border
  - Error messages: Below field, 12px
  
- **Autocomplete Dropdowns**: For party/item selection
  - Search as you type
  - Show: Code | Name | Additional info
  - Keyboard navigable (arrow keys, Enter)

### Data Display
- **Tables**: Striped rows for readability
  - Header: Sticky, 14px semibold
  - Row height: h-12
  - Zebra striping for alternating rows
  - Action column: Right-aligned
  - Sortable columns with visual indicators
  
- **Cards**: For summary metrics and forms
  - Border radius: rounded-lg
  - Shadow: Subtle elevation
  - Padding: p-6
  - Header with divider line

### Billing Interface
- **Invoice Entry Screen**: 
  - Top: Party selection + Invoice details (Date, Bill No.)
  - Middle: Item entry row (Item selector, Qty, Rate, Amount)
  - Bottom: Items table with running total
  - Right panel: Tax breakdown (CGST, SGST, Total)
  - Action buttons: Floating at bottom-right

### Reports & Print Views
- **Print Layout**: 
  - A4 proportion (210mm × 297mm)
  - Header: Company details, logo placement
  - Invoice details in table format
  - Tax summary clearly separated
  - Footer: Terms and signature lines
  - Print button: Top-right of report view

### Modals & Dialogs
- **Size**: Default max-w-md, Large max-w-2xl for forms
- **Overlay**: Semi-transparent backdrop
- **Actions**: Right-aligned, Primary + Cancel
- **Close**: X icon top-right + ESC key

---

## Key Application Sections

### Dashboard
- 4-column metrics cards (Today's Sales, Outstanding, Low Stock, Pending Orders)
- Quick actions: New Sale, New Purchase, View Reports
- Recent transactions table (last 10 entries)
- No hero images - data-focused layout

### Sales Billing
- Single-page workflow
- Party autocomplete prominent at top
- Item entry optimized for keyboard (Tab through fields)
- Live calculation display
- GST/Estimate toggle clearly visible
- Print preview in modal

### Masters (Customer, Item, Party)
- List view: Searchable table with filters
- Create/Edit: Side panel or modal form
- Bulk actions: Export, Import capabilities
- Pagination: Bottom-center, show counts

### Reports Section
- Filter panel: Left sidebar with date ranges, party selection
- Report display: Full-width table
- Export options: PDF, Excel (top-right)
- Print-optimized view toggle

---

## Responsive Behavior

**Desktop-First Approach** (Primary use case)
- Optimize for 1366px+ screens
- Sidebar always visible on desktop
- Tables: Horizontal scroll if needed
- Forms: Max-width centered

**Mobile Considerations** (Secondary)
- Sidebar: Collapsible drawer
- Tables: Card view on mobile
- Forms: Full-width on small screens
- Sticky header with menu toggle

---

## Animations
**Minimal, purposeful only**:
- Modal fade-in: 200ms
- Dropdown slide: 150ms
- Button states: Instant feedback
- No decorative animations
- Loading states: Subtle spinners

---

## Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation: Tab order logical, focus visible
- Form validation: Inline errors with clear messaging
- Color contrast: WCAG AA compliance minimum
- Screen reader: Descriptive text for data tables

---

## Images
**No decorative images needed** - This is a business application focused on data and functionality. Any company logo placement should be configurable in settings.