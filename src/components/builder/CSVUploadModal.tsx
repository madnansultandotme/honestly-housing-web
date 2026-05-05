'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { apiClient } from '@/lib/api/client';

interface CSVUploadModalProps {
  builderOrgId: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function CSVUploadModal({ builderOrgId, onSuccess, onClose }: CSVUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setError('');
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // Read file content
      const text = await file.text();

      // Upload to API
      const response = await apiClient.post('/api/options/bulk-upload', {
        csvData: text,
        builderOrgId,
      });

      setResult(response);

      if (response.imported > 0) {
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload CSV');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `title,category,price,tier,linkUrl,imageUrl
Moen Arbor Kitchen Faucet,Plumbing,420.00,better,https://amazon.com/...,https://example.com/image.jpg
Delta Trinsic Faucet,Plumbing,350.00,good,https://amazon.com/...,https://example.com/image.jpg
Kohler Purist Faucet,Plumbing,650.00,best,https://amazon.com/...,https://example.com/image.jpg`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'options-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-card max-w-2xl w-full p-6">
        <h2 className="text-2xl font-display font-bold text-neutral-900 mb-6">
          Bulk Upload Options from CSV
        </h2>

        {/* Instructions */}
        <div className="mb-6 p-4 bg-brass-50 border border-brass-200 rounded-button">
          <h3 className="font-semibold text-brass-900 mb-2">CSV Format Instructions</h3>
          <p className="text-sm text-brass-800 mb-2">
            Your CSV file should include these columns:
          </p>
          <ul className="text-sm text-brass-800 list-disc list-inside space-y-1">
            <li><strong>title</strong> (required) - Product name</li>
            <li><strong>category</strong> (required) - Category name (e.g., Plumbing, Lighting)</li>
            <li><strong>price</strong> (required) - Price in dollars (e.g., 420.00)</li>
            <li><strong>tier</strong> (optional) - good, better, or best</li>
            <li><strong>linkUrl</strong> (optional) - Product link (Amazon affiliate link)</li>
            <li><strong>imageUrl</strong> (optional) - Image URL</li>
          </ul>
          <button
            onClick={downloadTemplate}
            className="mt-3 text-sm text-brass-700 hover:text-brass-800 underline"
          >
            Download CSV Template
          </button>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Select CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-neutral-600
              file:mr-4 file:py-2 file:px-4
              file:rounded-button file:border-0
              file:text-sm file:font-medium
              file:bg-brass-50 file:text-brass-700
              hover:file:bg-brass-100
              cursor-pointer"
          />
          {file && (
            <p className="text-sm text-neutral-600 mt-2">
              Selected: {file.name}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-button text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-button">
            <div className="text-green-900 font-semibold mb-2">
              ✓ Upload Complete!
            </div>
            <div className="text-sm text-green-800">
              Successfully imported {result.imported} options
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-3">
                <div className="text-sm text-orange-800 font-medium mb-1">
                  Warnings ({result.errors.length}):
                </div>
                <div className="text-xs text-orange-700 max-h-32 overflow-y-auto">
                  {result.errors.map((err: string, i: number) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1"
          >
            {uploading ? 'Uploading...' : 'Upload CSV'}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            disabled={uploading}
          >
            {result ? 'Close' : 'Cancel'}
          </Button>
        </div>
      </div>
    </div>
  );
}
