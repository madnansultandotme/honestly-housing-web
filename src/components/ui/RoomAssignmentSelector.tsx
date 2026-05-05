'use client';

import { useState } from 'react';

export interface Room {
  id: string;
  name: string;
  requiredFixtures: number;
  assignedFixtures: number;
}

interface RoomAssignmentSelectorProps {
  rooms: Room[];
  selectedRoomId?: string;
  onSelect: (roomId: string) => void;
  disabled?: boolean;
}

export default function RoomAssignmentSelector({
  rooms,
  selectedRoomId,
  onSelect,
  disabled = false,
}: RoomAssignmentSelectorProps) {
  const [localSelected, setLocalSelected] = useState(selectedRoomId);

  const handleSelect = (roomId: string) => {
    if (disabled) return;
    setLocalSelected(roomId);
    onSelect(roomId);
  };

  // Filter out rooms that have met their fixture count
  const availableRooms = rooms.filter(
    (room) => room.assignedFixtures < room.requiredFixtures || room.id === localSelected
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Assign to Room
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {availableRooms.map((room) => {
          const isSelected = room.id === localSelected;
          const isFull = room.assignedFixtures >= room.requiredFixtures;
          const remaining = room.requiredFixtures - room.assignedFixtures;

          return (
            <button
              key={room.id}
              onClick={() => handleSelect(room.id)}
              disabled={disabled || (isFull && !isSelected)}
              className={`
                p-3 rounded-button border-2 text-left transition-all
                ${
                  isSelected
                    ? 'border-brass-600 bg-brass-50'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }
                ${disabled || (isFull && !isSelected) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-neutral-900">{room.name}</div>
                  <div className="text-xs text-neutral-600 mt-1">
                    {room.assignedFixtures} / {room.requiredFixtures} fixtures
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="ml-2">
                  {isSelected ? (
                    <div className="w-5 h-5 bg-brass-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  ) : isFull ? (
                    <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full">
                      Full
                    </span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      {remaining} left
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {availableRooms.length === 0 && (
        <div className="text-center py-6 text-neutral-600 text-sm">
          All rooms have met their fixture requirements
        </div>
      )}
    </div>
  );
}
