# Invoice Draw History Table Implementation

## Overview
Enhanced the invoice PDF generation system to include a comprehensive "Draw History by Category" table that shows all draws made from each budget category across all invoices.

## Features Implemented

### 1. Draw History by Category Table
The PDF now includes a new table section that displays:
- **Category Code** - Budget category identifier
- **Category Name** - Full category name
- **Budget** - Total budgeted amount for the category
- **Draw 1, Draw 2, Draw 3...** - Amount drawn in each invoice (dynamic columns)
- **Total Drawn** - Cumulative total drawn across all invoices
- **Remaining** - Funds still available in the category

### 2. Key Characteristics
- **Dynamic Columns**: Table automatically adjusts to show columns for however many draws have been created
- **Historical View**: Shows complete draw history, not just the current invoice
- **Category-Level Tracking**: Groups all line items by category for easy tracking
- **Visual Clarity**: 
  - Amounts shown with currency formatting
  - Empty cells show "—" dash for better readability
  - Remaining amounts highlighted in green when positive
  - Responsive column widths based on number of draws

### 3. Table Layout
```
Code | Category      | Budget    | Draw 1  | Draw 2  | Draw 3  | Total Drawn | Remaining
-----|---------------|-----------|---------|---------|---------|-------------|----------
1100 | Site Work     | $50,000   | $20,000 | $15,000 | $10,000 | $45,000     | $5,000
1200 | Foundation    | $75,000   | $30,000 | $25,000 | —       | $55,000     | $20,000
...
```

## Technical Implementation

### Modified Files

#### 1. `src/lib/budget/types.ts`
No changes needed - uses existing `DrawInvoice` type

#### 2. `src/lib/budget/service.ts`
**Changes:**
- Updated `InvoicePdfContext` interface to include `allDraws: DrawInvoice[]`
- Added new PDF rendering section after category summary
- Calculates draw amounts per category across all historical draws
- Renders dynamic table with columns for each draw number

**Key Functions:**
```typescript
export interface InvoicePdfContext {
  // ... existing fields
  allDraws: DrawInvoice[]; // NEW: All historical draws including current
}
```

#### 3. `src/app/api/budget/draws/route.ts`
**Changes:**
- Imports `DrawInvoice` type
- Creates temporary `currentDraw` object before PDF generation
- Passes `allDraws: [...state.draws, currentDraw]` to PDF context

### Data Flow

1. **Invoice Creation**:
   - User enters draw amounts in Budget & Draw page
   - Clicks "Generate Invoice" button
   - System creates draw record and calculates line items

2. **PDF Generation**:
   - Collects all historical draws from Firestore
   - Creates temporary draw object for current invoice
   - Combines historical + current draws
   - Passes to PDF builder

3. **Table Rendering**:
   - Groups line items by category across all draws
   - Calculates totals per draw per category
   - Dynamically generates column headers
   - Renders data rows with proper formatting

## Usage

### For Builders
1. Go to `/projects/[id]/purchasing`
2. Create budget line items (if not already done)
3. Finalize the budget
4. Enter draw amounts for categories/items
5. Click "Generate Invoice"
6. Download PDF - will include complete draw history table

### PDF Sections
The invoice PDF now includes these sections in order:
1. **Header** - Invoice info, project details, client, builder
2. **Budget Status Panel** - Draw total and remaining budget
3. **Category Invoice Summary** - Budget vs. last/current/remaining per category
4. **Draw History by Category** - NEW! Complete draw tracking table
5. **Budget Draw Detail** - Line-item level breakdown
6. **Total Amount Panel** - Invoice total

## Benefits

### For Builders
- Track which categories have been drawn from
- See remaining funds available per category at a glance
- Better cash flow management
- Historical record of all payments

### For Clients/Banks
- Transparency in how funds are being used
- Easy verification of category-level spending
- Clear view of what's been paid vs. what's remaining
- Professional invoice format

### For Project Management
- Quick financial health check per category
- Identify over/under spending trends
- Historical audit trail
- Compliance documentation

## Example Output

When you generate Invoice #3, the table shows:
- All amounts drawn in Draw 1
- All amounts drawn in Draw 2
- All amounts drawn in Draw 3 (current)
- Total of all 3 draws per category
- Remaining funds in each category

This provides complete financial transparency and tracking.

## Future Enhancements

Potential improvements:
- Add percentage drawn column
- Color coding for categories near/over budget
- Export table data to CSV
- Comparison view (budgeted vs. actual)
- Category-level notes or adjustments

## Testing

To test the implementation:
1. Create a project with budget
2. Add multiple budget categories (Site Work, Foundation, etc.)
3. Finalize the budget
4. Generate Draw #1 with some category amounts
5. Generate Draw #2 with different amounts
6. Generate Draw #3
7. Download the PDF and verify:
   - Draw History table appears after Category Summary
   - Shows columns for Draw 1, 2, and 3
   - Totals are correct
   - Remaining amounts are accurate

## Notes

- Table automatically adjusts column widths based on number of draws
- Maximum practical limit is ~10 draws before columns become too narrow
- For projects with many draws, consider using landscape orientation
- Empty categories (not drawn from) are still shown with "—" in draw columns

---

**Last Updated:** January 2025
**Status:** ✅ Implemented and Ready for Production
