export const STATUS_COLORS = {
  Submitted: 'bg-blue-100 text-blue-700',
  'Under Review': 'bg-amber-100 text-amber-700',
  'Returned to Requester': 'bg-orange-100 text-orange-700',
  Approved: 'bg-teal-100 text-teal-700',
  Processing: 'bg-indigo-100 text-indigo-700',
  Completed: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

export function statusClass(status) {
  return STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
}

export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
