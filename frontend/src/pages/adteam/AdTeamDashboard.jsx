import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getStats, listRequests } from '../../api/requests.js';
import StatCard from '../../components/common/StatCard.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { formatDate } from '../../utils/statusColors.js';

/**
 * AD Team dashboard - mirrors the Processor dashboard but scoped to the AD
 * stage: only requests that Operations has already completed appear here
 * (the API filters them; requests still awaiting Operations are invisible).
 */
export default function AdTeamDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStats(), listRequests({ recent: 8 })])
      .then(([statsRes, recentRes]) => {
        setStats(statsRes.data);
        setRecent(recentRes.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner full />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">AD Team Dashboard</h2>
        <p className="text-sm text-gray-500">Requests handed over by Operations for account creation.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Awaiting AD Review" value={stats.awaitingAction} color="bg-purple-500" />
        <StatCard label="Completed" value={stats.completed} color="bg-green-500" />
        <StatCard label="Rejected" value={stats.rejected} color="bg-red-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-medium text-gray-800">Recent Requests</h3>
          <Link to="/ad/queue" className="text-sm text-primary-600 hover:underline">View queue</Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState message="No requests have reached the AD Team yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-2 text-left">Request ID</th>
                  <th className="px-5 py-2 text-left">Requester</th>
                  <th className="px-5 py-2 text-left">Type</th>
                  <th className="px-5 py-2 text-left">Status</th>
                  <th className="px-5 py-2 text-left">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-2.5">
                      <Link to={`/ad/queue/${r.id}`} className="text-primary-600 hover:underline font-medium">
                        {r.requestNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-2.5">{r.requester?.fullName}</td>
                    <td className="px-5 py-2.5">{r.requestType?.name}</td>
                    <td className="px-5 py-2.5"><StatusBadge status={r.status?.name} /></td>
                    <td className="px-5 py-2.5">{formatDate(r.submittedDate || r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
