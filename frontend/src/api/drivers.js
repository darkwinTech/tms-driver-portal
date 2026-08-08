import apiClient from './axiosClient.js';

// Used by the "View All" button - every driver this requester's completed
// Create Driver requests have produced, no query needed.
export function listMyCompletedDrivers() {
  return apiClient.get('/drivers/my-completed');
}

// Partial match across first name, username/email, and phone, plus an exact
// match on license/ID number (unlike the others, a partial license number
// shouldn't surface a result - it's sensitive enough that only knowing the
// full number should find it). An empty/whitespace query matches everything
// - shared by DriverSearchPanel's live client-side filtering so the match
// rules can't drift out of sync. Pure client-side helper - no network call.
export function driverMatchesQuery(driver, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;

  return (
    driver.firstName.toLowerCase().includes(q) ||
    (driver.username || '').toLowerCase().includes(q) ||
    (driver.email || '').toLowerCase().includes(q) ||
    (driver.phone || '').includes(q) ||
    (driver.licenseNumber || '').toLowerCase() === q
  );
}
