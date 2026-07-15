import { getDb } from './db.js';

// Format: REQ-{year}-{4-digit sequence}, resetting each calendar year.
export function generateRequestNumber() {
  const db = getDb();
  const year = new Date().getFullYear();
  const prefix = `REQ-${year}-`;

  const maxSeq = db.requests
    .filter((r) => r.requestNumber.startsWith(prefix))
    .reduce((max, r) => {
      const seq = parseInt(r.requestNumber.slice(prefix.length), 10);
      return Number.isNaN(seq) ? max : Math.max(max, seq);
    }, 0);

  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
}
