import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { getRequest, markComplete } from '../../api/requests.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import DriverTable from '../../components/driver/DriverTable.jsx';
import RequestTimeline from '../../components/request/RequestTimeline.jsx';
import AttachmentsList from '../../components/request/AttachmentsList.jsx';
import Alert from '../../components/common/Alert.jsx';
import { formatDate, formatDateTime } from '../../utils/statusColors.js';

/**
 * AD Team request details - the second (and now only) stage of the AD
 * workflow. Requests arrive here once Operations has completed the driver
 * profiles (Create Driver) or has accepted the disable request (Disable
 * Driver) - Operations already triggered the RPA flow and the ServiceNow
 * ticket already exists by the time a request reaches this page. Modify
 * Driver requests never reach the AD Team - Operations completes those
 * directly.
 *
 *   AD Team Review -> "Mark as Complete" confirms the external AD work
 *                     (account creation or disablement) is done and closes
 *                     the request. This is the AD Team's only action here -
 *                     there is no reject option at this stage.
 */
export default function AdTeamRequestDetails() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getRequest(id)
      .then((res) => setRequest(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load request'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleComplete() {
    setBusy(true);
    setError('');
    try {
      const res = await markComplete(id);
      setRequest(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete the request');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner full />;
  if (!request) {
    return (
      <div className="w-full space-y-4">
        <Link to="/ad/queue" className="text-sm text-primary-600 hover:underline">← Back to Request Queue</Link>
        <Alert type="error">{error || 'Request not found.'}</Alert>
      </div>
    );
  }

  const statusName = request.status?.name;
  const requestTypeName = request.requestType?.name;
  const isDisable = requestTypeName === 'Disable Driver';
  const rejectedRemark =
    statusName === 'Rejected'
      ? [...(request.history || [])].reverse().find((h) => h.newStatus === 'Rejected')?.remarks
      : null;

  return (
    <div className="w-full space-y-6">
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
        <DriverTable
          drivers={request.drivers || []}
          setDrivers={() => {}}
          readOnly
          showOperationsFields={requestTypeName === 'Create Driver'}
        />
      </section>

      {/* AD Team actions */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium text-gray-800 mb-3">AD Team Actions</h3>
        <Alert type="error">{error}</Alert>

        {statusName === 'AD Team Review' && (
          <>
            <p className="text-sm text-gray-500 mb-1">
              {isDisable
                ? 'Operations has triggered the RPA flow to disable this account.'
                : 'Operations has completed the driver profiles and triggered the RPA flow.'}
            </p>
            <p className="text-xs text-gray-400 mb-3">
              RPA triggered {formatDateTime(request.rpaTriggeredAt)}
            </p>
            <p className="text-sm text-gray-500 mb-3">
              Confirm once the account {isDisable ? 'disablement' : 'creation'} has completed in Active Directory.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={handleComplete}
              className="px-5 py-2.5 rounded-md text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {busy ? 'Working...' : 'Mark as Complete'}
            </button>
          </>
        )}

        {statusName === 'Completed' && (
          <div className="text-sm text-gray-500">
            <p>This request is completed and closed. No further action is required.</p>
            {request.adCompletedByUser && (
              <p className="text-xs text-gray-400 mt-1">
                Completed by {request.adCompletedByUser.fullName} on {formatDateTime(request.adCompletedAt)}
              </p>
            )}
          </div>
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
    </div>
  );
}
