'use client';

import { useState } from 'react';
import Button from './Button';
import Input from './Input';
import Card from './Card';

export interface CabinetryDetail {
  id: string;
  cabinetryType: string;
  material?: string;
  finish?: string;
  doorStyle?: string;
  constructionType?: string;
  hardware?: string;
  notes?: string;
  image?: string;
  assignmentType: 'wholeHome' | 'specificRooms';
  areas?: string[];
  roomIds?: string[];
  roomNames?: string[];
}

interface CabinetryBuilderProps {
  cabinetrySelections: CabinetryDetail[];
  onChange: (selections: CabinetryDetail[]) => void;
  availableRooms?: { id: string; name: string }[];
}

const CABINETRY_TYPES = [
  'Kitchen Cabinets',
  'Bathroom Vanities',
  'Built-in Shelving',
  'Pantry Shelving',
  'Closet Systems',
  'Laundry Cabinets',
  'Mudroom Built-ins',
  'Entertainment Center',
];

const DOOR_STYLES = [
  'Shaker',
  'Slab/Flat',
  'Raised Panel',
  'Recessed Panel',
  'Beadboard',
  'Glass Front',
  'Louvered',
];

const CONSTRUCTION_TYPES = [
  'Framed',
  'Frameless (European)',
];

const WHOLE_HOME_AREAS = [
  'Kitchen',
  'Master Bathroom',
  'Guest Bathroom',
  'Powder Room',
  'Laundry Room',
  'Mudroom',
  'Pantry',
  'Closets',
];

