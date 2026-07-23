import { formatDateTime } from '../../utils/statusColors.js';

export default function RequestTimeline({ history = [] }) {
  if (!history.length) return <p className="text-sm text-gray-400">No history yet.</p>;

  return (
    <ol className="relative border-l border-gray-200 ml-2">
      {history.map((h) => (
        <li key={h.id} className="mb-6 ml-4">
          <div className="absolute w-2.5 h-2.5 bg-primary-500 rounded-full -left-[5px] mt-1.5 border border-white" />
          <p className="text-sm font-medium text-gray-800">
            {h.oldStatus ? `${h.oldStatus} → ${h.newStatus}` : h.newStatus}
          </p>
          <p className="text-xs text-gray-500">
            {h.actor?.fullName || 'System'} · {formatDateTime(h.createdAt)}
          </p>
          {h.remarks && <p className="text-sm text-gray-600 mt-1">{h.remarks}</p>}
        </li>
      ))}
    </ol>
  );
}
