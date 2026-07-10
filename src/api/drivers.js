// Searches the "existing driver" directory - used by Modify Driver and
// Disable Driver requests, which act on a driver that already exists rather
// than starting from a blank form. Mirrors what a real backend endpoint
// (e.g. GET /api/drivers/search?q=...) would return.
import { getDb, delay } from '../mock/db.js';

export async function searchDrivers(query) {
  await delay(200);
  const db = getDb();
  const q = (query || '').trim().toLowerCase();

  if (!q) return { data: [] };

  const results = db.driverDirectory.filter((d) => d.email.toLowerCase().includes(q));

  return { data: results };
}
