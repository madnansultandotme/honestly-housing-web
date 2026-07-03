/**
 * Scope of Work Integration Logic
 * Auto-populate scope data from room selections
 */

import { PlumbingRoomSummary, PlumbingData, ElectricalRoomSummary, ElectricalData } from './types';

interface RoomFixture {
  category: string;
  name: string;
  quantity: number;
  imageUrl?: string;
  value?: string; // For special values like "Right" or "Left"
}

interface RoomDetail {
  id: string;
  name: string;
  type: string;
  fixtures: RoomFixture[];
}

/**
 * Generate Plumbing Scope from room selections
 */
export function generatePlumbingScope(rooms: RoomDetail[]): PlumbingData {
  const roomSummary: PlumbingRoomSummary[] = [];
  const gasAppliances: string[] = [];

  rooms.forEach(room => {
    const plumbingFixtures = room.fixtures.filter(f => 
      f.category.toLowerCase() === 'plumbing'
    );

    if (plumbingFixtures.length === 0) return;

    const summary: PlumbingRoomSummary = {
      roomName: room.name,
      faucets: 0,
      potFillers: 0,
      sinks: 0,
      toilets: 0,
      tubs: 0,
      showers: 0,
    };

    plumbingFixtures.forEach(fixture => {
      const nameLower = fixture.name.toLowerCase();
      const qty = fixture.quantity || 1;

      // Categorize fixtures
      if (nameLower.includes('faucet')) {
        summary.faucets += qty;
      } else if (nameLower.includes('pot filler')) {
        summary.potFillers += qty;
      } else if (nameLower.includes('sink') || nameLower.includes('vanity')) {
        summary.sinks += qty;
      } else if (nameLower.includes('toilet')) {
        summary.toilets += qty;
      } else if (nameLower.includes('tub') || nameLower.includes('alcove')) {
        summary.tubs += qty;
      } else if (nameLower.includes('shower')) {
        summary.showers += qty;
      }
    });

    // Only add rooms that have plumbing fixtures
    if (Object.values(summary).some(val => typeof val === 'number' && val > 0)) {
      roomSummary.push(summary);
    }
  });

  // Check for gas appliances
  rooms.forEach(room => {
    const appliances = room.fixtures.filter(f => 
      f.category.toLowerCase() === 'appliances'
    );

    appliances.forEach(fixture => {
      const nameLower = fixture.name.toLowerCase();
      // Common gas appliances
      if (nameLower.includes('range') || 
          nameLower.includes('cooktop') || 
          nameLower.includes('oven') ||
          nameLower.includes('gas')) {
        gasAppliances.push(`${room.name}: ${fixture.name}`);
      }
    });
  });

  return {
    roomSummary,
    gasAppliances,
    fireplace: {
      type: '',
      location: '',
    },
    waterHeater: {
      type: '',
      location: '',
      otherLocation: '',
    },
    outdoorGrill: false,
    propane: false,
    propaneLocation: '',
  };
}

/**
 * Generate Electrical Scope from room selections
 */
export function generateElectricalScope(rooms: RoomDetail[]): ElectricalData {
  const roomSummary: ElectricalRoomSummary[] = [];

  rooms.forEach(room => {
    const electricalFixtures = room.fixtures.filter(f => 
      f.category.toLowerCase() === 'electrical' || 
      f.category.toLowerCase() === 'lighting'
    );

    if (electricalFixtures.length === 0) return;

    const fixtureMap = new Map<string, number>();

    electricalFixtures.forEach(fixture => {
      const fixtureName = fixture.name;
      const qty = fixture.quantity || 1;

      // Combine fixtures of the same type
      if (fixtureMap.has(fixtureName)) {
        fixtureMap.set(fixtureName, fixtureMap.get(fixtureName)! + qty);
      } else {
        fixtureMap.set(fixtureName, qty);
      }
    });

    const fixtures = Array.from(fixtureMap.entries()).map(([type, count]) => ({
      type,
      count,
    }));

    roomSummary.push({
      roomName: room.name,
      fixtures,
    });
  });

  return {
    roomSummary,
    additionalNotes: '',
  };
}

/**
 * Count total plumbing fixtures across all rooms
 */
