import { DRIVER_FIELDS } from '../../utils/constants.js';

/**
 * One selected driver in a Disable Driver request. Read-only - the
 * requester cannot edit driver information, only confirm which driver to
 * disable and why.
 */
export default function DisableDriverCard({ driver, onRemove }) {
  const fields = DRIVER_FIELDS.filter((f) => f.key !== 'username');

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500">Username</p>
          <p className="font-medium text-gray-800">{driver.username}</p>
        </div>
        <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-700 text-sm">
          ✕ Remove
        </button>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        {fields.map((f) => (
          <div key={f.key}>
            <p className="text-xs text-gray-500">{f.label}</p>
            <p className="font-medium text-gray-700">{driver[f.key] || '-'}</p>
          </div>
        ))}
        <div>
          <p className="text-xs text-gray-500">Status</p>
          <p className="font-medium text-gray-700">{driver.status || 'Active'}</p>
        </div>
      </div>
    </div>
  );
}
