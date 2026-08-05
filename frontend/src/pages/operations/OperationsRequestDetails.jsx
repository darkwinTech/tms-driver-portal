import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { getRequest, updateStatus, assignRequest, downloadSecurityReportPdf } from '../../api/requests.js';
import { listUsers } from '../../api/users.js';
import { useAuth } from '../../context/AuthContext.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import DriverTable from '../../components/driver/DriverTable.jsx';
import RequestTimeline from '../../components/request/RequestTimeline.jsx';
import AttachmentsList from '../../components/request/AttachmentsList.jsx';
import DriverProfilePanel from '../../components/operations/DriverProfilePanel.jsx';
import Alert from '../../components/common/Alert.jsx';
import Modal from '../../components/common/Modal.jsx';
import { formatDate } from '../../utils/statusColors.js';

// Statuses during which a request is still owned by Operations and can be
// (re)assigned to a different Operations employee - mirrors the backend's
// ASSIGNABLE_STATUSES in requestController.js.
const ASSIGNABLE_STATUSES = [
  'Submitted',
  'Under Review – Operations Team',
  'Processing – Operations Team',
  'Returned to Requester',
];

// Mirrors the backend's isOperationsPartDone in requestController.js - each
// request type finishes its Operations part at a different point, captured
// by a different existing field.
function isOperationsPartDone(request) {
  const type = request.requestType?.name;
  if (type === 'Create Driver') return Boolean(request.driverProfilesCompletedAt);
  if (type === 'Disable Driver') return Boolean(request.rpaTriggeredAt);
  if (type === 'Modify Driver') return Boolean(request.completedDate);
  return false;
}

