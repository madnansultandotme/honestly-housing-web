'use client';

import { ScopeOfWorkTemplateProps, PlumbingData } from '@/lib/scope-of-work/types';
import { formatPlumbingSummary } from '@/lib/scope-of-work/integration';
import FileUploader from './FileUploader';

export default function PlumbingScope({
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

  const scopeData = (data as PlumbingData) || {
    roomSummary: [],
    gasAppliances: [],
    fireplace: { type: '', location: '' },
    waterHeater: { type: '', location: '', otherLocation: '' },
    outdoorGrill: false,
    propane: false,
    propaneLocation: '',
  };

  const handleCompleteLater = (checked: boolean) => {
    if (checked) {
      onStatusChange('skipped');
    } else {
      onStatusChange('incomplete');
    }
  };

  const handleFieldChange = (field: keyof PlumbingData, value: any) => {
    onChange({
      ...scopeData,
      [field]: value,
    });
  };

  const handleFireplaceChange = (field: 'type' | 'location', value: string) => {
    onChange({
      ...scopeData,
      fireplace: {
        ...scopeData.fireplace,
        [field]: value,
      },
    });
  };

  const handleWaterHeaterChange = (field: 'type' | 'location' | 'otherLocation', value: string) => {
    onChange({
      ...scopeData,
      waterHeater: {
        ...scopeData.waterHeater,
        [field]: value,
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
          {/* Room Summary (Auto-populated) */}
          {scopeData.roomSummary.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">
                Plumbing Fixtures by Room
                <span className="ml-2 text-xs font-normal text-blue-600">
                  (Auto-populated from room selections)
                </span>
              </h4>
              <div className="space-y-2">
                {scopeData.roomSummary.map((room, index) => (
                  <div key={index} className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-blue-900">{room.roomName}:</span>
                    <span className="text-blue-700 ml-4">{formatPlumbingSummary(room)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gas Appliances (Auto-detected) */}
          {scopeData.gasAppliances.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-sm font-semibold text-green-900 mb-3">
                Gas Appliances Detected
                <span className="ml-2 text-xs font-normal text-green-600">
                  (Auto-detected from appliance selections)
                </span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                {scopeData.gasAppliances.map((appliance, index) => (
                  <li key={index}>{appliance}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Fireplace */}
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <h4 className="text-sm font-medium text-neutral-800 mb-3">Fireplace</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-2">
                  Type
                </label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fireplaceType"
                      value="gas"
                      checked={scopeData.fireplace.type === 'gas'}
                      onChange={(e) => handleFireplaceChange('type', e.target.value)}
                      className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Gas</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fireplaceType"
                      value="electric"
                      checked={scopeData.fireplace.type === 'electric'}
                      onChange={(e) => handleFireplaceChange('type', e.target.value)}
                      className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Electric</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fireplaceType"
                      value="wood"
                      checked={scopeData.fireplace.type === 'wood'}
                      onChange={(e) => handleFireplaceChange('type', e.target.value)}
                      className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Wood</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={scopeData.fireplace.location}
                  onChange={(e) => handleFireplaceChange('location', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
                  placeholder="e.g., Living Room, Primary Bedroom"
                />
              </div>
            </div>
          </div>

          {/* Water Heater */}
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <h4 className="text-sm font-medium text-neutral-800 mb-3">Water Heater</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-2">
                  Type
                </label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="waterHeaterType"
                      value="gas"
                      checked={scopeData.waterHeater.type === 'gas'}
                      onChange={(e) => handleWaterHeaterChange('type', e.target.value)}
                      className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Gas</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="waterHeaterType"
                      value="electric"
                      checked={scopeData.waterHeater.type === 'electric'}
                      onChange={(e) => handleWaterHeaterChange('type', e.target.value)}
                      className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Electric</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="waterHeaterType"
                      value="propaneTank"
                      checked={scopeData.waterHeater.type === 'propaneTank'}
                      onChange={(e) => handleWaterHeaterChange('type', e.target.value)}
                      className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Propane Tank</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="waterHeaterType"
                      value="tankless"
                      checked={scopeData.waterHeater.type === 'tankless'}
                      onChange={(e) => handleWaterHeaterChange('type', e.target.value)}
                      className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Tankless</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-2">
                  Location
                </label>
                <select
                  value={scopeData.waterHeater.location}
                  onChange={(e) => handleWaterHeaterChange('location', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
                >
                  <option value="">Select location...</option>
                  <option value="garage">Garage</option>
                  <option value="attic">Attic</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {scopeData.waterHeater.location === 'other' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-2">
                    Specify Location
                  </label>
                  <input
                    type="text"
                    value={scopeData.waterHeater.otherLocation}
                    onChange={(e) => handleWaterHeaterChange('otherLocation', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
                    placeholder="Enter location"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Outdoor Grill & Propane */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <h4 className="text-sm font-medium text-neutral-800 mb-3">Outdoor Grill</h4>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="outdoorGrill"
                    checked={scopeData.outdoorGrill === true}
                    onChange={() => handleFieldChange('outdoorGrill', true)}
                    className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                  />
                  <span className="ml-2 text-sm text-neutral-700">Yes</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="outdoorGrill"
                    checked={scopeData.outdoorGrill === false}
                    onChange={() => handleFieldChange('outdoorGrill', false)}
                    className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                  />
                  <span className="ml-2 text-sm text-neutral-700">No</span>
                </label>
              </div>
            </div>

            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <h4 className="text-sm font-medium text-neutral-800 mb-3">Propane</h4>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="propane"
                    checked={scopeData.propane === true}
                    onChange={() => handleFieldChange('propane', true)}
                    className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                  />
                  <span className="ml-2 text-sm text-neutral-700">Yes</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="propane"
                    checked={scopeData.propane === false}
                    onChange={() => handleFieldChange('propane', false)}
                    className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                  />
                  <span className="ml-2 text-sm text-neutral-700">No</span>
                </label>
              </div>
            </div>
          </div>

          {/* Propane Location (conditional) */}
          {scopeData.propane && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Propane Location
              </label>
              <input
                type="text"
                value={scopeData.propaneLocation}
                onChange={(e) => handleFieldChange('propaneLocation', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
                placeholder="Enter propane tank location"
              />
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
              placeholder="Enter any additional plumbing specifications or notes..."
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
