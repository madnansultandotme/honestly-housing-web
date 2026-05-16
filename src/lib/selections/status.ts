const COMPLETED_STATUSES = new Set(['approved', 'installed']);
const PENDING_APPROVAL_STATUSES = new Set([
  'awaiting_approval',
  'awaitingClientApproval',
  'notStarted',
  'not_started',
]);

export function isSelectionCompleted(status?: string | null) {
  return COMPLETED_STATUSES.has(String(status || ''));
}

export function isSelectionPendingApproval(status?: string | null) {
  return PENDING_APPROVAL_STATUSES.has(String(status || ''));
}

export function isSelectionOpen(status?: string | null) {
  return !isSelectionCompleted(status);
}
