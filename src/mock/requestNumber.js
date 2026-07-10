import { getDb } from './db.js';

export function generateRequestNumber() {
  const year = new Date().getFullYear();
  const prefix = `REQ-${year}-`;
  const db = getDb();

  const matching = db.requests
    .filter((r) => r.requestNumber.startsWith(prefix))
    .map((r) => parseInt(r.requestNumber.split('-').pop(), 10))
    .filter((n) => !Number.isNaN(n));

  const nextSeq = matching.length ? Math.max(...matching) + 1 : 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}
