import { config } from '../config/env.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { sendSmtpMail } from './smtpMailService.js';
import { buildSecurityReportPdf } from './securityReportPdfService.js';

function buildEmailHtml(request, category) {
  return `
    <p>
      Request <strong>${escapeHtml(request.requestNumber)}</strong>
      (${escapeHtml(request.requestTypeName)}) submitted by
      ${escapeHtml(request.requester?.fullName)} (${escapeHtml(request.requester?.email)})
      has reached <strong>Completed</strong> - ${escapeHtml(category)}.
    </p>
    <p>Driver count: ${(request.drivers || []).length}</p>
    <p>See the attached PDF for full request and driver detail.</p>`;
}

// New notification, independent of sendServiceNowNotification (different
// trigger point, recipient, and content) - only the SMTP transport is
// shared. Sent whenever a request reaches Completed, regardless of type.
export async function sendSecurityTeamReport(request, category) {
  const subject = `Security Report - ${category} Request ${request.requestNumber}`;
  const pdfBuffer = await buildSecurityReportPdf(request, category);

  await sendSmtpMail({
    to: config.securityReportRecipient,
    from: config.smtpFromAddress,
    subject,
    html: buildEmailHtml(request, category),
    attachments: [
      {
        filename: `security-report-${request.requestNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}
