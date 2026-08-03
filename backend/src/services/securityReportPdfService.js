import PDFDocument from 'pdfkit';
import { DRIVER_FIELDS } from '../utils/constants.js';

// Excludes licenseFile/idFile/photoFile - the report must never carry
// uploaded attachment content, only the driver's data fields.
const REPORT_FIELDS = DRIVER_FIELDS.filter((f) => f.type !== 'file');

function formatValue(value) {
  if (value === undefined || value === null || value === '') return null;
  return String(value);
}

// Builds a plain-text PDF (no HTML/CSS rendering involved) summarizing a
// hydrated request for the cybersecurity team: request/requester info, one
// key-value block per driver (non-file DRIVER_FIELDS only), and the full
// status history. `category` is supplied by the caller ('Created' |
// 'Modified' | 'Disabled') rather than derived here.
export function buildSecurityReportPdf(request, category) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text(`Security Report - ${category} Request ${request.requestNumber}`, { underline: true });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Request Number: ${request.requestNumber || ''}`);
    doc.text(`Request Type: ${request.requestTypeName || ''}`);
    doc.text(`Status: ${request.statusName || ''}`);
    doc.text(`Requester: ${request.requester?.fullName || ''} (${request.requester?.email || ''})`);
    doc.text(`Department: ${request.requester?.department || ''}`);
    if (request.currentProcessor) {
      doc.text(`Current Processor: ${request.currentProcessor.fullName} (${request.currentProcessor.email})`);
    }
    doc.text(`Submitted Date: ${request.submittedDate || ''}`);
    doc.text(`Completed Date: ${request.completedDate || ''}`);
    doc.text(`Description: ${request.description || ''}`);
    doc.text(`Business Justification: ${request.businessJustification || ''}`);
    doc.moveDown();

    doc.fontSize(14).text('Drivers', { underline: true });
    doc.moveDown(0.5);
    (request.drivers || []).forEach((driver, idx) => {
      doc.fontSize(12).text(`Driver ${idx + 1}`, { underline: true });
      doc.fontSize(10);
      REPORT_FIELDS.forEach((field) => {
        const value = formatValue(driver[field.key]);
        if (value === null) return;
        doc.text(`${field.label}: ${value}`);
      });
      if (category === 'Modified' && driver.changeSummary) {
        doc.text(`Change Summary: ${driver.changeSummary}`);
      }
      if (category === 'Disabled') {
        doc.text(`Driver Status: ${driver.driverStatus || ''}`);
      }
      doc.moveDown();
    });

    doc.fontSize(14).text('Status History', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    (request.history || []).forEach((h) => {
      const actor = h.actor ? `${h.actor.fullName} (${h.actor.email})` : 'Unknown';
      const remarks = h.remarks ? ` - ${h.remarks}` : '';
      doc.text(`${h.createdAt} - ${h.oldStatus || 'N/A'} -> ${h.newStatus} - ${actor}${remarks}`);
    });

    doc.end();
  });
}
