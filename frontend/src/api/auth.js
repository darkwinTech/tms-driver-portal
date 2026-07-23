// Mock auth: validates against the in-memory/localStorage user list instead
// of a real server. Same function names/shapes as the full-stack version
// (login/register/fetchMe) so pages and AuthContext don't need to change.
import { getDb, delay } from '../mock/db.js';
import { DEMO_PASSWORD } from '../mock/seedData.js';
import { setSession, getSessionUser, clearSession } from '../mock/session.js';

function sanitizeUser(user) {
  const { id, employeeId, fullName, email, department, role, managerId } = user;
  return { id, employeeId, fullName, email, department, role, managerId };
}

export async function login(email, password) {
  await delay();
  const db = getDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.isActive);

  // Every seeded demo account shares the same password in this mock build.
  if (!user || password !== DEMO_PASSWORD) {
    const error = new Error('Invalid credentials');
    error.response = { data: { message: 'Invalid credentials' } };
    throw error;
  }

  const sanitized = sanitizeUser(user);
  setSession(sanitized);
  return { data: { token: `mock-token-${user.id}`, user: sanitized } };
}

export async function register(payload) {
  await delay();
  const db = getDb();
  const { employeeId, fullName, email, roleName, department, managerId } = payload;

  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim())) {
    const error = new Error('A user with this email already exists');
    error.response = { data: { message: 'A user with this email already exists' } };
    throw error;
  }

  const id = db.nextIds.user++;
  const user = { id, employeeId, fullName, email: email.toLowerCase().trim(), department, role: roleName, managerId: managerId || null, isActive: true };
  db.users.push(user);

  const sanitized = sanitizeUser(user);
  setSession(sanitized);
  return { data: { token: `mock-token-${id}`, user: sanitized } };
}

export async function fetchMe() {
  await delay(100);
  const user = getSessionUser();
  if (!user) {
    const error = new Error('Not authenticated');
    error.response = { status: 401, data: { message: 'Not authenticated' } };
    throw error;
  }
  return { data: { user } };
}

export function logoutSession() {
  clearSession();
}
