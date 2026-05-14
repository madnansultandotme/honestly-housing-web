export type RoomSummary = Record<string, number>;

export const EMPTY_ROOM_COUNTS: RoomSummary = {
  bedrooms: 0,
  bathrooms: 0,
  offices: 0,
  kitchens: 0,
  livingRooms: 0,
  diningRooms: 0,
  laundryRooms: 0,
  garages: 0,
  other: 0,
};

export interface RoomLike {
  type?: string | null;
}

export function countRoomsFromDetails(rooms: RoomLike[] = []): RoomSummary {
  const counts = { ...EMPTY_ROOM_COUNTS };

  rooms.forEach((room) => {
    const type = String(room?.type || '').toLowerCase();

    if (type.includes('bedroom')) counts.bedrooms += 1;
    else if (type.includes('bathroom')) counts.bathrooms += 1;
    else if (type.includes('office')) counts.offices += 1;
    else if (type.includes('kitchen')) counts.kitchens += 1;
    else if (type.includes('living')) counts.livingRooms += 1;
    else if (type.includes('dining')) counts.diningRooms += 1;
    else if (type.includes('laundry')) counts.laundryRooms += 1;
    else if (type.includes('garage')) counts.garages += 1;
    else counts.other += 1;
  });

  return counts;
}