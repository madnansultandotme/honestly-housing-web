'use client';

import { useState } from 'react';
import Button from './Button';
import Input from './Input';
import Card from './Card';

export interface RoomFixture {
  id: string;
  category: string;
  name: string;
  quantity: number;
}

export interface RoomDetail {
  id: string;
  name: string;
  type: string;
  fixtures: RoomFixture[];
}

interface DynamicRoomBuilderProps {
  rooms: RoomDetail[];
  onChange: (rooms: RoomDetail[]) => void;
}

const ROOM_TYPES = [
  'Bedroom',
  'Bathroom',
  'Kitchen',
  'Living Room',
  'Dining Room',
  'Office',
  'Laundry',
  'Foyer',
  'Mudroom',
  'Pantry',
  'Garage',
  'Bonus Room',
  'Other',
];

const FIXTURE_CATEGORIES = [
  'Electrical',
  'Plumbing',
  'Flooring',
  'Paint Colors',
  'Tile',
  'Countertops',
  'Hardware',
  'Cabinetry',
  'Appliances',
  'Mirrors',
  'Other',
];

const COMMON_FIXTURES: Record<string, string[]> = {
  'Electrical': ['Fan', 'Down Rod', 'Vanity Light', 'Ceiling Light', 'Recessed Light', 'Chandelier', 'Pendant Light', 'Sconce'],
  'Plumbing': ['Bathroom Faucet', 'Drain', 'Shower Head', 'Tub Faucet', 'Kitchen Faucet', 'Toilet', 'Sink'],
  'Paint Colors': ['Trim', 'Ceiling', 'Walls', 'Cabinets', 'Doors'],
  'Flooring': ['Hardwood', 'Tile', 'Carpet', 'Vinyl', 'Laminate'],
  'Tile': ['Floor Tile', 'Wall Tile', 'Backsplash', 'Shower Tile'],
  'Hardware': ['Door Knobs', 'Cabinet Pulls', 'Hinges', 'Towel Bars'],
  'Mirrors': ['Vanity Mirror', 'Full Length Mirror', 'Decorative Mirror'],
};

