'use client';

import { ScopeOfWorkTemplateProps, ElectricalData } from '@/lib/scope-of-work/types';
import { formatElectricalSummary } from '@/lib/scope-of-work/integration';
import FileUploader from './FileUploader';

export default function ElectricalScope({
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

  const scopeData = (data as ElectricalData) || {
    roomSummary: [],
    additionalNotes: '',
  };

  const handleCompleteLater = (checked: boolean) => {
    if (checked) {
      onStatusChange('skipped');
    } else {
      onStatusChange('incomplete');
    }
  };

  const handleAdditionalNotesChange = (value: string) => {
    onChange({
      ...scopeData,
      additionalNotes: value,
    });
  };

  const totalFixtures = scopeData.roomSummary.reduce(
    (total, room) => total + room.fixtures.reduce((sum, f) => sum + f.count, 0),
    0
  );

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
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-blue-900">
                  Electrical Fixtures by Room
                  <span className="ml-2 text-xs font-normal text-blue-600">
                    (Auto-populated from room selections)
                  </span>
                </h4>
                <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                  {totalFixtures} Total Fixtures
                </span>
              </div>
              <div className="space-y-3">
                {scopeData.roomSummary.map((room, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border border-blue-200">
                    <div className="font-medium text-blue-900 mb-2">{room.roomName}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {room.fixtures.map((fixture, fixtureIndex) => (
                        <div
                          key={fixtureIndex}
                          className="flex items-center justify-between text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded"
                        >
                          <span>{fixture.type}</span>
                          <span className="font-medium">×{fixture.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No fixtures message */}
          {scopeData.roomSummary.length === 0 && (
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-center">
              <p className="text-sm text-neutral-600">
                No electrical fixtures found in room selections. Add fixtures in the Room Selections step to auto-populate this section.
              </p>
            </div>
          )}

          {/* Additional Specifications */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Additional Electrical Specifications
            </label>
            <textarea
              value={scopeData.additionalNotes}
              onChange={(e) => handleAdditionalNotesChange(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
              placeholder="Enter additional electrical specifications (e.g., panel upgrades, dedicated circuits, outlet placements, switch configurations)..."
            />
          </div>

          {/* General Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              General Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brass-500 focus:border-brass-500"
              placeholder="Enter any general electrical notes or special requirements..."
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Supporting Documents
              <span className="ml-2 text-xs font-normal text-neutral-500">
                (electrical plans, wiring diagrams, fixture specifications)
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
            <h5 className="text-xs font-semibold text-neutral-700 mb-2">Common Electrical Items to Document:</h5>
            <ul className="text-xs text-neutral-600 space-y-1 list-disc list-inside">
              <li>Panel amperage and location</li>
              <li>Dedicated circuits (HVAC, appliances, EV charger)</li>
              <li>Outlet heights and placements</li>
              <li>Switch configurations (3-way, 4-way, dimmers)</li>
              <li>Exterior lighting and outlets</li>
              <li>Smart home wiring (CAT6, low voltage)</li>
              <li>Generator hookup or solar preparation</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
