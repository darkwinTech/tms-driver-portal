import apiClient from './axiosClient.js';

// Used by the "View All" button - every driver this requester's completed
// Create Driver requests have produced, no query needed.
export function listMyCompletedDrivers() {
  return apiClient.get('/drivers/my-completed');
}

// Partial match across first name, username/email, and phone. An
// empty/whitespace query matches everything - shared by DriverSearchPanel's
// live client-side filtering so the match rules can't drift out of sync.
// Pure client-side helper - no network call.
export function driverMatchesQuery(driver, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;

  return (
    driver.firstName.toLowerCase().includes(q) ||
    (driver.username || '').toLowerCase().includes(q) ||
    (driver.email || '').toLowerCase().includes(q) ||
    (driver.phone || '').includes(q)
  );
}
