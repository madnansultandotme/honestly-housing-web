'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import BuilderHeader from '@/components/navigation/BuilderHeader';
import ClientHeader from '@/components/navigation/ClientHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProjectTabs from '@/components/projects/ProjectTabs';
import { apiClient } from '@/lib/api/client';

interface Category {
  id: string;
  name: string;
  allowanceAmount?: number;
  allowanceType?: string;
}

interface SelectionItem {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  roomName?: string;
  quantity?: number;
  allowance?: number;
  actualCost?: number;
  difference?: number;
  purchased?: boolean;
  status?: string;
}

const formatCurrency = (value: number) =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export default function PurchasingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, profile } = useAuth();
  const { showError, showSuccess } = useNotification();
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<SelectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});
  const [costEdits, setCostEdits] = useState<Record<string, string>>({});

  const isBuilder = profile?.role === 'builder' || profile?.role === 'designer' || profile?.role === 'admin';
  const Header = isBuilder ? BuilderHeader : ClientHeader;

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (profile && profile.role === 'client') {
      router.push(`/projects/${id}`);
      return;
    }

    fetchData();
  }, [user, profile, id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const projectData = await apiClient.get(`/projects/${id}`);
      setProject(projectData);

      const categoryData = await apiClient.get(`/categories?projectId=${id}`);
      setCategories(Array.isArray(categoryData) ? categoryData : []);

      const itemsData = await apiClient.get(`/items?projectId=${id}`);
      const loadedItems = Array.isArray(itemsData) ? itemsData : [];
      setItems(loadedItems);
    } catch (error) {
      console.error('Failed to load purchasing list:', error);
      showError('Failed to load purchasing list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCostEdits((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        if (next[item.id] === undefined) {
          next[item.id] = item.actualCost !== undefined ? String(item.actualCost) : '';
        }
      });
      return next;
    });
  }, [items]);

  const purchasableItems = useMemo(
    () => items.filter((item) => item.status === 'approved' || item.status === 'installed'),
    [items]
  );

  const groupedByCategory = useMemo(() => {
    const grouped: Record<string, { category: Category; items: SelectionItem[] }> = {};

    purchasableItems.forEach((item) => {
      const category = categories.find((c) => c.id === item.categoryId) || {
        id: item.categoryId,
        name: item.categoryName || 'Uncategorized',
      };

      if (!grouped[category.id]) {
        grouped[category.id] = { category, items: [] };
      }

      grouped[category.id].items.push(item);
    });

    return grouped;
  }, [purchasableItems, categories]);

  const handleTogglePurchased = async (item: SelectionItem) => {
    try {
      setSavingIds((prev) => ({ ...prev, [item.id]: true }));
      const nextValue = !item.purchased;
      await apiClient.patch(`/items/${item.id}`, {
        projectId: id,
        purchased: nextValue,
      });
      setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, purchased: nextValue } : entry)));
    } catch (error) {
      console.error('Failed to update purchased status:', error);
      showError('Failed to update purchased status');
    } finally {
      setSavingIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleCostBlur = async (item: SelectionItem) => {
    const rawValue = costEdits[item.id] || '';
    const parsedValue = rawValue === '' ? 0 : Number(rawValue);
    const actualCost = Number.isNaN(parsedValue) ? 0 : parsedValue;
    const allowance = item.allowance || 0;

    try {
      setSavingIds((prev) => ({ ...prev, [item.id]: true }));
      await apiClient.patch(`/items/${item.id}`, {
        projectId: id,
        actualCost,
        difference: actualCost - allowance,
      });
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? { ...entry, actualCost, difference: actualCost - allowance }
            : entry
        )
      );
      showSuccess('Purchase amount updated');
    } catch (error) {
      console.error('Failed to update purchase amount:', error);
      showError('Failed to update purchase amount');
    } finally {
      setSavingIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-taupe-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading purchasing list...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-taupe-50 flex items-center justify-center">
        <div className="text-neutral-600">Project not found</div>
      </div>
    );
  }

  const categoryEntries = Object.values(groupedByCategory);

  return (
    <div className="min-h-screen bg-taupe-50">
      <Header
        title="Purchasing List"
        subtitle={project?.name || 'Project'}
        showBackButton
        actions={
          <Button variant="outline" size="sm" onClick={fetchData}>
            Refresh
          </Button>
        }
      />
      <ProjectTabs projectId={id} />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {categoryEntries.length === 0 ? (
          <Card>
            <div className="text-neutral-600">No approved selections yet.</div>
          </Card>
        ) : (
          <div className="space-y-6">
            {categoryEntries.map(({ category, items: categoryItems }) => {
              const totalCost = categoryItems.reduce((sum, item) => sum + (item.actualCost || 0), 0);
              const totalAllowance = categoryItems.reduce((sum, item) => sum + (item.allowance || 0), 0);
              const totalDifference = totalCost - totalAllowance;
              const categoryAllowance = category.allowanceAmount || 0;
              const categoryAllowanceLabel =
                category.allowanceType === 'perSqFt' ? `${formatCurrency(categoryAllowance)}/sq ft` : formatCurrency(categoryAllowance);

              return (
                <Card key={category.id}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-neutral-900">{category.name}</h2>
                      <div className="text-sm text-neutral-600">
                        Category allowance: {categoryAllowance ? categoryAllowanceLabel : 'Not set'}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="text-neutral-600">
                        Total allowance: <span className="font-medium text-neutral-900">{formatCurrency(totalAllowance)}</span>
                      </div>
                      <div className="text-neutral-600">
                        Total spend: <span className="font-medium text-neutral-900">{formatCurrency(totalCost)}</span>
                      </div>
                      <div className={totalDifference >= 0 ? 'text-red-600' : 'text-green-700'}>
                        Difference: <span className="font-medium">{formatCurrency(totalDifference)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-neutral-600">
                        <tr className="border-b border-neutral-200">
                          <th className="py-2 pr-4">Item</th>
                          <th className="py-2 pr-4">Room</th>
                          <th className="py-2 pr-4">Qty</th>
                          <th className="py-2 pr-4">Allowance</th>
                          <th className="py-2 pr-4">Purchase Amount</th>
                          <th className="py-2 pr-4">Purchased</th>
                        </tr>
                      </thead>
                      <tbody className="text-neutral-900">
                        {categoryItems.map((item) => (
                          <tr key={item.id} className="border-b border-neutral-100">
                            <td className="py-3 pr-4">
                              <div className="font-medium">{item.name}</div>
                            </td>
                            <td className="py-3 pr-4 text-neutral-600">
                              {item.roomName || '—'}
                            </td>
                            <td className="py-3 pr-4 text-neutral-600">{item.quantity || 1}</td>
                            <td className="py-3 pr-4 text-neutral-600">
                              {formatCurrency(item.allowance || 0)}
                            </td>
                            <td className="py-3 pr-4">
                              <input
                                type="number"
                                min="0"
                                value={costEdits[item.id] ?? ''}
                                onChange={(e) =>
                                  setCostEdits((prev) => ({ ...prev, [item.id]: e.target.value }))
                                }
                                onBlur={() => handleCostBlur(item)}
                                disabled={savingIds[item.id]}
                                className="w-32 px-2 py-1 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500"
                              />
                            </td>
                            <td className="py-3 pr-4">
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={!!item.purchased}
                                  onChange={() => handleTogglePurchased(item)}
                                  disabled={savingIds[item.id]}
                                  className="w-4 h-4 text-brass-600 border-neutral-300 rounded focus:ring-brass-500"
                                />
                                <span className="text-neutral-600">{item.purchased ? 'Yes' : 'No'}</span>
                              </label>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
