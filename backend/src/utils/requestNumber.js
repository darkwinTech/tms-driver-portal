import { requestRepository } from '../data/index.js';

// Format: REQ-{year}-{4-digit sequence}, resetting each calendar year.
export async function generateRequestNumber() {
  const year = new Date().getFullYear();
  const prefix = `REQ-${year}-`;

  const requests = await requestRepository.findAll();
  const maxSeq = requests
    .filter((r) => r.requestNumber.startsWith(prefix))
    .reduce((max, r) => {
      const seq = parseInt(r.requestNumber.slice(prefix.length), 10);
      return Number.isNaN(seq) ? max : Math.max(max, seq);
    }, 0);

  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
}


