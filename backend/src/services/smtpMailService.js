import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let cachedTransporter = null;

function getTransporter() {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: config.smtpUser ? { user: config.smtpUser, pass: config.smtpPass } : undefined,
    });
  }
  return cachedTransporter;
}

// Shared SMTP transport for every outbound email in the app (ServiceNow
// handoff, cybersecurity report, and future registration verification).
// Mirrors the old Graph integration's "no credentials configured -> log and
// keep working" behavior so the rest of each flow's fire-and-forget logic
// (status transitions, notifications) is unaffected by SMTP being unset.
export async function sendSmtpMail({ to, from, subject, html, attachments }) {
  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
    console.info('[SMTP Mail] SMTP credentials not configured - simulating email send:', {
      from,
      to,
      subject,
      attachmentCount: attachments?.length || 0,
    });
    return { simulated: true, to, subject };
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: from || config.smtpFromAddress,
    to,
    subject,
    html,
    attachments,
  });
  return { simulated: false, to, subject };
}
