'use client';

import { use, useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import StatusBadge from '@/components/ui/StatusBadge';
import BuilderHeader from '@/components/navigation/BuilderHeader';
import ClientHeader from '@/components/navigation/ClientHeader';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';

export default function SelectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, profile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [project, setProject] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selections, setSelections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [user, id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch project
      const projectData = await apiClient.get(`/api/projects/${id}`);
      setProject(projectData);

      // Fetch categories
      const catData = await apiClient.get(`/api/categories?projectId=${id}`);
      setCategories(Array.isArray(catData) ? catData : []);

      // Fetch selections
      const selData = await apiClient.get(`/api/selections?projectId=${id}`);
      setSelections(Array.isArray(selData) ? selData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load selections. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await fetch(`/api/export/materials?projectId=${id}`);

      if (!response.ok) {
        throw new Error('Failed to export materials');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `materials-list-${id}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export materials list');
    } finally {
      setExporting(false);
    }
  };

  const getSelectionsByCategory = (categoryId: string) => {
    return selections.filter(s => s.categoryId === categoryId);
  };

  const getCompletedCount = () => {
    return selections.filter(s => s.status === 'approved' || s.status === 'installed').length;
  };

  const getDueThisWeek = () => {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return selections.filter(s => {
      if (!s.dueDate) return false;
      const dueTime = new Date(s.dueDate).getTime();
      return dueTime > now && dueTime < now + oneWeek;
    });
  };

  // Compute derived values BEFORE any conditional returns
  const completedCount = getCompletedCount();
  const totalCount = selections.length;
  const dueThisWeek = getDueThisWeek();
  const isBuilder = profile?.role === 'builder' || profile?.role === 'designer' || profile?.role === 'admin';
  const Header = isBuilder ? BuilderHeader : ClientHeader;
  const categoryId = searchParams.get('category');
  const filteredSelections = useMemo(() => {
    if (!categoryId) return selections;
    return selections.filter((selection) => selection.categoryId === categoryId);
  }, [categoryId, selections]);
  const filteredCategory = categoryId
    ? categories.find((category) => category.id === categoryId)
    : null;
  const filteredCompleted = filteredSelections.filter(
    (selection) => selection.status === 'approved' || selection.status === 'installed'
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-taupe-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading selections...</div>
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

  return (
    <div className="min-h-screen bg-taupe-50">
      <Header
        title="Selections"
        subtitle={project?.name || 'Project Selections'}
        showBackButton
      />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-button text-red-700">
            {error}
          </div>
        )}

        {/* Progress Overview */}
        <Card className="mb-8">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Overall Progress</h3>
          <ProgressBar
            completed={categoryId ? filteredCompleted : completedCount}
            total={categoryId ? filteredSelections.length : totalCount}
          />
        </Card>

        {/* Due This Week */}
        {(categoryId ? filteredSelections.filter((selection) => dueThisWeek.includes(selection)) : dueThisWeek).length > 0 && (
          <Card className="mb-8">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Due This Week</h3>
            <div className="space-y-3">
              {(categoryId
                ? filteredSelections.filter((selection) => dueThisWeek.includes(selection))
                : dueThisWeek
              ).map((selection) => (
                <Link
                  key={selection.id}
                  href={`/projects/${id}/selections/${selection.id}`}
                  className="block"
                >
                  <div className="bg-taupe-50 rounded-button p-4 hover:bg-taupe-100 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-neutral-900">{selection.name}</div>
                        <div className="text-sm text-neutral-600">{selection.categoryName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-brass-700">
                          {new Date(selection.dueDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <StatusBadge status={selection.status} className="mt-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {categoryId && (
          <Card className="mb-8">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              {filteredCategory?.name || 'Category'} Items
            </h3>
            <div className="space-y-3">
              {filteredSelections.map((selection) => (
                <Link
                  key={selection.id}
                  href={`/projects/${id}/selections/${selection.id}`}
                  className="block"
                >
                  <div className="bg-white border border-neutral-200 rounded-button p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-neutral-900">{selection.name}</div>
                        <div className="text-sm text-neutral-600">{selection.categoryName}</div>
                      </div>
                      <StatusBadge status={selection.status} className="ml-3" />
                    </div>
                  </div>
                </Link>
              ))}
              {filteredSelections.length === 0 && (
                <div className="text-sm text-neutral-500">No selections yet for this category.</div>
              )}
            </div>
          </Card>
        )}

        {/* Categories */}
        {!categoryId && (
          <div className="space-y-6">
            <h3 className="text-xl font-display font-semibold text-neutral-900">
              Selection Categories
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => {
                const categorySelections = getSelectionsByCategory(category.id);
                const completed = categorySelections.filter(s => 
                  s.status === 'approved' || s.status === 'installed'
                ).length;
                
                return (
                  <Link key={category.id} href={`/projects/${id}/selections?category=${category.id}`}>
                    <Card hover className="h-full">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-lg font-semibold text-neutral-900">
                          {category.name}
                        </h4>
                        {category.required && (
                          <span className="text-xs bg-brass-100 text-brass-800 px-2 py-1 rounded-full">
                            Required
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-neutral-600 mb-4">
                        {completed} of {categorySelections.length} completed
                      </div>
                      
                      <div className="w-full bg-neutral-100 rounded-full h-2">
                        <div
                          className="bg-brass-600 h-2 rounded-full transition-all"
                          style={{ 
                            width: `${categorySelections.length > 0 ? (completed / categorySelections.length) * 100 : 0}%` 
                          }}
                        />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Sections */}
        {!categoryId && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h4 className="font-semibold text-neutral-900 mb-4">Awaiting Approval</h4>
            <div className="space-y-2">
              {selections
                .filter(s => s.status === 'awaiting_approval')
                .map(selection => (
                  <Link
                    key={selection.id}
                    href={`/projects/${id}/selections/${selection.id}`}
                    className="block p-3 bg-taupe-50 rounded-button hover:bg-taupe-100 transition-colors"
                  >
                    <div className="font-medium text-neutral-900">{selection.name}</div>
                    <div className="text-sm text-neutral-600">{selection.categoryName}</div>
                  </Link>
                ))}
              {selections.filter(s => s.status === 'awaiting_approval').length === 0 && (
                <p className="text-neutral-500 text-sm">No items awaiting approval</p>
              )}
            </div>
          </Card>

          <Card>
            <h4 className="font-semibold text-neutral-900 mb-4">Recently Approved</h4>
            <div className="space-y-2">
              {selections
                .filter(s => s.status === 'approved')
                .slice(0, 5)
                .map(selection => (
                  <Link
                    key={selection.id}
                    href={`/projects/${id}/selections/${selection.id}`}
                    className="block p-3 bg-taupe-50 rounded-button hover:bg-taupe-100 transition-colors"
                  >
                    <div className="font-medium text-neutral-900">{selection.name}</div>
                    <div className="text-sm text-neutral-600">{selection.categoryName}</div>
                  </Link>
                ))}
              {selections.filter(s => s.status === 'approved').length === 0 && (
                <p className="text-neutral-500 text-sm">No approved items yet</p>
              )}
            </div>
          </Card>
          </div>
        )}
      </main>
    </div>
  );
}
