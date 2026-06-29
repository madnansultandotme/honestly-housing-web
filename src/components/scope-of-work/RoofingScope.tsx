'use client';

import { ScopeOfWorkTemplateProps, RoofingData } from '@/lib/scope-of-work/types';
import FileUploader from './FileUploader';

export default function RoofingScope({
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

  const scopeData = (data as RoofingData) || {
    notes: '',
    options: {
      composite30Year: false,
      rPanel: false,
      standingSeamMetal: false,
      accents: false,
    },
  };

  const handleCompleteLater = (checked: boolean) => {
    if (checked) {
      onStatusChange('skipped');
    } else {
      onStatusChange('incomplete');
    }
  };

  const handleOptionChange = (option: keyof RoofingData['options'], checked: boolean) => {
    onChange({
      ...scopeData,
      options: {
        ...scopeData.options,
        [option]: checked,
      },
    });
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
          {/* Roofing Options */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Roofing Materials
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="composite30Year"
                  checked={scopeData.options.composite30Year}
                  onChange={(e) => handleOptionChange('composite30Year', e.target.checked)}
                  className="w-4 h-4 text-brass-600 border-neutral-300 rounded focus:ring-brass-500"
                />
                <label htmlFor="composite30Year" className="ml-2 text-sm text-neutral-700">
                  Composite 30 Year
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rPanel"
                  checked={scopeData.options.rPanel}
                  onChange={(e) => handleOptionChange('rPanel', e.target.checked)}
                  className="w-4 h-4 text-brass-600 border-neutral-300 rounded focus:ring-brass-500"
                />
                <label htmlFor="rPanel" className="ml-2 text-sm text-neutral-700">
                  R Panel
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="standingSeamMetal"
                  checked={scopeData.options.standingSeamMetal}
                  onChange={(e) => handleOptionChange('standingSeamMetal', e.target.checked)}
                  className="w-4 h-4 text-brass-600 border-neutral-300 rounded focus:ring-brass-500"
                />
                <label htmlFor="standingSeamMetal" className="ml-2 text-sm text-neutral-700">
                  Standing Seam Metal
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="accents"
                  checked={scopeData.options.accents}
                  onChange={(e) => handleOptionChange('accents', e.target.checked)}
                  className="w-4 h-4 text-brass-600 border-neutral-300 rounded focus:ring-brass-500"
                />
                <label htmlFor="accents" className="ml-2 text-sm text-neutral-700">
                  Accents
                </label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
              placeholder="Enter any additional roofing specifications or notes..."
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
