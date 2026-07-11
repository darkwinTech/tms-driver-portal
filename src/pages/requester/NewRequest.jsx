import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRequest, uploadAttachment } from '../../api/requests.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { REQUEST_TYPES, DRIVER_FIELDS } from '../../utils/constants.js';
import DriverTable from '../../components/driver/DriverTable.jsx';
import ExcelUploadPanel from '../../components/driver/ExcelUploadPanel.jsx';
import DriverSearchPanel from '../../components/driver/DriverSearchPanel.jsx';
import ModifyDriverCard from '../../components/driver/ModifyDriverCard.jsx';
import DisableDriverCard from '../../components/driver/DisableDriverCard.jsx';
import Alert from '../../components/common/Alert.jsx';

function buildChangeSummary(original, edited) {
  const changed = DRIVER_FIELDS.filter((f) => f.key !== 'username').filter(
    (f) => String(original[f.key] || '') !== String(edited[f.key] || '')
  );
  if (!changed.length) return null;
  return changed.map((f) => `${f.label}: "${original[f.key] || '-'}" → "${edited[f.key] || '-'}"`).join('; ');
}

export default function NewRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requestTypeName, setRequestTypeName] = useState(REQUEST_TYPES[0]);

  // Create Driver state
  const [entryMethod, setEntryMethod] = useState('Manual');
  const [createDrivers, setCreateDrivers] = useState([]);

  // Modify / Disable Driver state: selected existing drivers, keyed by username
  const [selectedDrivers, setSelectedDrivers] = useState([]); // [{ original, edited }]

  // Shared fields
  const [description, setDescription] = useState('');
  const [businessJustification, setBusinessJustification] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [attachments, setAttachments] = useState([]);

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  function handleTypeChange(type) {
    setRequestTypeName(type);
    setSelectedDrivers([]);
    setCreateDrivers([]);
    setError('');
    setFieldErrors([]);
  }

  function handleSelectDriver(driver) {
    setSelectedDrivers((prev) => [...prev, { original: driver, edited: { ...driver } }]);
  }

  function handleUpdateDriverField(username, key, value) {
    setSelectedDrivers((prev) =>
      prev.map((row) => (row.original.username === username ? { ...row, edited: { ...row.edited, [key]: value } } : row))
    );
  }

  function handleRemoveDriver(username) {
    setSelectedDrivers((prev) => prev.filter((row) => row.original.username !== username));
  }

  function buildDriversPayload() {
    if (requestTypeName === 'Create Driver') return createDrivers;

    if (requestTypeName === 'Modify Driver') {
      return selectedDrivers.map(({ original, edited }) => ({
        ...edited,
        changeSummary: buildChangeSummary(original, edited),
      }));
    }

    // Disable Driver: driver info is read-only, carried through unchanged
    return selectedDrivers.map(({ original }) => ({ ...original, driverStatus: 'Disable Requested' }));
  }
  function validateDrivers(drivers) {
  const errors = [];

  const requiredKeys = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'customerGroup',
    'driverClass',
    'operatingHours',
    'poNumber',
    'poExpiry',
  ];

  drivers.forEach((driver, index) => {
    const rowErrors = [];

    DRIVER_FIELDS.forEach((field) => {
      if (
        requiredKeys.includes(field.key) &&
        (!driver[field.key] || String(driver[field.key]).trim() === '')
      ) {
        rowErrors.push(`${field.label} is required`);
      }
    });

    if (rowErrors.length) {
      errors.push({
        row: index + 1,
        errors: rowErrors,
      });
    }
  });

  return errors;
}

  async function handleSubmit() {
    setError('');
    setFieldErrors([]);
    setSubmitting(true);
    try {
      const drivers = buildDriversPayload();
      const validationErrors = validateDrivers(drivers);

      if (validationErrors.length > 0) {
        setFieldErrors(validationErrors);
        setSubmitting(false);
        return;
      }

      if (requestTypeName === 'Disable Driver' && !effectiveDate) {
        setError('Effective Date is required');
        setSubmitting(false);
        return;
      }

      const res = await createRequest({
        requestTypeName,
        entryMethod: requestTypeName === 'Create Driver' ? entryMethod : 'Search',
        drivers,
        description,
        businessJustification,
        effectiveDate: requestTypeName === 'Disable Driver' ? effectiveDate : undefined,
      });

      const newRequest = res.data;

      for (const file of attachments) {
        // eslint-disable-next-line no-await-in-loop
        await uploadAttachment(newRequest.id, file);
      }

      navigate(`/requests/${newRequest.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
      setFieldErrors(err.response?.data?.validationErrors || []);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedUsernames = selectedDrivers.map((row) => row.original.username);

  const descriptionLabel =
    requestTypeName === 'Modify Driver' ? 'Reason for Modification *' : requestTypeName === 'Disable Driver' ? 'Disable Reason *' : 'Description *';

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">New Request</h2>
        <p className="text-sm text-gray-500">Create a driver request for AD / Operations / IT TMS processing.</p>
      </div>

      <Alert type="error">{error}</Alert>
      {fieldErrors.length > 0 && (
        <Alert type="error">
          {fieldErrors.map((fe) => (
            <div key={fe.row}>Row {fe.row}: {fe.errors.join(', ')}</div>
          ))}
        </Alert>
      )}

      {/* Requester info */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium text-gray-800 mb-4">Requester Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Requester</p>
            <p className="font-medium text-gray-800">{user?.fullName}</p>
          </div>
          <div>
            <p className="text-gray-500">Department</p>
            <p className="font-medium text-gray-800">{user?.department || '-'}</p>
          </div>
        </div>
      </section>

      {/* Type of request */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium text-gray-800 mb-4">Type of Request</h3>
        <div className="flex flex-wrap gap-3">
          {REQUEST_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium border ${
                requestTypeName === t
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* ---------------- Create Driver ---------------- */}
      {requestTypeName === 'Create Driver' && (
        <>
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-medium text-gray-800 mb-4">Choose Entry Method</h3>
            <div className="flex flex-wrap gap-3 mb-4">
              {['Manual', 'Excel'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setEntryMethod(m)}
                  className={`px-4 py-2 rounded-md text-sm font-medium border ${
                    entryMethod === m
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {m === 'Manual' ? 'Manual Entry' : 'Excel Upload'}
                </button>
              ))}
            </div>
            {entryMethod === 'Excel' && <ExcelUploadPanel onParsed={setCreateDrivers} />}
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-medium text-gray-800 mb-4">Driver Records ({createDrivers.length})</h3>
            <DriverTable drivers={createDrivers} setDrivers={setCreateDrivers} readOnly={entryMethod === 'Excel'} />
          </section>
        </>
      )}

      {/* ---------------- Modify / Disable Driver ---------------- */}
      {(requestTypeName === 'Modify Driver' || requestTypeName === 'Disable Driver') && (
        <>
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-medium text-gray-800 mb-1">Search Driver</h3>
            <p className="text-sm text-gray-500 mb-4">
              Find the existing driver you want to {requestTypeName === 'Modify Driver' ? 'modify' : 'disable'}, then select them below.
            </p>
            <DriverSearchPanel
              mode={requestTypeName === 'Modify Driver' ? 'modify' : 'disable'}
              excludeUsernames={selectedUsernames}
              onSelect={handleSelectDriver}
            />
          </section>

          <section className="space-y-4">
            <h3 className="font-medium text-gray-800">
              Selected Drivers ({selectedDrivers.length})
            </h3>
            {selectedDrivers.length === 0 && (
              <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400 text-sm">
                No drivers selected yet. Search above and click "Select" to add one.
              </div>
            )}
            {selectedDrivers.map(({ original, edited }) =>
              requestTypeName === 'Modify Driver' ? (
                <ModifyDriverCard
                  key={original.username}
                  original={original}
                  value={edited}
                  onChange={(key, value) => handleUpdateDriverField(original.username, key, value)}
                  onRemove={() => handleRemoveDriver(original.username)}
                />
              ) : (
                <DisableDriverCard
                  key={original.username}
                  driver={original}
                  onRemove={() => handleRemoveDriver(original.username)}
                />
              )
            )}
          </section>
        </>
      )}

      {/* Description / justification / effective date */}
      <section className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{descriptionLabel}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder={
              requestTypeName === 'Modify Driver'
                ? 'What needs to change and why'
                : requestTypeName === 'Disable Driver'
                ? 'e.g. Driver left company'
                : 'Briefly describe this request'
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Justification *</label>
          <textarea
            value={businessJustification}
            onChange={(e) => setBusinessJustification(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Explain why this request is needed"
          />
        </div>

        {requestTypeName === 'Disable Driver' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date *</label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Attachments (Optional)</label>
          <input
            type="file"
            multiple
            onChange={(e) => setAttachments((prev) => [...prev, ...Array.from(e.target.files)])}
            className="text-sm"
          />
          {attachments.length > 0 && (
            <ul className="mt-2 text-sm text-gray-600 space-y-1">
              {attachments.map((f, idx) => (
                <li key={idx} className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-1.5">
                  <span>📎 {f.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleSubmit()}
          className="px-4 py-2 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </div>
  );
}
