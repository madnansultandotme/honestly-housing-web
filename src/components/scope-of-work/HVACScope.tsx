'use client';

import { ScopeOfWorkTemplateProps, HVACData } from '@/lib/scope-of-work/types';
import FileUploader from './FileUploader';

export default function HVACScope({
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

  const scopeData = (data as HVACData) || {
    systemType: '',
    size: 0,
    brand: '',
    interiorUnitLocation: '',
    exteriorUnitLocation: '',
  };

  const handleCompleteLater = (checked: boolean) => {
    if (checked) {
      onStatusChange('skipped');
    } else {
      onStatusChange('incomplete');
    }
  };

  const handleFieldChange = (field: keyof HVACData, value: any) => {
    onChange({
      ...scopeData,
      [field]: value,
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
          {/* System Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              System Type
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="systemType"
                  value="electric"
                  checked={scopeData.systemType === 'electric'}
                  onChange={(e) => handleFieldChange('systemType', e.target.value)}
                  className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                />
                <span className="ml-2 text-sm text-neutral-700">Electric</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="systemType"
                  value="gas"
                  checked={scopeData.systemType === 'gas'}
                  onChange={(e) => handleFieldChange('systemType', e.target.value)}
                  className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                />
                <span className="ml-2 text-sm text-neutral-700">Gas</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="systemType"
                  value="heatPump"
                  checked={scopeData.systemType === 'heatPump'}
                  onChange={(e) => handleFieldChange('systemType', e.target.value)}
                  className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                />
                <span className="ml-2 text-sm text-neutral-700">Heat Pump</span>
              </label>
            </div>
          </div>

          {/* Size and Brand */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Size (Ton)
              </label>
              <input
                type="number"
                value={scopeData.size || ''}
                onChange={(e) => handleFieldChange('size', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
                placeholder="e.g., 3.5"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Brand
              </label>
              <input
                type="text"
                value={scopeData.brand}
                onChange={(e) => handleFieldChange('brand', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
                placeholder="e.g., Carrier, Trane"
              />
            </div>
          </div>

          {/* Unit Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Location of Interior Unit
              </label>
              <input
                type="text"
                value={scopeData.interiorUnitLocation}
                onChange={(e) => handleFieldChange('interiorUnitLocation', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
                placeholder="e.g., Attic, Garage"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Location of Exterior Unit
              </label>
              <input
                type="text"
                value={scopeData.exteriorUnitLocation}
                onChange={(e) => handleFieldChange('exteriorUnitLocation', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
                placeholder="e.g., Side yard, Back patio"
              />
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
              placeholder="Enter any additional HVAC specifications or notes..."
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
