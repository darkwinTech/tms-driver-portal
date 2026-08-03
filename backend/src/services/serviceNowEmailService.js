import { config } from '../config/env.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { sendSmtpMail } from './smtpMailService.js';

function buildEmailSubject(request) {
  return `Driver Profile Completed - Request ${request.requestNumber} - ${request.requester?.fullName || ''}`;
}

// Narrows each driver down to the 6 fields ServiceNow needs (First Name,
// Last Name, Email, Mobile Number, PO Number, PO Expiration Date), same
// intent as the "Select" step in the original Power Automate design.
function buildEmailHtml(request) {
  const rows = (request.drivers || [])
    .map((d) => `
      <tr>
        <td>${escapeHtml(d.firstName)}</td>
        <td>${escapeHtml(d.lastName)}</td>
        <td>${escapeHtml(d.email)}</td>
        <td>${escapeHtml(d.phone)}</td>
        <td>${escapeHtml(d.poNumber)}</td>
        <td>${escapeHtml(d.poExpiry)}</td>
      </tr>`)
    .join('');

  return `
    <p>
      Request <strong>${escapeHtml(request.requestNumber)}</strong> submitted by
      ${escapeHtml(request.requester?.fullName)} (${escapeHtml(request.requester?.email)},
      ${escapeHtml(request.requester?.department)}) has completed the driver profile step.
    </p>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">
      <thead>
        <tr>
          <th>First Name</th>
          <th>Last Name</th>
          <th>Email</th>
          <th>Mobile Number</th>
          <th>PO Number</th>
          <th>PO Expiration Date</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// The email is the only handoff to ServiceNow - ServiceNow's inbound-email
// rule owns ticket creation and everything downstream from there, entirely
// outside this app. So this is fire-and-forget: send the email, treat a
// non-2xx response as failure, and don't expect anything back (no ticket
// number is ever reported to this app).
export async function sendServiceNowNotification(request) {
  const subject = buildEmailSubject(request);
  const html = buildEmailHtml(request);

  await sendSmtpMail({
    to: config.serviceNowNotifyEmail,
    from: config.serviceNowFromMailbox,
    subject,
    html,
  });
  return { subject, html };
}
