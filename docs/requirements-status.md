# Client Requirements - Implementation Status

## Status Legend
- ✅ **COMPLETE** - Fully implemented and working
- 🟡 **PARTIAL** - Partially implemented, needs enhancement
- ❌ **NOT IMPLEMENTED** - Not yet started
- 🔍 **NEEDS VERIFICATION** - Implemented but needs testing

---

## 1. Paint System Requirements

### ✅ Paint options structure (NO price)
**Status:** COMPLETE
- ✅ Image field
- ✅ Color name field (required)
- ✅ Paint code field (optional)
- ✅ Sheen field (optional)
- ✅ Notes field (optional)
- ✅ NO price field

**Location:** `src/components/ui/PaintBuilder.tsx`

### ✅ Paint has own section
**Status:** COMPLETE
- ✅ Removed from room configuration fixtures
- ✅ Dedicated PaintBuilder component
- ✅ Step 3 in project creation wizard
- ✅ Dedicated section in project setup/edit page
- ✅ Can assign to entire home (walls, trim, ceiling, etc.)
- ✅ Can assign to specific rooms

---

## 2. Room Configuration Requirements

### ❌ Pre-populated room checklist with quantities
**Status:** NOT IMPLEMENTED

**Current Implementation:**
- Manual room entry with "Add Room" button
- User types room name and selects type
- No pre-populated checklist

**Required Implementation:**
- [ ] Create RoomChecklist component
- [ ] Pre-populate common rooms (Primary Bedroom, Guest Bedroom, Kitchen, etc.)
- [ ] Add quantity selector for each room type
- [ ] Keep "Add Custom Room" section separate
- [ ] Example: 
  ```
  ☑ Bedrooms [3]
  ☑ Bathrooms [2]
  ☐ Office [1]
  ☑ Kitchen [1]
  ```

**Files to Create/Modify:**
- Create: `src/components/ui/RoomChecklist.tsx`
- Modify: `src/app/projects/new/page.tsx` (Step 2)
- Modify: `src/app/projects/[id]/setup/page.tsx`

---

## 3. Quick-Add Options in Categories

### ❌ Builder-created quick-add options available to all builders
**Status:** NOT IMPLEMENTED

**Current Implementation:**
- Quick-add buttons exist in DynamicRoomBuilder for fixtures
- Hard-coded in component (not saved to database)
- Not shared across builders/designers

**Required Implementation:**
- [ ] Create QuickAddOptions collection in Firestore
- [ ] Store at: `builderOrgs/{orgId}/quickAddOptions/{categoryId}`
- [ ] UI for builders to add/manage quick-add options
- [ ] Load quick-add options dynamically from database
- [ ] Make available to all builders/designers in org
- [ ] Show as clickable options in client portal

**Files to Create/Modify:**
- Create: `src/app/api/quick-add-options/route.ts`
- Create: `src/components/ui/QuickAddManager.tsx`
- Modify: `src/components/ui/DynamicRoomBuilder.tsx`

---

## 4. Fixture Selection with Quantities

### 🟡 All options listed with select and quantities
**Status:** PARTIAL

**Current Implementation:**
- ✅ Can add fixtures with quantities
- ✅ Quick-add buttons for common fixtures
- ❌ Not all options pre-listed with checkboxes

**Required Implementation:**
- [ ] Show all fixture options as checkboxes
- [ ] Add quantity input next to each option
- [ ] Example:
  ```
  Electrical:
  ☑ Fan [1]
  ☑ Down Rod [1]
  ☐ Vanity Light [0]
  ☑ Recessed Light [6]
  ```

---

## 5. Countertops Configuration

### ❌ Countertops material options
**Status:** NOT IMPLEMENTED

**Required Implementation:**
- [ ] Add material dropdown to countertop selections
- [ ] Options: Granite, Quartz, Quartzite, Marble
- [ ] Add notes field for countertops
- [ ] Update selection schema to include `material` field

