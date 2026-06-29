'use client';

import { ScopeOfWorkTemplateProps, CabinetryData } from '@/lib/scope-of-work/types';
import FileUploader from './FileUploader';

export default function CabinetryScope({
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

  const scopeData = (data as CabinetryData) || {
    notes: '',
    completeLater: false,
    customFields: {},
  };

  const handleCompleteLater = (checked: boolean) => {
    if (checked) {
      onStatusChange('skipped');
      onChange({
        ...scopeData,
        completeLater: true,
      });
    } else {
      onStatusChange('incomplete');
      onChange({
        ...scopeData,
        completeLater: false,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Complete Later Toggle */}
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <input
          type="checkbox"
          id={`skip-${categoryId}`}
          checked={status === 'skipped' || scopeData.completeLater}
          onChange={(e) => handleCompleteLater(e.target.checked)}
          className="w-4 h-4 text-brass-600 border-neutral-300 rounded focus:ring-brass-500"
        />
        <label htmlFor={`skip-${categoryId}`} className="text-sm text-neutral-700 cursor-pointer">
          Complete this category later
        </label>
      </div>

      {status !== 'skipped' && !scopeData.completeLater && (
        <>
          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Cabinetry specifications can be detailed separately. Use this section to document general cabinetry requirements, layouts, and special features.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Cabinetry Specifications
            </label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
              placeholder="Enter cabinetry specifications including:&#10;- Room layouts and dimensions&#10;- Cabinet styles and materials&#10;- Door styles and finishes&#10;- Hardware selections&#10;- Special features (pull-outs, organizers, etc.)&#10;- Countertop specifications"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Supporting Documents & Images
              <span className="ml-2 text-xs font-normal text-neutral-500">
                (layouts, elevation drawings, material samples, inspiration photos)
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
            <h5 className="text-xs font-semibold text-neutral-700 mb-2">Cabinetry Items to Document:</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-600">
              <div>
                <strong className="block text-neutral-700 mb-1">Kitchen:</strong>
                <ul className="space-y-1 list-disc list-inside ml-2">
                  <li>Base and upper cabinets</li>
                  <li>Island configuration</li>
                  <li>Pantry system</li>
                  <li>Appliance garage</li>
                  <li>Wine storage</li>
                </ul>
              </div>
              <div>
                <strong className="block text-neutral-700 mb-1">Bathrooms:</strong>
                <ul className="space-y-1 list-disc list-inside ml-2">
                  <li>Vanity cabinets</li>
                  <li>Medicine cabinets</li>
                  <li>Linen storage</li>
                  <li>Drawer configuration</li>
                </ul>
              </div>
              <div>
                <strong className="block text-neutral-700 mb-1">Other Areas:</strong>
                <ul className="space-y-1 list-disc list-inside ml-2">
                  <li>Laundry room cabinets</li>
                  <li>Mudroom lockers</li>
                  <li>Built-in desks</li>
                  <li>Entertainment centers</li>
                </ul>
              </div>
              <div>
                <strong className="block text-neutral-700 mb-1">Details:</strong>
                <ul className="space-y-1 list-disc list-inside ml-2">
                  <li>Door & drawer styles</li>
                  <li>Finish & colors</li>
                  <li>Hardware finishes</li>
                  <li>Crown & trim details</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Note about detailed cabinetry */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Tip:</strong> For detailed cabinetry planning, consider using the Cabinetry Builder tool in the project creation process or working with your cabinet designer to provide detailed layouts and specifications.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
