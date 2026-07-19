import { useState } from 'react';
import { updateDriverProfile, completeDriverProfiles } from '../../api/requests.js';
import { formatDateTime } from '../../utils/statusColors.js';
import OperatingHoursPicker from '../driver/OperatingHoursPicker.jsx';
import Alert from '../common/Alert.jsx';

// The three requester-hidden fields Operations completes during Processing.
const PROFILE_FIELDS = [
  { key: 'customerGroup', label: 'Group / Customer', placeholder: 'e.g. CUEU/ARCO' },
  { key: 'driverClass', label: 'Driver Class', placeholder: 'e.g. 30Ton_Drivers' },
  { key: 'operatingHours', label: 'Operating Hours' },
];

function profileValues(driver) {
  return PROFILE_FIELDS.reduce((acc, f) => {
    acc[f.key] = driver[f.key] || '';
    return acc;
  }, {});
}

function DriverProfileEditor({ requestId, driver, locked, onUpdated, onError }) {
  const [values, setValues] = useState(() => profileValues(driver));
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const dirty = PROFILE_FIELDS.some((f) => (values[f.key] || '') !== (driver[f.key] || ''));

  function setField(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setBusy(true);
    onError('');
    try {
      const res = await updateDriverProfile(requestId, driver.id, values);
      setSaved(true);
      onUpdated(res.data);
    } catch (err) {
      onError(err.response?.data?.message || 'Failed to save driver profile');
    } finally {
      setBusy(false);
    }
  }

  const missing = PROFILE_FIELDS.filter((f) => !(driver[f.key] || '').trim());

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <p className="font-medium text-gray-800">{driver.firstName} {driver.lastName}</p>
          <p className="text-xs text-gray-500">{driver.email} · {driver.phone}</p>
        </div>
        {locked ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Profile complete</span>
        ) : missing.length === 0 ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">All fields filled</span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            Missing: {missing.map((f) => f.label).join(', ')}
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {PROFILE_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
            {locked ? (
              <p className="text-sm text-gray-800 border border-gray-100 bg-gray-50 rounded-md px-3 py-2">
                {driver[f.key] || '-'}
              </p>
            ) : f.key === 'operatingHours' ? (
              <OperatingHoursPicker value={values[f.key]} onChange={(v) => setField(f.key, v)} />
            ) : (
              <input
                value={values[f.key]}
                placeholder={f.placeholder}
                onChange={(e) => setField(f.key, e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            )}
          </div>
        ))}
      </div>

      {!locked && (
        <div className="flex items-center justify-end gap-3 mt-3">
          {saved && !dirty && <span className="text-xs text-green-600">Saved</span>}
          {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
          <button
            type="button"
            disabled={busy || !dirty}
            onClick={handleSave}
            className="px-4 py-1.5 rounded-md text-sm font-medium bg-white border border-primary-600 text-primary-600 hover:bg-primary-50 disabled:opacity-50"
          >
            {busy ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Processing-stage panel for Operations: lists every driver on the request
 * with editable Group/Customer, Driver Class and Operating Hours fields, and
 * the "Complete Driver Profiles" action. Completion validates that all three
 * fields are filled for every driver; afterwards the panel locks. The
 * request intentionally stays in Processing - routing to the AD Team /
 * secondary processors arrives in a future sprint.
 */
export default function DriverProfilePanel({ request, onUpdated }) {
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  const drivers = request.drivers || [];
  const completed = Boolean(request.driverProfilesCompletedAt);

  async function handleComplete() {
    setBusy(true);
    setError('');
    setValidationErrors([]);
    try {
      const res = await completeDriverProfiles(request.id);
      onUpdated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete driver profiles');
      setValidationErrors(err.response?.data?.validationErrors || []);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h3 className="font-medium text-gray-800">Driver Profile Completion</h3>
        {completed && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">
            Completed {formatDateTime(request.driverProfilesCompletedAt)}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-4">
        {completed
          ? 'All driver profiles are complete. The request will be routed to the next processing team in a future stage.'
          : 'Fill in Group / Customer, Driver Class and Operating Hours for every driver, save each one, then complete the profiles.'}
      </p>

      <Alert type="error">{error}</Alert>
      {validationErrors.length > 0 && (
        <ul className="mb-3 text-sm text-red-600 list-disc pl-5 space-y-0.5">
          {validationErrors.map((v) => (
            <li key={v.driverId}>
              <span className="font-medium">{v.driverName}</span>: missing {v.missing.join(', ')}
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-4">
        {drivers.map((d) => (
          <DriverProfileEditor
            key={d.id}
            requestId={request.id}
            driver={d}
            locked={completed}
            onUpdated={onUpdated}
            onError={setError}
          />
        ))}
      </div>

      {!completed && (
        <div className="mt-5 border-t pt-4 flex justify-end">
          <button
            type="button"
            disabled={busy || drivers.length === 0}
            onClick={handleComplete}
            className="px-5 py-2.5 rounded-md text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {busy ? 'Completing...' : 'Complete Driver Profiles'}
          </button>
        </div>
      )}
    </section>
  );
}
