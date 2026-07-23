// Looks up drivers for Modify/Disable Driver requests. Scoped to the
// current requester's own driver accounts - only drivers created via a
// Create Driver request THEY submitted, once that request has actually
// completed (i.e. AD has created the account and assigned a username).
import { getDb, delay } from '../mock/db.js';
import { getSessionUser } from '../mock/session.js';

function apiError(message, status = 400) {
  const error = new Error(message);
  error.response = { status, data: { message } };
  return error;
}

function currentUser() {
  const user = getSessionUser();
  if (!user) throw apiError('Not authenticated', 401);
  return user;
}

function myCompletedDrivers(db, user) {
  const myCompletedRequestIds = db.requests
    .filter((r) => r.requestTypeName === 'Create Driver' && r.requesterId === user.id && r.statusName === 'Completed')
    .map((r) => r.id);

  return db.drivers
    .filter((d) => myCompletedRequestIds.includes(d.requestId) && d.username && d.driverStatus !== 'Disabled')
    .map((d) => ({ ...d, status: 'Active' }));
}

// Used by the "View All" button - every driver this requester's completed
// Create Driver requests have produced, no query needed.
export async function listMyCompletedDrivers() {
  await delay(200);
  const user = currentUser();
  const db = getDb();
  return { data: myCompletedDrivers(db, user) };
}

// Partial match across first name, username/email, and phone. An
// empty/whitespace query matches everything - shared by DriverSearchPanel's
// live client-side filtering so the match rules can't drift out of sync.
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