**Files to Modify:**
- `src/components/selections/AddSelectionModal.tsx`
- `src/components/selections/EditSelectionModal.tsx`
- `src/app/api/items/route.ts` (add material field)

---

## 6. Scope of Work per Category

### ❌ Builder can enter scope of work for each category
**Status:** NOT IMPLEMENTED

**Required Implementation:**
- [ ] Add scopeOfWork field to category schema
- [ ] Add textarea in project creation wizard (Step 4: Categories)
- [ ] Add textarea in project setup page for each category
- [ ] Store in: `projects/{projectId}/categories/{categoryId}/scopeOfWork`

**Files to Modify:**
- `src/app/projects/new/page.tsx` (Step 4)
- `src/app/projects/[id]/setup/page.tsx`
- `src/app/api/categories/route.ts`

---

## 7. Square Footage Input

### 🔍 Square footage in project creation
**Status:** NEEDS VERIFICATION

**Current Implementation:**
- `squareFootage` state exists with default value of 2500
- Used in allowance calculations
- Shows in project summary

**Issue:**
- No visible input field in Step 1 (Basic Info)
- Hardcoded to 2500

**Required Implementation:**
- [ ] Add square footage input field in Step 1 (Basic Info)
- [ ] Remove hardcoded default value
- [ ] Make it required or optional with clear default

**Files to Modify:**
- `src/app/projects/new/page.tsx` (Step 1)

---

## 8. Project Summary - Fixture Counts

### ❌ Summary showing fixture counts by category
**Status:** NOT IMPLEMENTED

**Current Implementation:**
- Shows total rooms count
- Shows total fixtures count
- Does NOT break down by category (plumbing, electrical, etc.)

**Required Implementation:**
- [ ] Calculate fixture counts by category
- [ ] Show breakdown:
  ```
  Plumbing Fixtures: 8
  Electrical Fixtures: 12
  Flooring: 5 rooms
  etc.
  ```

**Files to Modify:**
- `src/app/projects/new/page.tsx` (Step 6 summary)

---

## 9. Purchase List with Budget Tracking

### ❌ Purchase list grouped by category
**Status:** NOT IMPLEMENTED

**Required Implementation:**
- [ ] Create PurchaseList component
- [ ] Generate list when client completes selections
- [ ] Group items by category
- [ ] Add "purchased" checkbox column
- [ ] Link purchase amounts to budgeted allowances
- [ ] Show remaining budget per category
- [ ] Store in: `projects/{projectId}/purchases/{purchaseId}`
- [ ] Create page: `/projects/[id]/purchases`

**Files to Create:**
- `src/app/projects/[id]/purchases/page.tsx`
- `src/components/purchases/PurchaseList.tsx`
- `src/app/api/purchases/route.ts`

---

## 10. Cabinetry System

### ❌ Cabinetry has own section (like Paint)
**Status:** NOT IMPLEMENTED

**Current Implementation:**
- Cabinetry is still in fixture categories
- Part of room configuration

**Required Implementation:**
- [ ] Remove Cabinetry from DynamicRoomBuilder fixture categories
- [ ] Create CabinetryBuilder component (similar to PaintBuilder)
- [ ] Add Cabinetry step in project creation wizard
- [ ] Add Cabinetry section in project setup page
- [ ] Store in: `projects/{projectId}/cabinetry/{cabinetryId}`
- [ ] Support room-specific or whole-home cabinetry

**Files to Create/Modify:**
- Create: `src/components/ui/CabinetryBuilder.tsx`
- Create: `src/app/api/cabinetry/route.ts`
- Modify: `src/components/ui/DynamicRoomBuilder.tsx`
- Modify: `src/app/projects/new/page.tsx`
- Modify: `src/app/projects/[id]/setup/page.tsx`

---

## 11. Selection Subcategories

### ❌ Add subcategories within main categories
**Status:** NOT IMPLEMENTED

**Example:** Plumbing category should have subcategories:
- Shower Systems
- Free Standing Tub
- Alcove Tub
- Shower/Tub Faucets
- Sink Faucets
- Drain + Overflow
- Tub Filler
- Free Standing Tub Drain
- Shower Drain

