import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { createRequest, getRequest, resubmitRequest, uploadAttachment } from '../../api/requests.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { REQUEST_TYPES, DRIVER_FIELDS } from '../../utils/constants.js';
import { validateField, findDuplicateLicenseNumberIndexes } from '../../utils/validators.js';
import DriverTable from '../../components/driver/DriverTable.jsx';
import ExcelUploadPanel from '../../components/driver/ExcelUploadPanel.jsx';
import DriverSearchPanel from '../../components/driver/DriverSearchPanel.jsx';
import ModifyDriverCard from '../../components/driver/ModifyDriverCard.jsx';
import DisableDriverCard from '../../components/driver/DisableDriverCard.jsx';
import Alert from '../../components/common/Alert.jsx';
import Spinner from '../../components/common/Spinner.jsx';

const FILE_FIELDS = DRIVER_FIELDS.filter((f) => f.type === 'file');

const PAGE_COPY = {
  'Create Driver': { title: 'Create New Driver', subtitle: 'Submit a new driver account request for processing.' },
  'Modify Driver': { title: 'Modify Existing Driver', subtitle: 'Search for an existing driver and update their PO details.' },
  'Disable Driver': { title: 'Disable Existing Driver', subtitle: 'Search for an existing driver and request that their access be disabled.' },
};

function buildChangeSummary(original, edited) {
  const changed = DRIVER_FIELDS.filter((f) => f.key !== 'username').filter(
    (f) => String(original[f.key] || '') !== String(edited[f.key] || '')
  );
  if (!changed.length) return null;
  return changed.map((f) => `${f.label}: "${original[f.key] || '-'}" → "${edited[f.key] || '-'}"`).join('; ');
}

