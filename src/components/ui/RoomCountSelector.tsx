'use client';

import { useState } from 'react';
import Card from './Card';

export interface RoomCounts {
  bedrooms: number;
  bathrooms: number;
  office: number;
  diningRoom: number;
  pantry: number;
  laundry: number;
  livingRoom: number;
  bonusRoom: number;
}

interface RoomCountSelectorProps {
  value: RoomCounts;
  onChange: (counts: RoomCounts) => void;
}

type RoomType = keyof RoomCounts;

interface RoomTypeConfig {
  key: RoomType;
  label: string;
  icon: string;
}

const ROOM_TYPES: RoomTypeConfig[] = [
  { key: 'bedrooms', label: 'Bedrooms', icon: '🛏️' },
  { key: 'bathrooms', label: 'Bathrooms', icon: '🚿' },
  { key: 'office', label: 'Office', icon: '💼' },
  { key: 'diningRoom', label: 'Dining Room', icon: '🍽️' },
  { key: 'pantry', label: 'Pantry', icon: '🥫' },
  { key: 'laundry', label: 'Laundry', icon: '🧺' },
  { key: 'livingRoom', label: 'Living Room', icon: '🛋️' },
  { key: 'bonusRoom', label: 'Bonus Room', icon: '✨' },
];

export default function RoomCountSelector({ value, onChange }: RoomCountSelectorProps) {
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

  const getTotalRooms = () => {
    return Object.values(value).reduce((sum, count) => sum + count, 0);
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
                    {idx < arr.length - 1 ? ', ' : ''}
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
