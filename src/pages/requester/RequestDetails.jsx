import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRequest } from '../../api/requests.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import DriverTable from '../../components/driver/DriverTable.jsx';
import RequestTimeline from '../../components/request/RequestTimeline.jsx';
import { formatDate } from '../../utils/statusColors.js';

export default function RequestDetails() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    getRequest(id).then((res) => setRequest(res.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Spinner full />;
  if (!request) return <p className="text-gray-500">Request not found.</p>;

  return (
    <div className="max-w-5xl space-y-6">
      <Link to="/requests" className="text-sm text-primary-600 hover:underline">← Back to My Requests</Link>

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
            <p className="font-medium">{request.currentProcessor?.fullName || '-'}</p>
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
        <h3 className="font-medium text-gray-800 mb-4">Driver List ({request.drivers?.length || 0})</h3>
        <DriverTable drivers={request.drivers || []} setDrivers={() => {}} readOnly />
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-medium text-gray-800 mb-4">Timeline</h3>
        <RequestTimeline history={request.history} />
      </section>
    </div>
  );
}
