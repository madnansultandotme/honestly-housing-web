'use client';

import { use, useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import StatusBadge from '@/components/ui/StatusBadge';
import BuilderHeader from '@/components/navigation/BuilderHeader';
import ClientHeader from '@/components/navigation/ClientHeader';
import BulkUploadModal from '@/components/selections/BulkUploadModal';
import AddSelectionModal from '@/components/selections/AddSelectionModal';
import EditSelectionModal from '@/components/selections/EditSelectionModal';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';

export default function SelectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, profile } = useAuth();
  const { showError } = useNotification();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [project, setProject] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selections, setSelections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showAddSelection, setShowAddSelection] = useState(false);
  const [showEditSelection, setShowEditSelection] = useState(false);
  const [selectedSelection, setSelectedSelection] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

      // Fetch selections (items)
      const selData = await apiClient.get(`/api/items?projectId=${id}`);
      setSelections(Array.isArray(selData.items) ? selData.items : []);
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
      showError('Failed to export materials list');
    } finally {
      setExporting(false);
    }
  };

  const handleEditSelection = (selection: any) => {
    setSelectedSelection(selection);
    setShowEditSelection(true);
  };

  const handleDeleteSelection = async (selectionId: string) => {
    if (!confirm('Are you sure you want to delete this selection? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(selectionId);
      
      const response = await fetch(`/api/items?projectId=${id}&itemId=${selectionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete selection');
      }

      showError('Selection deleted successfully');
      fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
      showError('Failed to delete selection');
    } finally {
      setDeletingId(null);
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
        actions={
          isBuilder && (
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddSelection(true)}
                size="sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Selection
              </Button>
              <Button
                onClick={() => setShowBulkUpload(true)}
                variant="outline"
                size="sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Bulk Upload CSV
              </Button>
            </div>
          )
        }
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
                <div key={selection.id} className="bg-white border border-neutral-200 rounded-button p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between">
                    <Link href={`/projects/${id}/selections/${selection.id}`} className="flex-1">
                      <div>
                        <div className="font-medium text-neutral-900">{selection.name}</div>
                        <div className="text-sm text-neutral-600">{selection.categoryName}</div>
                        {selection.quantity && selection.quantity > 1 && (
                          <div className="text-xs text-neutral-500 mt-1">Qty: {selection.quantity}</div>
                        )}
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 ml-3">
                      <StatusBadge status={selection.status} />
                      {isBuilder && (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleEditSelection(selection);
                            }}
                            className="p-2 text-brass-600 hover:bg-brass-50 rounded-button transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteSelection(selection.id);
                            }}
                            disabled={deletingId === selection.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-button transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === selection.id ? (
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
                .filter(s => s.status === 'awaitingClientApproval')
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
              {selections.filter(s => s.status === 'awaitingClientApproval').length === 0 && (
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

      {/* Add Selection Modal */}
      {showAddSelection && (
        <AddSelectionModal
          projectId={id}
          userId={user?.uid || ''}
          onClose={() => setShowAddSelection(false)}
          onSuccess={fetchData}
        />
      )}

      {/* Edit Selection Modal */}
      {showEditSelection && selectedSelection && (
        <EditSelectionModal
          selection={selectedSelection}
          projectId={id}
          onClose={() => {
            setShowEditSelection(false);
            setSelectedSelection(null);
          }}
          onSuccess={fetchData}
        />
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadModal
          projectId={id}
          userId={user?.uid || ''}
          onClose={() => setShowBulkUpload(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
