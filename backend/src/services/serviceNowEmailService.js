import { config } from '../config/env.js';

let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getGraphAccessToken() {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) {
    return cachedToken;
  }

  const tokenUrl = `https://login.microsoftonline.com/${config.graphTenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: config.graphClientId,
    client_secret: config.graphClientSecret,
    scope: 'https://graph.microsoft.com/.default',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) {
    throw new Error(`Failed to get Graph access token (status ${response.status})`);
  }
  const data = await response.json();
  cachedToken = data.access_token;
  cachedTokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

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

  if (!config.graphTenantId || !config.graphClientId || !config.graphClientSecret) {
    console.info('[ServiceNow Email] Graph credentials not configured - simulating email send:', {
      from: config.serviceNowFromMailbox,
      to: config.serviceNowNotifyEmail,
      subject,
    });
    return { simulated: true, subject, html };
  }

  const token = await getGraphAccessToken();
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${config.serviceNowFromMailbox}/sendMail`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: 'HTML', content: html },
          toRecipients: [{ emailAddress: { address: config.serviceNowNotifyEmail } }],
        },
        saveToSentItems: true,
      }),
    }
  );
  if (!response.ok) {
    throw new Error(`ServiceNow email send failed with status ${response.status}`);
  }
  return { simulated: false, subject, html };
}
