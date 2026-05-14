'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface TemplateViewerProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (templateId: string) => void;
  template: {
    id: string;
    name: string;
    description?: string;
    rooms?: Record<string, number>;
    fixtureCounts?: { plumbingFixtures: number; lightingFixtures: number };
    squareFootage?: number;
    categories?: { name: string; required: boolean; allowanceType?: string; allowanceAmount?: number }[];
    createdAt?: string;
    createdBy?: string;
    usageCount?: number;
  } | null;
}

export default function TemplateViewer({ isOpen, onClose, onDelete, template }: TemplateViewerProps) {
  if (!isOpen || !template) return null;

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      onDelete(template.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-display font-bold text-neutral-900">{template.name}</h2>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {template.description && (
            <p className="text-sm text-neutral-600 mb-4">{template.description}</p>
          )}

          {/* Basic Info */}
          <div className="space-y-3 mb-6">
            {template.squareFootage && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Square Footage:</span>
                <span className="font-medium text-neutral-900">{template.squareFootage.toLocaleString()} sq ft</span>
              </div>
            )}
            {template.createdAt && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Created:</span>
                <span className="font-medium text-neutral-900">
                  {new Date(template.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
            {template.usageCount !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Times Used:</span>
                <span className="font-medium text-neutral-900">{template.usageCount}</span>
              </div>
            )}
          </div>

          {/* Rooms */}
          {template.rooms && Object.keys(template.rooms).length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">Rooms</h3>
              <div className="space-y-1">
                {Object.entries(template.rooms).map(([type, count]) => (
                  count > 0 && (
                    <div key={type} className="flex justify-between text-sm ml-4">
                      <span className="text-neutral-600 capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}:</span>
                      <span className="font-medium text-neutral-900">{count}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Fixture Counts */}
          {template.fixtureCounts && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">Fixtures</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm ml-4">
                  <span className="text-neutral-600">Plumbing:</span>
                  <span className="font-medium text-neutral-900">{template.fixtureCounts.plumbingFixtures || 0}</span>
                </div>
                <div className="flex justify-between text-sm ml-4">
                  <span className="text-neutral-600">Lighting:</span>
                  <span className="font-medium text-neutral-900">{template.fixtureCounts.lightingFixtures || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Categories */}
          {template.categories && template.categories.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">Categories</h3>
              <div className="space-y-1">
                {template.categories.map((cat, idx) => (
                  <div key={idx} className="flex justify-between text-sm ml-4">
                    <span className="text-neutral-600">
                      {cat.name}
                      {cat.required ? '' : ' (Optional)'}
                    </span>
                    {cat.allowanceAmount ? (
                      <span className="font-medium text-neutral-900">
                        ${cat.allowanceAmount.toLocaleString()}
                        {cat.allowanceType === 'perSqFt' ? '/sq ft' : ''}
                      </span>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-neutral-200">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            {onDelete && (
              <Button onClick={handleDelete} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                Delete Template
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
