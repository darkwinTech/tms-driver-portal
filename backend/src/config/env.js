import dotenv from 'dotenv'

dotenv.config();

const required = ['JWT_SECRET'];
const missing = required.filter((key) => ! process.env[key]);
if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

export const config = Object.freeze({
    port: Number(process.env.PORT) || 4000,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET, 
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ||'8h',
    corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    serviceNowFromMailbox: process.env.SERVICENOW_FROM_MAILBOX || 'dana.almuallem@asmo.com',
    serviceNowNotifyEmail: process.env.SERVICENOW_NOTIFY_EMAIL || 'aleen.alqarni@asmo.com',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: Number(process.env.SMTP_PORT) || 587,
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFromAddress: process.env.SMTP_FROM_ADDRESS || 'noreply@asmo.com',
    securityReportRecipient: process.env.SECURITY_REPORT_EMAIL || 'cybersecurity-team@asmo.com',
});