export default function NewRequest({ requestType }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditMode = Boolean(editId);

  const [loadingExisting, setLoadingExisting] = useState(isEditMode);
  const [returnedRemark, setReturnedRemark] = useState('');

  // The request type is fixed by which page/route the requester is on
  // (chosen from the sidebar) rather than an in-form switcher - edit mode
  // overrides it once the actual request loads, since it could be any type.
  const [requestTypeName, setRequestTypeName] = useState(requestType || REQUEST_TYPES[0]);

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
  const [forceValidate, setForceValidate] = useState(false);

  useEffect(() => {
    if (!isEditMode) return;
    getRequest(editId)
      .then((res) => {
        const req = res.data;
        setRequestTypeName(req.requestType?.name || REQUEST_TYPES[0]);
        setDescription(req.description || '');
        setBusinessJustification(req.businessJustification || '');
        setEffectiveDate(req.effectiveDate ? req.effectiveDate.slice(0, 10) : '');

        if (req.requestType?.name === 'Create Driver') {
          setCreateDrivers((req.drivers || []).map((d) => ({ ...d })));
        } else {
          setSelectedDrivers((req.drivers || []).map((d) => ({ original: { ...d }, edited: { ...d } })));
        }

        const returned = [...(req.history || [])].reverse().find((h) => h.newStatus === 'Returned to Requester');
        setReturnedRemark(returned?.remarks || '');
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load request'))
      .finally(() => setLoadingExisting(false));
  }, [editId, isEditMode]);

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

    // createOnly fields (license, insurance, city, documents) only apply to
    // Create Driver requests - Modify/Disable rows never carry them. Editing
    // a returned request doesn't re-populate file inputs, so skip
    // re-requiring uploads there (the originals are still attached
    // server-side). Runs the same field-level checks (required, format,
    // length, allowed characters, date rules, file type/size) as the live
    // table so nothing invalid can slip through on submit.
    const fieldsToCheck = DRIVER_FIELDS.filter(
      (f) =>
        !f.hiddenFromRequester &&
        !(isEditMode && f.type === 'file') &&
        !(f.createOnly && requestTypeName !== 'Create Driver')
    );

    const duplicateIndexes =
      requestTypeName === 'Create Driver' ? findDuplicateLicenseNumberIndexes(drivers) : new Set();

    drivers.forEach((driver, index) => {
      const rowErrors = fieldsToCheck
        .map((field) => validateField(field, driver[field.key], { requireCreateFields: requestTypeName === 'Create Driver' }))
        .filter(Boolean);

      if (duplicateIndexes.has(index)) {
        rowErrors.push('Driver License/ID/IQAMA Number is duplicated within this submission');
      }

      if (rowErrors.length) {
        errors.push({ row: index + 1, errors: rowErrors });
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
        setForceValidate(true);
        setSubmitting(false);
        return;
      }

      if (requestTypeName === 'Disable Driver') {
        if (!effectiveDate) {
          setError('Effective Date is required');
          setSubmitting(false);
          return;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(effectiveDate).getTime() < today.getTime()) {
          setError('Effective Date cannot be in the past');
          setSubmitting(false);
          return;
        }
      }

      // Driver license/ID/photo uploads are File objects that can't be
      // serialized into db.drivers - they're uploaded separately below,
      // linked to their driver row via driverIndex/docType.
      const driversForSubmit = drivers.map((d) => {
        const stripped = { ...d };
        FILE_FIELDS.forEach((f) => delete stripped[f.key]);
        return stripped;
      });

      const res = isEditMode
        ? await resubmitRequest(editId, {
            description,
            businessJustification,
            drivers: driversForSubmit,
            effectiveDate: requestTypeName === 'Disable Driver' ? effectiveDate : undefined,
          })
        : await createRequest({
            requestTypeName,
            entryMethod: requestTypeName === 'Create Driver' ? entryMethod : 'Search',
            drivers: driversForSubmit,
            description,
            businessJustification,
            effectiveDate: requestTypeName === 'Disable Driver' ? effectiveDate : undefined,
          });

      const savedRequest = res.data;

      for (const file of attachments) {
        // eslint-disable-next-line no-await-in-loop
        await uploadAttachment(savedRequest.id, file);
      }

      if (requestTypeName === 'Create Driver') {
        for (let idx = 0; idx < drivers.length; idx++) {
          const driver = drivers[idx];
          for (const f of FILE_FIELDS) {
            const file = driver[f.key];
            if (file instanceof File) {
              const docType = f.label.replace(/^Driver\s+/, '');
              // eslint-disable-next-line no-await-in-loop
              await uploadAttachment(savedRequest.id, file, { driverIndex: idx, docType });
            }
          }
        }
      }

      navigate(`/requests/${savedRequest.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
      setFieldErrors(err.response?.data?.validationErrors || []);
      setForceValidate(true);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedUsernames = selectedDrivers.map((row) => row.original.username);

  const descriptionLabel =
    requestTypeName === 'Modify Driver' ? 'Reason for Modification *' : requestTypeName === 'Disable Driver' ? 'Disable Reason *' : 'Description *';

  if (loadingExisting) return <Spinner full />;

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">
          {isEditMode ? 'Edit & Resubmit Request' : PAGE_COPY[requestTypeName]?.title || 'New Request'}
        </h2>
        <p className="text-sm text-gray-500">
          {isEditMode
            ? 'Address the comments below, then resubmit for another review.'
            : PAGE_COPY[requestTypeName]?.subtitle}
        </p>
      </div>

      {isEditMode && returnedRemark && (
        <Alert type="warning">
          <span className="font-medium">Returned by Operations:</span> {returnedRemark}
        </Alert>
      )}

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

      {/* ---------------- Create Driver ---------------- */}
      {requestTypeName === 'Create Driver' && (
        <>
          {!isEditMode && (
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
          )}

          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-medium text-gray-800 mb-4">Driver Records ({createDrivers.length})</h3>
            {entryMethod === 'Excel' && createDrivers.length > 0 && (
              <p className="text-sm text-gray-500 mb-4">
                Review the uploaded driver records below, make any corrections needed, and attach each driver's
                documents before submitting.
              </p>
            )}
            <DriverTable
              drivers={createDrivers}
              setDrivers={setCreateDrivers}
              forceValidate={forceValidate}
              skipFileRequiredValidation={isEditMode}
            />
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
            maxLength={500}
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
            maxLength={1000}
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
              min={new Date().toISOString().slice(0, 10)}
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
          {submitting ? 'Submitting...' : isEditMode ? 'Resubmit Request' : 'Submit Request'}
        </button>
      </div>
    </div>
  );
}
