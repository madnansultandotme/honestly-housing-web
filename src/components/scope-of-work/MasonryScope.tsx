'use client';

import { ScopeOfWorkTemplateProps, MasonryData } from '@/lib/scope-of-work/types';
import FileUploader from './FileUploader';

export default function MasonryScope({
  categoryId,
  categoryName,
  data,
  onChange,
  onStatusChange,
  status,
  notes,
  onNotesChange,
  files,
  onFilesChange,
}: ScopeOfWorkTemplateProps & { projectId?: string }) {
  const projectId = 'temp';

  const scopeData = (data as MasonryData) || {
    notes: '',
    customFields: {},
  };

  const handleCompleteLater = (checked: boolean) => {
    if (checked) {
      onStatusChange('skipped');
    } else {
      onStatusChange('incomplete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Complete Later Toggle */}
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <input
          type="checkbox"
          id={`skip-${categoryId}`}
          checked={status === 'skipped'}
          onChange={(e) => handleCompleteLater(e.target.checked)}
          className="w-4 h-4 text-brass-600 border-neutral-300 rounded focus:ring-brass-500"
        />
        <label htmlFor={`skip-${categoryId}`} className="text-sm text-neutral-700 cursor-pointer">
          Complete this category later
        </label>
      </div>

      {status !== 'skipped' && (
        <>
          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Masonry Work:</strong> Document all masonry and stonework including porches, fireplaces, chimneys, foundations, and decorative elements.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Masonry Specifications
            </label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
              placeholder="Enter masonry specifications including:&#10;- Materials (brick, stone, block, etc.)&#10;- Locations and dimensions&#10;- Finishes and mortar colors&#10;- Structural requirements&#10;- Decorative elements"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Supporting Documents
              <span className="ml-2 text-xs font-normal text-neutral-500">
                (plans, material specs, photos, drawings)
              </span>
            </label>
            <FileUploader
              projectId={projectId}
              categoryId={categoryId}
              files={files}
              onChange={onFilesChange}
            />
          </div>

          {/* Helper Info */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
            <h5 className="text-xs font-semibold text-neutral-700 mb-2">Common Masonry Items to Document:</h5>
            <ul className="text-xs text-neutral-600 space-y-1 list-disc list-inside">
              <li>Exterior brick or stone veneer</li>
              <li>Foundation materials and specifications</li>
              <li>Fireplace and chimney construction</li>
              <li>Porch columns and supports</li>
              <li>Retaining walls</li>
              <li>Outdoor kitchen or fire pit</li>
              <li>Decorative stone accents</li>
              <li>Mortar colors and joint styles</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
