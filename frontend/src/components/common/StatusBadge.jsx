import { statusClass } from '../../utils/statusColors.js';

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusClass(status)}`}>
      {status}
    </span>
  );
}
