import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRequest, updateStatus } from '../../api/requests.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import DriverTable from '../../components/driver/DriverTable.jsx';
import RequestTimeline from '../../components/request/RequestTimeline.jsx';
import AttachmentsList from '../../components/request/AttachmentsList.jsx';
import Alert from '../../components/common/Alert.jsx';
import { formatDate } from '../../utils/statusColors.js';

// Mirrors server/src/services/workflowService.js TRANSITIONS for the
// Processor role. Two distinct negative outcomes: "Return to Requester" is
// non-terminal (the requester can edit and resubmit), "Reject" is a dead
// end used when the driver/request isn't wanted at all.
const PROCESSOR_ACTIONS = {
  Submitted: [
    { label: 'Start Review', target: 'Under Review', style: 'primary' },
    { label: 'Return to Requester', target: 'Returned to Requester', style: 'warning' },
    { label: 'Reject', target: 'Rejected', style: 'danger' },
  ],
  'Under Review': [
    { label: 'Approve', target: 'Approved', style: 'primary' },
    { label: 'Return to Requester', target: 'Returned to Requester', style: 'warning' },
    { label: 'Reject', target: 'Rejected', style: 'danger' },
  ],
  Approved: [{ label: 'Start Processing', target: 'Processing', style: 'primary' }],
  Processing: [{ label: 'Complete Request', target: 'Completed', style: 'primary' }],
};

const REMARKS_REQUIRED_TARGETS = new Set(['Returned to Requester', 'Rejected']);

const BTN_STYLES = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
  warning: 'bg-amber-500 text-white hover:bg-amber-600',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

export default function ProcessRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function load() {
    getRequest(id).then((res) => setRequest(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAction(target) {
  if (REMARKS_REQUIRED_TARGETS.has(target) && !remarks.trim()) {
    setError('Please provide a comment explaining this decision.');
    return;
  }
 
  setBusy(true);
  setError('');
 
  try {
    const res = await updateStatus(id, target, remarks);
    setRequest(res.data);
    setRemarks('');
  } catch (err) {
    setError(err.response?.data?.message || 'Action failed');
  } finally {
    setBusy(false);
  }
  }

  if (loading) return <Spinner full />;
  if (!request) return <p className="text-gray-500">Request not found.</p>;

  const actions = PROCESSOR_ACTIONS[request.status?.name] || [];

  return (
    <div className="max-w-5xl space-y-6">
      <Link to="/queue" className="text-sm text-primary-600 hover:underline">← Back to Queue</Link>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{request.requestNumber}</h2>
            <p className="text-sm text-gray-500">{request.requestType?.name}</p>
          </div>
          <StatusBadge status={request.status?.name} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t pt-4">
          <div>
            <p className="text-gray-500">Requester</p>
            <p className="font-medium">{request.requester?.fullName}</p>
            <p className="text-xs text-gray-400">{request.requester?.email}</p>
          </div>
          <div>
            <p className="text-gray-500">Submitted</p>
            <p className="font-medium">{formatDate(request.submittedDate)}</p>
          </div>
          {request.effectiveDate && (
            <div>
              <p className="text-gray-500">Effective Date</p>
              <p className="font-medium">{formatDate(request.effectiveDate)}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500">Current Processor</p>
            <p className="font-medium">{request.currentProcessor?.fullName || 'Unassigned'}</p>
          </div>
        </div>
        {request.description && (
          <div className="mt-4 border-t pt-4">
            <p className="text-gray-500 text-sm mb-1">Description</p>
            <p className="text-sm text-gray-700">{request.description}</p>
          </div>
        )}
        {request.businessJustification && (
          <div className="mt-4 border-t pt-4">
            <p className="text-gray-500 text-sm mb-1">Business Justification</p>
            <p className="text-sm text-gray-700">{request.businessJustification}</p>
          </div>
        )}
      </div>

      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium text-gray-800 mb-4">Driver Information ({request.drivers?.length || 0})</h3>
        <DriverTable drivers={request.drivers || []} setDrivers={() => {}} readOnly />
      </section>

      {/* Processing actions */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium text-gray-800 mb-3">Process Request</h3>
        <Alert type="error">{error}</Alert>
        {actions.length === 0 ? (
          <p className="text-sm text-gray-400">No further action available for this status.</p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700 mb-2">
              A comment is required when returning to the requester or rejecting.
            </p>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Remarks (required for Return to Requester / Reject, optional otherwise)"
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <div className="flex flex-wrap gap-2">
              {actions.map((a) => (
                <button
                  key={a.target}
                  disabled={busy}
                  onClick={() => handleAction(a.target)}
                  className={`px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 ${BTN_STYLES[a.style]}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-medium text-gray-800 mb-4">Timeline</h3>
          <RequestTimeline history={request.history} />
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-medium text-gray-800 mb-4">Attachments</h3>
          <AttachmentsList requestId={request.id} attachments={request.attachments} readOnly />
        </section>
      </div>
    </div>
  );
}
