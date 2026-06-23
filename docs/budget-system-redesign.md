# Budget System Redesign - Construction Budget Integration

## Current Problem

The current "budgets" step in project creation uses **selection categories** (Flooring, Lighting, Plumbing, etc.) which are meant for client selections, not for the actual construction budget tracking.

**Current Flow:**
1. Project creation → "Budgets" step
2. Shows selection categories (Flooring, Lighting, etc.)
3. Builder enters allowances for each
4. These allowances are for client selections only

**What's Missing:**
- No way to track actual construction costs (framing, foundation, roofing, etc.)
- No connection to the Budget & Draw system (`/projects/[id]/purchasing`)
- No way to create budgets for bank draws and invoices
- Mixes selection allowances with construction budget

## Required Solution

Create a comprehensive construction budget system that:

1. **Project Creation** - Step 2: "Construction Budget"
   - Use proper construction categories (Foundation, Framing, Roofing, HVAC, etc.)
   - Builder enters budgeted amounts for each line item
   - Creates initial budget structure in `projects/{projectId}/budget`

2. **Budget & Draw System** - Already exists at `/projects/[id]/purchasing`
   - Load initial budget from project creation
   - Allow adding detailed line items under each category
   - Track draws against budget
   - Generate client and bank invoices

3. **Selection Allowances** - Keep separate
   - Still track client selection allowances per category
   - These are sub-budgets within larger construction categories
   - Example: "Flooring" allowance is part of "15 - Flooring" budget line

## Implementation Plan

### Phase 1: Add Construction Budget Categories ✅

**File**: `src/lib/constants/budget-categories.ts` ✅ CREATED

- Defined 28 standard construction categories
- Based on builder questionnaire categories
- Industry-standard code numbering (01-28)
- Includes: Site Work, Foundation, Framing, Roofing, HVAC, Electrical, etc.

### Phase 2: Update Project Creation "Budgets" Step

**File**: `src/app/projects/new/page.tsx`

**Changes Needed:**

1. **Import budget categories**
```typescript
import { getDefaultBudgetCategories, BudgetCategory } from '@/lib/constants/budget-categories';
```

2. **Add state for construction budget**
```typescript
const [constructionBudget, setConstructionBudget] = useState<{
  categoryCode: string;
  categoryName: string;
  budgetedAmount: number;
}[]>([]);
```

3. **Initialize with default categories**
```typescript
useEffect(() => {
  const defaultCats = getDefaultBudgetCategories();
  setConstructionBudget(defaultCats.map(cat => ({
    categoryCode: cat.code,
    categoryName: cat.name,
    budgetedAmount: 0,
  })));
}, []);
```

4. **Update "Budgets" step UI**
```typescript
{currentStep === 'budgets' && (
  <div className="space-y-6">
    <div>
      <h2>Construction Budget</h2>
      <p>Enter budgeted amounts for each construction category. 
         These will be used for budget tracking, draws, and invoices.</p>
    </div>
    
    <div className="space-y-4">
      {constructionBudget.map(item => (
        <div key={item.categoryCode} className="flex items-center gap-4">
          <div className="w-12 text-sm font-mono text-neutral-600">
            {item.categoryCode}
          </div>
          <div className="flex-1">
            <Input
              label={item.categoryName}
              type="number"
              value={item.budgetedAmount}
              onChange={(e) => handleBudgetChange(item.categoryCode, parseFloat(e.target.value))}
              prefix="$"
              placeholder="0.00"
            />
          </div>
        </div>
      ))}
    </div>
    
    <div className="mt-6 p-4 bg-brass-50 rounded-button">
      <div className="flex justify-between">
        <span className="font-semibold">Total Project Budget:</span>
        <span className="text-xl font-bold">
          ${constructionBudget.reduce((sum, item) => sum + item.budgetedAmount, 0).toLocaleString()}
        </span>
      </div>
    </div>
  </div>
)}
```

5. **Save to project creation**
```typescript
// When creating project, save budget
const projectData = {
  name: projectName,
  // ... other fields ...
  budget: {
    totalAmount: constructionBudget.reduce((sum, item) => sum + item.budgetedAmount, 0),
    status: 'draft',
    categories: constructionBudget,
  },
};
```

### Phase 3: Integrate with Budget & Draw System

**File**: `src/app/projects/[id]/purchasing/page.tsx`

The Budget & Draw system already exists and expects this structure. We just need to ensure the initial budget is loaded from the project.

**Current Structure (already implemented):**
```
projects/{projectId}/budget/main
projects/{projectId}/budgetRows/{rowId}
projects/{projectId}/drawInvoices/{drawId}
```

**What Changes:**
- Budget is now pre-populated from project creation
- Categories follow construction budget codes (01-28)
- Each category can have multiple line items (budgetRows)

### Phase 4: Keep Selection Allowances Separate

**File**: `src/app/projects/new/page.tsx`

The "Categories" step (currently step 8) should still exist for selection allowances, but:

1. Rename to "Selection Allowances" for clarity
2. Keep existing selection categories (Flooring, Lighting, Plumbing)
3. These are for client selections only
4. Store in `projects/{projectId}/categories` subcollection

