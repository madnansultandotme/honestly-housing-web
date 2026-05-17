'use client';

import { useMemo } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import type { RoomDetail, RoomFixture } from './DynamicRoomBuilder';
import { useSetupDesign } from '@/hooks/useSetupDesign';
import type { SetupDesignOption } from '@/lib/setupDesign/defaults';

interface RoomSelectionOptionsProps {
  rooms: RoomDetail[];
  onChange: (rooms: RoomDetail[]) => void;
}

function getOptionSetKey(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes('bath') || normalized.includes('powder')) return 'bathroom';
  if (normalized.includes('kitchen') || normalized.includes('pantry')) return 'kitchen';
  if (normalized.includes('living') || normalized.includes('dining') || normalized.includes('bonus')) return 'living';
  if (normalized.includes('laundry') || normalized.includes('mud') || normalized.includes('garage')) return 'utility';
  return 'bedroom';
}

function fixtureMatches(fixture: RoomFixture, option: SetupDesignOption) {
  return fixture.category === option.category && fixture.name === option.name;
}

function createFixture(option: SetupDesignOption): RoomFixture {
  return {
    id: `fixture-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category: option.category,
    name: option.name,
    quantity: 1,
  };
}

export default function RoomSelectionOptions({ rooms, onChange }: RoomSelectionOptionsProps) {
  const { setupDesign } = useSetupDesign();
  const roomGroups = useMemo(() => {
    return rooms.reduce<Record<string, RoomDetail[]>>((acc, room) => {
      const key = getOptionSetKey(room.type);
      acc[key] = [...(acc[key] || []), room];
      return acc;
    }, {});
  }, [rooms]);

  const toggleOption = (groupRooms: RoomDetail[], option: SetupDesignOption, checked: boolean) => {
    const groupRoomIds = new Set(groupRooms.map((room) => room.id));
    const updatedRooms = rooms.map((room) => {
      if (!groupRoomIds.has(room.id)) return room;

      const existing = room.fixtures.some((fixture) => fixtureMatches(fixture, option));
      if (checked && !existing) {
        return { ...room, fixtures: [...room.fixtures, createFixture(option)] };
      }

      if (!checked && existing) {
        return {
          ...room,
          fixtures: room.fixtures.filter((fixture) => !fixtureMatches(fixture, option)),
        };
      }

      return room;
    });

    onChange(updatedRooms);
  };

  const updateQuantity = (groupRooms: RoomDetail[], option: SetupDesignOption, quantity: number) => {
    const groupRoomIds = new Set(groupRooms.map((room) => room.id));
    onChange(
      rooms.map((room) => {
        if (!groupRoomIds.has(room.id)) return room;

        return {
          ...room,
          fixtures: room.fixtures.map((fixture) =>
            fixtureMatches(fixture, option) ? { ...fixture, quantity: Math.max(1, quantity) } : fixture
          ),
        };
      })
    );
  };

  if (rooms.length === 0) {
    return (
      <div className="rounded-button border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
        Select rooms first, then room selection options will appear here.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(roomGroups).map(([groupKey, groupRooms]) => {
        const config = setupDesign[groupKey] || setupDesign.bedroom;
        const categories = Array.from(new Set(config.options.map((option) => option.category)));

        return (
          <section key={groupKey} className="border-b border-neutral-200 pb-8 last:border-b-0 last:pb-0">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-neutral-900">{config.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{config.appliesTo}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {groupRooms.map((room) => (
                  <span
                    key={room.id}
                    className="rounded-button border border-brass-200 bg-brass-50 px-3 py-1 text-xs font-medium text-neutral-800"
                  >
                    {room.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              {categories.map((category) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-base font-semibold text-neutral-900">{category}</h4>
                  <div className="space-y-1">
                    {config.options
                      .filter((option) => option.category === category)
                      .map((option) => {
                        const selectedCount = groupRooms.filter((room) =>
                          room.fixtures.some((fixture) => fixtureMatches(fixture, option))
                        ).length;
                        const checked = selectedCount === groupRooms.length;
                        const partial = selectedCount > 0 && selectedCount < groupRooms.length;
                        const selectedFixture = groupRooms
                          .flatMap((room) => room.fixtures)
                          .find((fixture) => fixtureMatches(fixture, option));

                        return (
                          <div
                            key={`${category}-${option.name}`}
                            className="grid grid-cols-[minmax(0,1fr)_minmax(120px,180px)] items-center gap-4 pl-8 pr-2 py-1"
                          >
                            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-neutral-900">
                              <input
                                type="checkbox"
                                checked={checked}
                                ref={(input) => {
                                  if (input) input.indeterminate = partial;
                                }}
                                onChange={(event) => toggleOption(groupRooms, option, event.target.checked)}
                                className="sr-only"
                              />
                              {selectedCount > 0 ? (
                                <CheckSquare className="h-5 w-5 flex-none text-brass-700" />
                              ) : (
                                <Square className="h-5 w-5 flex-none text-neutral-500" />
                              )}
                              <span>{option.name}</span>
                            </label>

                            {selectedCount > 0 ? (
                              <input
                                type="number"
                                min="1"
                                value={selectedFixture?.quantity || 1}
                                aria-label={`${option.name} ${option.measureLabel || 'Quantity'}`}
                                onChange={(event) =>
                                  updateQuantity(groupRooms, option, parseInt(event.target.value, 10) || 1)
                                }
                                className="w-full rounded-button border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brass-500"
                              />
                            ) : (
                              <span className="text-sm text-neutral-700">{option.measureLabel || 'Quantity'}</span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                  <div className="pt-1 text-sm text-neutral-700">Notes:</div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
