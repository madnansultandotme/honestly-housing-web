'use client';

import { CheckSquare, Square } from 'lucide-react';
import type { RoomDetail, RoomFixture } from './DynamicRoomBuilder';
import { useSetupDesign } from '@/hooks/useSetupDesign';
import type { SetupDesignOption } from '@/lib/setupDesign/defaults';

interface RoomSelectionOptionsProps {
  rooms: RoomDetail[];
  onChange: (rooms: RoomDetail[]) => void;
  notesByRoomCategory?: Record<string, string>;
  onNotesChange?: (roomId: string, category: string, notes: string) => void;
}

function getOptionSetKey(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes('interior')) return 'interior';
  if (normalized.includes('exterior') || normalized.includes('outdoor') || normalized.includes('patio') || normalized.includes('pool')) return 'exterior';
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

export default function RoomSelectionOptions({
  rooms,
  onChange,
  notesByRoomCategory = {},
  onNotesChange,
}: RoomSelectionOptionsProps) {
  const { setupDesign } = useSetupDesign();

  const getNotesKey = (roomId: string, category: string) =>
    `${roomId}-${category.toLowerCase().trim().replace(/\s+/g, '-')}`;

  const toggleOption = (roomId: string, option: SetupDesignOption, checked: boolean) => {
    const updatedRooms = rooms.map((room) => {
      if (room.id !== roomId) return room;

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

  const updateQuantity = (roomId: string, option: SetupDesignOption, quantity: number) => {
    onChange(
      rooms.map((room) => {
        if (room.id !== roomId) return room;

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
      {rooms.map((room) => {
        const groupKey = getOptionSetKey(room.type);
        const config = setupDesign[groupKey] || setupDesign.bedroom;
        const categories = Array.from(new Set(config.options.map((option) => option.category)));

        return (
          <section key={room.id} className="border-b border-neutral-200 pb-8 last:border-b-0 last:pb-0">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-neutral-900">{room.name}</h3>
              <p className="mt-1 text-sm text-neutral-600">
                {config.title} defaults. Select only the items needed for this room.
              </p>
            </div>

            <div className="space-y-8">
              {categories.map((category) => (
                <div key={category} className="space-y-2">
                  <h4 className="text-base font-semibold text-neutral-900">{category}</h4>
                  <div className="space-y-1">
                    {config.options
                      .filter((option) => option.category === category)
                      .map((option) => {
                        const selectedFixture = room.fixtures.find((fixture) => fixtureMatches(fixture, option));
                        const checked = Boolean(selectedFixture);

                        return (
                          <div
                            key={`${room.id}-${category}-${option.name}`}
                            className="grid grid-cols-1 gap-2 py-2 pl-2 pr-2 sm:grid-cols-[minmax(0,1fr)_minmax(120px,180px)] sm:items-center sm:gap-4 sm:py-1 sm:pl-8"
                          >
                            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-neutral-900">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) => toggleOption(room.id, option, event.target.checked)}
                                className="sr-only"
                              />
                              {checked ? (
                                <CheckSquare className="h-5 w-5 flex-none text-brass-700" />
                              ) : (
                                <Square className="h-5 w-5 flex-none text-neutral-500" />
                              )}
                              <span>{option.name}</span>
                            </label>

                            {checked ? (
                              option.inputType === 'select' && option.selectOptions ? (
                                // Select dropdown for special inputs (e.g., Alcove Tub: Right or Left)
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs text-neutral-600 sm:hidden">
                                    {option.measureLabel}
                                  </label>
                                  <select
                                    value={selectedFixture?.value || option.selectOptions[0]}
                                    onChange={(event) => {
                                      onChange(
                                        rooms.map((r) => {
                                          if (r.id !== room.id) return r;
                                          return {
                                            ...r,
                                            fixtures: r.fixtures.map((fixture) =>
                                              fixtureMatches(fixture, option)
                                                ? { ...fixture, value: event.target.value, quantity: 1 }
                                                : fixture
                                            ),
                                          };
                                        })
                                      );
                                    }}
                                    className="w-full rounded-button border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brass-500"
                                  >
                                    {option.selectOptions.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : option.inputType === 'dual' && option.selectOptions ? (
                                // Dual input: Quantity + Select (e.g., Down Rod: quantity + length)
                                <div className="flex flex-col gap-2">
                                  {/* Quantity Input */}
                                  <div className="flex flex-col gap-1">
                                    <label className="text-xs text-neutral-600">
                                      {option.measureLabel || 'Quantity'}
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={selectedFixture?.quantity || 1}
                                      aria-label={`${option.name} ${option.measureLabel || 'Quantity'}`}
                                      onChange={(event) =>
                                        updateQuantity(room.id, option, parseInt(event.target.value, 10) || 1)
                                      }
                                      className="w-full rounded-button border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brass-500"
                                    />
                                  </div>
                                  {/* Select Input */}
                                  <div className="flex flex-col gap-1">
                                    <label className="text-xs text-neutral-600">
                                      {option.selectLabel || 'Option'}
                                    </label>
                                    <select
                                      value={selectedFixture?.value || option.selectOptions[0]}
                                      onChange={(event) => {
                                        onChange(
                                          rooms.map((r) => {
                                            if (r.id !== room.id) return r;
                                            return {
                                              ...r,
                                              fixtures: r.fixtures.map((fixture) =>
                                                fixtureMatches(fixture, option)
                                                  ? { ...fixture, value: event.target.value }
                                                  : fixture
                                              ),
                                            };
                                          })
                                        );
                                      }}
                                      className="w-full rounded-button border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brass-500"
                                    >
                                      {option.selectOptions.map((opt) => (
                                        <option key={opt} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              ) : (
                                // Number input for quantity
                                <div className="flex flex-col gap-1">
                                  <label className="text-xs text-neutral-600 sm:hidden">
                                    {option.measureLabel || 'Quantity'}
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={selectedFixture?.quantity || 1}
                                    aria-label={`${option.name} ${option.measureLabel || 'Quantity'}`}
                                    onChange={(event) =>
                                      updateQuantity(room.id, option, parseInt(event.target.value, 10) || 1)
                                    }
                                    className="w-full rounded-button border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brass-500"
                                  />
                                </div>
                              )
                            ) : (
                              <span className="pl-8 text-sm text-neutral-700 sm:pl-0">{option.measureLabel || 'Quantity'}</span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                  <div className="pt-3">
                    <label className="mb-1 block text-sm font-medium text-neutral-700">Notes</label>
                    <textarea
                      value={notesByRoomCategory[getNotesKey(room.id, category)] || ''}
                      onChange={(event) => onNotesChange?.(room.id, category, event.target.value)}
                      disabled={!onNotesChange}
                      rows={3}
                        placeholder={`Add any notes for ${category.toLowerCase()} in this room...`}
                      className="w-full rounded-button border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brass-500 disabled:cursor-not-allowed disabled:bg-neutral-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
