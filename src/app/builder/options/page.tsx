'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import OptionUploadForm, { OptionFormData } from '@/components/builder/OptionUploadForm';
import CSVUploadModal from '@/components/builder/CSVUploadModal';
import { LoadingTable } from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/lib/api/client';

interface Option {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  price: number;
  categoryId: string;
  tier?: 'good' | 'better' | 'best';
}

interface Category {
  id: string;
  name: string;
}

export default function BuilderOptionsPage() {
  const { user, profile } = useAuth();
  const { confirm, showError } = useNotification();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      const builderOrgId = profile?.builderOrgId || user?.uid;

      // Use default categories for the options library
      const defaultCategories = [
        { id: 'flooring', name: 'Flooring' },
        { id: 'lighting', name: 'Lighting' },
        { id: 'plumbing', name: 'Plumbing' },
        { id: 'paint', name: 'Paint' },
        { id: 'tile', name: 'Tile' },
        { id: 'countertops', name: 'Countertops' },
        { id: 'hardware', name: 'Hardware' },
        { id: 'appliances', name: 'Appliances' },
        { id: 'cabinetry', name: 'Cabinetry' },
      ];
      setCategories(defaultCategories);

      // Load options
      const optionsData = await apiClient.get(`/api/options?builderOrgId=${builderOrgId}`);
      setOptions(optionsData);
    } catch (err) {
      console.error('Failed to load options:', err);
      setError('Failed to load options');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = async (data: OptionFormData) => {
    try {
      const builderOrgId = profile?.builderOrgId || user?.uid;
      const newOption = await apiClient.post('/api/options', {
        ...data,
        name: data.title,
        builderOrgId,
      });

      setOptions((prev) => [newOption, ...prev]);
      setShowUploadForm(false);
    } catch (err) {
      console.error('Failed to add option:', err);
      throw err;
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this option? This action cannot be undone.',
      'Delete Option'
    );
    
    if (!confirmed) return;

    try {
      const builderOrgId = profile?.builderOrgId || user?.uid;
      await apiClient.delete(`/api/options/${optionId}?builderOrgId=${builderOrgId}`);
      setOptions((prev) => prev.filter((opt) => opt.id !== optionId));
    } catch (err) {
      console.error('Failed to delete option:', err);
      showError('Failed to delete option');
    }
  };

  const filteredOptions =
    selectedCategory === 'all'
      ? options
      : options.filter((opt) => opt.categoryId === selectedCategory);

  const getTierBadgeColor = (tier?: string) => {
    switch (tier) {
      case 'good':
        return 'bg-neutral-100 text-neutral-700';
      case 'better':
        return 'bg-brass-100 text-brass-700';
      case 'best':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-neutral-100 text-neutral-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-taupe-50">
        <nav className="bg-white shadow-sm border-b border-neutral-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/builder')}
                  className="text-neutral-600 hover:text-neutral-900"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-xl font-display font-bold text-neutral-900">
                  Options Library
                </h1>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <LoadingTable rows={10} columns={5} />
        </main>
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
                onClick={() => router.push('/builder')}
                className="text-neutral-600 hover:text-neutral-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-display font-bold text-neutral-900">
                Options Library
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowCSVUpload(true)}
                variant="outline"
                size="sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                CSV Upload
              </Button>
              <Button onClick={() => setShowUploadForm(true)} size="sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Option
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-button text-red-700">
            {error}
          </div>
        )}

        {/* Upload Form Modal */}
        {showUploadForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-neutral-900">
                  Add New Option
                </h2>
                <button
                  onClick={() => setShowUploadForm(false)}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                  aria-label="Close dialog"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <OptionUploadForm
                categories={categories}
                onSubmit={handleAddOption}
                onCancel={() => setShowUploadForm(false)}
              />
            </div>
          </div>
        )}

        {/* CSV Upload Modal */}
        {showCSVUpload && (
          <CSVUploadModal
            builderOrgId={profile?.builderOrgId || user?.uid || ''}
            onSuccess={loadData}
            onClose={() => setShowCSVUpload(false)}
          />
        )}

        <Card className="mb-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Coming soon</h3>
              <p className="text-sm text-neutral-600 mt-1">
                These builder tools are queued for implementation once integrations are approved.
              </p>
              <div className="mt-3 text-sm text-neutral-700">
                Mood board generation.
              </div>
            </div>
            <div className="text-xs uppercase tracking-wide text-neutral-500">Roadmap</div>
          </div>
        </Card>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`
                px-4 py-2 rounded-button font-medium whitespace-nowrap transition-all
                ${
                  selectedCategory === 'all'
                    ? 'bg-brass-600 text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-50'
                }
              `}
            >
              All Categories ({options.length})
            </button>
            {categories.map((cat) => {
              const count = options.filter((opt) => opt.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`
                    px-4 py-2 rounded-button font-medium whitespace-nowrap transition-all
                    ${
                      selectedCategory === cat.id
                        ? 'bg-brass-600 text-white'
                        : 'bg-white text-neutral-700 hover:bg-neutral-50'
                    }
                  `}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredOptions.map((option) => (
            <Card key={option.id} className="overflow-hidden">
              {/* Image */}
              <div className="aspect-square bg-neutral-100 mb-3 rounded-button overflow-hidden">
                <img
                  src={option.imageUrl}
                  alt={option.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-neutral-900 line-clamp-2">
                    {option.title}
                  </h3>
                  {option.tier && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium capitalize whitespace-nowrap ${getTierBadgeColor(
                        option.tier
                      )}`}
                    >
                      {option.tier}
                    </span>
                  )}
                </div>

                <div className="text-lg font-bold text-brass-700">
                  ${(option.price ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>

                {option.linkUrl && (
                  <a
                    href={option.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brass-600 hover:text-brass-700 flex items-center gap-1"
                  >
                    View Product
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}

                <button
                  onClick={() => handleDeleteOption(option.id)}
                  className="w-full mt-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-button transition-colors"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>

        {filteredOptions.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-neutral-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-neutral-600 mb-2">No options found</p>
              <p className="text-sm text-neutral-500 mb-4">
                {selectedCategory === 'all'
                  ? 'Start building your options library'
                  : 'No options in this category yet'}
              </p>
              <Button onClick={() => setShowUploadForm(true)}>Add Your First Option</Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
