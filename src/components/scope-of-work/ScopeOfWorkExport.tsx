'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface ScopeOfWorkExportProps {
  projectId: string;
  projectName: string;
}

export default function ScopeOfWorkExport({ projectId, projectName }: ScopeOfWorkExportProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);

      // Open in new window - browser can print to PDF
      const url = `/api/scope-of-work/export?projectId=${projectId}&format=html`;
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        // Wait a bit for content to load, then trigger print dialog
        setTimeout(() => {
          printWindow.print();
        }, 1000);
      }
    } catch (error) {
      console.error('Error exporting scope of work:', error);
      alert('Failed to export scope of work');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={exporting}
      variant="outline"
      className="flex items-center gap-2"
    >
      <DocumentArrowDownIcon className="w-5 h-5" />
      {exporting ? 'Generating...' : 'Export Scope of Work'}
    </Button>
  );
}
