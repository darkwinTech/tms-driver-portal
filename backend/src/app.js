import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import routes from './routes/index.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

// Trust the first proxy hop (the WAF, once deployed) so req.secure and
// X-Forwarded-* headers reflect the real client, not the proxy - needed for
// the HTTPS check below and for rate limiting by real client IP.
app.set('trust proxy', 1);

app.use(helmet({
  // Explicit HSTS beyond helmet's defaults: 1 year, apply to subdomains, and
  // eligible for the public preload list once this domain is submitted -
  // this is what actually stops a browser from ever trying plain HTTP again
  // after its first real HTTPS visit.
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || config.corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
app.use(express.json({ limit: '2mb' }));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// Defense-in-depth: the WAF should never forward plain HTTP, but reject it
// here too in case that ever fails. Gated to production only - req.secure is
// always false for local http://localhost dev, which must keep working.
if (config.nodeEnv === 'production') {
  app.use((req, res, next) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      return next();
    }
    res.status(403).json({ message: 'HTTPS is required' });
  });
}

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);