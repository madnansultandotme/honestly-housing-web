'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface SubCategorySelectProps {
  builderOrgId: string;
  categoryId: string;
  categoryName: string;
  value: string;
  onChange: (subCategoryId: string, subCategoryName: string) => void;
  disabled?: boolean;
}

interface SubCategory {
  id: string;
  name: string;
  parentCategoryId: string;
}

export default function SubCategorySelect({
  builderOrgId,
  categoryId,
  categoryName,
  value,
  onChange,
  disabled = false,
}: SubCategorySelectProps) {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!builderOrgId || !categoryId) {
      setSubCategories([]);
      return;
    }

    loadSubCategories();
  }, [builderOrgId, categoryId]);

  const loadSubCategories = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(
        `/subCategories?builderOrgId=${builderOrgId}&categoryId=${categoryId}`
      );
      setSubCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load sub-categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubCategory = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    try {
      setAdding(true);
      const response = await apiClient.post('/subCategories', {
        builderOrgId,
        parentCategoryId: categoryId,
        parentCategoryName: categoryName,
        name: trimmed,
        displayOrder: subCategories.length,
      });

      const newSub = { id: response.id || response.subCategoryId, name: trimmed, parentCategoryId: categoryId };
      setSubCategories(prev => [...prev, newSub]);
      onChange(newSub.id, newSub.name);
      setNewName('');
      setShowAdd(false);
    } catch (err) {
      console.error('Failed to add sub-category:', err);
    } finally {
      setAdding(false);
    }
  };

  if (!categoryId) return null;

  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Sub-Category
      </label>

      {loading ? (
        <div className="py-2">
          <LoadingSpinner size="sm" />
        </div>
      ) : (
        <>
          <select
            value={value}
            onChange={(e) => {
              const selected = subCategories.find(s => s.id === e.target.value);
              onChange(e.target.value, selected?.name || '');
            }}
            disabled={disabled}
            className="w-full px-4 py-3 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 bg-white text-neutral-900"
          >
            <option value="">None</option>
            {subCategories.map(sub => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>

          {!showAdd && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="mt-2 text-sm text-brass-600 hover:text-brass-700 font-medium"
            >
              + Add new sub-category
            </button>
          )}

          {showAdd && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Sub-category name"
                className="flex-1 px-3 py-2 border border-neutral-300 rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-brass-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubCategory();
                  }
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddSubCategory}
                disabled={adding || !newName.trim()}
                className="px-3 py-2 bg-brass-600 text-white rounded-button text-sm font-medium hover:bg-brass-700 disabled:opacity-50"
              >
                {adding ? '...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setNewName('');
                }}
                className="px-3 py-2 text-neutral-500 text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
