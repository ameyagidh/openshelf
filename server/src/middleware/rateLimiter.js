import rateLimit from 'express-rate-limit';

// Rate limiting is a production concern; skip it in dev/test so repeated local
// runs and Playwright suites that log in several times per run aren't
// throttled by the same limiter that protects a real deployment.
const skip = () => process.env.NODE_ENV !== 'production';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: { error: { message: 'Too many auth attempts, try again later.' } },
});

export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: { error: { message: 'Too many requests, slow down.' } },
});