**Required Implementation:**
- [ ] Update category schema to support subcategories array
- [ ] Add UI to create/manage subcategories
- [ ] Update CategoryChecklist to show subcategories
- [ ] Allow subcategory selection when creating items
- [ ] Store subcategory in item: `subcategory` field

**Files to Modify:**
- `src/app/api/categories/route.ts`
- `src/components/ui/CategoryChecklist.tsx`
- `src/components/selections/AddSelectionModal.tsx`

---

## 12. Shared Options Library

### ❌ Categories and options available to all builders/designers
**Status:** NOT IMPLEMENTED

**Required Implementation:**
- [ ] Store custom categories at org level
- [ ] Store selection options at org level
- [ ] Auto-sync to all builders/designers in org
- [ ] Path: `builderOrgs/{orgId}/sharedCategories/{categoryId}`
- [ ] Path: `builderOrgs/{orgId}/sharedOptions/{optionId}`

**Files to Create:**
- `src/app/api/shared-categories/route.ts`
- `src/app/api/shared-options/route.ts`

---

## 13. Template Management

### 🟡 View, apply, and delete templates
**Status:** PARTIAL

**Current Implementation:**
- ✅ Can save as template
- ✅ Can apply template (dropdown in setup page)
- ❌ No "View Template" button to see details
- ❌ No delete template functionality

**Required Implementation:**
- [ ] Add "View Template" button showing template details
- [ ] Add "Delete Template" button with confirmation
- [ ] Fix: Prevent duplicates when applying templates

**Files to Modify:**
- `src/app/projects/[id]/setup/page.tsx`
- `src/app/api/templates/[id]/route.ts` (add DELETE)
- Create: `src/components/templates/TemplateViewer.tsx`

---

## 14. Bug Fixes

### ❌ Duplicates in required categories
**Status:** BUG - NOT FIXED

**Issue:** When applying templates, duplicates appear in required categories

**Required Fix:**
- [ ] Check for existing categories before adding from template
- [ ] Merge instead of duplicate

### ❌ Office count showing as 0
**Status:** BUG - NOT FIXED

**Issue:** Selected office in room configuration but shows 0 in summary

**Required Fix:**
- [ ] Debug room counting logic in handleSubmit
- [ ] Ensure "Office" type is properly mapped to `roomsObject.offices`

**Files to Check:**
- `src/app/projects/new/page.tsx` (room counting logic around line 280-300)

---

## Summary

### Completed (2/14)
1. ✅ Paint system with correct fields (no price)
2. ✅ Paint has own section with assignment modes

### Partially Complete (2/14)
3. 🟡 Fixture selection with quantities (needs checkbox approach)
4. 🟡 Template management (needs view/delete)

### Not Implemented (10/14)
5. ❌ Pre-populated room checklist with quantities
6. ❌ Quick-add options shared across builders
7. ❌ Countertops material options
8. ❌ Scope of work per category
9. ❌ Square footage input field
10. ❌ Fixture counts by category in summary
11. ❌ Purchase list with budget tracking
12. ❌ Cabinetry own section
13. ❌ Selection subcategories
14. ❌ Shared options library

### Bugs to Fix (2)
15. ❌ Duplicates in required categories
16. ❌ Office count showing as 0

---

## Priority Recommendations

### High Priority (Core Functionality)
1. Room checklist with quantities
2. Square footage input field
3. Bug fixes (duplicates, office count)
4. Cabinetry system (like paint)

### Medium Priority (Enhanced UX)
5. Countertops material options
6. Scope of work per category
7. Fixture counts in summary
8. Template view/delete

### Lower Priority (Advanced Features)
9. Purchase list with budget tracking
10. Selection subcategories
11. Quick-add options library
12. Shared options across builders

---

**Last Updated:** January 2025
**Paint System Status:** ✅ Complete (2/14 requirements)
**Remaining Work:** 12 requirements + 2 bug fixes
