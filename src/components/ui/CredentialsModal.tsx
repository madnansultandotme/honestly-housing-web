'use client';

import { useEffect } from 'react';
import Button from './Button';

interface CredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentials: {
    email: string;
    password: string;
    displayName: string;
  };
  projectName?: string;
}

export default function CredentialsModal({
  isOpen,
  onClose,
  credentials,
  projectName,
}: CredentialsModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const content = `
HONESTLY HOUSING - CLIENT CREDENTIALS
=====================================

Project: ${projectName || 'New Project'}
Created: ${new Date().toLocaleString()}

CLIENT INFORMATION:
-------------------
Name: ${credentials.displayName}
Email: ${credentials.email}
Password: ${credentials.password}

LOGIN INSTRUCTIONS:
-------------------
1. Go to the Honestly Housing login page
2. Enter your email: ${credentials.email}
3. Enter your password: ${credentials.password}
4. Click "Sign In"

IMPORTANT NOTES:
----------------
- Please change your password after first login
- Keep these credentials secure
- Do not share your password with anyone
- Contact your builder if you have any issues

=====================================
© ${new Date().getFullYear()} Honestly Housing
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${credentials.displayName.replace(/\s+/g, '_')}_credentials.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const text = `Email: ${credentials.email}\nPassword: ${credentials.password}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-card shadow-xl max-w-lg w-full p-6 animate-scale-in">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-display font-semibold text-neutral-900 mb-2">
              Client Account Created Successfully!
            </h3>
            <p className="text-sm text-neutral-600">
              Login credentials have been sent to <strong>{credentials.email}</strong>
            </p>
          </div>

          {/* Credentials Display */}
          <div className="bg-taupe-50 border-2 border-brass-200 rounded-button p-4 mb-6">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
                  Client Name
                </label>
                <div className="mt-1 text-sm font-semibold text-neutral-900">
                  {credentials.displayName}
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
                  Email
                </label>
                <div className="mt-1 text-sm font-mono text-neutral-900 break-all">
                  {credentials.email}
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
                  Password
                </label>
                <div className="mt-1 text-sm font-mono text-neutral-900 bg-white px-3 py-2 rounded border border-neutral-300">
                  {credentials.password}
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Important:</strong> Save these credentials now. The password cannot be retrieved later.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download as Text
            </Button>
            
            <Button
              variant="outline"
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy to Clipboard
            </Button>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={onClose}
              className="text-sm text-neutral-600 hover:text-neutral-900 underline"
            >
              Close and Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
