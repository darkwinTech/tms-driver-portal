import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { listNotifications, markAllNotificationsRead } from '../../api/notifications.js';
import { formatDateTime } from '../../utils/statusColors.js';

export default function Navbar({ onMenuClick = () => {} }) {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    listNotifications()
      .then((res) => setNotifications(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleOpen() {
    setOpen((o) => !o);
    if (!open && unreadCount > 0) {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between gap-3 px-4 sm:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden shrink-0 flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-800 truncate">TMS Driver Portal</h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleOpen}
            className="relative flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-orange-100 hover:text-orange-600 transition-colors"            aria-label="Notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341A6.002 6.002 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              <div className="px-4 py-2 border-b font-medium text-sm text-gray-700">Notifications</div>
              {notifications.length === 0 && (
                <p className="p-4 text-sm text-gray-500">No notifications yet.</p>
              )}
              {notifications.map((n) => (
                <div key={n.id} className="px-4 py-3 border-b last:border-0 text-sm">
                  <p className="font-medium text-gray-800">{n.title}</p>
                  <p className="text-gray-600">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-800">{user?.fullName}</p>
          <p className="text-xs text-gray-500">{user?.role}</p>
        </div>
        {/* <button
          onClick={logout}
          className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
        >
          Logout
        </button> */}
        <button
  onClick={logout}
  className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 16l4-4m0 0l-4-4m4 4H9m4 8H5a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2"
    />
  </svg>

  Logout
</button>
      </div>
    </header>
  );
}
