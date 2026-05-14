'use client';

import { useState } from 'react';
import Button from './Button';
import Input from './Input';
import Card from './Card';

export interface PaintDetail {
  id: string;
  colorName: string;
  paintCode?: string;
  sheen?: string;
  notes?: string;
  image?: string;
  assignmentType: 'wholeHome' | 'specificRooms';
  areas?: string[]; // For whole home: walls, trim, ceiling, cabinets, etc.
  roomIds?: string[];
  roomNames?: string[];
}

interface PaintBuilderProps {
  paintSelections: PaintDetail[];
  onChange: (selections: PaintDetail[]) => void;
  availableRooms?: { id: string; name: string }[];
}

const WHOLE_HOME_AREAS = [
  'Walls',
  'Trim',
  'Ceiling',
  'Cabinets',
  'Doors',
  'Baseboards',
  'Crown Molding',
  'Window Frames',
];

const SHEEN_OPTIONS = [
  'Flat',
  'Matte',
  'Eggshell',
  'Satin',
  'Semi-Gloss',
  'Gloss',
];

export default function PaintBuilder({
  paintSelections,
  onChange,
  availableRooms = [],
}: PaintBuilderProps) {
  const [expandedPaint, setExpandedPaint] = useState<string | null>(null);
  const [showAddPaint, setShowAddPaint] = useState(false);

  // Add paint states
  const [newColorName, setNewColorName] = useState('');
  const [newPaintCode, setNewPaintCode] = useState('');
  const [newSheen, setNewSheen] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newAssignmentType, setNewAssignmentType] = useState<'wholeHome' | 'specificRooms'>('wholeHome');
  const [newAreas, setNewAreas] = useState<string[]>([]);
  const [newRoomIds, setNewRoomIds] = useState<string[]>([]);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleAddPaint = async () => {
    if (!newColorName.trim()) return;

    let imageUrl = '';

    // Upload image if provided
    if (newImage) {
      try {
        setUploadingImage(true);
        const timestamp = Date.now();
        const fileName = `${timestamp}_${newImage.name}`;
        const path = `paint/${fileName}`;

        // Use Firebase Storage
        const { uploadFile } = await import('@/lib/api/upload');
        imageUrl = await uploadFile(newImage, path);
      } catch (error) {
        console.error('Failed to upload image:', error);
        // Continue without image
      } finally {
        setUploadingImage(false);
      }
    }

    const newPaint: PaintDetail = {
      id: `paint-${Date.now()}`,
      colorName: newColorName.trim(),
      paintCode: newPaintCode.trim() || undefined,
      sheen: newSheen || undefined,
      notes: newNotes.trim() || undefined,
      image: imageUrl || undefined,
      assignmentType: newAssignmentType,
      areas: newAssignmentType === 'wholeHome' ? newAreas : undefined,
      roomIds: newAssignmentType === 'specificRooms' ? newRoomIds : undefined,
      roomNames: newAssignmentType === 'specificRooms'
        ? newRoomIds.map(id => availableRooms.find(r => r.id === id)?.name || '')
        : undefined,
    };

    onChange([...paintSelections, newPaint]);
    resetForm();
  };

  const resetForm = () => {
    setNewColorName('');
    setNewPaintCode('');
    setNewSheen('');
    setNewNotes('');
    setNewAssignmentType('wholeHome');
    setNewAreas([]);
    setNewRoomIds([]);
    setNewImage(null);
    setNewImagePreview(null);
    setShowAddPaint(false);
  };

  const handleRemovePaint = (paintId: string) => {
    onChange(paintSelections.filter(p => p.id !== paintId));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setNewImage(null);
    setNewImagePreview(null);
  };

  const toggleArea = (area: string) => {
    setNewAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const toggleRoom = (roomId: string) => {
    setNewRoomIds(prev =>
      prev.includes(roomId) ? prev.filter(r => r !== roomId) : [...prev, roomId]
    );
  };

  return (
    <div className="space-y-4">
      {/* Paint List */}
      {paintSelections.map((paint) => {
        const isExpanded = expandedPaint === paint.id;

        return (
          <Card key={paint.id} className="overflow-hidden">
            {/* Paint Header */}
            <div className="flex items-center justify-between p-4 bg-brass-50 border-b border-brass-200">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => setExpandedPaint(isExpanded ? null : paint.id)}
                  className="text-neutral-900 hover:text-brass-600 transition-colors"
                >
                  <svg
                    className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {paint.image && (
                  <img
                    src={paint.image}
                    alt={paint.colorName}
                    className="w-12 h-12 object-cover rounded border border-neutral-300"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900">{paint.colorName}</h3>
                  <p className="text-sm text-neutral-600">
                    {paint.assignmentType === 'wholeHome'
                      ? `Whole Home • ${paint.areas?.length || 0} areas`
                      : `Specific Rooms • ${paint.roomNames?.length || 0} rooms`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemovePaint(paint.id)}
                className="text-red-600 hover:text-red-700 p-2"
                title="Remove paint selection"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Paint Details (Expanded) */}
            {isExpanded && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {paint.paintCode && (
                    <div>
                      <span className="font-medium text-neutral-700">Paint Code:</span>
                      <span className="ml-2 text-neutral-900">{paint.paintCode}</span>
                    </div>
                  )}
                  {paint.sheen && (
                    <div>
                      <span className="font-medium text-neutral-700">Sheen:</span>
                      <span className="ml-2 text-neutral-900">{paint.sheen}</span>
                    </div>
                  )}
                </div>

                {paint.notes && (
                  <div className="text-sm">
                    <span className="font-medium text-neutral-700">Notes:</span>
                    <p className="mt-1 text-neutral-900">{paint.notes}</p>
                  </div>
                )}

                {paint.assignmentType === 'wholeHome' && paint.areas && paint.areas.length > 0 && (
                  <div>
                    <span className="font-medium text-neutral-700 text-sm">Areas:</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {paint.areas.map(area => (
                        <span
                          key={area}
                          className="px-3 py-1 bg-brass-100 text-brass-800 rounded-full text-xs font-medium"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {paint.assignmentType === 'specificRooms' && paint.roomNames && paint.roomNames.length > 0 && (
                  <div>
                    <span className="font-medium text-neutral-700 text-sm">Rooms:</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {paint.roomNames.map((roomName, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-brass-100 text-brass-800 rounded-full text-xs font-medium"
                        >
                          {roomName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {/* Add Paint Section */}
      {showAddPaint ? (
        <Card className="p-4 bg-brass-50 border-brass-200 space-y-4">
          <h3 className="font-semibold text-neutral-900">Add Paint Selection</h3>

          {/* Color Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Color Name *
            </label>
            <Input
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              placeholder="e.g., Swiss Coffee, Alabaster"
            />
          </div>

          {/* Paint Code and Sheen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Paint Code (Optional)
              </label>
              <Input
                value={newPaintCode}
                onChange={(e) => setNewPaintCode(e.target.value)}
                placeholder="e.g., SW 7012"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Sheen (Optional)
              </label>
              <select
                value={newSheen}
                onChange={(e) => setNewSheen(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500"
              >
                <option value="">Select sheen</option>
                {SHEEN_OPTIONS.map(sheen => (
                  <option key={sheen} value={sheen}>{sheen}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Paint Swatch Image (Optional)
            </label>
            {newImagePreview ? (
              <div className="relative inline-block">
                <img
                  src={newImagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-button border border-neutral-300"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                  type="button"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-button file:border-0 file:text-sm file:font-medium file:bg-brass-50 file:text-brass-700 hover:file:bg-brass-100"
              />
            )}
          </div>

          {/* Assignment Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Assignment Type *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="wholeHome"
                  checked={newAssignmentType === 'wholeHome'}
                  onChange={(e) => setNewAssignmentType(e.target.value as 'wholeHome')}
                  className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                />
                <span className="text-sm text-neutral-900">Entire Home</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="specificRooms"
                  checked={newAssignmentType === 'specificRooms'}
                  onChange={(e) => setNewAssignmentType(e.target.value as 'specificRooms')}
                  className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                />
                <span className="text-sm text-neutral-900">Specific Rooms</span>
              </label>
            </div>
          </div>

          {/* Whole Home Areas */}
          {newAssignmentType === 'wholeHome' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Select Areas *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {WHOLE_HOME_AREAS.map(area => (
                  <label
                    key={area}
                    className={`flex items-center gap-2 p-2 border rounded-button cursor-pointer transition-colors ${
                      newAreas.includes(area)
                        ? 'bg-brass-100 border-brass-500'
                        : 'bg-white border-neutral-300 hover:border-brass-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={newAreas.includes(area)}
                      onChange={() => toggleArea(area)}
                      className="w-4 h-4 text-brass-600 border-neutral-300 rounded focus:ring-brass-500"
                    />
                    <span className="text-sm text-neutral-900">{area}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Specific Rooms */}
          {newAssignmentType === 'specificRooms' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Select Rooms *
              </label>
              {availableRooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {availableRooms.map(room => (
                    <label
                      key={room.id}
                      className={`flex items-center gap-2 p-2 border rounded-button cursor-pointer transition-colors ${
                        newRoomIds.includes(room.id)
                          ? 'bg-brass-100 border-brass-500'
                          : 'bg-white border-neutral-300 hover:border-brass-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={newRoomIds.includes(room.id)}
                        onChange={() => toggleRoom(room.id)}
                        className="w-4 h-4 text-brass-600 border-neutral-300 rounded focus:ring-brass-500"
                      />
                      <span className="text-sm text-neutral-900">{room.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500 italic">
                  No rooms available. Please add rooms first.
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Additional notes about this paint selection"
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleAddPaint}
              disabled={
                !newColorName.trim() ||
                uploadingImage ||
                (newAssignmentType === 'wholeHome' && newAreas.length === 0) ||
                (newAssignmentType === 'specificRooms' && newRoomIds.length === 0)
              }
            >
              {uploadingImage ? 'Uploading...' : 'Add Paint'}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowAddPaint(true)}
          className="w-full border-dashed border-2"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Paint Selection
        </Button>
      )}

      {/* Summary */}
      {paintSelections.length > 0 && (
        <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 rounded-button">
          <h4 className="font-medium text-neutral-900 mb-2">Paint Summary</h4>
          <div className="text-sm text-neutral-600 space-y-1">
            <p>Total Paint Selections: {paintSelections.length}</p>
            <p>
              Whole Home: {paintSelections.filter(p => p.assignmentType === 'wholeHome').length}
            </p>
            <p>
              Specific Rooms: {paintSelections.filter(p => p.assignmentType === 'specificRooms').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
