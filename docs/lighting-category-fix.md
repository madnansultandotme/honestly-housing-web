# Lighting Category Fix - "0 of 0" Issue

## Problem Description

When builders configure rooms during project creation and add lighting fixtures (fans, vanity lights, etc.), the Lighting category on the Selections page shows "**0 of 0 completed**" even though items were created.

## Root Cause

**Category Name Mismatch:**

1. **Default Categories** (in project creation): Use "**Lighting**" as the category name
   - Located in: `src/app/projects/new/page.tsx`
   - DEFAULT_CATEGORIES array includes: `{ id: 'lighting', name: 'Lighting' }`

2. **Room Builder Fixtures** (in room configuration): Used "**Electrical**" as the category name
   - Located in: `src/components/ui/DynamicRoomBuilder.tsx`
   - FIXTURE_CATEGORIES array had: `'Electrical'` instead of `'Lighting'`

3. **Result**: 
   - When items are created from room fixtures, they get assigned to category "Electrical"
   - The default "Lighting" category exists but has 0 items
   - Selections page shows "0 of 0" for Lighting because items are in Electrical category

## Solution

Changed all references from "Electrical" to "Lighting" in the room builder and related files:

### Files Modified:

1. **`src/components/ui/DynamicRoomBuilder.tsx`**
   - Line 45: Changed `FIXTURE_CATEGORIES` from `'Electrical'` to `'Lighting'`
   - Line 59: Updated `COMMON_FIXTURES` key from `'Electrical'` to `'Lighting'`
   - Line 75: Changed default `newFixtureCategory` state from `'Electrical'` to `'Lighting'`
   - Line 456: Updated initial category when adding fixture from `'Electrical'` to `'Lighting'`

2. **`src/app/projects/[id]/setup/page.tsx`**
   - Line 528: Updated fixture count filter from `f.category === 'Electrical'` to `f.category === 'Lighting'`
   - Line 749: Updated fixture count filter from `f.category === 'Electrical'` to `f.category === 'Lighting'`

3. **`src/app/projects/new/page.tsx`**
   - Line 444: Updated fixture count filter from `f.category === 'Electrical'` to `f.category === 'Lighting'`

4. **`AGENTS.md`**
   - Added issue and solution to "Common Issues & Solutions" section

## Impact

### For New Projects (After Fix):
- ✅ Lighting fixtures will be correctly assigned to "Lighting" category
- ✅ Category count will show correct numbers (e.g., "0 of 5" or "2 of 5")
- ✅ Category name is consistent across the application

### For Existing Projects (Before Fix):
Projects created before this fix will still have the issue because their items are stored with `categoryName: "Electrical"`.

**Migration Options:**

**Option 1: Re-save Room Configuration (Recommended)**
1. Go to project setup page: `/projects/[id]/setup`
2. Make any small change to rooms (or just click through)
3. Click "Save Configuration"
4. Old items are deleted and recreated with correct category names

**Option 2: Manual Database Update**
Update existing items in Firestore:
```javascript
// For each project with the issue
db.collection('projects').doc(projectId).collection('items')
  .where('categoryName', '==', 'Electrical')
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      doc.ref.update({
        categoryName: 'Lighting',
        // Also update categoryId if it was set to 'electrical'
        categoryId: 'lighting'
      });
    });
  });
```

**Option 3: Create "Electrical" Category (Workaround)**
1. Go to project setup: `/projects/[id]/setup`
2. Add a custom category named "Electrical"
3. This will make existing items visible under "Electrical" category
4. Note: This doesn't fix the underlying issue, just makes items visible

## Testing

### Test Case 1: New Project
1. Create new project
2. Go to Step 3: Room Configuration
3. Add a room (e.g., "Living Room")
4. Add fixtures: Category = "Lighting", Name = "Ceiling Fan", Qty = 2
5. Complete project creation
6. Navigate to Selections page
7. **Expected**: Lighting category shows "0 of 2 completed" (or similar count)
8. **Previous Bug**: Showed "0 of 0 completed"

### Test Case 2: Edit Existing Project
1. Open project with "0 of 0" issue
2. Go to `/projects/[id]/setup`
3. Review rooms and fixtures
4. Click "Save Configuration"
5. Go back to Selections page
6. **Expected**: Lighting category now shows correct count

## Related Code Locations

### Category Definitions:
- **Default Categories**: `src/app/projects/new/page.tsx` (line 32)
- **Fixture Categories**: `src/components/ui/DynamicRoomBuilder.tsx` (line 45)
- **Common Fixtures**: `src/components/ui/DynamicRoomBuilder.tsx` (line 59)

### Category Usage:
- **Items API**: `src/app/api/items/route.ts` - stores `categoryName`
- **Categories API**: `src/app/api/categories/route.ts` - manages categories
- **Selections Display**: `src/app/projects/[id]/selections/page.tsx` - shows category counts

### Fixture Count Calculation:
- Project creation: `src/app/projects/new/page.tsx` (line 444)
- Project setup: `src/app/projects/[id]/setup/page.tsx` (lines 528, 749)

## Prevention

To prevent similar issues in the future:

1. **Use Constants**: Define category names in a shared constants file
2. **Type Safety**: Create TypeScript types for category names
3. **Validation**: Add validation to ensure category names match expected values
4. **Testing**: Add integration tests that verify category consistency

### Suggested Constants File:

```typescript
// src/lib/constants/categories.ts
export const CATEGORY_NAMES = {
  LIGHTING: 'Lighting',
  PLUMBING: 'Plumbing',
  FLOORING: 'Flooring',
  TILE: 'Tile',
  COUNTERTOPS: 'Countertops',
  HARDWARE: 'Hardware',
  APPLIANCES: 'Appliances',
  CABINETRY: 'Cabinetry',
  PAINT: 'Paint',
  MIRRORS: 'Mirrors',
} as const;

export type CategoryName = typeof CATEGORY_NAMES[keyof typeof CATEGORY_NAMES];

export const DEFAULT_CATEGORIES = [
  { id: 'lighting', name: CATEGORY_NAMES.LIGHTING, required: true },
  { id: 'plumbing', name: CATEGORY_NAMES.PLUMBING, required: true },
  // ... etc
];
```

## Notes

- This is a **data consistency issue**, not a functional bug
- The application was working correctly, just with inconsistent naming
- All fixtures were being saved and tracked, just under "Electrical" instead of "Lighting"
- No data loss or corruption occurred
- The fix ensures consistency between default categories and dynamically created categories

---

**Status**: ✅ Fixed
**Date**: June 23, 2026
**Severity**: Medium (visual/UX issue, not data loss)
**Affected**: All projects created before this fix
**Fixed In**: This commit
