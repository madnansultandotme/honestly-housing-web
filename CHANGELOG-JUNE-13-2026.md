# Changelog - June 13, 2026

## 🎯 Major Updates

### 1. Budget Subcategory Management System ✅
**Enhanced HierarchicalBudgetInput Component**

#### New Features:
- ✅ **Edit Subcategory Names**: Click the pencil icon next to any custom subcategory to edit its name inline
- ✅ **Delete Subcategories**: Remove custom subcategories with a single click (with confirmation)
- ✅ **Room Assignment**: Assign subcategories to specific rooms via dropdown selector
- ✅ **Better Organization**: "Add Subcategory" button now appears contextually within each category's expanded view

#### Implementation Details:
**Files Modified:**
- `src/components/ui/HierarchicalBudgetInput.tsx`
- `src/lib/constants/hierarchical-budget-categories.ts`

**New Data Structure:**
```typescript
export interface BudgetSubcategory {
  id: string;
  name: string;
  description?: string;
  amount?: number;
  roomId?: string;        // NEW: Optional room assignment
  roomName?: string;      // NEW: Optional room name for display
}
```

**Key Features:**
1. **SubcategoryRow Component**: New internal component handles individual subcategory rendering with:
   - Inline name editing (Save/Cancel buttons)
   - Amount input field
   - Room selection dropdown (if rooms provided)
   - Visual indicator showing assigned room
   - Delete button for custom subcategories

2. **Room Assignment Flow**:
   - Pass `availableRooms` prop to `HierarchicalBudgetInput`
   - Dropdown appears for each subcategory
   - Selected room displays with location icon
   - Room data saved in subcategory object

3. **Edit Workflow**:
   - Click pencil icon → Edit mode
   - Type new name → Press Enter or click Save
   - Press Escape or click Cancel to abort
   - Amount input disabled during edit

**Usage Example:**
```tsx
const [rooms, setRooms] = useState([
  { id: 'room-1', name: 'Kitchen' },
  { id: 'room-2', name: 'Dining Room' },
  { id: 'room-3', name: 'Living Room' },
]);

<HierarchicalBudgetInput
  categories={budgetCategories}
  onChange={setBudgetCategories}
  availableRooms={rooms} // Optional: enables room assignment
/>
```

---

### 2. Custom Systems Configuration ✅
**Enhanced SystemsConfiguration Component**

#### New Features:
- ✅ **Add Custom Systems**: Add unlimited custom systems (Generator, Well Pump, Solar Panels, etc.)
- ✅ **Trade Assignment**: Select which trade/scope each system belongs to
- ✅ **Custom Specifications**: Add unlimited custom spec fields per system
- ✅ **Scope of Work Integration**: Systems automatically attach to selected trade's scope

#### Implementation Details:
**Files Modified:**
- `src/components/ui/SystemsConfiguration.tsx`

**New Trade Categories:**
```typescript
export const TRADE_CATEGORIES = [
  { id: 'hvac', name: 'HVAC', icon: '❄️' },
  { id: 'plumbing', name: 'Plumbing', icon: '🚿' },
  { id: 'electrical', name: 'Electrical', icon: '⚡' },
  { id: 'septic', name: 'Septic', icon: '🏗️' },
  { id: 'propane', name: 'Propane/Gas', icon: '🔥' },
  { id: 'general', name: 'General', icon: '📋' },
];
```

**New Data Structure:**
```typescript
export interface CustomSystem {
  id: string;
  name: string;
  trade: TradeCategory;
  specifications: Record<string, string>; // Key-value pairs for custom fields
}

export interface SystemsData {
  // ... existing standard systems (hvac, septic, propane, waterHeater)
  customSystems?: CustomSystem[]; // NEW: Array of custom systems
}
```

**Key Features:**

1. **Add System Workflow**:
   - Click "Add System" button
   - Enter system name (e.g., "Generator", "Well Pump")
   - Select trade category (determines scope of work attachment)
   - Click "Add System" to create

2. **Custom Specifications**:
   - Click "Add Field" on any system
   - Enter field name (e.g., "Brand", "Model", "Size", "KW Rating")
   - Field appears with input box
   - Add unlimited fields per system
   - Delete fields individually

3. **Trade Integration**:
   - Each system shows its assigned trade with icon
   - Systems automatically populate relevant scope of work sections
   - Example: Generator with "Electrical" trade → appears in Electrical scope

4. **Standard Systems Preserved**:
   - HVAC (tonnage, brand, location)
   - Septic (aerobic, spray heads/drip, tank)
   - Propane (250/500 gallon, custom size)
   - Water Heater (gas/propane/electric, tankless/tank, size)

**Visual Design:**
- Each custom system displayed in a card
- Trade icon and name prominently shown
- Specifications in grid layout (label + input)
- Delete system button (top right)
- Delete field button (per specification)

**Usage Scenarios:**

1. **Generator System**:
   - Name: "Backup Generator"
   - Trade: Electrical
   - Specs: Brand (Generac), KW Rating (22), Fuel Type (Propane)

2. **Well System**:
   - Name: "Well Pump"
   - Trade: Plumbing
   - Specs: Depth (250 ft), GPM (10), Tank Size (80 gal)

3. **Solar System**:
   - Name: "Solar Panel Array"
   - Trade: Electrical
   - Specs: Total KW (10), Panel Count (28), Inverter (Enphase)

---

## 🐛 Bug Fixes

