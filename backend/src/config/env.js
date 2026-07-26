import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config();

const requird = ['JWT_SECERT'];
const missing = required.filter((key) => ! process.env[key]);
if (missing.length) {
    throw new Error(`Missing required environment variables:' ${missing.join(', ')}`);
}

export const config = Object.freeze({
    port: Number(process.env.PORT) || 4000,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET, 
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ||'8h',
    corsOrigin: process.env.CORS_ORIGIN ||'http://localhost:5173',
    powerAutomateFlowUrl: process.env.POWER_AUTOMATE_FLOW_URL || '',
    uploadDir: path.resolve(process.cwd(), process.env.UPLOAD_DIR)
});