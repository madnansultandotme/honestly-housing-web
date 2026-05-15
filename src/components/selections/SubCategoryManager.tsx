'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';

interface SubCategoryManagerProps {
  builderOrgId: string;
}

interface SubCategory {
  id: string;
  name: string;
  parentCategoryId: string;
  parentCategoryName: string;
}

const PARENT_CATEGORIES = [
  'Flooring', 'Lighting', 'Plumbing', 'Paint', 'Tile',
  'Countertops', 'Hardware', 'Appliances', 'Cabinetry',
];

export default function SubCategoryManager({ builderOrgId }: SubCategoryManagerProps) {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParent, setSelectedParent] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadAllSubCategories();
  }, [builderOrgId]);

  const loadAllSubCategories = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(`/subCategories?builderOrgId=${builderOrgId}`);
      setSubCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load sub-categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed || !selectedParent) return;

    try {
      setAdding(true);
      await apiClient.post('/subCategories', {
        builderOrgId,
        parentCategoryId: selectedParent.toLowerCase(),
        parentCategoryName: selectedParent,
        name: trimmed,
        displayOrder: subCategories.filter(s => s.parentCategoryName === selectedParent).length,
      });
      setNewName('');
      await loadAllSubCategories();
    } catch (err) {
      console.error('Failed to add sub-category:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sub-category?')) return;
    try {
      setDeletingId(id);
      await apiClient.delete(`/subCategories/${id}?builderOrgId=${builderOrgId}`);
      await loadAllSubCategories();
    } catch (err) {
      console.error('Failed to delete sub-category:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const groupedSubCategories = selectedParent
    ? subCategories.filter(s => s.parentCategoryName === selectedParent)
    : subCategories;

  const groupedByParent: Record<string, SubCategory[]> = {};
  subCategories.forEach(sub => {
    const parent = sub.parentCategoryName || 'Other';
    if (!groupedByParent[parent]) groupedByParent[parent] = [];
    groupedByParent[parent].push(sub);
  });

  if (loading) {
    return (
      <Card>
        <div className="py-8 flex justify-center">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">Sub-Category Manager</h3>
      <p className="text-sm text-neutral-600 mb-6">
        Add sub-categories to organize selections within each category. These are shared across all your projects.
      </p>

      {/* Add Form */}
      <div className="bg-taupe-50 rounded-card p-4 mb-6">
        <h4 className="text-sm font-medium text-neutral-700 mb-3">Add Sub-Category</h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedParent}
            onChange={(e) => setSelectedParent(e.target.value)}
            className="px-4 py-3 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 bg-white text-neutral-900"
          >
            <option value="">Select parent category...</option>
            {PARENT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Sub-category name"
            className="flex-1 px-4 py-3 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Button
            onClick={handleAdd}
            disabled={adding || !newName.trim() || !selectedParent}
            size="sm"
          >
            {adding ? 'Adding...' : 'Add'}
          </Button>
        </div>
      </div>

      {/* Sub-Categories List */}
      {Object.keys(groupedByParent).length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          No sub-categories defined yet. Add some above to organize your selections.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByParent).map(([parent, subs]) => (
            <div key={parent}>
              <h4 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-2">
                {parent}
              </h4>
              <div className="space-y-2">
                {subs.map(sub => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between bg-white border border-neutral-200 rounded-button px-4 py-3"
                  >
                    <span className="text-neutral-900">{sub.name}</span>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      disabled={deletingId === sub.id}
                      className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
                    >
                      {deletingId === sub.id ? '...' : 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
