const rateLimit = require('express-rate-limit');
const { AppError } = require('./errorHandler');

// Generous general API limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' },
});

// Limiter for AI quiz generation (configurable via settings)
const createGenerationLimiter = (max = 10) =>
  rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(new AppError('Quiz generation rate limit reached. Please try again later.', 429));
    },
  });

module.exports = { generalLimiter, authLimiter, createGenerationLimiter };