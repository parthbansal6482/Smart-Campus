import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  // Polling GET requests (dashboard/kitchen boards refreshing every 15-30s)
  // shouldn't compete with write traffic for the same budget, or a busy
  // dashboard can lock legitimate staff out of the API.
  skip: req => req.method === 'GET',
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

/** Tight limiter for login — the main brute-force surface in the API. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: req => `${req.ip}:${String(req.body?.email || '').toLowerCase()}`,
  message: {
    success: false,
    message: 'Too many login attempts. Please wait 15 minutes and try again.',
  },
});

/**
 * Deliberately generous but non-zero: an SOS button must never feel
 * throttled to someone in genuine distress, but nothing should let a single
 * account flood the responder dashboard with dozens of alerts a minute.
 */
export const emergencyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => req.user?.userId || req.ip || 'unknown',
  message: {
    success: false,
    message: 'Too many emergency alerts from this account in a short time. If this is a genuine emergency, call campus security directly.',
  },
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => `${req.ip}:${String(req.body?.email || '').toLowerCase()}`,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again later.',
  },
});
