'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import CategoryChecklist, { CategoryItem } from '@/components/ui/CategoryChecklist';
import { apiClient } from '@/lib/api/client';
import { isSelectionCompleted } from '@/lib/selections/status';

export default function SelectionCategoriesPage() {
  const { user } = useAuth();
  const { showError } = useNotification();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [projectName, setProjectName] = useState('');
  const [exporting, setExporting] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, projectId]);

  const loadData = async () => {
    try {
      setLoading(true);

      if (user) {
        const { doc: docRef, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/config');
        const userDoc = await getDoc(docRef(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      }

      // Load project
      const project = await apiClient.get(`/api/projects/${projectId}`);
      setProjectName(project.name || 'Project');

      // Load categories with selection counts
      const categoriesData = await apiClient.get(`/api/categories?projectId=${projectId}`);
      
      // Load selections to count completed items per category
      const selections = await apiClient.get(`/api/selections?projectId=${projectId}`);

      // Build category items with counts
      const categoryItems: CategoryItem[] = categoriesData.map((cat: any) => {
        const categorySelections = selections.filter((s: any) => s.categoryId === cat.id);
        const completedCount = categorySelections.filter((s: any) => isSelectionCompleted(s.status)).length;

        return {
          id: cat.id,
          name: cat.name,
          required: cat.required || false,
          completedCount,
          totalCount: categorySelections.length,
        };
      });

      setCategories(categoryItems);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await fetch(`/api/export/materials?projectId=${projectId}`);

      if (!response.ok) {
        throw new Error('Failed to export materials');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `materials-list-${projectId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
      showError('Failed to export materials list');
    } finally {
      setExporting(false);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/projects/${projectId}/selections?category=${categoryId}`);
  };

  const totalCompleted = categories.reduce((sum, cat) => sum + cat.completedCount, 0);
  const totalItems = categories.reduce((sum, cat) => sum + cat.totalCount, 0);
  const overallProgress = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
  const isBuilder = userRole === 'builder' || userRole === 'designer' || userRole === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen bg-taupe-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-taupe-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-neutral-600 hover:text-neutral-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-display font-bold text-neutral-900">
                Selection Categories
              </h1>
            </div>
            {isBuilder && (
              <Button
                onClick={handleExportCSV}
                disabled={exporting || totalCompleted === 0}
                variant="outline"
                size="sm"
              >
                {exporting ? 'Exporting...' : 'Export Materials CSV'}
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Overall Progress */}
        <Card className="mb-8">
          <div className="mb-4">
            <h2 className="text-2xl font-display font-bold text-neutral-900 mb-1">
              {projectName}
            </h2>
            <p className="text-neutral-600">
              Track your selection progress by category
            </p>
          </div>

          <ProgressBar
            completed={totalCompleted}
            total={totalItems}
            showLabel
          />
        </Card>

        {/* Categories List */}
        <div className="space-y-3">
          {categories.map((category) => {
            const percent = category.totalCount > 0
              ? Math.round((category.completedCount / category.totalCount) * 100)
              : 0;
            const isComplete = category.completedCount === category.totalCount && category.totalCount > 0;

            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="w-full"
              >
                <Card hover className="text-left">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                        {category.name}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {category.completedCount} of {category.totalCount} completed
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="ml-4">
                      {isComplete ? (
                        <span className="text-xs bg-green-100 text-green-800 px-3 py-1.5 rounded-full font-medium">
                          Complete
                        </span>
                      ) : category.completedCount > 0 ? (
                        <span className="text-xs bg-brass-100 text-brass-800 px-3 py-1.5 rounded-full font-medium">
                          In Progress
                        </span>
                      ) : (
                        <span className="text-xs bg-neutral-100 text-neutral-600 px-3 py-1.5 rounded-full font-medium">
                          Not Started
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {category.totalCount > 0 && (
                    <div className="mt-3">
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-brass-500 to-brass-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="text-xs text-neutral-600 mt-1 text-right">
                        {percent}%
                      </div>
                    </div>
                  )}
                </Card>
              </button>
            );
          })}

          {categories.length === 0 && (
            <Card>
              <div className="text-center py-8">
                <p className="text-neutral-600">No categories found for this project.</p>
                <p className="text-sm text-neutral-500 mt-2">
                  The builder needs to set up categories for this project.
                </p>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
