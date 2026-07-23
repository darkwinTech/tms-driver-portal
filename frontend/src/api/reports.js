import { getDb, delay } from '../mock/db.js';
import { hydrateRequestSummary } from '../mock/hydrate.js';
import { buildRequestsReportBlob } from '../mock/excel.js';

export async function getMonthlyReport() {
  await delay();
  const db = getDb();
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const rows = db.requests
    .filter((r) => new Date(r.createdAt) >= from)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(hydrateRequestSummary);
  return { data: rows };
}

export async function getCompletedReport() {
  await delay();
  const db = getDb();
  const rows = db.requests
    .filter((r) => r.statusName === 'Completed')
    .sort((a, b) => new Date(b.completedDate || 0) - new Date(a.completedDate || 0))
    .map(hydrateRequestSummary);
  return { data: rows };
}

export async function getRejectedReport() {
  await delay();
  const db = getDb();
  const rows = db.requests
    .filter((r) => r.statusName === 'Rejected')
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .map(hydrateRequestSummary);
  return { data: rows };
}

export async function exportReportsExcel() {
  await delay(150);
  const db = getDb();
  const rows = db.requests
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(hydrateRequestSummary);
  return { data: buildRequestsReportBlob(rows) };
}
