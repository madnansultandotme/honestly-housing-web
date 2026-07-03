'use client';

import { useState } from 'react';
import Card from './Card';

export interface RoomCounts {
  bedrooms: number;
  bathrooms: number;
  kitchen: number;
  livingRoom: number;
  diningRoom: number;
  pantry: number;
  laundry: number;
  office: number;
  bonusRoom: number;
  other?: Array<{ name: string; count: number }>;
}

interface RoomCountSelectorProps {
  value: RoomCounts;
  onChange: (counts: RoomCounts) => void;
}

type RoomType = keyof Omit<RoomCounts, 'other'>;

interface RoomTypeConfig {
  key: RoomType;
  label: string;
  icon: string;
}

const ROOM_TYPES: RoomTypeConfig[] = [
  { key: 'bedrooms', label: 'Bedrooms', icon: '🛏️' },
  { key: 'bathrooms', label: 'Bathrooms', icon: '🚿' },
  { key: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { key: 'livingRoom', label: 'Living Room', icon: '🛋️' },
  { key: 'diningRoom', label: 'Dining Room', icon: '🍽️' },
  { key: 'pantry', label: 'Pantry', icon: '🥫' },
  { key: 'laundry', label: 'Laundry', icon: '🧺' },
  { key: 'office', label: 'Office', icon: '💼' },
  { key: 'bonusRoom', label: 'Bonus Room', icon: '✨' },
];

export default function RoomCountSelector({ value, onChange }: RoomCountSelectorProps) {
  const [newOtherRoomName, setNewOtherRoomName] = useState('');

  const handleIncrement = (type: RoomType) => {
    onChange({
      ...value,
      [type]: value[type] + 1,
    });
  };

  const handleDecrement = (type: RoomType) => {
    onChange({
      ...value,
      [type]: Math.max(0, value[type] - 1),
    });
  };

  const handleChange = (type: RoomType, newValue: string) => {
    const num = parseInt(newValue) || 0;
    onChange({
      ...value,
      [type]: Math.max(0, num),
    });
  };

  const handleAddOtherRoom = () => {
    if (!newOtherRoomName.trim()) return;

    const otherRooms = value.other || [];
    onChange({
      ...value,
      other: [...otherRooms, { name: newOtherRoomName.trim(), count: 1 }],
    });
    setNewOtherRoomName('');
  };

  const handleOtherRoomCountChange = (index: number, count: number) => {
    const otherRooms = value.other || [];
    const updatedOther = [...otherRooms];
    updatedOther[index] = { ...updatedOther[index], count: Math.max(0, count) };
    onChange({
      ...value,
      other: updatedOther,
    });
  };

  const handleRemoveOtherRoom = (index: number) => {
    const otherRooms = value.other || [];
    onChange({
      ...value,
      other: otherRooms.filter((_, i) => i !== index),
    });
  };

  const getTotalRooms = () => {
    const standardRoomsTotal = Object.keys(value)
      .filter(key => key !== 'other')
      .reduce((sum, key) => sum + (value[key as RoomType] || 0), 0);
    
    const otherRoomsTotal = (value.other || []).reduce((sum, room) => sum + room.count, 0);
    
    return standardRoomsTotal + otherRoomsTotal;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-3 sm:mb-4">
          How Many Rooms?
        </h3>
        <p className="text-xs sm:text-sm text-neutral-600 mb-4 sm:mb-6">
          Enter the number of each room type for this project. 
          You'll be able to name them individually on the next page.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ROOM_TYPES.map((roomType) => (
          <Card key={roomType.key} className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{roomType.icon}</span>
              <label className="block text-sm font-medium text-neutral-700">
                {roomType.label}
              </label>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => handleDecrement(roomType.key)}
                disabled={value[roomType.key] === 0}
                className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-brass-600 text-brass-600 hover:bg-brass-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation"
                aria-label={`Decrease ${roomType.label}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                </svg>
              </button>

              <input
                type="number"
                min="0"
                value={value[roomType.key]}
                onChange={(e) => handleChange(roomType.key, e.target.value)}
                className="w-16 px-2 py-2 text-center text-xl font-bold border-2 border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
                aria-label={`Number of ${roomType.label}`}
              />

              <button
                onClick={() => handleIncrement(roomType.key)}
                className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-brass-600 bg-brass-600 text-white hover:bg-brass-700 transition-colors touch-manipulation"
                aria-label={`Increase ${roomType.label}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Other Rooms Section */}
      <div className="mt-8">
        <h4 className="text-sm font-semibold text-neutral-900 mb-3">
          Other Room Types
        </h4>
        <p className="text-xs text-neutral-600 mb-4">
          Add custom room types that aren't listed above (e.g., Theater, Gym, Wine Cellar, Mudroom).
        </p>

        {/* Existing Other Rooms */}
        {value.other && value.other.length > 0 && (
          <div className="space-y-3 mb-4">
            {value.other.map((room, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">🏠</span>
                      <label className="block text-sm font-medium text-neutral-700">
                        {room.name}
                      </label>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => handleOtherRoomCountChange(index, room.count - 1)}
                        disabled={room.count === 0}
                        className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-brass-600 text-brass-600 hover:bg-brass-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation"
                        aria-label={`Decrease ${room.name}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                        </svg>
                      </button>

                      <input
                        type="number"
                        min="0"
                        value={room.count}
                        onChange={(e) => handleOtherRoomCountChange(index, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-2 text-center text-xl font-bold border-2 border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
                        aria-label={`Number of ${room.name}`}
                      />

                      <button
                        onClick={() => handleOtherRoomCountChange(index, room.count + 1)}
                        className="w-9 h-9 flex items-center justify-center rounded-full border-2 border-brass-600 bg-brass-600 text-white hover:bg-brass-700 transition-colors touch-manipulation"
                        aria-label={`Increase ${room.name}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveOtherRoom(index)}
                    className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-button transition-colors"
                    title="Remove room type"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add New Other Room */}
        <Card className="p-4 bg-neutral-50 border-neutral-300">
          <div className="flex gap-3">
            <input
              type="text"
              value={newOtherRoomName}
              onChange={(e) => setNewOtherRoomName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newOtherRoomName.trim()) {
                  e.preventDefault();
                  handleAddOtherRoom();
                }
              }}
              placeholder="Enter custom room type (e.g., Theater, Gym, Wine Cellar)"
              className="flex-1 px-4 py-2 border-2 border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
            />
            <button
              onClick={handleAddOtherRoom}
              disabled={!newOtherRoomName.trim()}
              className="px-6 py-2 bg-brass-600 text-white rounded-button hover:bg-brass-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Add
            </button>
          </div>
        </Card>
      </div>

      {/* Summary */}
      {getTotalRooms() > 0 && (
        <Card className="p-3 sm:p-4 bg-brass-50 border-brass-200">
          <div className="flex items-start sm:items-center gap-3">
            <svg className="w-5 h-5 text-brass-600 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs sm:text-sm text-neutral-700">
              <strong>Total Rooms:</strong> {getTotalRooms()}
              <div className="mt-1 text-neutral-600">
                {ROOM_TYPES.filter(rt => value[rt.key] > 0).map((rt, idx, arr) => (
                  <span key={rt.key}>
                    {value[rt.key]} {rt.label.toLowerCase()}
                    {idx < arr.length - 1 || (value.other && value.other.length > 0) ? ', ' : ''}
                  </span>
                ))}
                {value.other && value.other.map((room, idx) => (
                  <span key={idx}>
                    {room.count} {room.name.toLowerCase()}
                    {idx < value.other!.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
