import { useState } from 'react';
import Card from './Card';
import { useSetupDesign } from '@/hooks/useSetupDesign';
import type { SetupDesignOption } from '@/lib/setupDesign/defaults';

interface Room {
  id: string;
  name: string;
  type?: string;
}

interface Category {
  id: string;
  name: string;
}

interface SelectedItem {
  id?: string;
  roomId: string;
  categoryId: string;
  name: string;
  quantity?: number;
  notes?: string;
}

interface RoomCategoryMatrixProps {
  rooms: Room[];
  categories: Category[];
  selectedMappings: { roomId: string; categoryId: string }[];
  onToggle: (roomId: string, categoryId: string, selected: boolean) => void;
  selectedItems?: SelectedItem[];
  onToggleItem?: (roomId: string, category: Category, fixture: SetupDesignOption, selected: boolean) => void;
  onUpdateItemQuantity?: (roomId: string, category: Category, itemName: string, quantity: number) => void;
  onAddCustomItem?: (roomId: string, category: Category, itemName: string) => void;
  notesByRoomCategory?: Record<string, string>;
  onNotesChange?: (roomId: string, category: Category, notes: string) => void;
  disabled?: boolean;
}

function getRoomOptionKey(room: Room) {
  const normalized = `${room.type || ''} ${room.name}`.toLowerCase();
  if (normalized.includes('interior')) return 'interior';
  if (normalized.includes('exterior') || normalized.includes('outdoor') || normalized.includes('patio') || normalized.includes('pool')) return 'exterior';
  if (normalized.includes('bath') || normalized.includes('powder')) return 'bathroom';
  if (normalized.includes('kitchen') || normalized.includes('pantry')) return 'kitchen';
  if (normalized.includes('living') || normalized.includes('dining') || normalized.includes('bonus')) return 'living';
  if (normalized.includes('laundry') || normalized.includes('mud') || normalized.includes('garage')) return 'utility';
  return 'bedroom';
}

