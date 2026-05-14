"use client";

import Image from 'next/image';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import BudgetImpactRow from './BudgetImpactRow';
import ImageViewer from '@/components/ui/ImageViewer';

interface VisualApprovalCardProps {
  imageUrl: string;
  category: string;
  brand?: string;
  itemName: string;
  allowance: number;
  actualCost: number;
  notes?: string;
  productLink?: string;
  dueDate?: string;
  status: 'not_started' | 'notStarted' | 'needs_builder_input' | 'awaiting_approval' | 'awaitingClientApproval' | 'approved' | 'ordered' | 'installed';
  onApprove?: () => void;
  onRequestChange?: () => void;
  showActions?: boolean;
}

export default function VisualApprovalCard({
  imageUrl,
  category,
  brand,
  itemName,
  allowance,
  actualCost,
  notes,
  productLink,
  dueDate,
  status,
  onApprove,
  onRequestChange,
  showActions = true,
}: VisualApprovalCardProps) {
  const [showViewer, setShowViewer] = useState(false);

  console.log('[VisualApprovalCard] Render:', { status, showActions });
  
  return (
    <div className="bg-white rounded-card shadow-card overflow-hidden">
      {/* Image */}
      <div className="relative w-full aspect-[4/3] bg-neutral-100">
        {imageUrl && imageUrl !== '/placeholder-image.jpg' ? (
          <Image
            src={imageUrl}
            alt={itemName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-neutral-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-neutral-500">Image not available</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Category & Status */}
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm text-neutral-600 mb-1">{category}</div>
            <h3 className="text-xl font-display font-semibold text-neutral-900">
              {brand && <span className="text-brass-700">{brand}</span>}
              {brand && ' '}
              {itemName}
            </h3>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Budget Impact */}
        <BudgetImpactRow allowance={allowance} actualCost={actualCost} />

        {/* Details */}
        <div className="space-y-2">
          {notes && (
            <div>
              <div className="text-sm font-medium text-neutral-700 mb-1">Notes</div>
              <p className="text-sm text-neutral-600">{notes}</p>
            </div>
          )}
          
          {productLink && (
            <div>
              <div className="text-sm font-medium text-neutral-700 mb-1">Product Link</div>
              <a
                href={productLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brass-600 hover:text-brass-700 underline flex items-center gap-1"
              >
                View Product
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
          
          {dueDate && (
            <div className="flex items-center text-sm text-neutral-600">
              <svg className="w-4 h-4 mr-2 text-brass-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Due: {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-3 pt-2">
            {imageUrl && imageUrl !== '/placeholder-image.jpg' && (
              <Button
                variant="outline"
                onClick={() => setShowViewer(true)}
                className="mr-2"
              >
                View Image
              </Button>
            )}
            <Button
              onClick={onApprove}
              className="flex-1"
            >
              Approve
            </Button>
            <Button
              onClick={onRequestChange}
              variant="outline"
              className="flex-1"
            >
              Request Change
            </Button>
          </div>
        )}
      {showViewer && (
        <ImageViewer images={[imageUrl]} initialIndex={0} onClose={() => setShowViewer(false)} />
      )}
      </div>
    </div>
  );
}