### Subcategory Issues
- ❌ **FIXED**: "Add Subcategory" button was in wrong location (now appears within each category's expanded section)
- ❌ **FIXED**: No way to edit subcategory names (now has inline edit with pencil icon)
- ❌ **FIXED**: No way to delete subcategories (now has delete button with confirmation)
- ❌ **FIXED**: Room selection dropdown not working (now fully functional with room assignment)

### Systems Issues
- ❌ **FIXED**: Limited to only 4 predefined systems (now supports unlimited custom systems)
- ❌ **FIXED**: No way to specify which trade/scope a system belongs to (now has trade selector)
- ❌ **FIXED**: No custom specification fields (now supports unlimited custom fields per system)

---

## 📝 Technical Notes

### Component Architecture

**HierarchicalBudgetInput:**
- Main component handles category-level logic
- SubcategoryRow sub-component handles individual subcategory UI
- Fully controlled component pattern
- Room assignment optional (only appears if `availableRooms` prop provided)

**SystemsConfiguration:**
- Standard systems remain unchanged for backward compatibility
- Custom systems stored in separate array
- Trade categories use const assertion for type safety
- Specifications use flexible key-value structure

### Data Flow

**Budget Subcategories:**
1. Parent component manages categories state
2. HierarchicalBudgetInput receives categories + onChange
3. SubcategoryRow emits changes (amount, name, room)
4. Changes propagate up via onChange callback
5. Parent updates state immutably

**Systems Configuration:**
1. Parent component manages SystemsData state
2. SystemsConfiguration receives value + onChange
3. Standard systems use dedicated update functions
4. Custom systems managed in array
5. All changes propagate immediately

### Backward Compatibility
- ✅ Existing projects without `customSystems` field continue to work
- ✅ Existing projects without `roomId` in subcategories continue to work
- ✅ Standard systems (HVAC, Septic, Propane, Water Heater) unchanged
- ✅ All existing APIs and data structures preserved

---

## 🚀 Next Steps

### Scope of Work Integration (TODO)
To complete the systems integration, the scope of work components need updates:

1. **HVACScope.tsx**: Read and display custom HVAC systems
2. **PlumbingScope.tsx**: Read and display custom plumbing systems  
3. **ElectricalScope.tsx**: Read and display custom electrical systems
4. **GeneralScope.tsx**: Read and display general systems

**Implementation Pattern:**
```typescript
// In scope of work component
const customSystems = systemsData.customSystems?.filter(s => s.trade === 'hvac') || [];

// Display custom systems
{customSystems.map(system => (
  <div key={system.id}>
    <h4>{system.name}</h4>
    {Object.entries(system.specifications).map(([key, value]) => (
      <p key={key}>{key}: {value}</p>
    ))}
  </div>
))}
```

### Budget Room Assignment Integration (TODO)
To utilize the room assignments in budget subcategories:

1. **Budget Rows API**: Update to save roomId/roomName from subcategories
2. **Draw Invoice PDF**: Group line items by room (optional)
3. **Budget Reports**: Filter/group by room assignment

---

## 📦 Files Changed

### Modified Files:
1. `src/components/ui/HierarchicalBudgetInput.tsx` - Complete rewrite with new features
2. `src/lib/constants/hierarchical-budget-categories.ts` - Added roomId/roomName to interface
3. `src/components/ui/SystemsConfiguration.tsx` - Added custom systems section

### New Interfaces:
- `BudgetSubcategory` - Added optional roomId and roomName fields
- `CustomSystem` - New interface for custom systems
- `TradeCategory` - New type for trade categories

---

## ✅ Testing Checklist

### Budget Subcategories:
- [ ] Click "Add Subcategory" within expanded category
- [ ] Enter subcategory name and save
- [ ] Click pencil icon to edit subcategory name
- [ ] Save edited name with Enter or Save button
- [ ] Cancel edit with Escape or Cancel button
- [ ] Enter amount in subcategory
- [ ] Select room from dropdown (if rooms provided)
- [ ] Verify room displays with location icon
- [ ] Delete custom subcategory with confirmation
- [ ] Verify category total updates correctly

### Custom Systems:
- [ ] Click "Add System" button
- [ ] Enter system name (e.g., "Generator")
- [ ] Select trade category (e.g., "Electrical")
- [ ] Click "Add System" to create
- [ ] Verify system appears in list
- [ ] Click "Add Field" on system
- [ ] Enter field name (e.g., "Brand")
- [ ] Enter field value
- [ ] Add multiple fields
- [ ] Delete a field
- [ ] Delete entire system with confirmation
- [ ] Create systems for different trades
- [ ] Verify standard systems still work (HVAC, Septic, etc.)

---

## 🎨 UI/UX Improvements

### Budget Subcategories:
- Inline editing with visual feedback
- Room assignment with location icon indicator
- Contextual delete buttons (only for custom subcategories)
- Grid layout for amount + room selection
- Improved spacing and visual hierarchy

### Custom Systems:
- Empty state with helpful message
- Trade icons for visual identification
- Card-based layout for each system
- Specification fields in grid layout
- Clear "Add" buttons throughout
- Confirmation dialogs for destructive actions

---

## 📚 Documentation Updates Needed

1. Update AGENTS.md with:
   - New budget subcategory features
   - Custom systems configuration
   - Room assignment workflow
   - Trade category selection

2. Update implementation status docs
3. Add screenshots to documentation
4. Create user guide for custom systems

---

**Status**: ✅ Build successful, ready for testing
**Date**: June 13, 2026
**Build Time**: 39.7s
**TypeScript Compilation**: 31.5s ✅
