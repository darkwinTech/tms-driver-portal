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
    .filter((d) => myCompletedRequestIds.includes(d.requestId) && d.username)
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

// Partial match across first name, username/email, and phone.
export async function searchDrivers(query) {
  await delay(200);
  const user = currentUser();
  const db = getDb();
  const q = (query || '').trim().toLowerCase();

  if (!q) return { data: [] };

  const results = myCompletedDrivers(db, user).filter(
    (d) =>
      d.firstName.toLowerCase().includes(q) ||
      (d.username || '').toLowerCase().includes(q) ||
      (d.email || '').toLowerCase().includes(q) ||
      (d.phone || '').includes(q)
  );

  return { data: results };
}
