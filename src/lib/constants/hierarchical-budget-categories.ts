/**
 * Hierarchical Construction Budget Categories
 * 
 * Main categories contain subcategories that add up to the main total
 */

export interface BudgetSubcategory {
  id: string;
  name: string;
  description?: string;
  amount?: number;
  roomId?: string; // Optional room assignment
  roomName?: string; // Optional room name for display
}

export interface HierarchicalBudgetCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  total?: number;
  subcategories: BudgetSubcategory[];
  displayOrder: number;
  isCustom?: boolean;
}

export const HIERARCHICAL_BUDGET_CATEGORIES: HierarchicalBudgetCategory[] = [
  {
    id: 'site-prep',
    code: '01',
    name: 'Site Prep',
    displayOrder: 1,
    subcategories: [
      { id: 'site-demolition', name: 'Site Demolition + Earthwork' },
    ],
  },
  {
    id: 'general-conditions',
    code: '02',
    name: 'General Conditions',
    displayOrder: 2,
    subcategories: [
      { id: 'dumpsters-toilets', name: 'Dumpsters/Toilets' },
      { id: 'preparation-preliminaries', name: 'Preparation & Preliminaries' },
      { id: 'site-utilities', name: 'Site Utilities' },
      { id: 'septic-system', name: 'Septic System' },
      { id: 'propane-tank', name: 'Propane Tank' },
      { id: 'architectural-engineering', name: 'Architectural/Engineering' },
    ],
  },
  {
    id: 'foundation',
    code: '03',
    name: 'Foundation',
    displayOrder: 3,
    subcategories: [
      { id: 'foundations', name: 'Foundations' },
    ],
  },
  {
    id: 'framing',
    code: '04',
    name: 'Framing',
    displayOrder: 4,
    subcategories: [
      { id: 'structural-framing', name: 'Structural Framing' },
    ],
  },
  {
    id: 'insulation-drywall',
    code: '05',
    name: 'Insulation, Drywall & Wall Finishes',
    displayOrder: 5,
    subcategories: [
      { id: 'insulation', name: 'Insulation' },
      { id: 'painting', name: 'Painting' },
      { id: 'drywall', name: 'Drywall Tape, Bed, + Texture' },
    ],
  },
  {
    id: 'roofing',
    code: '06',
    name: 'Roofing',
    displayOrder: 6,
    subcategories: [
      { id: 'roofing', name: 'Roofing' },
      { id: 'gutters', name: 'Gutters' },
      { id: 'shutters', name: 'Shutters' },
    ],
  },
  {
    id: 'brick-masonry',
    code: '07',
    name: 'Brick & Masonry',
    displayOrder: 7,
    subcategories: [
      { id: 'masonry', name: 'Masonry' },
      { id: 'porches', name: 'Porches' },
    ],
  },
  {
    id: 'concrete-flatwork',
    code: '08',
    name: 'Concrete/Flatwork',
    displayOrder: 8,
    subcategories: [
      { id: 'builders-warranty', name: 'Builders Warranty' },
    ],
  },
  {
    id: 'pool-exterior',
    code: '09',
    name: 'Pool and/or Exterior Upgrades',
    displayOrder: 9,
    subcategories: [
      { id: 'additional-upgrades', name: 'Additional Upgrades Allowance' },
    ],
  },
  {
    id: 'windows-doors',
    code: '10',
    name: 'Windows & Doors',
    displayOrder: 10,
    subcategories: [
      { id: 'exterior-doors', name: 'Exterior Doors' },
      { id: 'garage-doors', name: 'Garage Doors' },
      { id: 'windows', name: 'Windows' },
    ],
  },
  {
    id: 'landscaping',
    code: '11',
    name: 'Landscaping',
    displayOrder: 11,
    subcategories: [
      { id: 'driveway-allowance', name: 'Driveway Allowance' },
      { id: 'landscaping', name: 'Landscaping' },
      { id: 'sprinklers', name: 'Sprinklers' },
    ],
  },
  {
    id: 'cabinetry',
    code: '12',
    name: 'Cabinetry',
    displayOrder: 12,
    subcategories: [
      { id: 'cabinetry-allowance', name: 'Cabinetry Allowance' },
    ],
  },
  {
    id: 'countertops',
    code: '13',
    name: 'Countertops',
    displayOrder: 13,
    subcategories: [
      { id: 'countertop-labor', name: 'Countertop Labor' },
      { id: 'countertop-material', name: 'Countertop Material Allowance' },
    ],
  },
  {
    id: 'appliances',
    code: '14',
    name: 'Appliances',
    displayOrder: 14,
    subcategories: [
      { id: 'appliances', name: 'Appliances' },
    ],
  },
  {
    id: 'interior-trim',
    code: '15',
    name: 'Interior Trim',
    displayOrder: 15,
    subcategories: [
      { id: 'interior-doors', name: 'Interior Doors' },
      { id: 'interior-woodwork', name: 'Interior Woodwork L+M' },
      { id: 'interior-door-hardware', name: 'Interior Door Hardware Allowance' },
      { id: 'glass-door', name: 'Glass Door L+M' },
      { id: 'mirrors-allowance', name: 'Mirrors Allowance' },
    ],
  },
  {
    id: 'tile',
    code: '16',
    name: 'Tile',
    displayOrder: 16,
    subcategories: [
      { id: 'tiling', name: 'Tiling' },
    ],
  },
  {
    id: 'flooring',
    code: '17',
    name: 'Flooring',
    displayOrder: 17,
    subcategories: [
      { id: 'flooring', name: 'Flooring' },
    ],
  },
  {
    id: 'plumbing',
    code: '18',
    name: 'Plumbing',
    displayOrder: 18,
    subcategories: [
      { id: 'plumbing-rough-in', name: 'Plumbing (Rough-In)' },
      { id: 'plumbing-finish', name: 'Plumbing (Finish)' },
    ],
  },
  {
    id: 'hvac',
    code: '19',
    name: 'HVAC',
    displayOrder: 19,
    subcategories: [
      { id: 'hvac-rough-in', name: 'HVAC (Rough-In)' },
      { id: 'hvac-finish', name: 'HVAC (Finish)' },
    ],
  },
  {
    id: 'electrical',
    code: '20',
    name: 'Electrical',
    displayOrder: 20,
    subcategories: [
      { id: 'electrical-rough-in', name: 'Electrical (Rough-In)' },
      { id: 'electrical-finish', name: 'Electrical (Finish)' },
    ],
  },
  {
    id: 'project-management',
    code: '21',
    name: 'Project Management',
    displayOrder: 21,
    subcategories: [
      { id: 'site-cleanup', name: 'Site Cleanup' },
      { id: 'builder-fee', name: 'Builder Fee' },
    ],
  },
];

/**
 * Get all hierarchical budget categories
 */
export function getHierarchicalBudgetCategories(): HierarchicalBudgetCategory[] {
  // Try to load custom from localStorage
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('hierarchicalBudgetCategories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Failed to load custom hierarchical budget categories:', error);
    }
  }
  
  return HIERARCHICAL_BUDGET_CATEGORIES;
}

/**
 * Save hierarchical budget categories to localStorage
 */
export function saveHierarchicalBudgetCategories(categories: HierarchicalBudgetCategory[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('hierarchicalBudgetCategories', JSON.stringify(categories));
  }
}

/**
 * Calculate total for a category based on subcategories
 */
export function calculateCategoryTotal(category: HierarchicalBudgetCategory): number {
  return category.subcategories.reduce((sum, sub) => sum + (sub.amount || 0), 0);
}

/**
 * Calculate grand total of all categories
 */
export function calculateGrandTotal(categories: HierarchicalBudgetCategory[]): number {
  return categories.reduce((sum, cat) => sum + calculateCategoryTotal(cat), 0);
}
