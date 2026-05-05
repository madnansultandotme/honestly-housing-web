import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function uploadFile(
  file: File,
  path: string
): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

export async function uploadProjectPhoto(
  file: File,
  projectId: string,
  userId: string
): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const path = `projects/${projectId}/photos/${fileName}`;
  return uploadFile(file, path);
}

export async function uploadUserAvatar(
  file: File,
  userId: string
): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const path = `users/${userId}/avatar/${fileName}`;
  return uploadFile(file, path);
}

export async function uploadImage(
  file: File,
  folder: string
): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const path = `${folder}/${fileName}`;
  return uploadFile(file, path);
}
