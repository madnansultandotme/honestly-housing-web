'use client';

import { use, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import BuilderHeader from '@/components/navigation/BuilderHeader';
import ClientHeader from '@/components/navigation/ClientHeader';
import { uploadProjectPhoto } from '@/lib/api/upload';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';

export default function ProjectPhotosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, profile } = useAuth();
  const { confirm } = useNotification();
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<'progress' | 'before' | 'after' | 'detail'>('progress');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string>('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadData();
  }, [user, id]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load project info
      const projectData = await apiClient.get(`/api/projects/${id}`);
      setProject(projectData);
      
      // Load photos
      const response = await fetch(`/api/photos?projectId=${id}`);
      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) {
      setError('Please select a file');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // Upload file to Firebase Storage
      const imageUrl = await uploadProjectPhoto(selectedFile, id, user.uid);

      // Save photo metadata to Firestore
      await apiClient.post('/api/photos', {
        projectId: id,
        imageUrl,
        caption: caption || null,
        category,
        uploadedBy: user.uid,
        uploaderName: profile?.displayName || user.email || 'Unknown',
        uploaderRole: profile?.role || 'builder',
      });

      // Reset form
      setSelectedFile(null);
      setCaption('');
      setCategory('progress');
      setPreview('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this photo? This action cannot be undone.',
      'Delete Photo'
    );
    
    if (!confirmed) return;

    try {
      await apiClient.delete(`/api/photos/${photoId}?projectId=${id}`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete photo');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-taupe-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-taupe-50 flex items-center justify-center">
        <div className="text-neutral-600">Project not found</div>
      </div>
    );
  }

  const isBuilder = profile?.role === 'builder' || profile?.role === 'designer' || profile?.role === 'admin';
  const Header = isBuilder ? BuilderHeader : ClientHeader;

  return (
    <div className="min-h-screen bg-taupe-50">
      <Header
        title="Project Photos"
        subtitle={project?.name || 'Photos'}
        showBackButton
      />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        <Card className="mb-8">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Upload Photo</h2>
          <form onSubmit={handleUploadPhoto} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-button text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* File Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Photo File *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 bg-white text-neutral-900"
                />
              </div>
              {selectedFile && (
                <p className="mt-2 text-sm text-neutral-600">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            {/* Preview */}
            {preview && (
              <div className="mt-4">
                <p className="text-sm font-medium text-neutral-700 mb-2">Preview</p>
                <div className="w-full max-w-xs aspect-[4/3] bg-neutral-100 rounded-button overflow-hidden">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 bg-white text-neutral-900"
              >
                <option value="progress">Progress</option>
                <option value="before">Before</option>
                <option value="after">After</option>
                <option value="detail">Detail</option>
              </select>
            </div>

            {/* Caption */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Caption (optional)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption for this photo"
                rows={3}
                className="w-full px-4 py-3 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500 bg-white text-neutral-900"
              />
            </div>

            <Button type="submit" disabled={uploading || !selectedFile}>
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </Button>
          </form>
        </Card>

        {/* Photos Grid */}
        {loading ? (
          <div className="text-neutral-600">Loading photos...</div>
        ) : photos.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-neutral-600">No photos yet. Upload your first photo above.</div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden">
                <div className="aspect-[4/3] bg-neutral-100">
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption || 'Project photo'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  {photo.caption && (
                    <div className="text-sm font-medium text-neutral-900 mb-2">
                      {photo.caption}
                    </div>
                  )}
                  <div className="text-xs text-neutral-600 mb-2">
                    {photo.category && (
                      <span className="inline-block bg-brass-100 text-brass-700 px-2 py-1 rounded mr-2">
                        {photo.category}
                      </span>
                    )}
                    {photo.uploaderName && (
                      <span className="text-neutral-500">by {photo.uploaderName}</span>
                    )}
                  </div>
                  {photo.createdAt && (
                    <div className="text-xs text-neutral-500 mb-3">
                      {new Date(photo.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="w-full text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
