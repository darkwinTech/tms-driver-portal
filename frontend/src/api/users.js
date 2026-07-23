import { getDb, delay } from '../mock/db.js';

export async function listUsers(role) {
  await delay(100);
  const db = getDb();
  const rows = db.users
    .filter((u) => !role || u.role === role)
    .map((u) => ({ id: u.id, fullName: u.fullName, email: u.email, department: u.department, managerId: u.managerId }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  return { data: rows };
}
