import Image from 'next/image';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import BudgetImpactRow from './BudgetImpactRow';

interface VisualApprovalCardProps {
  imageUrl: string;
  category: string;
  brand?: string;
  itemName: string;
  allowance: number;
  actualCost: number;
  notes?: string;
  dueDate?: string;
  status: 'not_started' | 'needs_builder_input' | 'awaiting_approval' | 'approved' | 'ordered' | 'installed';
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
  dueDate,
  status,
  onApprove,
  onRequestChange,
  showActions = true,
}: VisualApprovalCardProps) {
  return (
    <div className="bg-white rounded-card shadow-card overflow-hidden">
      {/* Image */}
      <div className="relative w-full aspect-[4/3] bg-neutral-100">
        <Image
          src={imageUrl}
          alt={itemName}
          fill
          className="object-cover"
        />
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
        {showActions && status === 'awaiting_approval' && (
          <div className="flex gap-3 pt-2">
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
      </div>
    </div>
  );
}
