// import { useEffect, useState } from 'react';
// import { Link } from 'react-router';
// import { listRequests, cancelRequest, exportRequestDrivers } from '../../api/requests.js';
// import StatusBadge from '../../components/common/StatusBadge.jsx';
// import EmptyState from '../../components/common/EmptyState.jsx';
// import Spinner from '../../components/common/Spinner.jsx';
// import { formatDate } from '../../utils/statusColors.js';

// const STATUS_OPTIONS = ['', 'Submitted', 'Under Review', 'Approved', 'Processing', 'Completed', 'Rejected'];

// export default function MyRequests() {
//   const [requests, setRequests] = useState([]);
//   const [total, setTotal] = useState(0);
//   const [search, setSearch] = useState('');
//   const [status, setStatus] = useState('');
//   const [page, setPage] = useState(1);
//   const [loading, setLoading] = useState(true);

//   function load() {
//     setLoading(true);
//     listRequests({ search: search || undefined, status: status || undefined, page, pageSize: 10 })
//       .then((res) => {
//         setRequests(res.data.data);
//         setTotal(res.data.total);
//       })
//       .finally(() => setLoading(false));
//   }

//   useEffect(() => {
//     load();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [status, page]);

//   function handleSearchSubmit(e) {
//     e.preventDefault();
//     setPage(1);
//     load();
//   }

//   async function handleCancel(id) {
//     if (!window.confirm('Cancel this request?')) return;
//     await cancelRequest(id);
//     load();
//   }

//   async function handleDownload(id, requestNumber) {
//     const res = await exportRequestDrivers(id);
//     const url = window.URL.createObjectURL(new Blob([res.data]));
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `${requestNumber}-drivers.xlsx`;
//     a.click();
//     window.URL.revokeObjectURL(url);
//   }

//   return (
//     <div className="space-y-4">
//       <div className="flex items-center justify-between">
//         <h2 className="text-xl font-semibold text-gray-800">My Requests</h2>
//       </div>

//       <div className="flex flex-wrap gap-3">
//         <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 min-w-[220px] sm:flex-none">
//           <input
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             placeholder="Search by request number..."
//             className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-primary-500"
//           />
//           <button type="submit" className="px-3 py-2 rounded-md border border-gray-300 text-sm hover:bg-gray-50">
//             Search
//           </button>
//         </form>
//         <select
//           value={status}
//           onChange={(e) => { setStatus(e.target.value); setPage(1); }}
//           className="border border-gray-300 rounded-md px-3 py-2 text-sm"
//         >
//           {STATUS_OPTIONS.map((s) => (
//             <option key={s} value={s}>{s || 'All Statuses'}</option>
//           ))}
//         </select>
//       </div>

//       <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
//         {loading ? (
//           <Spinner full={false} />
//         ) : requests.length === 0 ? (
//           <EmptyState message="No requests found" />
//         ) : (
//           <table className="min-w-full text-sm">
//             <thead className="bg-gray-50 text-gray-600">
//               <tr>
//                 <th className="px-5 py-2 text-left">Request ID</th>
//                 <th className="px-5 py-2 text-left">Type</th>
//                 <th className="px-5 py-2 text-left">Status</th>
//                 <th className="px-5 py-2 text-left">Submitted</th>
//                 <th className="px-5 py-2 text-left">Drivers</th>
//                 <th className="px-5 py-2 text-right">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {requests.map((r) => (
//                 <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
//                   <td className="px-5 py-2.5">
//                     <Link to={`/requests/${r.id}`} className="text-primary-600 hover:underline font-medium">
//                       {r.requestNumber}
//                     </Link>
//                   </td>
//                   <td className="px-5 py-2.5">{r.requestType?.name}</td>
//                   <td className="px-5 py-2.5"><StatusBadge status={r.status?.name} /></td>
//                   <td className="px-5 py-2.5">{formatDate(r.submittedDate || r.createdAt)}</td>
//                   <td className="px-5 py-2.5">{r.drivers?.length || 0}</td>
//                   <td className="px-5 py-2.5 text-right space-x-2">
//                     <button onClick={() => handleDownload(r.id, r.requestNumber)} className="text-primary-600 hover:underline text-xs">
//                       Download
//                     </button>
//                     {['Submitted', 'Under Review'].includes(r.status?.name) && (
//                       <button onClick={() => handleCancel(r.id)} className="text-red-600 hover:underline text-xs">
//                         Cancel
//                       </button>
//                     )}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>

//       {total > 10 && (
//         <div className="flex justify-end gap-2 text-sm">
//           <button
//             disabled={page === 1}
//             onClick={() => setPage((p) => p - 1)}
//             className="px-3 py-1.5 border rounded-md disabled:opacity-40"
//           >
//             Prev
//           </button>
//           <span className="px-2 py-1.5 text-gray-500">Page {page}</span>
//           <button
//             disabled={page * 10 >= total}
//             onClick={() => setPage((p) => p + 1)}
//             className="px-3 py-1.5 border rounded-md disabled:opacity-40"
//           >
//             Next
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listRequests, exportRequestDrivers } from '../../api/requests.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { formatDate } from '../../utils/statusColors.js';

const STATUS_OPTIONS = ['', 'Submitted', 'Under Review – Operations Team', 'Returned to Requester', 'Processing – Operations Team', 'AD Team Review', 'Completed', 'Rejected'];

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    listRequests({ search: search || undefined, status: status || undefined, page, pageSize: 10 })
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

  async function handleDownload(id, requestNumber) {
    const res = await exportRequestDrivers(id);
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${requestNumber}-drivers.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">My Requests</h2>
      </div>

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
          <EmptyState message="No requests found" />
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-2 text-left">Request ID</th>
                <th className="px-5 py-2 text-left">Type</th>
                <th className="px-5 py-2 text-left">Status</th>
                <th className="px-5 py-2 text-left">Submitted</th>
                <th className="px-5 py-2 text-left">Drivers</th>
                <th className="px-5 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-2.5">
                    <Link to={`/requests/${r.id}`} className="text-primary-600 hover:underline font-medium">
                      {r.requestNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-2.5">{r.requestType?.name}</td>
                  <td className="px-5 py-2.5"><StatusBadge status={r.status?.name} /></td>
                  <td className="px-5 py-2.5">{formatDate(r.submittedDate || r.createdAt)}</td>
                  <td className="px-5 py-2.5">{r.drivers?.length || 0}</td>
                  <td className="px-5 py-2.5 text-right space-x-2">
                    <button onClick={() => handleDownload(r.id, r.requestNumber)} className="text-primary-600 hover:underline text-xs">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > 10 && (
        <div className="flex justify-end gap-2 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 border rounded-md disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-2 py-1.5 text-gray-500">Page {page}</span>
          <button
            disabled={page * 10 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 border rounded-md disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}