'use client';

import { ScopeOfWorkTemplateProps, DefaultScopeData } from '@/lib/scope-of-work/types';
import FileUploader from './FileUploader';

export default function DefaultScope({
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
  const projectId = 'temp'; // This will be passed from parent when integrated

  const scopeData = data as DefaultScopeData || { notes: '' };

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
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
              placeholder={`Enter any notes or details for ${categoryName}...`}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Supporting Documents
            </label>
            <FileUploader
              projectId={projectId}
              categoryId={categoryId}
              files={files}
              onChange={onFilesChange}
            />
          </div>
        </>
      )}
    </div>
  );
}
