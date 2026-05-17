'use client';

import { useState } from 'react';
import Button from './Button';
import Card from './Card';

export interface RoomSelection {
  type: string;
  displayName: string;
  quantity: number;
  selected: boolean;
}

export interface CustomRoom {
  id: string;
  name: string;
  type: string;
}

interface RoomChecklistProps {
  roomSelections: RoomSelection[];
  customRooms: CustomRoom[];
  onRoomSelectionsChange: (selections: RoomSelection[]) => void;
  onCustomRoomsChange: (rooms: CustomRoom[]) => void;
}

export default function RoomChecklist({
  roomSelections,
  customRooms,
  onRoomSelectionsChange,
  onCustomRoomsChange,
}: RoomChecklistProps) {
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customRoomName, setCustomRoomName] = useState('');
  const [customRoomType, setCustomRoomType] = useState('other');

  const handleToggleRoom = (type: string) => {
    const updated = roomSelections.map(room => {
      if (room.type === type) {
        return {
          ...room,
          selected: !room.selected,
          quantity: !room.selected ? 1 : room.quantity, // Set to 1 when selecting
        };
      }
      return room;
    });
    onRoomSelectionsChange(updated);
  };

  const handleQuantityChange = (type: string, quantity: number) => {
    const updated = roomSelections.map(room => {
      if (room.type === type) {
        return {
          ...room,
          quantity: Math.max(0, quantity),
          selected: quantity > 0, // Auto-select if quantity > 0
        };
      }
      return room;
    });
    onRoomSelectionsChange(updated);
  };

  const handleAddCustomRoom = () => {
    if (!customRoomName.trim()) return;

    const newRoom: CustomRoom = {
      id: `custom-${Date.now()}`,
      name: customRoomName.trim(),
      type: customRoomType,
    };

    onCustomRoomsChange([...customRooms, newRoom]);
    setCustomRoomName('');
    setCustomRoomType('other');
    setShowAddCustom(false);
  };

  const handleRemoveCustomRoom = (id: string) => {
    onCustomRoomsChange(customRooms.filter(room => room.id !== id));
  };

  const getTotalRooms = () => {
    const standardCount = roomSelections
      .filter(r => r.selected)
      .reduce((sum, r) => sum + r.quantity, 0);
    return standardCount + customRooms.length;
  };

  return (
    <div className="space-y-6">
      {/* Standard Rooms Checklist */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Select Standard Rooms
        </h3>
        <p className="text-sm text-neutral-600 mb-4">
          Check the rooms that apply to this project and specify how many of each.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roomSelections.map((room) => (
            <div
              key={room.type}
              className={`flex items-center gap-3 p-3 border rounded-button transition-colors ${
                room.selected
                  ? 'bg-brass-50 border-brass-500'
                  : 'bg-white border-neutral-300 hover:border-brass-300'
              }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={room.selected}
                onChange={() => handleToggleRoom(room.type)}
                className="w-5 h-5 text-brass-600 border-neutral-300 rounded focus:ring-brass-500 cursor-pointer"
              />

              {/* Room Name */}
              <label className="flex-1 text-sm font-medium text-neutral-900 cursor-pointer">
                {room.displayName}
              </label>

              {/* Quantity Input */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuantityChange(room.type, room.quantity - 1)}
                  disabled={!room.selected || room.quantity <= 0}
                  className="w-7 h-7 flex items-center justify-center rounded border border-neutral-300 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>

                <input
                  type="number"
                  min="0"
                  value={room.quantity}
                  onChange={(e) => handleQuantityChange(room.type, parseInt(e.target.value) || 0)}
                  disabled={!room.selected}
                  className="w-14 px-2 py-1 text-center border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-brass-500 disabled:bg-neutral-100 disabled:cursor-not-allowed"
                />

                <button
                  onClick={() => handleQuantityChange(room.type, room.quantity + 1)}
                  disabled={!room.selected}
                  className="w-7 h-7 flex items-center justify-center rounded border border-neutral-300 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Rooms */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Custom Rooms
        </h3>
        <p className="text-sm text-neutral-600 mb-4">
          Add any additional rooms with custom names, such as Wine Cellar or Theater Room.
        </p>

        {/* Custom Rooms List */}
        {customRooms.length > 0 && (
          <div className="space-y-2 mb-4">
            {customRooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between p-3 bg-brass-50 border border-brass-200 rounded-button"
              >
                <div>
                  <span className="font-medium text-neutral-900">{room.name}</span>
                  <span className="text-sm text-neutral-600 ml-2">
                    ({room.type.replace('-', ' ')})
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveCustomRoom(room.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="Remove custom room"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Custom Room Form */}
        {showAddCustom ? (
          <Card className="p-4 bg-brass-50 border-brass-200 space-y-3">
            <h4 className="font-medium text-neutral-900">Add Custom Room</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Room Name *
                </label>
                <input
                  type="text"
                  value={customRoomName}
                  onChange={(e) => setCustomRoomName(e.target.value)}
                  placeholder="e.g., Wine Cellar, Theater Room"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Room Type
                </label>
                <select
                  value={customRoomType}
                  onChange={(e) => setCustomRoomType(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500"
                >
                  <option value="other">Other</option>
                  <option value="bedroom">Bedroom</option>
                  <option value="bathroom">Bathroom</option>
                  <option value="living-room">Living Room</option>
                  <option value="dining-room">Dining Room</option>
                  <option value="office">Office</option>
                  <option value="bonus-room">Bonus Room</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddCustomRoom} disabled={!customRoomName.trim()}>
                Add Room
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddCustom(false);
                  setCustomRoomName('');
                  setCustomRoomType('other');
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowAddCustom(true)}
            className="w-full border-dashed border-2"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Custom Room
          </Button>
        )}
      </div>

      {/* Summary */}
      {getTotalRooms() > 0 && (
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-button">
          <h4 className="font-medium text-neutral-900 mb-2">Room Summary</h4>
          <div className="text-sm text-neutral-600 space-y-1">
            <p>
              <strong>Total Rooms:</strong> {getTotalRooms()}
            </p>
            {roomSelections.filter(r => r.selected).length > 0 && (
              <div className="mt-2">
                <strong>Selected:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  {roomSelections
                    .filter(r => r.selected)
                    .map(r => (
                      <li key={r.type}>
                        {r.displayName}: {r.quantity}
                      </li>
                    ))}
                </ul>
              </div>
            )}
            {customRooms.length > 0 && (
              <div className="mt-2">
                <strong>Custom Rooms:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  {customRooms.map(r => (
                    <li key={r.id}>{r.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
