'use client';

import { useState } from 'react';
import { HierarchicalBudgetCategory, calculateCategoryTotal } from '@/lib/constants/hierarchical-budget-categories';
import { ChevronDownIcon, ChevronUpIcon, TrashIcon } from '@heroicons/react/24/outline';

interface HierarchicalBudgetInputProps {
  categories: HierarchicalBudgetCategory[];
  onChange: (categories: HierarchicalBudgetCategory[]) => void;
}

export default function HierarchicalBudgetInput({ categories, onChange }: HierarchicalBudgetInputProps) {
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

  const grandTotal = categories.reduce((sum, cat) => sum + calculateCategoryTotal(cat), 0);

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        const categoryTotal = calculateCategoryTotal(category);
        const hasCustomSubcategories = category.subcategories.some(sub => 
          sub.id.includes('sub-') && !category.id.includes('custom-')
        );

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
                  <div key={subcategory.id} className="flex items-center gap-3">
                    <div className="flex-1 bg-white p-3 rounded-lg border border-neutral-200">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            {subcategory.name}
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
                                handleSubcategoryChange(
                                  category.id,
                                  subcategory.id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0.00"
                              className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
                            />
                          </div>
                        </div>
                        
                        {/* Delete button for custom subcategories */}
                        {subcategory.id.includes('sub-') && hasCustomSubcategories && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSubcategory(category.id, subcategory.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete subcategory"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
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
