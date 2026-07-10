import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listRequests } from '../../api/requests.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { formatDate } from '../../utils/statusColors.js';

const STATUS_OPTIONS = ['', 'Submitted', 'Under Review', 'Approved', 'Processing', 'Completed', 'Rejected'];

export default function RequestQueue() {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    listRequests({ status: status || undefined, search: search || undefined, page, pageSize: 15 })
      .then((res) => {
        setRequests(res.data.data);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Request Queue</h2>

      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 min-w-[220px] sm:flex-none">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by request number..."
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <button type="submit" className="px-3 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50">
            Search
          </button>
        </form>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s || 'All Statuses'}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        {loading ? (
          <Spinner full={false} />
        ) : requests.length === 0 ? (
          <EmptyState message="No requests in the queue" />
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-2 text-left">Request ID</th>
                <th className="px-5 py-2 text-left">Requester</th>
                <th className="px-5 py-2 text-left">Type</th>
                <th className="px-5 py-2 text-left">Submitted</th>
                <th className="px-5 py-2 text-left">Status</th>
                <th className="px-5 py-2 text-left">Assigned To</th>
                <th className="px-5 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-2.5 font-medium">{r.requestNumber}</td>
                  <td className="px-5 py-2.5">{r.requester?.fullName}</td>
                  <td className="px-5 py-2.5">{r.requestType?.name}</td>
                  <td className="px-5 py-2.5">{formatDate(r.submittedDate || r.createdAt)}</td>
                  <td className="px-5 py-2.5"><StatusBadge status={r.status?.name} /></td>
                  <td className="px-5 py-2.5">{r.currentProcessor?.fullName || '-'}</td>
                  <td className="px-5 py-2.5 text-right">
                    <Link to={`/queue/${r.id}`} className="text-primary-600 hover:underline text-xs">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > 15 && (
        <div className="flex justify-end gap-2 text-sm">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border rounded-md disabled:opacity-40">Prev</button>
          <span className="px-2 py-1.5 text-gray-500">Page {page}</span>
          <button disabled={page * 15 >= total} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border rounded-md disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
