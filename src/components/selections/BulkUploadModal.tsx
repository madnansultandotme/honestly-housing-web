import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useNotification } from '@/contexts/NotificationContext';

interface BulkUploadModalProps {
  projectId: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkUploadModal({
  projectId,
  userId,
  onClose,
  onSuccess,
}: BulkUploadModalProps) {
  const { showSuccess, showError } = useNotification();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`/api/selections/template?projectId=${projectId}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `selections-template-${projectId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download template:', error);
      showError('Failed to download template');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showError('Please select a file');
      return;
    }

    try {
      setUploading(true);
      setResults(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvData = e.target?.result as string;

        const response = await fetch('/api/selections/bulk-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            csvData,
            createdBy: userId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Upload failed');
        }

        setResults(data.results);
        
        if (data.results.success > 0) {
          showSuccess(`Successfully imported ${data.results.success} selections`);
          if (data.results.failed === 0) {
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 2000);
          }
        }

        if (data.results.failed > 0) {
          showError(`${data.results.failed} selections failed to import`);
        }
      };

      reader.readAsText(file);
    } catch (error: any) {
      console.error('Upload error:', error);
      showError(error.message || 'Failed to upload selections');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-neutral-900">
              Bulk Upload Selections
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

          {/* Instructions */}
          <div className="mb-6 p-4 bg-brass-50 border border-brass-200 rounded-button">
            <h3 className="font-semibold text-neutral-900 mb-2">How to use:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-neutral-700">
              <li>Download the CSV template below</li>
              <li>Fill in your selections data (Category, Name, RoomName, Quantity, etc.)</li>
              <li>Save the file and upload it here</li>
              <li>Review the results and fix any errors if needed</li>
            </ol>
          </div>

          {/* Download Template */}
          <div className="mb-6">
            <Button
              onClick={handleDownloadTemplate}
              variant="outline"
              className="w-full"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download CSV Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Upload CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full px-4 py-3 border border-neutral-300 rounded-button focus:outline-none focus:ring-2 focus:ring-brass-500"
            />
            {file && (
              <div className="mt-2 text-sm text-neutral-600">
                Selected: {file.name}
              </div>
            )}
          </div>

          {/* Results */}
          {results && (
            <div className="mb-6 p-4 bg-taupe-50 rounded-button">
              <h3 className="font-semibold text-neutral-900 mb-3">Upload Results</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-button">
                  <div className="text-sm text-neutral-600">Successful</div>
                  <div className="text-2xl font-bold text-green-700">{results.success}</div>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-button">
                  <div className="text-sm text-neutral-600">Failed</div>
                  <div className="text-2xl font-bold text-red-700">{results.failed}</div>
                </div>
              </div>

              {results.errors && results.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-neutral-900 mb-2">Errors:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {results.errors.map((error: string, index: number) => (
                      <div key={index} className="text-sm text-red-600">
                        {error}
                      </div>
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
              {uploading ? 'Uploading...' : 'Upload Selections'}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              disabled={uploading}
            >
              {results && results.success > 0 ? 'Done' : 'Cancel'}
            </Button>
          </div>

          {/* CSV Format Reference */}
          <div className="mt-6 p-4 bg-neutral-50 rounded-button">
            <h3 className="font-semibold text-neutral-900 mb-2 text-sm">CSV Format:</h3>
            <div className="text-xs text-neutral-600 space-y-1">
              <div><strong>Required:</strong> Category, Name, RoomName</div>
              <div><strong>Optional:</strong> Quantity, Brand, Price, Description, DueDate, SubType</div>
              <div><strong>SubType:</strong> For Paint category only (trim, ceiling, walls, cabinets)</div>
              <div><strong>DueDate:</strong> Format: YYYY-MM-DD (e.g., 2024-12-31)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