export default function RoomCategoryMatrix({
  rooms,
  categories,
  selectedMappings,
  onToggle,
  selectedItems = [],
  onToggleItem,
  onUpdateItemQuantity,
  onAddCustomItem,
  notesByRoomCategory = {},
  onNotesChange,
  disabled = false,
}: RoomCategoryMatrixProps) {
  const [customItemNames, setCustomItemNames] = useState<Record<string, string>>({});
  const { setupDesign } = useSetupDesign();

  const visibleCategories = categories.filter((category, index, allCategories) => {
    const normalizedName = category.name.trim().toLowerCase();
    return allCategories.findIndex((item) => item.name.trim().toLowerCase() === normalizedName) === index;
  });

  const getEquivalentCategoryIds = (category: Category) => {
    const normalizedName = category.name.trim().toLowerCase();
    return categories
      .filter((item) => item.name.trim().toLowerCase() === normalizedName)
      .map((item) => item.id);
  };

  const isSelected = (roomId: string, categoryId: string) => {
    return selectedMappings.some(
      (mapping) => mapping.roomId === roomId && mapping.categoryId === categoryId
    );
  };

  const isCategorySelected = (roomId: string, category: Category) => {
    const categoryIds = getEquivalentCategoryIds(category);
    return selectedMappings.some(
      (mapping) => mapping.roomId === roomId && categoryIds.includes(mapping.categoryId)
    );
  };

  const handleToggle = (roomId: string, category: Category) => {
    const selected = isCategorySelected(roomId, category);

    if (selected) {
      getEquivalentCategoryIds(category).forEach((categoryId) => {
        if (isSelected(roomId, categoryId)) {
          onToggle(roomId, categoryId, false);
        }
      });
      return;
    }

    onToggle(roomId, category.id, true);
  };

  const getCategoryByName = (categoryName: string) => {
    return visibleCategories.find(
      (category) => category.name.trim().toLowerCase() === categoryName.trim().toLowerCase()
    );
  };

  const isFixtureSelected = (roomId: string, category: Category, fixtureName: string) => {
    const categoryIds = getEquivalentCategoryIds(category);
    return selectedItems.some(
      (item) => item.roomId === roomId && categoryIds.includes(item.categoryId) && item.name === fixtureName
    );
  };

  const getSelectedItem = (roomId: string, category: Category, itemName: string) => {
    const categoryIds = getEquivalentCategoryIds(category);
    return selectedItems.find(
      (item) => item.roomId === roomId && categoryIds.includes(item.categoryId) && item.name === itemName
    );
  };

  const getCustomInputKey = (roomId: string, categoryId: string) => `${roomId}-${categoryId}`;

  const getPresetOptions = (room: Room) => {
    const key = getRoomOptionKey(room);
    return setupDesign[key]?.options || setupDesign.bedroom.options;
  };

  const getCustomItems = (room: Room, category: Category) => {
    const presetNames = new Set(
      getPresetOptions(room)
        .filter((fixture) => fixture.category.trim().toLowerCase() === category.name.trim().toLowerCase())
        .map((fixture) => fixture.name)
    );
    const categoryIds = getEquivalentCategoryIds(category);

    return selectedItems.filter(
      (item) => item.roomId === room.id && categoryIds.includes(item.categoryId) && !presetNames.has(item.name)
    );
  };

  const handleCustomItemAdd = (roomId: string, category: Category) => {
    const inputKey = getCustomInputKey(roomId, category.id);
    const itemName = customItemNames[inputKey]?.trim();
    if (!itemName || !onAddCustomItem) return;

    onAddCustomItem(roomId, category, itemName);
    setCustomItemNames((prev) => ({ ...prev, [inputKey]: '' }));
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        Assign Categories to Rooms
      </h3>
      <p className="text-sm text-neutral-600 mb-6">
        Select which categories apply to each room. For example, a Living Room might need Electrical, Flooring, and Paint.
      </p>

      <div className="space-y-8">
        {rooms.map((room) => (
          <section key={room.id} className="border-b border-neutral-200 pb-6 last:border-b-0 last:pb-0">
            <h4 className="mb-1 text-xl font-semibold text-neutral-900">{room.name}</h4>
            <p className="mb-4 text-sm text-neutral-600">Select the fixtures and items that apply to this room.</p>

            {onToggleItem ? (
              <div className="space-y-7">
                {Array.from(new Set(getPresetOptions(room).map((fixture) => fixture.category)))
                  .map((categoryName) => {
                    const category = getCategoryByName(categoryName);
                    if (!category) return null;
                    const noteKey = getCustomInputKey(room.id, category.id);
                    const customItems = getCustomItems(room, category);

                    return (
                      <div key={categoryName}>
                        <h5 className="mb-2 text-base font-semibold text-neutral-900">{categoryName}</h5>
                        <div className="space-y-1">
                          {getPresetOptions(room)
                            .filter((fixture) => fixture.category === categoryName)
                            .map((fixture) => {
                              const selected = isFixtureSelected(room.id, category, fixture.name);
                              const selectedItem = getSelectedItem(room.id, category, fixture.name);

                              return (
                                <div
                                  key={`${room.id}-${categoryName}-${fixture.name}`}
                                  className={`
                                    grid w-full grid-cols-[minmax(0,1fr)_minmax(120px,190px)] items-center gap-4 py-1 pl-8 pr-2 text-left text-sm font-medium text-neutral-900 transition-colors
                                    ${selected ? 'text-brass-900' : 'hover:text-brass-800'}
                                    ${disabled ? 'opacity-50' : ''}
                                  `}
                                >
                                  <button
                                    type="button"
                                    onClick={() => onToggleItem(room.id, category, fixture, !selected)}
                                    disabled={disabled}
                                    className={`flex items-center gap-3 text-left ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                  >
                                    <span
                                      className={`
                                        flex h-5 w-5 items-center justify-center rounded border-2
                                        ${selected ? 'border-brass-600 bg-brass-600' : 'border-neutral-300 bg-white'}
                                      `}
                                    >
                                      {selected && (
                                        <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </span>
                                    <span>{fixture.name}</span>
                                  </button>
                                  {selected ? (
                                    <div className="flex items-center gap-2">
                                      <label className="text-sm font-normal text-neutral-700">{fixture.measureLabel}</label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={selectedItem?.quantity || 1}
                                        onChange={(event) =>
                                          onUpdateItemQuantity?.(
                                            room.id,
                                            category,
                                            fixture.name,
                                            parseInt(event.target.value, 10) || 1
                                          )
                                        }
                                        disabled={disabled}
                                        className="w-20 rounded-button border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brass-500"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-sm font-normal text-neutral-700">{fixture.measureLabel}</span>
                                  )}
                                </div>
                              );
                            })}
                          {customItems.map((item) => (
                            <div
                              key={item.id || `${room.id}-${category.id}-${item.name}`}
                              className="grid w-full grid-cols-[minmax(0,1fr)_minmax(120px,190px)] items-center gap-4 py-1 pl-8 pr-2 text-left text-sm font-medium text-brass-900"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  onToggleItem?.(
                                    room.id,
                                    category,
                                    { category: categoryName, name: item.name, measureLabel: 'Quantity' },
                                    false
                                  )
                                }
                                disabled={disabled}
                                className={`flex items-center gap-3 text-left ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <span className="flex h-5 w-5 items-center justify-center rounded border-2 border-brass-600 bg-brass-600">
                                  <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                                <span>{item.name}</span>
                              </button>
                              <div className="flex items-center gap-2">
                                <label className="text-sm font-normal text-neutral-700">Quantity</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity || 1}
                                  onChange={(event) =>
                                    onUpdateItemQuantity?.(
                                      room.id,
                                      category,
                                      item.name,
                                      parseInt(event.target.value, 10) || 1
                                    )
                                  }
                                  disabled={disabled}
                                  className="w-20 rounded-button border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brass-500"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        {onAddCustomItem && (
                          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 pl-8 pr-2">
                            <input
                              type="text"
                              value={customItemNames[getCustomInputKey(room.id, category.id)] || ''}
                              onChange={(event) =>
                                setCustomItemNames((prev) => ({
                                  ...prev,
                                  [getCustomInputKey(room.id, category.id)]: event.target.value,
                                }))
                              }
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault();
                                  handleCustomItemAdd(room.id, category);
                                }
                              }}
                              disabled={disabled}
                              placeholder={`Add other ${categoryName.toLowerCase()} item`}
                              className="rounded-button border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brass-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleCustomItemAdd(room.id, category)}
                              disabled={disabled || !customItemNames[getCustomInputKey(room.id, category.id)]?.trim()}
                              className="rounded-button border border-brass-600 px-3 py-2 text-sm font-medium text-brass-800 transition-colors hover:bg-brass-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Add
                            </button>
                          </div>
                        )}
                        <div className="pt-1">
                          <label className="mb-1 block text-sm text-neutral-700">Notes:</label>
                          <textarea
                            value={notesByRoomCategory[noteKey] || ''}
                            onChange={(event) => onNotesChange?.(room.id, category, event.target.value)}
                            disabled={disabled}
                            rows={2}
                            className="w-full rounded-button border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brass-500"
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="space-y-2">
                {visibleCategories.map((category) => {
                  const selected = isCategorySelected(room.id, category);

                  return (
                    <button
                      key={category.id}
                      onClick={() => handleToggle(room.id, category)}
                      disabled={disabled}
                      className={`
                        grid w-full grid-cols-[24px_minmax(0,1fr)] items-center gap-3 py-1 pl-3 pr-2 text-left text-sm font-medium text-neutral-900 transition-colors
                        ${selected ? 'text-brass-900' : 'hover:text-brass-800'}
                        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                      `}
                    >
                      <span
                        className={`
                          flex h-5 w-5 items-center justify-center rounded border-2
                          ${selected ? 'border-brass-600 bg-brass-600' : 'border-neutral-300 bg-white'}
                        `}
                      >
                        {selected && (
                          <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span>{category.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-8 text-neutral-500">
          No rooms available. Please add rooms first.
        </div>
      )}
    </Card>
  );
}
