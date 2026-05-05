'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { uploadImage } from '@/lib/api/upload';

export interface OptionFormData {
  title: string;
  linkUrl: string;
  imageUrl: string;
  price: number;
  categoryId: string;
  tier?: 'good' | 'better' | 'best';
}

interface OptionUploadFormProps {
  categories: Array<{ id: string; name: string }>;
  onSubmit: (data: OptionFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<OptionFormData>;
}

export default function OptionUploadForm({
  categories,
  onSubmit,
  onCancel,
  initialData,
}: OptionUploadFormProps) {
  const [formData, setFormData] = useState<OptionFormData>({
    title: initialData?.title || '',
    linkUrl: initialData?.linkUrl || '',
    imageUrl: initialData?.imageUrl || '',
    price: initialData?.price || 0,
    categoryId: initialData?.categoryId || '',
    tier: initialData?.tier || 'good',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.imageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [priceLookupLoading, setPriceLookupLoading] = useState(false);
  const [priceLookupMessage, setPriceLookupMessage] = useState('');
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setImageFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPriceLookupMessage('');

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.categoryId) {
      setError('Category is required');
      return;
    }
    if (formData.price <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    try {
      setSubmitting(true);

      let imageUrl = formData.imageUrl;

      // Upload image if a new file was selected
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadImage(imageFile, 'options');
        setUploading(false);
      }

      if (!imageUrl) {
        setError('Image is required');
        setSubmitting(false);
        return;
      }

      await onSubmit({
        ...formData,
        imageUrl,
      });

      // Reset form
      setFormData({
        title: '',
        linkUrl: '',
        imageUrl: '',
        price: 0,
        categoryId: '',
        tier: 'good',
      });
      setImageFile(null);
      setImagePreview('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save option');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handlePriceLookup = async () => {
    if (!formData.linkUrl) {
      setPriceLookupMessage('Add an Amazon product link to pull pricing.');
      return;
    }

    try {
      setPriceLookupLoading(true);
      setPriceLookupMessage('');

      const response = await fetch('/api/options/price-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkUrl: formData.linkUrl }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to pull price');
      }

      if (typeof data.price === 'number') {
        setFormData({ ...formData, price: data.price });
        setPriceLookupMessage('Price updated from Amazon.');
      } else {
        setPriceLookupMessage('Price not found for this link.');
      }
    } catch (err) {
      setPriceLookupMessage(err instanceof Error ? err.message : 'Failed to pull price');
    } finally {
      setPriceLookupLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-button text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Product Image *
        </label>
        <div className="flex items-start gap-4">
          {imagePreview && (
            <div className="w-32 h-32 rounded-button overflow-hidden border border-neutral-200">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-neutral-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-button file:border-0
                file:text-sm file:font-medium
                file:bg-brass-50 file:text-brass-700
                hover:file:bg-brass-100
                cursor-pointer"
            />
            <p className="text-xs text-neutral-500 mt-1">
              PNG, JPG, or WebP. Max 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Product Title *
        </label>
        <Input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Moen Arbor Kitchen Faucet"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Category *
        </label>
        <select
          value={formData.categoryId}
          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          className="w-full px-4 py-2 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 focus:border-transparent"
          required
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tier */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Tier
        </label>
        <div className="flex gap-2">
          {(['good', 'better', 'best'] as const).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setFormData({ ...formData, tier })}
              className={`
                flex-1 py-2 px-4 rounded-button border-2 font-medium capitalize transition-all
                ${
                  formData.tier === tier
                    ? 'border-brass-600 bg-brass-50 text-brass-700'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                }
              `}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Price *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600">$</span>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.price || ''}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="pl-8"
            required
          />
        </div>
      </div>

      {/* Link URL */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Product Link (Optional)
        </label>
        <Input
          type="url"
          value={formData.linkUrl}
          onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
          placeholder="https://..."
        />
        <div className="mt-2 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handlePriceLookup}
            disabled={!formData.linkUrl || priceLookupLoading}
          >
            {priceLookupLoading ? 'Fetching price...' : 'Pull price from Amazon'}
          </Button>
          {priceLookupMessage && (
            <span className="text-xs text-neutral-600">{priceLookupMessage}</span>
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          Link to product page or affiliate link
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={submitting || uploading}
          className="flex-1"
        >
          {uploading ? 'Uploading Image...' : submitting ? 'Saving...' : 'Save Option'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting || uploading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
