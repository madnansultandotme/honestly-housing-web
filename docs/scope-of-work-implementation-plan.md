# Scope of Work System Implementation Plan

## Overview
Replace the current flat budget/categories system with a hierarchical budget structure integrated with category-specific Scope of Work templates.

## Implementation Phases

### Phase 1: Update Project Creation ✅ READY TO IMPLEMENT
**Goal:** Replace Step 2 with hierarchical budget, remove Step 7 (Categories), add Step 8 (Scope of Work)

**Changes:**
1. Replace flat `constructionBudget` state with hierarchical structure
2. Update Step 2 UI to show main categories with expandable subcategories
3. Remove "Categories" step (old Step 7)
4. Add new "Scope of Work" step that shows all budget categories
5. Each category in Scope of Work has:
   - Complete/Skip toggle
   - Category-specific form (if applicable)
   - File upload area
   - Notes field

**Files to Modify:**
- `src/app/projects/new/page.tsx` - Project creation wizard
- Update state to use `HierarchicalBudgetCategory[]`
- Add `scopeOfWorkData` state for tracking scope completion

### Phase 2: Create Scope of Work Templates ✅ READY TO IMPLEMENT
**Goal:** Build category-specific templates for specialized categories

**Templates Needed:**

#### 1. **Roofing Template** (`src/components/scope-of-work/RoofingScope.tsx`)
```typescript
- Notes field (textarea)
- Checkboxes:
  - Composite 30 Year
  - R Panel
  - Standing Seam Metal
  - Accents
- File upload (multiple)
```

#### 2. **Insulation Template** (`src/components/scope-of-work/InsulationScope.tsx`)
```typescript
- 5 sections, each with:
  - Insulation type (text)
  - Thickness (number + "inches")
  - R-Value (number)
- Sections:
  1. Exterior walls of improved living areas
  2. Walls in other areas of the home
  3. Ceilings on improved living areas
  4. Floors not on slab foundation
  5. Other insulated areas
```

#### 3. **HVAC Template** (`src/components/scope-of-work/HVACScope.tsx`)
```typescript
- System type (radio: Electric, Gas, Heat Pump)
- Size (number + "Ton")
- Brand (text)
- Interior unit location (text)
- Exterior unit location (text)
```

#### 4. **Plumbing Template** (`src/components/scope-of-work/PlumbingScope.tsx`)
```typescript
- Auto-populate from room selections:
  - Group by room
  - Show counts: faucets, pot filler, sinks, toilets, tubs
- Gas appliances section (auto-detect from appliances)
- Fireplace:
  - Type (radio: Gas, Electric, Wood)
  - Location (text)
- Water Heater:
  - Type (radio: Gas, Electric, Propane Tank, Tankless)
  - Location (dropdown: Garage, Attic, Other)
  - Other location (text, conditional)
- Outdoor Grill (radio: Yes, No)
- Propane (radio: Yes, No)
- Propane location (text, conditional)
- File upload (multiple)
```

#### 5. **Electrical Template** (`src/components/scope-of-work/ElectricalScope.tsx`)
```typescript
- Auto-populate from room selections:
  - Group by room
  - Show fixture counts and types
- File upload (multiple)
- Notes (textarea)
```

#### 6. **Masonry Template** (`src/components/scope-of-work/MasonryScope.tsx`)
```typescript
- Custom fields (TBD by client)
- Notes (textarea)
- File upload (multiple)
```

#### 7. **Cabinetry Template** (`src/components/scope-of-work/CabinetryScope.tsx`)
```typescript
- Reorganized structure (TBD)
- File upload (multiple)
- Complete Later toggle
- Notes (textarea)
```

#### 8. **Default Template** (`src/components/scope-of-work/DefaultScope.tsx`)
```typescript
- Notes (textarea)
- File upload (multiple)
- Used for all categories without custom template
```

### Phase 3: Scope of Work Data Management ✅ READY TO IMPLEMENT
**Goal:** Store and manage scope of work data per project

**Database Schema:**
```typescript
// Firestore: projects/{projectId}/scopeOfWork/{categoryId}
interface ScopeOfWorkDocument {
  projectId: string;
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  status: 'completed' | 'skipped' | 'incomplete';
  data: Record<string, any>; // Template-specific data
  files: string[]; // URLs to uploaded files
  notes: string;
  completedAt?: string;
  completedBy?: string;
  createdAt: string;
  updatedAt: string;
}
```

**API Endpoints:**
- `POST /api/scope-of-work` - Create/update scope of work
- `GET /api/scope-of-work?projectId={id}` - Get all scopes for project
- `GET /api/scope-of-work/{id}` - Get specific scope
- `DELETE /api/scope-of-work/{id}` - Delete scope

### Phase 4: Plumbing/Electrical Integration ✅ READY TO IMPLEMENT
**Goal:** Auto-populate plumbing and electrical scopes from room selections

**Logic:**
```typescript
// src/lib/scope-of-work/integration.ts

function generatePlumbingScope(roomSelections: RoomDetail[]): PlumbingData {
  // Group by room
  // Count: faucets, sinks, toilets, tubs, showers
  // Extract gas appliances
  // Return structured data
}

function generateElectricalScope(roomSelections: RoomDetail[]): ElectricalData {
  // Group by room
  // Count: light fixtures by type, switches, outlets
  // Return structured data
}
```

### Phase 5: File Upload System ✅ READY TO IMPLEMENT
**Goal:** Allow file uploads for scope of work and construction contract

**Implementation:**
1. **Scope of Work Files:**
   - Multiple files per category
   - Upload to: `scopeOfWork/{projectId}/{categoryId}/{fileName}`
   - Store URLs in scope document

