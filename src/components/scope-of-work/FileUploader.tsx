'use client';

import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import Button from '@/components/ui/Button';
import { PaperClipIcon, TrashIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface FileUploaderProps {
  projectId: string;
  categoryId: string;
  files: string[];
  onChange: (files: string[]) => void;
  maxFiles?: number;
}

export default function FileUploader({ 
  projectId, 
  categoryId, 
  files, 
  onChange,
  maxFiles = 10 
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    
    if (files.length + fileList.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files`);
      return;
    }

    try {
      setUploading(true);
      const newFileUrls: string[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        
        // Validate file type
        const validTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp'
        ];
        
        if (!validTypes.includes(file.type)) {
          alert(`File "${file.name}" has an invalid type. Allowed: PDF, DOC, DOCX, Images`);
          continue;
        }
        
        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File "${file.name}" is too large. Maximum size: 10MB`);
          continue;
        }

        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name}`;
        const storageRef = ref(storage, `scopeOfWork/${projectId}/${categoryId}/${fileName}`);
        
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        newFileUrls.push(url);
      }

      onChange([...files, ...newFileUrls]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileUrl: string) => {
    try {
      // Extract file path from URL
      const urlObj = new URL(fileUrl);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);
      
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
      }

      onChange(files.filter(f => f !== fileUrl));
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const getFileName = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);
      
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        const parts = filePath.split('/');
        const fileName = parts[parts.length - 1];
        // Remove timestamp prefix if present
        return fileName.replace(/^\d+-/, '');
      }
      
      return 'Unknown file';
    } catch {
      return 'Unknown file';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-card p-6
          transition-colors duration-200
          ${dragActive 
            ? 'border-brass-500 bg-brass-50' 
            : 'border-neutral-300 hover:border-brass-400'
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          <PaperClipIcon className="w-12 h-12 text-neutral-400" />
          <div className="text-center">
            <p className="text-sm text-neutral-600">
              Drag and drop files here, or
            </p>
            <label className="cursor-pointer">
              <span className="text-sm text-brass-600 hover:text-brass-700 font-medium">
                browse files
              </span>
              <input
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={uploading}
              />
            </label>
          </div>
          <p className="text-xs text-neutral-500">
            PDF, DOC, DOCX, Images • Max 10MB per file • Up to {maxFiles} files
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-700">
            Uploaded Files ({files.length})
          </p>
          <div className="space-y-2">
            {files.map((fileUrl, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <DocumentIcon className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brass-600 hover:text-brass-700 truncate"
                  >
                    {getFileName(fileUrl)}
                  </a>
                </div>
                <button
                  onClick={() => handleDelete(fileUrl)}
                  className="ml-2 p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                  title="Delete file"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploading && (
        <div className="text-center">
          <p className="text-sm text-neutral-600">Uploading files...</p>
        </div>
      )}
    </div>
  );
}
