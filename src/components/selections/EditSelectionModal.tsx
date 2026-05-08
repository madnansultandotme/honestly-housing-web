import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useNotification } from '@/contexts/NotificationContext';
import { apiClient } from '@/lib/api/client';

interface EditSelectionModalProps {
  selection: any;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PAINT_SUBTYPES = [
  { value: 'trim', label: 'Trim' },
  { value: 'ceiling', label: 'Ceiling' },
  { value: 'walls', label: 'Walls' },
  { value: 'cabinets', label: 'Cabinets' },
];

export default function EditSelectionModal({
  selection,
  projectId,
  onClose,
  onSuccess,
}: EditSelectionModalProps) {
  const { showSuccess, showError } = useNotification();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(selection.imageUrl || '');

  // Form state
  const [formData, setFormData] = useState({
    categoryId: selection.categoryId || '',
    name: selection.name || '',
    roomId: selection.roomId || '',
    quantity: selection.quantity || 1,
    brand: selection.brand || '',
    price: selection.actualCost || '',
    description: selection.description || '',
    dueDate: selection.dueDate ? new Date(selection.dueDate).toISOString().split('T')[0] : '',
    subType: selection.subType || '',
    imageUrl: selection.imageUrl || '',
  });

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoadingData(true);

      // Load categories
      const categoriesData = await apiClient.get(`/api/categories?projectId=${projectId}`);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);

      // Load rooms
      const roomsData = await apiClient.get(`/api/rooms?projectId=${projectId}`);
      setRooms(Array.isArray(roomsData) ? roomsData : []);
    } catch (error) {
      console.error('Failed to load data:', error);
      showError('Failed to load categories and rooms');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    handleChange('imageUrl', '');
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Image upload error:', error);
      showError('Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId || !formData.name.trim()) {
      showError('Category and name are required');
      return;
    }

    try {
      setSaving(true);

      // Upload new image if present
      let imageUrl = formData.imageUrl;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const category = categories.find(c => c.id === formData.categoryId);
      const room = rooms.find(r => r.id === formData.roomId);

      const updateData = {
        projectId: projectId, // Required for items subcollection
        categoryId: formData.categoryId,
        categoryName: category?.name || '',
        name: formData.name.trim(),
        roomId: formData.roomId || null,
        roomName: room?.name || null,
        quantity: formData.quantity || 1,
        brand: formData.brand.trim() || null,
        description: formData.description.trim() || null,
        imageUrl: imageUrl || null,
        actualCost: parseFloat(formData.price as any) || 0,
        difference: (parseFloat(formData.price as any) || 0) - (selection.allowance || 0),
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        subType: formData.subType || null,
      };

      await apiClient.patch(`/api/items/${selection.id}`, updateData);

      showSuccess('Selection updated successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update selection:', error);
      showError(error.message || 'Failed to update selection');
    } finally {
      setSaving(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === formData.categoryId);
  const isPaintCategory = selectedCategory?.name.toLowerCase() === 'paint';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-neutral-900">
              Edit Selection
            </h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loadingData ? (
            <div className="text-center py-8 text-neutral-600">Loading...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 bg-white text-neutral-900"
                >
                  <option value="">Select category...</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <Input
                label="Item Name *"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Ceiling Fan, Hardwood Flooring"
                required
              />

              {/* Room */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Room (Optional)
                </label>
                <select
                  value={formData.roomId}
                  onChange={(e) => handleChange('roomId', e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 bg-white text-neutral-900"
                >
                  <option value="">No specific room</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <Input
                label="Quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
              />

              {/* Paint Sub-Type (conditional) */}
              {isPaintCategory && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Paint Type
                  </label>
                  <select
                    value={formData.subType}
                    onChange={(e) => handleChange('subType', e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 bg-white text-neutral-900"
                  >
                    <option value="">Select type...</option>
                    {PAINT_SUBTYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Brand */}
              <Input
                label="Brand (Optional)"
                value={formData.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                placeholder="e.g., Hunter, Kohler"
              />

              {/* Price */}
              <Input
                label="Price (Optional)"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="0.00"
              />

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 bg-white text-neutral-900"
                  placeholder="Additional details about this selection..."
                />
              </div>

              {/* Due Date */}
              <Input
                label="Due Date (Optional)"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
              />

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Product Image (Optional)
                </label>
                
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-button border border-neutral-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-button hover:bg-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-neutral-300 rounded-button p-6 text-center hover:border-brass-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload-edit"
                    />
                    <label htmlFor="image-upload-edit" className="cursor-pointer">
                      <svg className="w-12 h-12 mx-auto text-neutral-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div className="text-sm text-neutral-600">
                        Click to upload product image
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        PNG, JPG, GIF up to 10MB
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={saving || uploading || !formData.categoryId || !formData.name.trim()}
                  className="flex-1"
                >
                  {uploading ? 'Uploading Image...' : saving ? 'Updating...' : 'Update Selection'}
                </Button>
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