**Clarify the difference:**
- **Construction Budget** (Step 2): Builder's overall project budget
- **Selection Allowances** (Step 8): Client's budget for finishes/selections

## Data Flow

### Project Creation →  Budget Tracking → Invoices

```
1. Project Creation (Step 2: Construction Budget)
   ↓
   Creates: projects/{projectId}/budget/main
   Contains: Total budget, status, category summaries

2. Budget Builder (/projects/[id]/purchasing)
   ↓
   Creates: projects/{projectId}/budgetRows/{rowId}
   Contains: Detailed line items under each category

3. Draw Requests
   ↓
   Creates: projects/{projectId}/drawInvoices/{drawId}
   Generates: PDF invoices for client and bank

4. Selection Allowances (separate tracking)
   ↓
   Creates: projects/{projectId}/categories/{categoryId}
   Contains: Client selection budgets per category
```

## User Experience

### Builder Workflow:

1. **Create Project** → Enter basic info
2. **Construction Budget** → Enter $X for Foundation, $Y for Framing, etc.
   - See total project budget
   - Can skip and fill in later
3. **Room Configuration** → Configure rooms/fixtures (existing)
4. **Selection Allowances** → Set client's budget for selections (existing)
5. **Complete Setup**

Then later:

6. **Budget & Draw** (`/projects/[id]/purchasing`) → Add detailed line items
   - Under "01 - Site Work": Excavation $5K, Grading $3K, etc.
   - Under "02 - Foundation": Concrete $15K, Rebar $2K, Labor $8K, etc.
7. **Create Draw Requests** → Generate invoices for bank/client
8. **Track Progress** → See spent vs. budgeted for each category

### Client Workflow:

- **Selections** → Make selections within allowances
- **Budget View** → See how selections impact overall budget
- **Invoice Review** → Review draw invoices (if enabled)

## Example Budget Structure

### Project Creation - Initial Budget

```javascript
{
  projectId: "proj123",
  budget: {
    totalAmount: 450000,
    status: "draft",
    categories: [
      { code: "01", name: "Site Work", budgetedAmount: 15000 },
      { code: "02", name: "Foundation", budgetedAmount: 35000 },
      { code: "03", name: "Framing", budgetedAmount: 45000 },
      { code: "04", name: "Roofing", budgetedAmount: 18000 },
      // ... etc
    ]
  }
}
```

### Budget Builder - Detailed Line Items

```javascript
// budgetRows subcollection
{
  rowId: "row1",
  categoryCode: "01",
  categoryName: "Site Work",
  itemCode: "01.010",
  itemName: "Excavation",
  description: "Site excavation and prep",
  quantity: 1,
  unitCost: 5000,
  markup: 0,
  totalAmount: 5000,
  costType: "labor"
}
```

### Draw Invoice

```javascript
{
  drawNumber: 1,
  invoiceNumber: "INV-PROJ-001",
  date: "2026-06-23",
  totalAmount: 85000,
  lineItems: [
    {
      categoryCode: "01",
      categoryName: "Site Work",
      itemName: "Excavation",
      currentDrawAmount: 5000,
      previousDrawn: 0,
      remainingAmount: 0
    },
    // ... more items
  ]
}
```

## Benefits

1. **Real Construction Budget** - Tracks actual project costs
2. **Bank-Ready Invoices** - Generate professional draw requests
3. **Progress Tracking** - See spent vs. budgeted in real-time
4. **Separation of Concerns** - Construction budget separate from selection allowances
5. **Industry Standard** - Follows construction accounting practices

## Migration Notes

### For Existing Projects:

If projects already exist with only selection allowances:

1. Add a "Budget Setup" step to existing projects
2. Allow retroactive entry of construction budget
3. Or set all categories to $0 and let builders fill in as needed

### Backward Compatibility:

- Selection allowances remain unchanged
- Budget & Draw system works with or without initial budget
- No breaking changes to existing functionality

## Implementation Checklist

- [ ] Phase 1: Create budget-categories.ts ✅
- [ ] Phase 2: Update project creation budgets step
  - [ ] Import budget categories
  - [ ] Add construction budget state
  - [ ] Update UI to show construction categories
  - [ ] Calculate and display total
  - [ ] Save budget on project creation
- [ ] Phase 3: Integrate with Budget & Draw
  - [ ] Load initial budget in purchasing page
  - [ ] Pre-populate budget categories
  - [ ] Allow editing and adding line items
- [ ] Phase 4: Update documentation
  - [ ] Update AGENTS.md with new workflow
  - [ ] Add budget setup guide
  - [ ] Update implementation status

## Timeline

- **Phase 1**: ✅ Complete
- **Phase 2**: 4-6 hours (update project creation)
- **Phase 3**: 2-3 hours (integrate with existing budget system)
- **Phase 4**: 1 hour (documentation)

**Total**: ~1-2 days of development

---

**Status**: Phase 1 Complete, Ready for Phase 2
**Priority**: High - Core functionality for construction workflow
**Impact**: Enables complete budget tracking from project start to completion
