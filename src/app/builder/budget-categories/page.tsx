'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import BuilderHeader from '@/components/navigation/BuilderHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getDefaultBudgetCategories, type BudgetCategory } from '@/lib/constants/budget-categories';

export default function BudgetCategoriesPage() {
  const { user, profile } = useAuth();
  const { showSuccess, showError } = useNotification();
  const router = useRouter();
  
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [newCategoryCode, setNewCategoryCode] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if builder/designer/admin
    if (profile?.role !== 'builder' && profile?.role !== 'designer' && profile?.role !== 'admin') {
      router.push('/client');
      return;
    }

    loadCategories();
  }, [user, profile]);

  const loadCategories = () => {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem('customBudgetCategories');
    if (saved) {
      try {
        setCategories(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse saved categories:', error);
        setCategories(getDefaultBudgetCategories());
      }
    } else {
      setCategories(getDefaultBudgetCategories());
    }
  };

  const saveCategories = (updatedCategories: BudgetCategory[]) => {
    localStorage.setItem('customBudgetCategories', JSON.stringify(updatedCategories));
    setCategories(updatedCategories);
  };

  const handleAddCategory = () => {
    if (!newCategoryCode.trim() || !newCategoryName.trim()) {
      showError('Code and name are required');
      return;
    }

    // Check for duplicate code
    if (categories.some(cat => cat.code === newCategoryCode)) {
      showError('Category code already exists');
      return;
    }

    const newCategory: BudgetCategory = {
      code: newCategoryCode.trim(),
      name: newCategoryName.trim(),
      description: '',
      isOptional: false,
      isCustom: true,
    };

    const updated = [...categories, newCategory];
    saveCategories(updated);
    
    setNewCategoryCode('');
    setNewCategoryName('');
    showSuccess('Category added successfully');
  };

  const handleStartEdit = (category: BudgetCategory) => {
    setEditingId(category.code);
    setEditCode(category.code);
    setEditName(category.name);
  };

  const handleSaveEdit = () => {
    if (!editCode.trim() || !editName.trim()) {
      showError('Code and name are required');
      return;
    }

    const updated = categories.map(cat => 
      cat.code === editingId 
        ? { ...cat, code: editCode.trim(), name: editName.trim() }
        : cat
    );
    
    saveCategories(updated);
    setEditingId(null);
    setEditCode('');
    setEditName('');
    showSuccess('Category updated successfully');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditCode('');
    setEditName('');
  };

  const handleDelete = (code: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    const updated = categories.filter(cat => cat.code !== code);
    saveCategories(updated);
    showSuccess('Category deleted successfully');
  };

  const handleToggleOptional = (code: string) => {
    const updated = categories.map(cat =>
      cat.code === code ? { ...cat, isOptional: !cat.isOptional } : cat
    );
    saveCategories(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) return;
    
    const updated = [...categories];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    
    setCategories(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      saveCategories(categories);
      showSuccess('Order updated');
    }
    setDraggedIndex(null);
  };

  const handleResetToDefaults = () => {
    if (!confirm('Reset to default categories? This will remove all custom categories and ordering.')) return;
    
    localStorage.removeItem('customBudgetCategories');
    setCategories(getDefaultBudgetCategories());
    showSuccess('Reset to defaults');
  };

  const handleExport = () => {
    const json = JSON.stringify(categories, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'budget-categories.json';
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Categories exported');
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
          showSuccess('Categories imported successfully');
        } else {
          showError('Invalid file format');
        }
      } catch (error) {
        showError('Failed to import categories');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    e.target.value = '';
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-taupe-50">
      <BuilderHeader
        title="Budget Categories"
        subtitle="Manage construction budget categories"
        showBackButton
      />

      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Instructions */}
        <Card className="mb-8 p-6 bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-900">
              <strong className="block mb-1">Customize Your Budget Categories</strong>
              <p>Add custom categories, reorder by dragging, mark as optional, or reset to defaults. These categories will be used when creating new projects.</p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <Button onClick={handleExport} variant="outline" size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </Button>
          <label className="inline-block">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <span className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-button text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 cursor-pointer">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
            </span>
          </label>
          <Button onClick={handleResetToDefaults} variant="outline" size="sm" className="ml-auto text-red-600 border-red-300 hover:bg-red-50">
            Reset to Defaults
          </Button>
        </div>

        {/* Add New Category */}
        <Card className="mb-8 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Add Custom Category</h3>
          <div className="flex gap-3">
            <div className="w-32">
              <Input
                label="Code"
                value={newCategoryCode}
                onChange={(e) => setNewCategoryCode(e.target.value)}
                placeholder="e.g., 29"
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
            <div className="flex items-end">
              <Button
                onClick={handleAddCategory}
                disabled={!newCategoryCode.trim() || !newCategoryName.trim()}
              >
                Add Category
              </Button>
            </div>
          </div>
        </Card>

        {/* Categories List */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Budget Categories ({categories.length})
          </h3>
          <p className="text-sm text-neutral-600 mb-4">
            Drag to reorder • Click code/name to edit • Toggle optional status
          </p>

          <div className="space-y-2">
            {categories.map((category, index) => (
              <div
                key={category.code}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-4 bg-white border rounded-button hover:shadow-sm transition-all cursor-move ${
                  draggedIndex === index ? 'opacity-50 border-brass-500' : 'border-neutral-200'
                }`}
              >
                {/* Drag Handle */}
                <svg className="w-5 h-5 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>

                {/* Code */}
                {editingId === category.code ? (
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    maxLength={3}
                    className="w-20 px-2 py-1 border border-brass-500 rounded text-sm font-mono font-semibold text-brass-700 focus:outline-none focus:ring-2 focus:ring-brass-500"
                  />
                ) : (
                  <div
                    onClick={() => !category.isCustom ? null : handleStartEdit(category)}
                    className={`w-20 px-2 py-1 text-sm font-mono font-semibold text-brass-700 bg-brass-50 rounded text-center ${
                      category.isCustom ? 'cursor-pointer hover:bg-brass-100' : 'cursor-default'
                    }`}
                  >
                    {category.code}
                  </div>
                )}

                {/* Name */}
                {editingId === category.code ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 border border-brass-500 rounded text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brass-500"
                  />
                ) : (
                  <div
                    onClick={() => category.isCustom ? handleStartEdit(category) : null}
                    className={`flex-1 text-sm font-medium text-neutral-900 ${
                      category.isCustom ? 'cursor-pointer hover:text-brass-700' : 'cursor-default'
                    }`}
                  >
                    {category.name}
                    {category.isCustom && (
                      <span className="ml-2 text-xs text-brass-600 bg-brass-50 px-2 py-0.5 rounded-full">Custom</span>
                    )}
                  </div>
                )}

                {/* Optional Toggle */}
                <button
                  onClick={() => handleToggleOptional(category.code)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    category.isOptional
                      ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      : 'bg-brass-100 text-brass-700 hover:bg-brass-200'
                  }`}
                >
                  {category.isOptional ? 'Optional' : 'Required'}
                </button>

                {/* Edit/Save/Cancel Buttons */}
                {editingId === category.code ? (
                  <div className="flex gap-1">
                    <button
                      onClick={handleSaveEdit}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-button transition-colors"
                      title="Save"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-button transition-colors"
                      title="Cancel"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : category.isCustom ? (
                  <button
                    onClick={() => handleDelete(category.code)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-button transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                ) : (
                  <div className="w-8"></div> // Spacer for alignment
                )}
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
