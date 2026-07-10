import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { resetDb } from '../../mock/db.js';

const requesterLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/requests/new', label: 'New Request'},
  { to: '/requests', label: 'My Requests'},
];

const processorLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/queue', label: 'Request Queue'},
  { to: '/reports', label: 'Reports'},
];

export default function Sidebar({ open = false, onClose = () => {} }) {
  const { isProcessor } = useAuth();
  const links = isProcessor ? processorLinks : requesterLinks;

  function handleResetDemoData() {
    if (!window.confirm('Reset all demo data back to its original state? This clears anything you created in this session.')) return;
    resetDb();
    window.location.reload();
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-gray-900 text-gray-100 flex flex-col shrink-0 transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      <div className="h-16 flex items-center px-6 font-bold text-lg tracking-wide border-b border-gray-800">
        TMS<span className="text-primary-500">.</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {/* {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span>{link.icon}</span>
            {link.label}
          </NavLink>
        ))} */}
        {links.map((link) => (
  <NavLink
    key={link.to}
    to={link.to}
    // Update this line to include '/requests'
    end={link.to === '/' || link.to === '/requests'}
    onClick={onClose}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`
    }
  >
    <span>{link.icon}</span>
    {link.label}
  </NavLink>
))}
      </nav>
      <div className="px-6 py-4 border-t border-gray-800 space-y-2">
        <button
          onClick={handleResetDemoData}
          className="text-xs text-gray-400 hover:text-white"
        >
          Reset demo data
        </button>
      </div>
    </aside>
    </>
  );
}
