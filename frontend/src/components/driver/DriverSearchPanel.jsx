import { useState } from 'react';
import { listMyCompletedDrivers, driverMatchesQuery } from '../../api/drivers.js';

/**
 * Search box + results table used by Modify Driver and Disable Driver
 * requests to look up an existing driver before acting on them, instead of
 * starting from a blank entry form. Scoped to drivers created via this
 * requester's own completed Create Driver requests.
 *
 * The full scoped list is fetched once (via "View All", or lazily the first
 * time the user types before clicking it) and then filtered live, keystroke
 * by keystroke, entirely client-side - no per-keystroke network round-trip.
 */
export default function DriverSearchPanel({ mode = 'modify', excludeUsernames = [], onSelect }) {
  const [query, setQuery] = useState('');
  const [allDrivers, setAllDrivers] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadAllDrivers() {
    setLoading(true);
    try {
      const res = await listMyCompletedDrivers();
      setAllDrivers(res.data);
    } finally {
      setLoading(false);
    }
  }

  function handleViewAll() {
    setQuery('');
    loadAllDrivers();
  }

  function handleQueryChange(value) {
    setQuery(value);
    if (allDrivers === null) loadAllDrivers();
  }

  const results = allDrivers === null ? null : allDrivers.filter((d) => driverMatchesQuery(d, query));

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search by first name, email, phone, or exact license/ID/IQAMA number"
          className="flex-1 min-w-[220px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <button
          type="button"
          onClick={handleViewAll}
          disabled={loading}
          className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'View All'}
        </button>
      </div>

      {allDrivers !== null && !loading && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">Username</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Phone</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 w-20" />
              </tr>
            </thead>
            <tbody>
              {results.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-6">
                    No matching drivers found
                  </td>
                </tr>
              )}
              {results.map((d) => {
                const alreadyAdded = excludeUsernames.includes(d.username);
                const disableSelectable = mode === 'disable' && d.status !== 'Active';
                return (
                  <tr key={d.username} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-medium">{d.username}</td>
                    <td className="px-3 py-2">{d.firstName} {d.lastName}</td>
                    <td className="px-3 py-2">{d.phone}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${d.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        disabled={alreadyAdded || disableSelectable}
                        onClick={() => onSelect(d)}
                        className="text-primary-600 hover:underline text-xs disabled:text-gray-300 disabled:no-underline"
                        title={disableSelectable ? 'Driver is already inactive' : ''}
                      >
                        {alreadyAdded ? 'Added' : 'Select'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
