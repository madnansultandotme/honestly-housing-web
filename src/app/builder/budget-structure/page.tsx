'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import BuilderHeader from '@/components/navigation/BuilderHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  getHierarchicalBudgetCategories,
  saveHierarchicalBudgetCategories,
  calculateCategoryTotal,
  calculateGrandTotal,
  type HierarchicalBudgetCategory,
  type BudgetSubcategory,
  HIERARCHICAL_BUDGET_CATEGORIES,
} from '@/lib/constants/hierarchical-budget-categories';

export default function BudgetStructurePage() {
  const { user, profile } = useAuth();
  const { showSuccess, showError } = useNotification();
  const router = useRouter();
  
  const [categories, setCategories] = useState<HierarchicalBudgetCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
  const [draggedSubcategoryIndex, setDraggedSubcategoryIndex] = useState<number | null>(null);
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);
  
  // Add category form
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryCode, setNewCategoryCode] = useState('');
  
  // Add subcategory form
  const [addingSubcategoryTo, setAddingSubcategoryTo] = useState<string | null>(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (profile?.role !== 'builder' && profile?.role !== 'designer' && profile?.role !== 'admin') {
      router.push('/client');
      return;
    }

    loadCategories();
  }, [user, profile]);

  const loadCategories = () => {
    const loaded = getHierarchicalBudgetCategories();
    setCategories(loaded);
    // Expand all by default
    setExpandedCategories(new Set(loaded.map(cat => cat.id)));
  };

  const saveCategories = (updated: HierarchicalBudgetCategory[]) => {
    saveHierarchicalBudgetCategories(updated);
    setCategories(updated);
  };

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

  // Main category drag and drop
  const handleCategoryDragStart = (index: number) => {
    setDraggedCategoryIndex(index);
  };

  const handleCategoryDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedCategoryIndex === null || draggedCategoryIndex === index) return;
    
    const updated = [...categories];
    const [draggedItem] = updated.splice(draggedCategoryIndex, 1);
    updated.splice(index, 0, draggedItem);
    
    setCategories(updated);
    setDraggedCategoryIndex(index);
  };

  const handleCategoryDragEnd = () => {
    if (draggedCategoryIndex !== null) {
      saveCategories(categories);
      showSuccess('Category order updated');
    }
    setDraggedCategoryIndex(null);
  };

  // Subcategory drag and drop
  const handleSubcategoryDragStart = (categoryId: string, subIndex: number) => {
    setDraggedCategoryId(categoryId);
    setDraggedSubcategoryIndex(subIndex);
  };

  const handleSubcategoryDragOver = (e: React.DragEvent, categoryId: string, subIndex: number) => {
    e.preventDefault();
    if (draggedSubcategoryIndex === null || draggedCategoryId !== categoryId || draggedSubcategoryIndex === subIndex) return;
    
    const updated = categories.map(cat => {
      if (cat.id !== categoryId) return cat;
      
      const subs = [...cat.subcategories];
      const [draggedItem] = subs.splice(draggedSubcategoryIndex, 1);
      subs.splice(subIndex, 0, draggedItem);
      
      return { ...cat, subcategories: subs };
    });
    
    setCategories(updated);
    setDraggedSubcategoryIndex(subIndex);
  };

  const handleSubcategoryDragEnd = () => {
    if (draggedSubcategoryIndex !== null) {
      saveCategories(categories);
      showSuccess('Subcategory order updated');
    }
    setDraggedSubcategoryIndex(null);
    setDraggedCategoryId(null);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      showError('Category name is required');
      return;
    }

    const nextCode = String(categories.length + 1).padStart(2, '0');
    const newCategory: HierarchicalBudgetCategory = {
      id: `custom-${Date.now()}`,
      code: newCategoryCode.trim() || nextCode,
      name: newCategoryName.trim(),
      displayOrder: categories.length + 1,
      subcategories: [],
      isCustom: true,
    };

    const updated = [...categories, newCategory];
    saveCategories(updated);
    
    setNewCategoryName('');
    setNewCategoryCode('');
    setShowAddCategory(false);
    showSuccess('Category added');
  };

  const handleAddSubcategory = (categoryId: string) => {
    if (!newSubcategoryName.trim()) {
      showError('Subcategory name is required');
      return;
    }

    const updated = categories.map(cat => {
      if (cat.id !== categoryId) return cat;
      
      const newSub: BudgetSubcategory = {
        id: `sub-${Date.now()}`,
        name: newSubcategoryName.trim(),
      };
      
      return {
        ...cat,
        subcategories: [...cat.subcategories, newSub],
      };
    });

    saveCategories(updated);
    setNewSubcategoryName('');
    setAddingSubcategoryTo(null);
    showSuccess('Subcategory added');
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (!confirm('Delete this category and all its subcategories?')) return;
    
    const updated = categories.filter(cat => cat.id !== categoryId);
    saveCategories(updated);
    showSuccess('Category deleted');
  };

  const handleDeleteSubcategory = (categoryId: string, subcategoryId: string) => {
    if (!confirm('Delete this subcategory?')) return;
    
    const updated = categories.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        subcategories: cat.subcategories.filter(sub => sub.id !== subcategoryId),
      };
    });

    saveCategories(updated);
    showSuccess('Subcategory deleted');
  };

  const handleResetToDefaults = () => {
    if (!confirm('Reset to default budget structure? This will remove all customizations.')) return;
    
    localStorage.removeItem('hierarchicalBudgetCategories');
    setCategories(HIERARCHICAL_BUDGET_CATEGORIES);
    showSuccess('Reset to defaults');
  };

  const handleExport = () => {
    const json = JSON.stringify(categories, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'budget-structure.json';
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Budget structure exported');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          saveCategories(imported);
          showSuccess('Budget structure imported');
        } else {
          showError('Invalid file format');
        }
      } catch (error) {
        showError('Failed to import');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!user || !profile) return null;

  const grandTotal = calculateGrandTotal(categories);

  return (
    <div className="min-h-screen bg-taupe-50">
      <BuilderHeader
        title="Budget Structure"
        subtitle="Manage hierarchical budget categories"
        showBackButton
      />

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Instructions */}
        <Card className="mb-8 p-6 bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-900">
              <strong className="block mb-1">Hierarchical Budget Structure</strong>
              <p>Main categories contain subcategories. Subcategory totals automatically add up to the main category total. Drag to reorder both main categories and subcategories.</p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <Button onClick={() => setShowAddCategory(true)} size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            Export
          </Button>
          <label className="inline-block">
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            <span className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-button text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 cursor-pointer">
              Import
            </span>
          </label>
          <Button onClick={handleResetToDefaults} variant="outline" size="sm" className="ml-auto text-red-600 border-red-300 hover:bg-red-50">
            Reset to Defaults
          </Button>
        </div>

        {/* Add Category Modal */}
        {showAddCategory && (
          <Card className="mb-8 p-6 border-brass-300 bg-brass-50">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Add New Category</h3>
            <div className="flex gap-3 mb-4">
              <div className="w-32">
                <Input
                  label="Code (optional)"
                  value={newCategoryCode}
                  onChange={(e) => setNewCategoryCode(e.target.value)}
                  placeholder="22"
                  maxLength={3}
                />
              </div>
              <div className="flex-1">
                <Input
                  label="Category Name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Landscaping"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                Add Category
              </Button>
              <Button variant="outline" onClick={() => setShowAddCategory(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Grand Total */}
        <Card className="mb-8 p-6 bg-gradient-to-br from-brass-50 to-brass-100 border-2 border-brass-300">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-brass-800 mb-1">Grand Total</div>
              <div className="text-xs text-brass-600">Sum of all main categories</div>
            </div>
            <div className="text-3xl font-bold text-brass-900">
              ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </Card>

        {/* Categories List */}
        <div className="space-y-4">
          {categories.map((category, categoryIndex) => {
            const categoryTotal = calculateCategoryTotal(category);
            const isExpanded = expandedCategories.has(category.id);
            
            return (
              <div
                key={category.id}
                draggable
                onDragStart={() => handleCategoryDragStart(categoryIndex)}
                onDragOver={(e) => handleCategoryDragOver(e, categoryIndex)}
                onDragEnd={handleCategoryDragEnd}
                className={draggedCategoryIndex === categoryIndex ? 'opacity-50' : ''}
              >
                <Card className="p-0">
                {/* Main Category Header */}
                <div className="p-4 bg-gradient-to-r from-brass-50 to-white border-b border-neutral-200">
                  <div className="flex items-center gap-3">
                    {/* Drag Handle */}
                    <svg className="w-5 h-5 text-neutral-400 flex-shrink-0 cursor-move" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>

                    {/* Expand/Collapse */}
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="flex-shrink-0"
                    >
                      <svg className={`w-5 h-5 text-neutral-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* Code */}
                    <div className="w-16 px-2 py-1 text-sm font-mono font-semibold text-brass-700 bg-brass-100 rounded text-center">
                      {category.code}
                    </div>

                    {/* Name */}
                    <div className="flex-1 text-base font-semibold text-neutral-900">
                      {category.name}
                      {category.isCustom && (
                        <span className="ml-2 text-xs text-brass-600 bg-brass-100 px-2 py-0.5 rounded-full">Custom</span>
                      )}
                    </div>

                    {/* Total */}
                    <div className="text-right">
                      <div className="text-xs text-neutral-500 mb-0.5">{category.subcategories.length} subcategories</div>
                      <div className="text-lg font-bold text-brass-700">
                        ${categoryTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    {/* Delete */}
                    {category.isCustom && (
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-button transition-colors"
                        title="Delete category"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Subcategories */}
                {isExpanded && (
                  <div className="p-4">
                    <div className="space-y-2">
                      {category.subcategories.map((subcategory, subIndex) => (
                        <div
                          key={subcategory.id}
                          draggable
                          onDragStart={() => handleSubcategoryDragStart(category.id, subIndex)}
                          onDragOver={(e) => handleSubcategoryDragOver(e, category.id, subIndex)}
                          onDragEnd={handleSubcategoryDragEnd}
                          className={`flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-button hover:shadow-sm transition-all ${
                            draggedCategoryId === category.id && draggedSubcategoryIndex === subIndex ? 'opacity-50' : ''
                          }`}
                        >
                          {/* Drag Handle */}
                          <svg className="w-4 h-4 text-neutral-300 flex-shrink-0 cursor-move" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>

                          {/* Bullet */}
                          <div className="w-2 h-2 bg-brass-400 rounded-full flex-shrink-0"></div>

                          {/* Name */}
                          <div className="flex-1 text-sm text-neutral-700">
                            {subcategory.name}
                          </div>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteSubcategory(category.id, subcategory.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete subcategory"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Subcategory */}
                    {addingSubcategoryTo === category.id ? (
                      <div className="mt-3 flex gap-2">
                        <Input
                          value={newSubcategoryName}
                          onChange={(e) => setNewSubcategoryName(e.target.value)}
                          placeholder="Subcategory name"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddSubcategory(category.id);
                            if (e.key === 'Escape') setAddingSubcategoryTo(null);
                          }}
                          autoFocus
                        />
                        <Button onClick={() => handleAddSubcategory(category.id)} size="sm">
                          Add
                        </Button>
                        <Button onClick={() => setAddingSubcategoryTo(null)} variant="outline" size="sm">
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingSubcategoryTo(category.id)}
                        className="mt-3 w-full py-2 border-2 border-dashed border-neutral-300 rounded-button text-sm text-neutral-600 hover:border-brass-400 hover:text-brass-700 hover:bg-brass-50 transition-colors"
                      >
                        + Add Subcategory
                      </button>
                    )}
                  </div>
                )}
              </Card>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
