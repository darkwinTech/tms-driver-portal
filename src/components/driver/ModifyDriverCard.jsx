import { DRIVER_FIELDS } from '../../utils/constants.js';

const EDITABLE_FIELDS = DRIVER_FIELDS.filter((f) => ['poNumber', 'poExpiry'].includes(f.key));

/**
 * One selected driver in a Modify Driver request: only PO Number / PO
 * Expiry Date can be changed here - shows the original value next to each
 * editable field, and highlights whichever ones the requester has actually
 * changed so the processor can see the diff at a glance.
 */
export default function ModifyDriverCard({ original, value, onChange }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="mb-3">
        <p className="text-xs text-gray-500">Username</p>
        <p className="font-medium text-gray-800">{original.username}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {EDITABLE_FIELDS.map((f) => {
          const oldVal = original[f.key] || '-';
          const newVal = value[f.key] || '';
          const changed = String(original[f.key] || '') !== String(newVal);

          return (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
              <input
                type={f.type || 'text'}
                value={newVal}
                onChange={(e) => onChange(f.key, e.target.value)}
                className={`w-full border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 ${
                  changed ? 'border-amber-400 bg-amber-50' : 'border-gray-300'
                }`}
              />
              {changed && (
                <p className="text-xs text-gray-400 mt-1">
                  was: <span className="line-through">{oldVal}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