export default function CabinetryBuilder({
  cabinetrySelections,
  onChange,
  availableRooms = [],
}: CabinetryBuilderProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showAddCabinetry, setShowAddCabinetry] = useState(false);

  const [newCabinetryType, setNewCabinetryType] = useState('');
  const [newMaterial, setNewMaterial] = useState('');
  const [newFinish, setNewFinish] = useState('');
  const [newDoorStyle, setNewDoorStyle] = useState('');
  const [newConstructionType, setNewConstructionType] = useState('');
  const [newHardware, setNewHardware] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newAssignmentType, setNewAssignmentType] = useState<'wholeHome' | 'specificRooms'>('wholeHome');
  const [newAreas, setNewAreas] = useState<string[]>([]);
  const [newRoomIds, setNewRoomIds] = useState<string[]>([]);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleAddCabinetry = async () => {
    if (!newCabinetryType) return;

    let imageUrl = '';

    if (newImage) {
      try {
        setUploadingImage(true);
        const timestamp = Date.now();
        const fileName = `${timestamp}_${newImage.name}`;
        const path = `cabinetry/${fileName}`;

        const { uploadFile } = await import('@/lib/api/upload');
        imageUrl = await uploadFile(newImage, path);
      } catch (error) {
        console.error('Failed to upload image:', error);
      } finally {
        setUploadingImage(false);
      }
    }

    const newItem: CabinetryDetail = {
      id: `cabinetry-${Date.now()}`,
      cabinetryType: newCabinetryType,
      material: newMaterial.trim() || undefined,
      finish: newFinish.trim() || undefined,
      doorStyle: newDoorStyle || undefined,
      constructionType: newConstructionType || undefined,
      hardware: newHardware.trim() || undefined,
      notes: newNotes.trim() || undefined,
      image: imageUrl || undefined,
      assignmentType: newAssignmentType,
      areas: newAssignmentType === 'wholeHome' ? newAreas : undefined,
      roomIds: newAssignmentType === 'specificRooms' ? newRoomIds : undefined,
      roomNames: newAssignmentType === 'specificRooms'
        ? newRoomIds.map(id => availableRooms.find(r => r.id === id)?.name || '')
        : undefined,
    };

    onChange([...cabinetrySelections, newItem]);
    resetForm();
  };

  const resetForm = () => {
    setNewCabinetryType('');
    setNewMaterial('');
    setNewFinish('');
    setNewDoorStyle('');
    setNewConstructionType('');
    setNewHardware('');
    setNewNotes('');
    setNewAssignmentType('wholeHome');
    setNewAreas([]);
    setNewRoomIds([]);
    setNewImage(null);
    setNewImagePreview(null);
    setShowAddCabinetry(false);
  };

  const handleRemoveCabinetry = (id: string) => {
    onChange(cabinetrySelections.filter(c => c.id !== id));
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
      {cabinetrySelections.map((item) => {
        const isExpanded = expandedItem === item.id;

        return (
          <Card key={item.id} className="overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-brass-50 border-b border-brass-200">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => setExpandedItem(isExpanded ? null : item.id)}
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
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.cabinetryType}
                    className="w-12 h-12 object-cover rounded border border-neutral-300"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900">{item.cabinetryType}</h3>
                  <p className="text-sm text-neutral-600">
                    {item.assignmentType === 'wholeHome'
                      ? `Whole Home • ${item.areas?.length || 0} areas`
                      : `Specific Rooms • ${item.roomNames?.length || 0} rooms`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveCabinetry(item.id)}
                className="text-red-600 hover:text-red-700 p-2"
                title="Remove cabinetry selection"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isExpanded && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {item.material && (
                    <div>
                      <span className="font-medium text-neutral-700">Material:</span>
                      <span className="ml-2 text-neutral-900">{item.material}</span>
                    </div>
                  )}
                  {item.finish && (
                    <div>
                      <span className="font-medium text-neutral-700">Finish:</span>
                      <span className="ml-2 text-neutral-900">{item.finish}</span>
                    </div>
                  )}
                  {item.doorStyle && (
                    <div>
                      <span className="font-medium text-neutral-700">Door Style:</span>
                      <span className="ml-2 text-neutral-900">{item.doorStyle}</span>
                    </div>
                  )}
                  {item.constructionType && (
                    <div>
                      <span className="font-medium text-neutral-700">Construction:</span>
                      <span className="ml-2 text-neutral-900">{item.constructionType}</span>
                    </div>
                  )}
                  {item.hardware && (
                    <div>
                      <span className="font-medium text-neutral-700">Hardware:</span>
                      <span className="ml-2 text-neutral-900">{item.hardware}</span>
                    </div>
                  )}
                </div>

                {item.notes && (
                  <div className="text-sm">
                    <span className="font-medium text-neutral-700">Notes:</span>
                    <p className="mt-1 text-neutral-900">{item.notes}</p>
                  </div>
                )}

                {item.assignmentType === 'wholeHome' && item.areas && item.areas.length > 0 && (
                  <div>
                    <span className="font-medium text-neutral-700 text-sm">Areas:</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.areas.map(area => (
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

                {item.assignmentType === 'specificRooms' && item.roomNames && item.roomNames.length > 0 && (
                  <div>
                    <span className="font-medium text-neutral-700 text-sm">Rooms:</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.roomNames.map((roomName, idx) => (
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

      {showAddCabinetry ? (
        <Card className="p-4 bg-brass-50 border-brass-200 space-y-4">
          <h3 className="font-semibold text-neutral-900">Add Cabinetry Selection</h3>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Cabinetry Type *
            </label>
            <select
              value={newCabinetryType}
              onChange={(e) => setNewCabinetryType(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500"
            >
              <option value="">Select type</option>
              {CABINETRY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Material (Optional)
              </label>
              <Input
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
                placeholder="e.g., Oak, Maple, Cherry"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Finish (Optional)
              </label>
              <Input
                value={newFinish}
                onChange={(e) => setNewFinish(e.target.value)}
                placeholder="e.g., Natural, Espresso, White"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Door Style (Optional)
              </label>
              <select
                value={newDoorStyle}
                onChange={(e) => setNewDoorStyle(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500"
              >
                <option value="">Select door style</option>
                {DOOR_STYLES.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Construction Type (Optional)
              </label>
              <select
                value={newConstructionType}
                onChange={(e) => setNewConstructionType(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500"
              >
                <option value="">Select construction</option>
                {CONSTRUCTION_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Hardware (Optional)
            </label>
            <Input
              value={newHardware}
              onChange={(e) => setNewHardware(e.target.value)}
              placeholder="e.g., Brushed Nickel Knobs, Oil-Rubbed Bronze Pulls"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Reference Image (Optional)
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

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Additional notes about style, construction details, special requirements..."
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAddCabinetry}
              disabled={
                !newCabinetryType ||
                uploadingImage ||
                (newAssignmentType === 'wholeHome' && newAreas.length === 0) ||
                (newAssignmentType === 'specificRooms' && newRoomIds.length === 0)
              }
            >
              {uploadingImage ? 'Uploading...' : 'Add Cabinetry'}
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowAddCabinetry(true)}
          className="w-full border-dashed border-2"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Cabinetry Selection
        </Button>
      )}

      {cabinetrySelections.length > 0 && (
        <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 rounded-button">
          <h4 className="font-medium text-neutral-900 mb-2">Cabinetry Summary</h4>
          <div className="text-sm text-neutral-600 space-y-1">
            <p>Total Cabinetry Selections: {cabinetrySelections.length}</p>
            <p>
              Whole Home: {cabinetrySelections.filter(c => c.assignmentType === 'wholeHome').length}
            </p>
            <p>
              Specific Rooms: {cabinetrySelections.filter(c => c.assignmentType === 'specificRooms').length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
