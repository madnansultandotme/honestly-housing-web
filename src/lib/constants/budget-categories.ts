/**
 * Standard Construction Budget Categories
 * 
 * These categories represent the major cost centers in a home construction project
 * and align with industry-standard construction estimating practices.
 */

export interface BudgetCategory {
  code: string;
  name: string;
  description: string;
  displayOrder: number;
  isDefault: boolean;
}

/**
 * Standard budget categories for residential construction
 * Based on the builder questionnaire categories and industry standards
 */
export const STANDARD_BUDGET_CATEGORIES: BudgetCategory[] = [
  {
    code: '01',
    name: 'Site Work',
    description: 'Excavation, grading, utilities, driveway, landscaping',
    displayOrder: 1,
    isDefault: true,
  },
  {
    code: '02',
    name: 'Foundation',
    description: 'Concrete foundation, slab, pier & beam, vapor barrier',
    displayOrder: 2,
    isDefault: true,
  },
  {
    code: '03',
    name: 'Framing',
    description: 'Lumber, structural framing, roof trusses, sheathing',
    displayOrder: 3,
    isDefault: true,
  },
  {
    code: '04',
    name: 'Roofing',
    description: 'Roofing materials, underlayment, flashing, gutters',
    displayOrder: 4,
    isDefault: true,
  },
  {
    code: '05',
    name: 'Exterior Materials',
    description: 'Siding, brick, stone, exterior trim, porch materials',
    displayOrder: 5,
    isDefault: true,
  },
  {
    code: '06',
    name: 'Windows & Doors',
    description: 'All windows, exterior doors, patio doors',
    displayOrder: 6,
    isDefault: true,
  },
  {
    code: '07',
    name: 'Plumbing',
    description: 'Rough-in, fixtures, water heater, gas lines',
    displayOrder: 7,
    isDefault: true,
  },
  {
    code: '08',
    name: 'HVAC',
    description: 'Heating, ventilation, air conditioning systems',
    displayOrder: 8,
    isDefault: true,
  },
  {
    code: '09',
    name: 'Electrical',
    description: 'Wiring, panels, fixtures, devices, service',
    displayOrder: 9,
    isDefault: true,
  },
  {
    code: '10',
    name: 'Insulation',
    description: 'Wall, ceiling, and floor insulation',
    displayOrder: 10,
    isDefault: true,
  },
  {
    code: '11',
    name: 'Drywall',
    description: 'Drywall installation, finishing, texture',
    displayOrder: 11,
    isDefault: true,
  },
  {
    code: '12',
    name: 'Interior Doors & Trim',
    description: 'Interior doors, baseboard, crown molding, hardware',
    displayOrder: 12,
    isDefault: true,
  },
  {
    code: '13',
    name: 'Cabinetry',
    description: 'Kitchen, bathroom, and utility cabinets',
    displayOrder: 13,
    isDefault: true,
  },
  {
    code: '14',
    name: 'Countertops',
    description: 'Kitchen and bathroom countertops, backsplash',
    displayOrder: 14,
    isDefault: true,
  },
  {
    code: '15',
    name: 'Flooring',
    description: 'Hardwood, tile, carpet, LVP, underlayment',
    displayOrder: 15,
    isDefault: true,
  },
  {
    code: '16',
    name: 'Tile',
    description: 'Shower tile, backsplash, floor tile, grout',
    displayOrder: 16,
    isDefault: true,
  },
  {
    code: '17',
    name: 'Paint',
    description: 'Interior and exterior paint, stain, labor',
    displayOrder: 17,
    isDefault: true,
  },
  {
    code: '18',
    name: 'Lighting',
    description: 'Light fixtures, fans, switches, dimmers',
    displayOrder: 18,
    isDefault: true,
  },
  {
    code: '19',
    name: 'Plumbing Fixtures',
    description: 'Faucets, sinks, toilets, tubs, showers',
    displayOrder: 19,
    isDefault: true,
  },
  {
    code: '20',
    name: 'Appliances',
    description: 'Kitchen and laundry appliances',
    displayOrder: 20,
    isDefault: true,
  },
  {
    code: '21',
    name: 'Fireplace',
    description: 'Fireplace unit, surround, hearth, gas lines',
    displayOrder: 21,
    isDefault: false,
  },
  {
    code: '22',
    name: 'Mirrors & Glass',
    description: 'Bathroom mirrors, shower glass, custom glass',
    displayOrder: 22,
    isDefault: true,
  },
  {
    code: '23',
    name: 'Hardware',
    description: 'Door hardware, cabinet pulls, accessories',
    displayOrder: 23,
    isDefault: true,
  },
  {
    code: '24',
    name: 'Garage',
    description: 'Garage doors, openers, storage systems',
    displayOrder: 24,
    isDefault: false,
  },
  {
    code: '25',
    name: 'Deck & Patio',
    description: 'Deck materials, patio, outdoor structures',
    displayOrder: 25,
    isDefault: false,
  },
  {
    code: '26',
    name: 'Permits & Fees',
    description: 'Building permits, impact fees, inspections',
    displayOrder: 26,
    isDefault: true,
  },
  {
    code: '27',
    name: 'Cleanup & Final',
    description: 'Final cleaning, punch list, warranty items',
    displayOrder: 27,
    isDefault: true,
  },
  {
    code: '28',
    name: 'Contingency',
    description: 'Project contingency fund',
    displayOrder: 28,
    isDefault: true,
  },
];

/**
 * Get default categories for a new project
 */
export function getDefaultBudgetCategories(): BudgetCategory[] {
  return STANDARD_BUDGET_CATEGORIES.filter(cat => cat.isDefault);
}

/**
 * Get all available budget categories
 */
export function getAllBudgetCategories(): BudgetCategory[] {
  return STANDARD_BUDGET_CATEGORIES;
}

/**
 * Find category by code
 */
export function getBudgetCategoryByCode(code: string): BudgetCategory | undefined {
  return STANDARD_BUDGET_CATEGORIES.find(cat => cat.code === code);
}

/**
 * Find category by name
 */
export function getBudgetCategoryByName(name: string): BudgetCategory | undefined {
  return STANDARD_BUDGET_CATEGORIES.find(
    cat => cat.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Format category display name with code
 */
export function formatCategoryDisplay(category: BudgetCategory): string {
  return `${category.code} - ${category.name}`;
}
