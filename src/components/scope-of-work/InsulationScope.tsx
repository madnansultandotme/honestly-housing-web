'use client';

import { ScopeOfWorkTemplateProps, InsulationData, InsulationSection } from '@/lib/scope-of-work/types';
import FileUploader from './FileUploader';

export default function InsulationScope({
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

  const scopeData = (data as InsulationData) || {
    exteriorWalls: { insulationType: '', thickness: 0, rValue: 0 },
    otherWalls: { insulationType: '', thickness: 0, rValue: 0 },
    ceilings: { insulationType: '', thickness: 0, rValue: 0 },
    floors: { insulationType: '', thickness: 0, rValue: 0 },
    otherAreas: { insulationType: '', thickness: 0, rValue: 0 },
  };

  const handleCompleteLater = (checked: boolean) => {
    if (checked) {
      onStatusChange('skipped');
    } else {
      onStatusChange('incomplete');
    }
  };

  const handleSectionChange = (
    section: keyof InsulationData,
    field: keyof InsulationSection,
    value: string | number
  ) => {
    onChange({
      ...scopeData,
      [section]: {
        ...scopeData[section],
        [field]: value,
      },
    });
  };

  const sections: Array<{
    key: keyof InsulationData;
    label: string;
  }> = [
    { key: 'exteriorWalls', label: 'Exterior walls of improved living areas' },
    { key: 'otherWalls', label: 'Walls in other areas of the home' },
    { key: 'ceilings', label: 'Ceilings on improved living areas' },
    { key: 'floors', label: 'Floors of improved living areas not applied to a slab foundation' },
    { key: 'otherAreas', label: 'Other Insulated areas' },
  ];

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
          {/* Insulation Sections */}
          <div className="space-y-6">
            {sections.map((section, index) => (
              <div key={section.key} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <h4 className="text-sm font-medium text-neutral-800 mb-3">
                  {index + 1}. {section.label}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Insulation Type
                    </label>
                    <input
                      type="text"
                      value={scopeData[section.key].insulationType}
                      onChange={(e) =>
                        handleSectionChange(section.key, 'insulationType', e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
                      placeholder="e.g., Fiberglass, Spray Foam"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Thickness (inches)
                    </label>
                    <input
                      type="number"
                      value={scopeData[section.key].thickness || ''}
                      onChange={(e) =>
                        handleSectionChange(section.key, 'thickness', parseFloat(e.target.value) || 0)
                      }
                      min="0"
                      step="0.5"
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      R-Value
                    </label>
                    <input
                      type="number"
                      value={scopeData[section.key].rValue || ''}
                      onChange={(e) =>
                        handleSectionChange(section.key, 'rValue', parseFloat(e.target.value) || 0)
                      }
                      min="0"
                      step="1"
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ))}
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
              placeholder="Enter any additional insulation specifications or notes..."
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
