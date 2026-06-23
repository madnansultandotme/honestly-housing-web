# Measure Label Implementation

## Overview
Added support for custom unit labels (measureLabel) in budget items to handle different measurement types beyond just "Quantity". Items can now have units like "Length", "Square Feet", "Linear Feet", "Cubic Yards", etc.

## Problem Solved
Previously, all budget items showed "Qty" (Quantity) as the unit type. However, some items use different measurements:
- Down rods are measured in "Length" 
- Flooring/tile measured in "Square Feet"
- Trim measured in "Linear Feet"
- Concrete measured in "Cubic Yards"
- Labor measured in "Hours"

## Features Implemented

### 1. Data Model Updates
Added `measureLabel` field to:
- `BudgetRow` interface
- `DrawInvoiceLineItem` interface

**Type Definition:**
```typescript
export interface BudgetRow {
  // ... existing fields
  measureLabel?: string; // e.g., "Quantity", "Length", "Square Feet"
}

export interface DrawInvoiceLineItem {
  // ... existing fields  
  measureLabel?: string; // e.g., "Quantity", "Length", "Square Feet"
}
```

### 2. UI Form Enhancement
Added "Unit Type" dropdown in Budget Builder form with options:
- Quantity (default)
- Length
- Square Feet
- Linear Feet
- Cubic Yards
- Hours
- Trips
- Lots

**Form Changes:**
- New dropdown selector for unit type
- Quantity input label dynamically updates based on selected unit type
- Shows selected measureLabel when editing existing items

### 3. API Updates

#### POST `/api/budget/rows`
- Accepts `measureLabel` in payload
- Defaults to "Quantity" if not provided
- Saves to Firestore

#### PATCH `/api/budget/rows/[id]`
- Accepts `measureLabel` in update payload
- Updates existing budget row

### 4. Display Updates

#### Budget Builder Table
- Header changed from "Qty" to "Qty / Unit"
- Displays quantity with unit label (e.g., "12 Length", "150 Square Feet")
- Unit label shown in smaller gray text next to quantity

#### Finalized Budget Table
- Same "Qty / Unit" column format
- Shows measure label for client visibility

#### Invoice PDF
- Quantity column shows unit label with value (e.g., "12 Length")
- Format: `{quantity} {measureLabel}` when measureLabel !== 'Quantity'
- Otherwise just shows the quantity number

### 5. Data Flow

1. **Create Budget Item**:
   - Builder selects unit type from dropdown
   - Enters quantity value
   - System saves both `quantity` and `measureLabel`

2. **Edit Budget Item**:
   - Form loads existing measureLabel
   - Builder can change unit type
   - Updates saved to Firestore

3. **Generate Invoice**:
   - DrawInvoiceLineItem includes measureLabel
   - PDF rendering uses measureLabel to format quantity display
   - Shows "12 Length" instead of just "12" for down rods

4. **Display in Tables**:
   - Web UI shows quantity with unit label
   - PDF shows quantity with unit label
   - Provides clarity on what unit the quantity represents

## Technical Implementation

### Modified Files

1. **`src/lib/budget/types.ts`**
   - Added `measureLabel?: string` to `BudgetRow`
   - Added `measureLabel?: string` to `DrawInvoiceLineItem`

2. **`src/app/projects/[id]/purchasing/page.tsx`**
   - Added `measureLabel` to form state interface
   - Added "Unit Type" dropdown in form
   - Updated form initialization to include measureLabel
   - Updated table headers from "Qty" to "Qty / Unit"
   - Added display logic to show measureLabel with quantity

3. **`src/app/api/budget/rows/route.ts`**
   - Accepts `measureLabel` in POST request
   - Defaults to "Quantity" if not provided
   - Saves to Firestore document

4. **`src/app/api/budget/rows/[id]/route.ts`**
   - Accepts `measureLabel` in PATCH request
   - Updates existing budget row

5. **`src/lib/budget/service.ts`**
   - Updated `calculateInvoiceLineItems` to propagate measureLabel
   - Updated PDF rendering to display measureLabel with quantity

## Usage Examples

### Example 1: Down Rod (Length)
```
Item Code: 1150
Item Name: Down Rod
Unit Type: Length
Quantity: 12
Unit Cost: $25.00
```
**Display**: "12 Length" in tables and PDF

### Example 2: Flooring (Square Feet)
```
Item Code: 2100  
Item Name: Hardwood Flooring
Unit Type: Square Feet
Quantity: 500
Unit Cost: $8.50
```
**Display**: "500 Square Feet" in tables and PDF

### Example 3: Labor (Hours)
```
Item Code: 3200
Item Name: Carpentry Labor  
Unit Type: Hours
Quantity: 40
Unit Cost: $75.00
```
**Display**: "40 Hours" in tables and PDF

## Benefits

### For Builders
- Accurate unit tracking for different item types
- Clear invoicing with proper units
- Professional appearance on client-facing documents

### For Clients
- Better understanding of what's being billed
- Clear distinction between different measurement types
- Transparency in quantities

### For Accounting
- Proper unit tracking for inventory
- Accurate cost per unit analysis
- Better reporting capabilities

## Testing

To test the implementation:

1. **Create Budget Item with Custom Unit**:
   - Go to Budget & Draw page
   - Add new budget item
   - Select "Length" from Unit Type dropdown
   - Enter quantity (e.g., 12)
   - Save item

2. **Verify Display**:
   - Check budget builder table shows "12 Length"
   - Edit item and verify Unit Type is pre-selected
   - Finalize budget

3. **Generate Invoice**:
   - Enter draw amount for the item
   - Generate invoice PDF
   - Download and verify PDF shows "12 Length" in Qty column

4. **Test Different Units**:
   - Create items with Square Feet, Linear Feet, Hours
   - Verify all display correctly in UI and PDF

## Migration Notes

- Existing budget items without `measureLabel` will default to "Quantity"
- No data migration required - field is optional
- Old invoices will continue to work (measureLabel defaults if missing)
- New items can start using custom units immediately

## Future Enhancements

Potential improvements:
- Add more unit types (gallons, pounds, each)
- Custom unit input field
- Unit conversion calculator
- Unit-based filtering and reporting
- Template support for common item/unit combinations

---

**Last Updated:** January 2025
**Status:** ✅ Implemented and Ready for Production
