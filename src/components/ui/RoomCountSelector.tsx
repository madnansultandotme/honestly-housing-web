'use client';

import { useState } from 'react';
import Card from './Card';

export interface RoomCounts {
  bedrooms: number;
  bathrooms: number;
}

interface RoomCountSelectorProps {
  value: RoomCounts;
  onChange: (counts: RoomCounts) => void;
}

export default function RoomCountSelector({ value, onChange }: RoomCountSelectorProps) {
  const handleIncrement = (type: 'bedrooms' | 'bathrooms') => {
    onChange({
      ...value,
      [type]: value[type] + 1,
    });
  };

  const handleDecrement = (type: 'bedrooms' | 'bathrooms') => {
    onChange({
      ...value,
      [type]: Math.max(0, value[type] - 1),
    });
  };

  const handleChange = (type: 'bedrooms' | 'bathrooms', newValue: string) => {
    const num = parseInt(newValue) || 0;
    onChange({
      ...value,
      [type]: Math.max(0, num),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 mb-3 sm:mb-4">
          How Many Bedrooms and Bathrooms?
        </h3>
        <p className="text-xs sm:text-sm text-neutral-600 mb-4 sm:mb-6">
          Enter the total number of bedrooms and bathrooms for this project. 
          You'll be able to name them individually on the next page.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Bedrooms */}
        <Card className="p-4 sm:p-6">
          <label className="block text-sm font-medium text-neutral-700 mb-3 sm:mb-4">
            Bedrooms
          </label>
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <button
              onClick={() => handleDecrement('bedrooms')}
              disabled={value.bedrooms === 0}
              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full border-2 border-brass-600 text-brass-600 hover:bg-brass-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation"
              aria-label="Decrease bedrooms"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
              </svg>
            </button>

            <input
              type="number"
              min="0"
              value={value.bedrooms}
              onChange={(e) => handleChange('bedrooms', e.target.value)}
              className="w-20 sm:w-24 px-3 sm:px-4 py-2 sm:py-3 text-center text-2xl sm:text-3xl font-bold border-2 border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
              aria-label="Number of bedrooms"
            />

            <button
              onClick={() => handleIncrement('bedrooms')}
              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full border-2 border-brass-600 bg-brass-600 text-white hover:bg-brass-700 transition-colors touch-manipulation"
              aria-label="Increase bedrooms"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </Card>

        {/* Bathrooms */}
        <Card className="p-4 sm:p-6">
          <label className="block text-sm font-medium text-neutral-700 mb-3 sm:mb-4">
            Bathrooms
          </label>
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <button
              onClick={() => handleDecrement('bathrooms')}
              disabled={value.bathrooms === 0}
              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full border-2 border-brass-600 text-brass-600 hover:bg-brass-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-manipulation"
              aria-label="Decrease bathrooms"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
              </svg>
            </button>

            <input
              type="number"
              min="0"
              value={value.bathrooms}
              onChange={(e) => handleChange('bathrooms', e.target.value)}
              className="w-20 sm:w-24 px-3 sm:px-4 py-2 sm:py-3 text-center text-2xl sm:text-3xl font-bold border-2 border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
              aria-label="Number of bathrooms"
            />

            <button
              onClick={() => handleIncrement('bathrooms')}
              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full border-2 border-brass-600 bg-brass-600 text-white hover:bg-brass-700 transition-colors touch-manipulation"
              aria-label="Increase bathrooms"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </Card>
      </div>

      {/* Summary */}
      {(value.bedrooms > 0 || value.bathrooms > 0) && (
        <Card className="p-3 sm:p-4 bg-brass-50 border-brass-200">
          <div className="flex items-start sm:items-center gap-3">
            <svg className="w-5 h-5 text-brass-600 flex-shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
              <strong>Total Rooms:</strong> {value.bedrooms + value.bathrooms} 
              {value.bedrooms > 0 && ` (${value.bedrooms} ${value.bedrooms === 1 ? 'bedroom' : 'bedrooms'})`}
              {value.bedrooms > 0 && value.bathrooms > 0 && ', '}
              {value.bathrooms > 0 && `${value.bathrooms} ${value.bathrooms === 1 ? 'bathroom' : 'bathrooms'}`}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
