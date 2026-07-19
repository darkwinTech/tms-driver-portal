import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRequest, updateStatus, approveAndTriggerRpa } from '../../api/requests.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import DriverTable from '../../components/driver/DriverTable.jsx';
import RequestTimeline from '../../components/request/RequestTimeline.jsx';
import AttachmentsList from '../../components/request/AttachmentsList.jsx';
import Alert from '../../components/common/Alert.jsx';
import Modal from '../../components/common/Modal.jsx';
import { formatDate } from '../../utils/statusColors.js';

/**
 * AD Team request details - the second stage of the workflow. Requests
 * arrive here once Operations has completed the driver profiles.
 *
 *   AD Team Review -> "Approve & Send Tp System" moves the request to
 *                     RPA Triggered (the Power Automate flow - not this app -
 *                     generates and sends the handoff email), or "Reject"
 *                     ends the workflow (a rejection reason is mandatory and
 *                     is recorded in the history/timeline).
 *   RPA Triggered  -> account creation happens outside this application
 *                     (ServiceNow / AD provisioning). Once the AD Team
 *                     confirms it succeeded, "Mark as Completed" closes the
 *                     request.
 */
export default function AdTeamRequestDetails() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  useEffect(() => {
    getRequest(id)
      .then((res) => setRequest(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load request'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleApprove() {
    setBusy(true);
    setError('');
    try {
      const res = await approveAndTriggerRpa(id);
      setRequest(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to trigger the RPA flow');
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    setBusy(true);
    setError('');
    try {
      const res = await updateStatus(id, 'Completed', 'Account creation confirmed by AD Team.');
      setRequest(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete the request');
    } finally {
      setBusy(false);
    }
  }

  function openRejectModal() {
    setRejectReason('');
    setRejectError('');
    setRejectOpen(true);
  }

  async function handleRejectConfirm() {
    if (!rejectReason.trim()) {
      setRejectError('A rejection reason is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await updateStatus(id, 'Rejected', rejectReason.trim());
      setRequest(res.data);
      setRejectOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject the request');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner full />;
  if (!request) {
    return (
      <div className="max-w-5xl space-y-4">
        <Link to="/ad/queue" className="text-sm text-primary-600 hover:underline">← Back to Request Queue</Link>
        <Alert type="error">{error || 'Request not found.'}</Alert>
      </div>
    );
  }

  const statusName = request.status?.name;
  const rejectedRemark =
    statusName === 'Rejected'
      ? [...(request.history || [])].reverse().find((h) => h.newStatus === 'Rejected')?.remarks
      : null;

  return (
    <div className="max-w-5xl space-y-6">
      <Link to="/ad/queue" className="text-sm text-primary-600 hover:underline">← Back to Request Queue</Link>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{request.requestNumber}</h2>
            <p className="text-sm text-gray-500">{request.requestType?.name}</p>
          </div>
          <StatusBadge status={statusName} />
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
            <p className="text-gray-500">Handled By</p>
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
        <DriverTable drivers={request.drivers || []} setDrivers={() => {}} readOnly showOperationsFields />
      </section>

      {/* AD Team actions */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium text-gray-800 mb-3">AD Team Actions</h3>
        <Alert type="error">{error}</Alert>

        {statusName === 'AD Team Review' && (
          <>
            <p className="text-sm text-gray-500 mb-3">
              Operations has completed the driver profiles. Approving triggers and sends the email to ServiceNow
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={handleApprove}
                className="px-5 py-2.5 rounded-md text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {busy ? 'Working...' : 'Approve & Send To System'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={openRejectModal}
                className="px-4 py-2.5 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </>
        )}

        {statusName === 'RPA Triggered' && (
          <>
            <p className="text-sm text-gray-500 mb-3">
              The email is triggered and sent to ServiceNow, 
              once you have confirmed the accounts were created successfully, mark the request as
              completed to close it.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={handleComplete}
              className="px-5 py-2.5 rounded-md text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {busy ? 'Working...' : 'Mark as Completed'}
            </button>
          </>
        )}

        {statusName === 'Completed' && (
          <p className="text-sm text-gray-500">This request is completed and closed. No further action is required.</p>
        )}

        {statusName === 'Rejected' && (
          <div className="text-sm text-gray-500">
            <p className="mb-2">This request was rejected. No further action is possible.</p>
            {rejectedRemark && (
              <Alert type="error">
                <span className="font-medium">Rejection reason:</span> {rejectedRemark}
              </Alert>
            )}
          </div>
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

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject Request"
        footer={
          <>
            <button
              type="button"
              onClick={() => setRejectOpen(false)}
              className="px-4 py-2 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleRejectConfirm}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {busy ? 'Working...' : 'Reject Request'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Rejection is final - the workflow stops entirely and the requester cannot resubmit. The
            reason is saved and shown in the request details and timeline.
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => { setRejectReason(e.target.value); setRejectError(''); }}
            rows={4}
            placeholder="Rejection reason (required)"
            autoFocus
            className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 ${
              rejectError ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {rejectError && <p className="text-sm text-red-500">{rejectError}</p>}
        </div>
      </Modal>
    </div>
  );
}
