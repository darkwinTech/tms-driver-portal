import { useEffect, useState } from 'react';
import { getMonthlyReport, getCompletedReport, getRejectedReport, exportReportsExcel } from '../../api/reports.js';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Spinner from '../../components/common/Spinner.jsx';
import { formatDate } from '../../utils/statusColors.js';

const TABS = [
  { key: 'monthly', label: 'Monthly Requests', fetcher: getMonthlyReport },
  { key: 'completed', label: 'Completed Requests', fetcher: getCompletedReport },
  { key: 'rejected', label: 'Rejected Requests', fetcher: getRejectedReport },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('monthly');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const tab = TABS.find((t) => t.key === activeTab);
    tab.fetcher().then((res) => setRows(res.data)).finally(() => setLoading(false));
  }, [activeTab]);

  async function handleExport() {
    const res = await exportReportsExcel();
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'requests-report.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Reports</h2>
        <button
          onClick={handleExport}
          className="px-3 py-2 rounded-md bg-primary-600 text-white text-sm hover:bg-primary-700"
        >
          Excel Export (All Requests)
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              activeTab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        {loading ? (
          <Spinner full={false} />
        ) : rows.length === 0 ? (
          <EmptyState message="No records found" />
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-2 text-left">Request ID</th>
                <th className="px-5 py-2 text-left">Requester</th>
                <th className="px-5 py-2 text-left">Type</th>
                <th className="px-5 py-2 text-left">Status</th>
                <th className="px-5 py-2 text-left">Drivers</th>
                <th className="px-5 py-2 text-left">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-5 py-2.5 font-medium">{r.requestNumber}</td>
                  <td className="px-5 py-2.5">{r.requester?.fullName}</td>
                  <td className="px-5 py-2.5">{r.requestType?.name}</td>
                  <td className="px-5 py-2.5"><StatusBadge status={r.status?.name} /></td>
                  <td className="px-5 py-2.5">{r.drivers?.length || 0}</td>
                  <td className="px-5 py-2.5">{formatDate(r.submittedDate || r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
