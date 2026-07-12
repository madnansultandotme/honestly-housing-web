'use client';

import { useState } from 'react';
import { HierarchicalBudgetCategory, BudgetSubcategory, calculateCategoryTotal } from '@/lib/constants/hierarchical-budget-categories';
import { ChevronDownIcon, ChevronUpIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

interface SubcategoryRowProps {
  categoryId: string;
  subcategory: BudgetSubcategory;
  onAmountChange: (categoryId: string, subcategoryId: string, amount: number) => void;
  onNameChange: (categoryId: string, subcategoryId: string, newName: string) => void;
  onDelete: (categoryId: string, subcategoryId: string) => void;
  onRoomChange?: (categoryId: string, subcategoryId: string, roomId: string, roomName: string) => void;
  canDelete: boolean;
  availableRooms?: Array<{ id: string; name: string }>;
}

function SubcategoryRow({
  categoryId,
  subcategory,
  onAmountChange,
  onNameChange,
  onDelete,
  onRoomChange,
  canDelete,
  availableRooms = [],
}: SubcategoryRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(subcategory.name);

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== subcategory.name) {
      onNameChange(categoryId, subcategory.id, editedName.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedName(subcategory.name);
    setIsEditing(false);
  };

  const handleRoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roomId = e.target.value;
    const room = availableRooms.find(r => r.id === roomId);
    if (onRoomChange && room) {
      onRoomChange(categoryId, subcategory.id, roomId, room.name);
    } else if (onRoomChange && roomId === '') {
      onRoomChange(categoryId, subcategory.id, '', '');
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-white p-3 rounded-lg border border-neutral-200">
        <div className="space-y-3">
          {/* Name Section */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    className="w-full px-3 py-1.5 border border-brass-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brass-500 text-sm font-medium"
                    placeholder="Subcategory name"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveName}
                      className="px-3 py-1 text-xs font-medium text-white bg-brass-600 hover:bg-brass-700 rounded-lg transition-colors"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-sm font-medium text-neutral-700">
                    {subcategory.name}
                  </label>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="p-1 text-brass-600 hover:bg-brass-50 rounded transition-colors"
                      title="Edit subcategory name"
                    >
                      <PencilIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Delete button */}
            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete "${subcategory.name}"?`)) {
                    onDelete(categoryId, subcategory.id);
                  }
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors self-start"
                title="Delete subcategory"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Amount and Room Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Amount Input */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={subcategory.amount || ''}
                  onChange={(e) =>
                    onAmountChange(
                      categoryId,
                      subcategory.id,
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
                  disabled={isEditing}
                />
              </div>
            </div>

            {/* Room Selection */}
            {availableRooms.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">
                  Assign to Room (Optional)
                </label>
                <select
                  value={subcategory.roomId || ''}
                  onChange={handleRoomChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-brass-500 bg-white"
                  disabled={isEditing}
                >
                  <option value="">No room assigned</option>
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Display assigned room if selected */}
          {subcategory.roomName && (
            <div className="flex items-center gap-2 text-xs text-brass-700 bg-brass-50 px-2 py-1 rounded">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Assigned to: {subcategory.roomName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface HierarchicalBudgetInputProps {
  categories: HierarchicalBudgetCategory[];
  onChange: (categories: HierarchicalBudgetCategory[]) => void;
  availableRooms?: Array<{ id: string; name: string }>; // Optional room list for assignment
}

export default function HierarchicalBudgetInput({ categories, onChange, availableRooms = [] }: HierarchicalBudgetInputProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleSubcategoryChange = (categoryId: string, subcategoryId: string, amount: number) => {
    const updatedCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          subcategories: cat.subcategories.map(sub =>
            sub.id === subcategoryId
              ? { ...sub, amount: isNaN(amount) ? 0 : amount }
              : sub
          ),
        };
      }
      return cat;
    });
    onChange(updatedCategories);
  };

  const handleAddSubcategory = (categoryId: string, name: string) => {
    const updatedCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          subcategories: [
            ...cat.subcategories,
            {
              id: `${categoryId}-sub-${Date.now()}`,
              name: name.trim(),
              amount: 0,
            },
          ],
        };
      }
      return cat;
    });
    onChange(updatedCategories);
  };

  const handleDeleteSubcategory = (categoryId: string, subcategoryId: string) => {
    const updatedCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          subcategories: cat.subcategories.filter(sub => sub.id !== subcategoryId),
        };
      }
      return cat;
    });
    onChange(updatedCategories);
  };

  const handleDeleteCategory = (categoryId: string) => {
    onChange(categories.filter(cat => cat.id !== categoryId));
  };

  const handleRoomChange = (categoryId: string, subcategoryId: string, roomId: string, roomName: string) => {
    const updatedCategories = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          subcategories: cat.subcategories.map(sub =>
            sub.id === subcategoryId
              ? { ...sub, roomId: roomId || undefined, roomName: roomName || undefined }
              : sub
          ),
        };
      }
      return cat;
    });
    onChange(updatedCategories);
  };

  const grandTotal = categories.reduce((sum, cat) => sum + calculateCategoryTotal(cat), 0);

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        const categoryTotal = calculateCategoryTotal(category);

        return (
          <div key={category.id} className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
            {/* Main Category Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-brass-50 to-white">
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-brass-600 text-white rounded-lg font-mono font-bold">
                  {category.code}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-neutral-900">{category.name}</div>
                  <div className="text-sm text-brass-700 font-medium">
                    ${categoryTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUpIcon className="w-5 h-5 text-neutral-400" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-neutral-400" />
                )}
              </button>
              
              {/* Delete button for custom categories */}
              {category.isCustom && (
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(category.id)}
                  className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete custom category"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Subcategories */}
            {isExpanded && (
              <div className="p-4 bg-neutral-50 space-y-3">
                {category.subcategories.map((subcategory) => (
                  <SubcategoryRow
                    key={subcategory.id}
                    categoryId={category.id}
                    subcategory={subcategory}
                    onAmountChange={handleSubcategoryChange}
                    onNameChange={(categoryId, subcategoryId, newName) => {
                      const updatedCategories = categories.map(cat => {
                        if (cat.id === categoryId) {
                          return {
                            ...cat,
                            subcategories: cat.subcategories.map(sub =>
                              sub.id === subcategoryId
                                ? { ...sub, name: newName }
                                : sub
                            ),
                          };
                        }
                        return cat;
                      });
                      onChange(updatedCategories);
                    }}
                    onRoomChange={handleRoomChange}
                    onDelete={handleDeleteSubcategory}
                    canDelete={subcategory.id.includes('sub-')}
                    availableRooms={availableRooms}
                  />
                ))}

                {/* Add Subcategory */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const name = prompt('Enter subcategory name:');
                      if (name?.trim()) {
                        handleAddSubcategory(category.id, name);
                      }
                    }}
                    className="text-sm text-brass-600 hover:text-brass-700 font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Subcategory
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Grand Total */}
      <div className="p-6 bg-gradient-to-br from-brass-50 to-brass-100 border-2 border-brass-300 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-brass-800 mb-1">
              Total Project Budget
            </div>
            <div className="text-xs text-brass-600">
              Sum of all construction categories
            </div>
          </div>
          <div className="text-3xl font-bold text-brass-900">
            ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
}