export function countPlumbingFixtures(data: PlumbingData): number {
  return data.roomSummary.reduce((total, room) => {
    return total + 
      room.faucets + 
      room.potFillers + 
      room.sinks + 
      room.toilets + 
      room.tubs + 
      room.showers;
  }, 0);
}

/**
 * Count total electrical fixtures across all rooms
 */
export function countElectricalFixtures(data: ElectricalData): number {
  return data.roomSummary.reduce((total, room) => {
    return total + room.fixtures.reduce((sum, fixture) => sum + fixture.count, 0);
  }, 0);
}

/**
 * Format plumbing summary for display
 */
export function formatPlumbingSummary(room: PlumbingRoomSummary): string {
  const parts: string[] = [];
  
  if (room.faucets > 0) parts.push(`${room.faucets} Faucet${room.faucets > 1 ? 's' : ''}`);
  if (room.potFillers > 0) parts.push(`${room.potFillers} Pot Filler${room.potFillers > 1 ? 's' : ''}`);
  if (room.sinks > 0) parts.push(`${room.sinks} Sink${room.sinks > 1 ? 's' : ''}`);
  if (room.toilets > 0) parts.push(`${room.toilets} Toilet${room.toilets > 1 ? 's' : ''}`);
  if (room.tubs > 0) parts.push(`${room.tubs} Tub${room.tubs > 1 ? 's' : ''}`);
  if (room.showers > 0) parts.push(`${room.showers} Shower${room.showers > 1 ? 's' : ''}`);
  
  return parts.join(', ');
}

/**
 * Format electrical summary for display
 */
export function formatElectricalSummary(room: ElectricalRoomSummary): string {
  return room.fixtures
    .map(f => `${f.count} ${f.type}${f.count > 1 ? 's' : ''}`)
    .join(', ');
}

/**
 * Merge systems data into plumbing scope
 */
export function mergeSystemsIntoPlumbing(
  plumbingData: PlumbingData,
  systemsData: any
): PlumbingData {
  if (!systemsData) return plumbingData;

  const merged = { ...plumbingData };

  // Merge water heater data
  if (systemsData.waterHeater) {
    // Map fuel type to PlumbingData type
    let heaterType: 'gas' | 'electric' | 'propaneTank' | 'tankless' | '' = '';
    if (systemsData.waterHeater.type === 'tankless') {
      heaterType = 'tankless';
    } else if (systemsData.waterHeater.fuelType === 'gas') {
      heaterType = 'gas';
    } else if (systemsData.waterHeater.fuelType === 'electric') {
      heaterType = 'electric';
    } else if (systemsData.waterHeater.fuelType === 'propane') {
      heaterType = 'propaneTank';
    }

    merged.waterHeater = {
      type: heaterType,
      location: 'other',
      otherLocation: systemsData.waterHeater.tankSize ? 
        `${systemsData.waterHeater.tankSize} Gallon Tank` : 
        'See systems configuration',
    };
  }

  // Merge propane data
  if (systemsData.propane && systemsData.propane.size) {
    merged.propane = true;
    merged.propaneLocation = systemsData.propane.size === 'other' 
      ? systemsData.propane.otherSize 
      : `${systemsData.propane.size} Gallon`;
  }

  return merged;
}

/**
 * Generate septic notes from systems data
 */
export function generateSepticNotes(systemsData: any): string {
  if (!systemsData?.septic) return '';

  const notes: string[] = [];

  if (systemsData.septic.isAerobic) {
    notes.push('Septic System: Aerobic');
    if (systemsData.septic.aerobicType === 'sprayHeads') {
      notes.push('Type: Spray Heads');
    } else if (systemsData.septic.aerobicType === 'dripSystem') {
      notes.push('Type: Drip System');
    }
  }

  if (systemsData.septic.hasTank) {
    notes.push('Has septic tank');
  }

  return notes.length > 0 ? `\n\nSeptic System Configuration:\n${notes.join('\n')}` : '';
}

/**
 * Extract HVAC data from systems configuration
 */
export function extractHVACFromSystems(systemsData: any): any {
  if (!systemsData?.hvac) return {};

  return {
    systemType: '', // This would need to be determined from heating/cooling type
    size: parseFloat(systemsData.hvac.tonnage) || 0,
    brand: systemsData.hvac.brand || '',
    interiorUnitLocation: systemsData.hvac.location || '',
    exteriorUnitLocation: '',
  };
}
