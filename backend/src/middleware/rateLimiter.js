import rateLimit from 'express-rate-limit';

// Throttles the auth endpoints (login/register) per IP. Local password auth
// is an interim measure ahead of ADFS integration, but to let
// brute-force/mass-registration attempts need to be slowed down regardless.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
});
