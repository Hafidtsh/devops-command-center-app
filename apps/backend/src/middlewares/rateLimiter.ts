import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/apiResponse';

/** Strict limiter for auth endpoints: 5 attempts per 15 min */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Too many failed attempts. Account locked for 15 minutes.',
      429
    );
  },
});

/** General API limiter: 100 req per minute */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(res, 'Too many requests, please slow down.', 429);
  },
});
