/**
 * Scope of Work Type Definitions
 */

export type ScopeStatus = 'completed' | 'skipped' | 'incomplete';

export interface ScopeOfWorkDocument {
  projectId: string;
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  status: ScopeStatus;
  data: Record<string, any>;
  files: string[];
  notes: string;
  completedAt?: string;
  completedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScopeOfWorkTemplateProps {
  categoryId: string;
  categoryName: string;
  data: any;
  onChange: (data: any) => void;
  onStatusChange: (status: ScopeStatus) => void;
  status: ScopeStatus;
  notes: string;
  onNotesChange: (notes: string) => void;
  files: string[];
  onFilesChange: (files: string[]) => void;
}

// Roofing Scope Data
export interface RoofingData {
  notes: string;
  options: {
    composite30Year: boolean;
    rPanel: boolean;
    standingSeamMetal: boolean;
    accents: boolean;
  };
}

// Insulation Scope Data
export interface InsulationSection {
  insulationType: string;
  thickness: number;
  rValue: number;
}

export interface InsulationData {
  exteriorWalls: InsulationSection;
  otherWalls: InsulationSection;
  ceilings: InsulationSection;
  floors: InsulationSection;
  otherAreas: InsulationSection;
}

// HVAC Scope Data
export interface HVACData {
  systemType: 'electric' | 'gas' | 'heatPump' | '';
  size: number;
  brand: string;
  interiorUnitLocation: string;
  exteriorUnitLocation: string;
}

// Plumbing Scope Data
export interface PlumbingRoomSummary {
  roomName: string;
  faucets: number;
  potFillers: number;
  sinks: number;
  toilets: number;
  tubs: number;
  showers: number;
}

export interface PlumbingData {
  roomSummary: PlumbingRoomSummary[];
  gasAppliances: string[];
  fireplace: {
    type: 'gas' | 'electric' | 'wood' | '';
    location: string;
  };
  waterHeater: {
    type: 'gas' | 'electric' | 'propaneTank' | 'tankless' | '';
    location: 'garage' | 'attic' | 'other' | '';
    otherLocation: string;
  };
  outdoorGrill: boolean;
  propane: boolean;
  propaneLocation: string;
}

// Electrical Scope Data
export interface ElectricalRoomSummary {
  roomName: string;
  fixtures: {
    type: string;
    count: number;
  }[];
}

export interface ElectricalData {
  roomSummary: ElectricalRoomSummary[];
  additionalNotes: string;
}

// Masonry Scope Data
export interface MasonryData {
  notes: string;
  customFields: Record<string, any>;
}

// Cabinetry Scope Data
export interface CabinetryData {
  notes: string;
  completeLater: boolean;
  customFields: Record<string, any>;
}

// Default Scope Data
export interface DefaultScopeData {
  notes: string;
}