/**
 * Operations request details - the first stage of the review workflow.
 * The available actions depend on the request type:
 *
 *   Create Driver:
 *     Submitted     -> "Start Review" moves the request to Under Review.
 *     Under Review  -> Approve (-> Processing), Return to Requester or
 *                       Reject (both negative outcomes require a comment,
 *                       entered in a confirmation modal).
 *     Processing    -> Operations completes the requester-hidden driver
 *                       profile fields via DriverProfilePanel, then hands
 *                       off to the AD Team.
 *
 *   Modify Driver: no account action to perform, so Operations decides
 *     directly from Submitted - Accept completes the request immediately
 *     (writing the change onto the driver's real record), Reject is
 *     terminal. The AD Team is never involved.
 *
 *   Disable Driver: Operations also decides directly from Submitted, but
 *     Accept hands the request to the AD Team instead of completing it -
 *     disabling the account is their job (same pattern as Create Driver's
 *     AD handoff).
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
  const { isOperationsManager } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [commentAction, setCommentAction] = useState(null); // 'return' | 'reject' | null
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');

  const [operationsUsers, setOperationsUsers] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  const [downloadingReport, setDownloadingReport] = useState(false);
  const [reportError, setReportError] = useState('');

  useEffect(() => {
    getRequest(id)
      .then((res) => setRequest(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || 'Request not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!isOperationsManager) return;
    listUsers('Operations').then((res) => setOperationsUsers(res.data));
  }, [isOperationsManager]);

  useEffect(() => {
    setSelectedAssignee(request?.currentProcessor?.id ? String(request.currentProcessor.id) : '');
  }, [request?.currentProcessor?.id]);

  async function handleAssign() {
    if (!selectedAssignee) return;
    setAssigning(true);
    setAssignError('');
    try {
      const res = await assignRequest(id, Number(selectedAssignee));
      setRequest(res.data);
    } catch (err) {
      setAssignError(err.response?.data?.message || 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  }

  async function handleDownloadReport() {
    setDownloadingReport(true);
    setReportError('');
    try {
      await downloadSecurityReportPdf(id, `security-report-${request.requestNumber}.pdf`);
    } catch (err) {
      setReportError(err.response?.data?.message || 'Download failed');
    } finally {
      setDownloadingReport(false);
    }
  }

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
  if (!request) return <p className="text-gray-500">{loadError || 'Request not found.'}</p>;

  const statusName = request.status?.name;
  const requestTypeName = request.requestType?.name;
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

      {isOperationsManager && (
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-medium text-gray-800 mb-1">Assign to Operations Employee</h3>
          {ASSIGNABLE_STATUSES.includes(statusName) ? (
            <>
              <p className="text-sm text-gray-500 mb-3">
                Choose which Operations employee should own this request and complete its driver profiles.
              </p>
              <Alert type="error">{assignError}</Alert>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[220px] focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Unassigned</option>
                  {operationsUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={assigning || !selectedAssignee || Number(selectedAssignee) === request.currentProcessor?.id}
                  onClick={handleAssign}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {assigning ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              This request has moved past Operations and can no longer be reassigned.
            </p>
          )}
        </section>
      )}

      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium text-gray-800 mb-4">Driver Information ({request.drivers?.length || 0})</h3>
        <DriverTable
          drivers={request.drivers || []}
          setDrivers={() => {}}
          readOnly
          showOperationsFields={requestTypeName === 'Create Driver'}
        />
      </section>

      {/* Review actions - Operations Managers assign/reassign only; the
          assigned Operations employee performs the actual review actions. */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium text-gray-800 mb-3">Review</h3>
        {isOperationsManager ? (
          <p className="text-sm text-gray-500">
            Review actions are performed by the assigned Operations employee. Use the assignment control above to
            assign or reassign this request.
          </p>
        ) : (
        <>
        <Alert type="error">{error}</Alert>

        {statusName === 'Submitted' && requestTypeName === 'Modify Driver' && (
          <>
            <p className="text-sm text-gray-500 mb-3">
              Review the requested change in the "Changes" column above, then accept it to apply the
              update to the driver's record, or reject it with a comment.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => runTransition('Completed', 'Accepted by Operations - driver record updated.')}
                className="px-5 py-2.5 rounded-md text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
              >
                Accept & Apply Changes
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

        {statusName === 'Submitted' && requestTypeName === 'Disable Driver' && (
          <>
            <p className="text-sm text-gray-500 mb-3">
              Accept to trigger the RPA flow, create the ServiceNow ticket, and forward this request to
              the AD Team, who will disable the account - or reject it with a comment.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => runTransition('AD Team Review', 'Approved by Operations - forwarded to AD Team for account disablement.')}
                className="px-5 py-2.5 rounded-md text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
              >
                Accept & Forward to AD Team
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

        {statusName === 'Submitted' && requestTypeName === 'Create Driver' && (
          <>
            <p className="text-sm text-gray-500 mb-3">
              This request is waiting for Operations. Start the review to take ownership of it.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => runTransition('Under Review – Operations Team')}
              className="px-5 py-2.5 rounded-md text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Start Review
            </button>
          </>
        )}

        {statusName === 'Under Review – Operations Team' && requestTypeName === 'Create Driver' && (
          <>
            <p className="text-sm text-gray-500 mb-3">
              Approve to move the request into Processing and complete the driver profiles, or send it back with a comment.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => runTransition('Processing – Operations Team')}
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

        {statusName === 'Processing – Operations Team' && (
          <p className="text-sm text-gray-500">
            Request approved. Complete the driver profiles below to finish the Operations phase.
          </p>
        )}

        {statusName === 'AD Team Review' && requestTypeName === 'Disable Driver' && (
          <p className="text-sm text-gray-500">
            RPA triggered. Forwarded to the AD Team to disable the account. No further Operations action is required.
          </p>
        )}

        {statusName === 'Returned to Requester' && requestTypeName === 'Create Driver' && (
          <p className="text-sm text-gray-500">
            Waiting for the requester to correct and resubmit. It will reappear in the queue as Submitted.
          </p>
        )}

        {['Under Review – Operations Team', 'Processing – Operations Team', 'Returned to Requester'].includes(statusName) && requestTypeName !== 'Create Driver' && (
          <Alert type="warning">
            This {requestTypeName} request is sitting in an unexpected status ("{statusName}") left over from
            before this workflow existed - {requestTypeName} requests no longer pass through that stage.
            Contact an administrator to resolve it manually.
          </Alert>
        )}

        {statusName === 'Rejected' && (
          <p className="text-sm text-gray-500">This request was rejected. No further action is possible.</p>
        )}

        {statusName === 'Completed' && (
          <p className="text-sm text-gray-500">This request is completed. No further action is required.</p>
        )}
        </>
        )}
      </section>

      {statusName === 'Processing – Operations Team' && !isOperationsManager && (
        <DriverProfilePanel request={request} onUpdated={setRequest} />
      )}

      {isOperationsPartDone(request) && (
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-medium text-gray-800 mb-3">Security Report</h3>
          <Alert type="error">{reportError}</Alert>
          <button
            type="button"
            disabled={downloadingReport}
            onClick={handleDownloadReport}
            className="px-4 py-2 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {downloadingReport ? 'Preparing...' : 'Download Security Report (PDF)'}
          </button>
        </section>
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
