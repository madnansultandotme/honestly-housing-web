'use client';

import { useState } from 'react';
import Button from './Button';

interface ScopeOfWorkDownloadProps {
  projectId: string;
  projectName?: string;
  className?: string;
}

type DownloadFormat = 'txt' | 'md' | 'html';

export default function ScopeOfWorkDownload({ 
  projectId, 
  projectName = 'Project',
  className = '' 
}: ScopeOfWorkDownloadProps) {
  const [downloading, setDownloading] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async (format: DownloadFormat) => {
    try {
      setDownloading(true);
      setError('');
      setShowFormatMenu(false);

      const response = await fetch(`/api/export/scope-of-work?projectId=${projectId}&format=${format}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download scope of work');
      }

      // Get the blob and create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Extract filename from content-disposition header or use default
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `${projectName}_Scope_of_Work.${format}`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Failed to download');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Download Button - Responsive */}
      <div className="flex gap-2">
        <Button
          onClick={() => handleDownload('txt')}
          disabled={downloading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="hidden sm:inline">{downloading ? 'Downloading...' : 'Download Scope of Work'}</span>
          <span className="sm:hidden">{downloading ? 'Downloading...' : 'Scope'}</span>
        </Button>

        {/* Format Selector Button */}
        <button
          onClick={() => setShowFormatMenu(!showFormatMenu)}
          disabled={downloading}
          className="px-2 sm:px-3 py-2 border-2 border-brass-600 text-brass-600 hover:bg-brass-50 rounded-button transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Choose format"
          aria-label="Choose download format"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Format Menu - Mobile Responsive */}
      {showFormatMenu && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-neutral-300 rounded-button shadow-lg z-50 w-screen max-w-xs sm:min-w-[200px] sm:w-auto">
          <div className="p-2">
            <p className="text-xs font-medium text-neutral-600 px-3 py-2 uppercase">
              Choose Format
            </p>
            <button
              onClick={() => handleDownload('txt')}
              disabled={downloading}
              className="w-full text-left px-3 py-2 text-sm hover:bg-brass-50 rounded transition-colors flex items-center gap-3 disabled:opacity-50"
            >
              <svg className="w-4 h-4 text-brass-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">Plain Text (.txt)</div>
                <div className="text-xs text-neutral-500">Simple text format</div>
              </div>
            </button>
            <button
              onClick={() => handleDownload('md')}
              disabled={downloading}
              className="w-full text-left px-3 py-2 text-sm hover:bg-brass-50 rounded transition-colors flex items-center gap-3 disabled:opacity-50"
            >
              <svg className="w-4 h-4 text-brass-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">Markdown (.md)</div>
                <div className="text-xs text-neutral-500">Formatted text</div>
              </div>
            </button>
            <button
              onClick={() => handleDownload('html')}
              disabled={downloading}
              className="w-full text-left px-3 py-2 text-sm hover:bg-brass-50 rounded transition-colors flex items-center gap-3 disabled:opacity-50"
            >
              <svg className="w-4 h-4 text-brass-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">HTML (.html)</div>
                <div className="text-xs text-neutral-500">Styled web page</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Error Message - Mobile Responsive */}
      {error && (
        <div className="absolute top-full mt-2 left-0 right-0 p-3 bg-red-50 border border-red-200 rounded-button text-red-700 text-xs sm:text-sm z-50 max-w-xs sm:max-w-none">
          {error}
        </div>
      )}

      {/* Click outside to close menu */}
      {showFormatMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowFormatMenu(false)}
        />
      )}
    </div>
  );
}
