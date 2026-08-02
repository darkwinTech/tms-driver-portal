import { requestRepository } from '../data/index.js';
import { hydrateRequestSummary } from '../utils/hydrate.js';
import { buildRequestsReportBuffer, EXCEL_MIME_TYPE } from '../services/excelService.js';
export async function monthly(req, res) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const rows = (await requestRepository.findAll((r) => new Date(r.createdAt) >= from))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(await Promise.all(rows.map(hydrateRequestSummary)));
}
export async function completed(req, res) {
  const rows = (await requestRepository.findAll((r) => r.statusName === 'Completed'))
    .sort((a, b) => new Date(b.completedDate || 0) - new Date(a.completedDate || 0));
  res.json(await Promise.all(rows.map(hydrateRequestSummary)));
}
export async function rejected(req, res) {
  const rows = (await requestRepository.findAll((r) => r.statusName === 'Rejected'))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(await Promise.all(rows.map(hydrateRequestSummary)));
}
export async function exportExcel(req, res) {
  const rows = (await requestRepository.findAll())
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const hydrated = await Promise.all(rows.map(hydrateRequestSummary));
  const buffer = await buildRequestsReportBuffer(hydrated);
  res.setHeader('Content-Type', EXCEL_MIME_TYPE);
  res.setHeader('Content-Disposition', 'attachment; filename="requests_report.xlsx"');
  res.send(buffer);
}

 