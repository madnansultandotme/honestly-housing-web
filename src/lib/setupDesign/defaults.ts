export interface SetupDesignOption {
  category: string;
  name: string;
  measureLabel: string;
}

export interface SetupDesignGroup {
  title: string;
  appliesTo: string;
  options: SetupDesignOption[];
}

export type SetupDesignConfig = Record<string, SetupDesignGroup>;

export const DEFAULT_SETUP_DESIGN: SetupDesignConfig = {
  bedroom: {
    title: 'Bedroom',
    appliesTo: 'Applies to primary bedrooms, additional bedrooms, foyers, and offices.',
    options: [
      { category: 'Electrical', name: 'Ceiling Fan', measureLabel: 'Quantity' },
      { category: 'Electrical', name: 'Down Rod', measureLabel: 'Length' },
      { category: 'Electrical', name: 'Chandelier', measureLabel: 'Quantity' },
      { category: 'Electrical', name: 'Sconce', measureLabel: 'Quantity' },
      { category: 'Hardware', name: 'Cabinet Pulls', measureLabel: 'Quantity' },
      { category: 'Hardware', name: 'Cabinet Knobs', measureLabel: 'Quantity' },
      { category: 'Hardware', name: 'Privacy Door Knob', measureLabel: 'Quantity' },
      { category: 'Hardware', name: 'Passage Door Knob', measureLabel: 'Quantity' },
      { category: 'Hardware', name: 'Dummy Door Knob', measureLabel: 'Quantity' },
    ],
  },
  bathroom: {
    title: 'Bathroom',
    appliesTo: 'Applies to primary bathrooms, powder rooms, half baths, and additional bathrooms.',
    options: [
      { category: 'Electrical', name: 'Vanity Light', measureLabel: 'Quantity' },
      { category: 'Electrical', name: 'Sconce', measureLabel: 'Quantity' },
      { category: 'Electrical', name: 'Chandelier', measureLabel: 'Quantity' },
      { category: 'Plumbing', name: 'Sink Faucet', measureLabel: 'Quantity' },
      { category: 'Plumbing', name: 'Shower System', measureLabel: 'Number of Shower Heads' },
      { category: 'Plumbing', name: 'Shower Drain', measureLabel: 'Quantity' },
      { category: 'Plumbing', name: 'Alcove Tub', measureLabel: 'Quantity' },
      { category: 'Plumbing', name: 'Drop In Tub', measureLabel: 'Quantity' },
      { category: 'Plumbing', name: 'Overflow + Drain', measureLabel: 'Quantity' },
      { category: 'Hardware', name: 'Toilet Paper Holder', measureLabel: 'Quantity' },
      { category: 'Hardware', name: 'Hand Towel Holder', measureLabel: 'Quantity' },
      { category: 'Hardware', name: 'Towel Bar', measureLabel: 'Quantity' },
      { category: 'Mirrors', name: 'Bathroom Mirror', measureLabel: 'Quantity' },
      { category: 'Tile', name: 'Floor Tile', measureLabel: 'Square Feet' },
      { category: 'Tile', name: 'Shower Wall Tile', measureLabel: 'Square Feet' },
    ],
  },
  kitchen: {
    title: 'Kitchen',
    appliesTo: 'Applies to kitchens, pantries, and prep kitchen spaces.',
    options: [
      { category: 'Electrical', name: 'Pendant Light', measureLabel: 'Quantity' },
      { category: 'Electrical', name: 'Recessed Light', measureLabel: 'Quantity' },
      { category: 'Electrical', name: 'Under Cabinet Lighting', measureLabel: 'Quantity' },
      { category: 'Plumbing', name: 'Kitchen Faucet', measureLabel: 'Quantity' },
      { category: 'Plumbing', name: 'Kitchen Sink', measureLabel: 'Quantity' },
      { category: 'Countertops', name: 'Countertop', measureLabel: 'Square Feet' },
      { category: 'Hardware', name: 'Cabinet Pulls', measureLabel: 'Quantity' },
      { category: 'Hardware', name: 'Cabinet Knobs', measureLabel: 'Quantity' },
      { category: 'Appliances', name: 'Dishwasher', measureLabel: 'Quantity' },
      { category: 'Appliances', name: 'Range / Cooktop', measureLabel: 'Quantity' },
    ],
  },
  living: {
    title: 'Living / Dining',
    appliesTo: 'Applies to living rooms, dining rooms, bonus rooms, and similar shared spaces.',
    options: [
      { category: 'Electrical', name: 'Ceiling Fan', measureLabel: 'Quantity' },
      { category: 'Electrical', name: 'Down Rod', measureLabel: 'Length' },
      { category: 'Electrical', name: 'Chandelier', measureLabel: 'Quantity' },
      { category: 'Electrical', name: 'Sconce', measureLabel: 'Quantity' },
      { category: 'Electrical', name: 'Recessed Light', measureLabel: 'Quantity' },
      { category: 'Flooring', name: 'Flooring', measureLabel: 'Square Feet' },
      { category: 'Hardware', name: 'Passage Door Knob', measureLabel: 'Quantity' },
    ],
  },
  utility: {
    title: 'Utility / Mudroom',
    appliesTo: 'Applies to laundry rooms, mudrooms, garages, and utility areas.',
    options: [
      { category: 'Electrical', name: 'Flush Mount Light', measureLabel: 'Quantity' },
      { category: 'Electrical', name: 'Recessed Light', measureLabel: 'Quantity' },
      { category: 'Plumbing', name: 'Utility Sink', measureLabel: 'Quantity' },
      { category: 'Countertops', name: 'Countertop', measureLabel: 'Square Feet' },
      { category: 'Hardware', name: 'Cabinet Pulls', measureLabel: 'Quantity' },
      { category: 'Hardware', name: 'Cabinet Knobs', measureLabel: 'Quantity' },
      { category: 'Flooring', name: 'Flooring', measureLabel: 'Square Feet' },
    ],
  },
};
