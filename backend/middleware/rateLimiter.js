/**
 * Rate Limiting Middleware
 * Implements request rate limiting to prevent abuse
 */
const rateLimit = require('express-rate-limit');

// General API rate limit: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: {
    success: false,
    error_code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later',
  },
  standardHeaders: false, // Don't return rate limit info in headers
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/';
  },
});

// Strict limits for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    error_code: 'TOO_MANY_LOGIN_ATTEMPTS',
    message: 'Too many login attempts. Try again in 15 minutes.',
  },
  skipSuccessfulRequests: true, // Only count failed attempts
});

// Strict limits for registration (prevent spam accounts)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    success: false,
    error_code: 'TOO_MANY_REGISTRATIONS',
    message: 'Too many registration attempts. Try again later.',
  },
});

// Limits for message sending (prevent spam)
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 messages per minute
  message: {
    success: false,
    error_code: 'MESSAGE_RATE_LIMIT',
    message: 'Sending too many messages. Wait a moment.',
  },
});

// Limits for listing creation (prevent spam listings)
const listingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 listings per hour per user
  keyGenerator: (req, res) => {
    // Rate limit per user ID instead of IP
    return req.user?.id || req.ip;
  },
  message: {
    success: false,
    error_code: 'LISTING_RATE_LIMIT',
    message: 'Too many listings. Wait before creating another.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  registerLimiter,
  messageLimiter,
  listingLimiter,
};