export default function DynamicRoomBuilder({ rooms, onChange }: DynamicRoomBuilderProps) {
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState('Bedroom');
  const [showAddRoom, setShowAddRoom] = useState(false);

  // Add fixture states
  const [addingFixtureToRoom, setAddingFixtureToRoom] = useState<string | null>(null);
  const [newFixtureCategory, setNewFixtureCategory] = useState('Electrical');
  const [newFixtureName, setNewFixtureName] = useState('');
  const [newFixtureQuantity, setNewFixtureQuantity] = useState(1);

  const handleAddRoom = () => {
    if (!newRoomName.trim()) return;

    const newRoom: RoomDetail = {
      id: `room-${Date.now()}`,
      name: newRoomName.trim(),
      type: newRoomType,
      fixtures: [],
    };

    onChange([...rooms, newRoom]);
    setNewRoomName('');
    setNewRoomType('Bedroom');
    setShowAddRoom(false);
  };

  const handleRemoveRoom = (roomId: string) => {
    onChange(rooms.filter(r => r.id !== roomId));
  };

  const handleAddFixture = (roomId: string) => {
    if (!newFixtureName.trim()) return;

    const newFixture: RoomFixture = {
      id: `fixture-${Date.now()}`,
      category: newFixtureCategory,
      name: newFixtureName.trim(),
      quantity: newFixtureQuantity,
    };

    const updatedRooms = rooms.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          fixtures: [...room.fixtures, newFixture],
        };
      }
      return room;
    });

    onChange(updatedRooms);
    setNewFixtureName('');
    setNewFixtureQuantity(1);
    setAddingFixtureToRoom(null);
  };

  const handleRemoveFixture = (roomId: string, fixtureId: string) => {
    const updatedRooms = rooms.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          fixtures: room.fixtures.filter(f => f.id !== fixtureId),
        };
      }
      return room;
    });

    onChange(updatedRooms);
  };

  const handleQuickAddFixture = (roomId: string, category: string, fixtureName: string) => {
    const newFixture: RoomFixture = {
      id: `fixture-${Date.now()}`,
      category,
      name: fixtureName,
      quantity: 1,
    };

    const updatedRooms = rooms.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          fixtures: [...room.fixtures, newFixture],
        };
      }
      return room;
    });

    onChange(updatedRooms);
  };

  const groupFixturesByCategory = (fixtures: RoomFixture[]) => {
    const grouped: Record<string, RoomFixture[]> = {};
    fixtures.forEach(fixture => {
      if (!grouped[fixture.category]) {
        grouped[fixture.category] = [];
      }
      grouped[fixture.category].push(fixture);
    });
    return grouped;
  };

  return (
    <div className="space-y-4">
      {/* Room List */}
      {rooms.map((room) => {
        const isExpanded = expandedRoom === room.id;
        const groupedFixtures = groupFixturesByCategory(room.fixtures);

        return (
          <Card key={room.id} className="overflow-hidden">
            {/* Room Header */}
            <div className="flex items-center justify-between p-4 bg-brass-50 border-b border-brass-200">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => setExpandedRoom(isExpanded ? null : room.id)}
                  className="text-neutral-900 hover:text-brass-600 transition-colors"
                >
                  <svg
                    className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900">{room.name}</h3>
                  <p className="text-sm text-neutral-600">
                    {room.type} • {room.fixtures.length} fixture{room.fixtures.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveRoom(room.id)}
                className="text-red-600 hover:text-red-700 p-2"
                title="Remove room"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Room Details (Expanded) */}
            {isExpanded && (
              <div className="p-4 space-y-4">
                {/* Fixtures by Category */}
                {Object.keys(groupedFixtures).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(groupedFixtures).map(([category, fixtures]) => (
                      <div key={category} className="border border-neutral-200 rounded-button p-3">
                        <h4 className="font-medium text-neutral-900 mb-2">{category}</h4>
                        <div className="space-y-2">
                          {fixtures.map((fixture) => (
                            <div
                              key={fixture.id}
                              className="flex items-center justify-between bg-neutral-50 p-2 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-neutral-900">{fixture.name}</span>
                                {fixture.quantity > 1 && (
                                  <span className="text-xs bg-brass-100 text-brass-800 px-2 py-0.5 rounded-full">
                                    x{fixture.quantity}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveFixture(room.id, fixture.id)}
                                className="text-red-600 hover:text-red-700 p-1"
                                title="Remove fixture"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500 italic">No fixtures added yet</p>
                )}

                {/* Add Fixture Section */}
                {addingFixtureToRoom === room.id ? (
                  <div className="border border-brass-200 rounded-button p-4 bg-brass-50 space-y-3">
                    <h4 className="font-medium text-neutral-900">Add Fixture</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                        <select
                          value={newFixtureCategory}
                          onChange={(e) => setNewFixtureCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500"
                        >
                          {FIXTURE_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Fixture Name</label>
                        <input
                          type="text"
                          value={newFixtureName}
                          onChange={(e) => setNewFixtureName(e.target.value)}
                          placeholder="e.g., Fan, Faucet"
                          className="w-full px-3 py-2 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={newFixtureQuantity}
                          onChange={(e) => setNewFixtureQuantity(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500"
                        />
                      </div>
                    </div>

                    {/* Quick Add Suggestions */}
                    {COMMON_FIXTURES[newFixtureCategory] && (
                      <div>
                        <p className="text-xs text-neutral-600 mb-2">Quick add:</p>
                        <div className="flex flex-wrap gap-2">
                          {COMMON_FIXTURES[newFixtureCategory].map(fixtureName => (
                            <button
                              key={fixtureName}
                              onClick={() => handleQuickAddFixture(room.id, newFixtureCategory, fixtureName)}
                              className="text-xs bg-white border border-neutral-300 hover:border-brass-500 px-2 py-1 rounded transition-colors"
                            >
                              + {fixtureName}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button onClick={() => handleAddFixture(room.id)} disabled={!newFixtureName.trim()}>
                        Add Fixture
                      </Button>
                      <Button variant="outline" onClick={() => setAddingFixtureToRoom(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAddingFixtureToRoom(room.id);
                      setNewFixtureCategory('Electrical');
                      setNewFixtureName('');
                      setNewFixtureQuantity(1);
                    }}
                    className="w-full"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Fixture
                  </Button>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {/* Add Room Section */}
      {showAddRoom ? (
        <Card className="p-4 bg-brass-50 border-brass-200 space-y-3">
          <h3 className="font-semibold text-neutral-900">Add New Room</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Room Name *</label>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="e.g., Primary Bedroom, Half Bath"
                className="w-full px-3 py-2 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Room Type</label>
              <select
                value={newRoomType}
                onChange={(e) => setNewRoomType(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500"
              >
                {ROOM_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAddRoom} disabled={!newRoomName.trim()}>
              Add Room
            </Button>
            <Button variant="outline" onClick={() => setShowAddRoom(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowAddRoom(true)}
          className="w-full border-dashed border-2"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Room
        </Button>
      )}

      {/* Summary */}
      {rooms.length > 0 && (
        <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 rounded-button">
          <h4 className="font-medium text-neutral-900 mb-2">Summary</h4>
          <div className="text-sm text-neutral-600 space-y-1">
            <p>Total Rooms: {rooms.length}</p>
            <p>Total Fixtures: {rooms.reduce((sum, room) => sum + room.fixtures.length, 0)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
