import dotenv from 'dotenv'
import path from 'node:path'

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
    graphTenantId: process.env.GRAPH_TENANT_ID || '',
    graphClientId: process.env.GRAPH_CLIENT_ID || '',
    graphClientSecret: process.env.GRAPH_CLIENT_SECRET || '',
    serviceNowFromMailbox: process.env.SERVICENOW_FROM_MAILBOX || 'dana.almuallem@asmo.com',
    serviceNowNotifyEmail: process.env.SERVICENOW_NOTIFY_EMAIL || 'aleen.alqarni@asmo.com',
    uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads')
});