2. **Construction Contract:**
   - Single file per project
   - Upload to: `contracts/{projectId}/construction-contract.pdf`
   - Store URL in project document: `project.contractUrl`

3. **Component:** `src/components/scope-of-work/FileUploader.tsx`
   - Drag-and-drop support
   - Multiple file selection
   - File type validation (PDF, DOC, DOCX, images)
   - Preview thumbnails
   - Delete capability

### Phase 6: Scope of Work Export ✅ READY TO IMPLEMENT
**Goal:** Export compiled scope of work document

**Features:**
- **Format:** PDF
- **Content:**
  - Project header (name, address, client)
  - Budget summary table (hierarchical)
  - Each category's scope of work:
    - Category name and code
    - Template data (formatted)
    - Notes
    - Attached files (list with links or embedded)
- **Button location:** Project detail page, Scope of Work section

**Implementation:**
- Use existing PDF generation logic
- New template: `src/lib/pdf/scope-of-work-template.ts`
- API endpoint: `GET /api/scope-of-work/export?projectId={id}`

### Phase 7: Construction Contract Upload ✅ READY TO IMPLEMENT
**Goal:** Upload area for construction contract

**Location:** Project detail page → Documents tab (new tab)

**Features:**
- File upload (PDF preferred)
- Display uploaded contract with download link
- Replace contract capability
- Delete contract capability

**UI Component:** `src/components/projects/ContractUpload.tsx`

### Phase 8: "Complete Later" Feature ✅ READY TO IMPLEMENT
**Goal:** Allow skipping scope of work during project creation

**Implementation:**
- Each category has 3 states:
  - **Completed** - Form filled out
  - **Skipped** - Explicitly skipped
  - **Incomplete** - Not yet addressed (default)
- Toggle: "Complete Later" checkbox
- If checked, category marked as "skipped"
- Can return later to complete

**UI:**
```tsx
<div className="flex items-center gap-2 mb-4">
  <input 
    type="checkbox" 
    id={`skip-${categoryId}`}
    checked={status === 'skipped'}
    onChange={() => toggleSkip(categoryId)}
  />
  <label htmlFor={`skip-${categoryId}`}>
    Complete this later
  </label>
</div>
```

### Phase 9: Cabinetry Reorganization ✅ PENDING CLIENT INPUT
**Goal:** Reorganize cabinetry section with files/pics

**Status:** Waiting for client to provide structure

**Placeholder Implementation:**
- Use default template with file upload
- Add "Complete Later" toggle
- Notes field
- Client can provide specific fields later

## File Structure

```
src/
├── components/
│   └── scope-of-work/
│       ├── RoofingScope.tsx
│       ├── InsulationScope.tsx
│       ├── HVACScope.tsx
│       ├── PlumbingScope.tsx
│       ├── ElectricalScope.tsx
│       ├── MasonryScope.tsx
│       ├── CabinetryScope.tsx
│       ├── DefaultScope.tsx
│       ├── FileUploader.tsx
│       └── ScopeOfWorkExport.tsx
├── lib/
│   ├── scope-of-work/
│   │   ├── integration.ts (auto-population logic)
│   │   └── types.ts (TypeScript interfaces)
│   └── pdf/
│       └── scope-of-work-template.ts
└── app/
    ├── api/
    │   └── scope-of-work/
    │       ├── route.ts (CRUD)
    │       ├── [id]/route.ts
    │       └── export/route.ts
    └── projects/
        ├── new/page.tsx (updated)
        └── [id]/
            ├── scope-of-work/page.tsx (new)
            └── documents/page.tsx (new - for contract)
```

## Testing Checklist

### Project Creation:
- [ ] Step 2 shows hierarchical budget
- [ ] Can expand/collapse main categories
- [ ] Can enter amounts for subcategories
- [ ] Subcategories add up to main total
- [ ] Grand total calculates correctly
- [ ] Old "Categories" step removed
- [ ] New "Scope of Work" step appears
- [ ] Can complete scope for each category
- [ ] Can skip categories with "Complete Later"
- [ ] Templates render correctly
- [ ] File uploads work
- [ ] Auto-population works (Plumbing/Electrical)

### Scope of Work Management:
- [ ] Can view all scopes for a project
- [ ] Can edit existing scopes
- [ ] Can upload files to scopes
- [ ] Can delete files from scopes
- [ ] Export generates PDF correctly
- [ ] PDF includes all category data
- [ ] PDF includes file links/embeds

### Construction Contract:
- [ ] Can upload contract
- [ ] Can download contract
- [ ] Can replace contract
- [ ] Can delete contract
- [ ] Contract URL saved to project

## Timeline Estimate

- **Phase 1:** 2-3 hours (Update project creation)
- **Phase 2:** 4-5 hours (Create all templates)
- **Phase 3:** 2 hours (API endpoints)
- **Phase 4:** 2 hours (Integration logic)
- **Phase 5:** 2 hours (File upload system)
- **Phase 6:** 3 hours (PDF export)
- **Phase 7:** 1 hour (Contract upload)
- **Phase 8:** 1 hour (Complete later feature)
- **Phase 9:** TBD (Pending client input)

**Total:** 17-20 hours

## Priority Order

1. **Phase 1** - Project creation update (blocking)
2. **Phase 3** - Data management (blocking)
3. **Phase 2** - Templates (high value)
4. **Phase 4** - Integration (high value)
5. **Phase 5** - File uploads (required)
6. **Phase 6** - Export (required)
7. **Phase 7** - Contract (nice to have)
8. **Phase 8** - Complete later (QoL)
9. **Phase 9** - Cabinetry (pending)

---

**Status:** Ready to implement
**Next Step:** Begin Phase 1 implementation
