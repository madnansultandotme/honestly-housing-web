import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { uploadProjectPhoto } from '@/lib/api/upload';

export function usePhotos(projectId: string) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchPhotos();
    }
  }, [projectId]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getPhotos(projectId) as any;
      setPhotos(response.photos || response || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (
    file: File,
    userId: string,
    caption?: string
  ) => {
    try {
      setUploading(true);
      
      // Upload file to Firebase Storage
      const url = await uploadProjectPhoto(file, projectId, userId);
      
      // Save photo metadata to Firestore via API
      const response = await apiClient.uploadPhoto({
        projectId,
        url,
        caption,
        uploadedBy: userId,
      });
      
      await fetchPhotos(); // Refresh list
      return response;
    } catch (err: any) {
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return {
    photos,
    loading,
    error,
    uploading,
    uploadPhoto,
    refresh: fetchPhotos,
  };
}
