interface StatusBadgeProps {
  status: 'not_started' | 'needs_builder_input' | 'awaiting_approval' | 'approved' | 'ordered' | 'installed' | 'pending' | 'in_progress' | 'completed' | 'change_order_pending' | 'setup' | 'active' | 'archived' | string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    not_started: {
      label: 'Not Started',
      className: 'bg-neutral-100 text-neutral-700',
    },
    needs_builder_input: {
      label: 'Needs Builder Input',
      className: 'bg-taupe-100 text-taupe-800',
    },
    awaiting_approval: {
      label: 'Awaiting Approval',
      className: 'bg-brass-100 text-brass-800',
    },
    approved: {
      label: 'Approved',
      className: 'bg-emerald-100 text-emerald-800',
    },
    ordered: {
      label: 'Ordered',
      className: 'bg-blue-100 text-blue-800',
    },
    installed: {
      label: 'Installed',
      className: 'bg-green-100 text-green-800',
    },
    pending: {
      label: 'Pending',
      className: 'bg-taupe-100 text-taupe-800',
    },
    in_progress: {
      label: 'In Progress',
      className: 'bg-brass-100 text-brass-800',
    },
    completed: {
      label: 'Completed',
      className: 'bg-green-100 text-green-800',
    },
    change_order_pending: {
      label: 'Change Order Pending',
      className: 'bg-orange-100 text-orange-800',
    },
    setup: {
      label: 'Setup',
      className: 'bg-blue-100 text-blue-800',
    },
    active: {
      label: 'Active',
      className: 'bg-brass-100 text-brass-800',
    },
    archived: {
      label: 'Archived',
      className: 'bg-neutral-100 text-neutral-700',
    },
  };

  const config = statusConfig[status] || {
    label: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
    className: 'bg-neutral-100 text-neutral-700',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.className} ${className}`}>
      {config.label}
    </span>
  );
}
