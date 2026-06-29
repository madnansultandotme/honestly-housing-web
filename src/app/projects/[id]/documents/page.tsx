'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import BuilderHeader from '@/components/navigation/BuilderHeader';
import ClientHeader from '@/components/navigation/ClientHeader';
import DesignerHeader from '@/components/navigation/DesignerHeader';
import AdminHeader from '@/components/navigation/AdminHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/lib/api/client';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { DocumentTextIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface Project {
  id: string;
  name: string;
  contractUrl?: string;
  contractFileName?: string;
  contractUploadedAt?: string;
  contractUploadedBy?: string;
}

export default function ProjectDocumentsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState('');

  const isBuilder = profile?.role === 'builder' || profile?.role === 'designer' || profile?.role === 'admin';

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchProject();
  }, [user, projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get(`/projects/${projectId}`);
      setProject(data);
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Only PDF files are allowed for construction contracts');
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const fileName = `construction-contract-${Date.now()}.pdf`;
      const storageRef = ref(storage, `contracts/${projectId}/${fileName}`);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // Update project with contract URL
      await apiClient.patch(`/projects/${projectId}`, {
        contractUrl: url,
        contractFileName: file.name,
        contractUploadedAt: new Date().toISOString(),
        contractUploadedBy: user?.uid,
      });

      await fetchProject();
    } catch (err) {
      console.error('Error uploading contract:', err);
      setError('Failed to upload contract');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteContract = async () => {
    if (!project?.contractUrl) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this construction contract? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setUploading(true);
      setError('');

      // Extract file path from URL
      const urlObj = new URL(project.contractUrl);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);

      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
      }

      // Update project to remove contract URL
      await apiClient.patch(`/projects/${projectId}`, {
        contractUrl: null,
        contractFileName: null,
        contractUploadedAt: null,
        contractUploadedBy: null,
      });

      await fetchProject();
    } catch (err) {
      console.error('Error deleting contract:', err);
      setError('Failed to delete contract');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <LoadingOverlay fullScreen message="Loading documents..." />;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  let Header;
  if (profile?.role === 'admin') {
    Header = AdminHeader;
  } else if (profile?.role === 'designer') {
    Header = DesignerHeader;
  } else if (profile?.role === 'builder') {
    Header = BuilderHeader;
  } else {
    Header = ClientHeader;
  }

  return (
    <div className="min-h-screen bg-taupe-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="text-brass-600 hover:text-brass-700 mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Project
          </button>
          <h1 className="text-3xl font-display font-bold text-neutral-900">
            Project Documents
          </h1>
          <p className="text-neutral-600 mt-2">{project.name}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-card text-red-700">
            {error}
          </div>
        )}

        {/* Construction Contract Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Construction Contract</h2>
              <p className="text-sm text-neutral-600 mt-1">
                Upload the signed construction contract for this project
              </p>
            </div>
          </div>

          {project.contractUrl ? (
            /* Existing Contract Display */
            <div className="border-2 border-neutral-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <DocumentTextIcon className="w-12 h-12 text-brass-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {project.contractFileName || 'Construction Contract'}
                    </h3>
                    {project.contractUploadedAt && (
                      <p className="text-sm text-neutral-600">
                        Uploaded on {new Date(project.contractUploadedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                    <div className="flex gap-3 mt-4">
                      <a
                        href={project.contractUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-brass-600 text-white rounded-button hover:bg-brass-700 transition-colors text-sm"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                        View/Download
                      </a>
                      {isBuilder && (
                        <button
                          onClick={handleDeleteContract}
                          disabled={uploading}
                          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-button hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                        >
                          <TrashIcon className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Upload Area */
            <div>
              {isBuilder ? (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-brass-400 hover:bg-brass-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <DocumentTextIcon className="w-16 h-16 text-neutral-400 mb-4" />
                    <p className="mb-2 text-sm text-neutral-600">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-neutral-500">PDF files only (Max 50MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              ) : (
                <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-neutral-200 rounded-lg bg-neutral-50">
                  <DocumentTextIcon className="w-16 h-16 text-neutral-300 mb-4" />
                  <p className="text-sm text-neutral-600">No construction contract uploaded yet</p>
                  <p className="text-xs text-neutral-500 mt-1">Your builder will upload the contract when ready</p>
                </div>
              )}

              {uploading && (
                <div className="mt-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brass-600"></div>
                  <p className="text-sm text-neutral-600 mt-2">Uploading contract...</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Info Section */}
        <Card className="p-4 bg-blue-50 border-blue-200 mt-6">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> The construction contract is a legally binding document. 
            Make sure all parties have reviewed and agreed to the terms before uploading the signed version.
          </p>
        </Card>
      </main>
    </div>
  );
}
