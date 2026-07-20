import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRequest, updateStatus } from '../../api/requests.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import DriverTable from '../../components/driver/DriverTable.jsx';
import RequestTimeline from '../../components/request/RequestTimeline.jsx';
import AttachmentsList from '../../components/request/AttachmentsList.jsx';
import DriverProfilePanel from '../../components/operations/DriverProfilePanel.jsx';
import Alert from '../../components/common/Alert.jsx';
import Modal from '../../components/common/Modal.jsx';
import { formatDate } from '../../utils/statusColors.js';

/**
 * Operations request details - the first stage of the review workflow.
 *
 *   Submitted     -> "Start Review" moves the request to Under Review.
 *   Under Review  -> Approve (-> Processing), Return to Requester or Reject
 *                    (both negative outcomes require a comment, entered in a
 *                    confirmation modal).
 *   Processing    -> Operations completes the requester-hidden driver
 *                    profile fields via DriverProfilePanel. The workflow
 *                    intentionally stops after "Complete Driver Profiles" -
 *                    routing to the AD Team / secondary processors is a
 *                    future sprint.
 */
const COMMENT_ACTIONS = {
  return: {
    title: 'Return to Requester',
    target: 'Returned to Requester',
    description: 'The requester will be able to edit the request and resubmit it. Please explain what needs to be corrected.',
    confirmLabel: 'Return to Requester',
    confirmClass: 'bg-amber-500 hover:bg-amber-600',
  },
  reject: {
    title: 'Reject Request',
    target: 'Rejected',
    description: 'Rejection is final - the workflow stops entirely and the requester cannot resubmit. Please explain why the request is rejected.',
    confirmLabel: 'Reject Request',
    confirmClass: 'bg-red-600 hover:bg-red-700',
  },
};

export default function OperationsRequestDetails() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [commentAction, setCommentAction] = useState(null); // 'return' | 'reject' | null
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    getRequest(id).then((res) => setRequest(res.data)).finally(() => setLoading(false));
  }, [id]);

  async function runTransition(target, remarks) {
    setBusy(true);
    setError('');
    try {
      const res = await updateStatus(id, target, remarks);
      setRequest(res.data);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
      return false;
    } finally {
      setBusy(false);
    }
  }

  function openCommentModal(actionKey) {
    setComment('');
    setCommentError('');
    setCommentAction(actionKey);
  }

  async function handleCommentConfirm() {
    const action = COMMENT_ACTIONS[commentAction];
    if (!comment.trim()) {
      setCommentError('A comment is required for this action.');
      return;
    }
    const ok = await runTransition(action.target, comment.trim());
    if (ok) setCommentAction(null);
  }

  if (loading) return <Spinner full />;
  if (!request) return <p className="text-gray-500">Request not found.</p>;

  const statusName = request.status?.name;
  const modalAction = commentAction ? COMMENT_ACTIONS[commentAction] : null;

  return (
    <div className="w-full space-y-6">
      <Link to="/ops/queue" className="text-sm text-primary-600 hover:underline">← Back to Request Queue</Link>

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

      {/* Review actions */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium text-gray-800 mb-3">Review</h3>
        <Alert type="error">{error}</Alert>

        {statusName === 'Submitted' && (
          <>
            <p className="text-sm text-gray-500 mb-3">
              This request is waiting for Operations. Start the review to take ownership of it.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => runTransition('Under Review')}
              className="px-5 py-2.5 rounded-md text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Start Review
            </button>
          </>
        )}

        {statusName === 'Under Review' && (
          <>
            <p className="text-sm text-gray-500 mb-3">
              Approve to move the request into Processing and complete the driver profiles, or send it back with a comment.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => runTransition('Processing')}
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => openCommentModal('return')}
                className="px-4 py-2 rounded-md text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
              >
                Return to Requester
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => openCommentModal('reject')}
                className="px-4 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </>
        )}

        {statusName === 'Processing' && (
          <p className="text-sm text-gray-500">
            Request approved. Complete the driver profiles below to finish the Operations phase.
          </p>
        )}

        {statusName === 'Returned to Requester' && (
          <p className="text-sm text-gray-500">
            Waiting for the requester to correct and resubmit. It will reappear in the queue as Submitted.
          </p>
        )}

        {statusName === 'Rejected' && (
          <p className="text-sm text-gray-500">This request was rejected. No further action is possible.</p>
        )}

        {statusName === 'Completed' && (
          <p className="text-sm text-gray-500">This request is completed. No further action is required.</p>
        )}
      </section>

      {statusName === 'Processing' && (
        <DriverProfilePanel request={request} onUpdated={setRequest} />
      )}

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
        open={Boolean(modalAction)}
        onClose={() => setCommentAction(null)}
        title={modalAction?.title}
        footer={
          modalAction && (
            <>
              <button
                type="button"
                onClick={() => setCommentAction(null)}
                className="px-4 py-2 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleCommentConfirm}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-50 ${modalAction.confirmClass}`}
              >
                {busy ? 'Working...' : modalAction.confirmLabel}
              </button>
            </>
          )
        }
      >
        {modalAction && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">{modalAction.description}</p>
            <textarea
              value={comment}
              onChange={(e) => { setComment(e.target.value); setCommentError(''); }}
              rows={4}
              placeholder="Comment (required)"
              autoFocus
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 ${
                commentError ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {commentError && <p className="text-sm text-red-500">{commentError}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
