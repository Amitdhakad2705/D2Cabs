import rateLimit from 'express-rate-limit';

const make = (windowMs, limit, message, extra = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message },
    ...extra,
  });

export const loginLimiter = make(
  15 * 60 * 1000,
  10,
  'Too many login attempts. Please try again after 15 minutes.',
  { skipSuccessfulRequests: true }
);

export const registerLimiter = make(
  60 * 60 * 1000,
  20,
  'Too many sign-ups from this network. Please try again later.'
);

// Fare quotes call the routing service, so keep them limited per IP.
export const quoteLimiter = make(60 * 1000, 30, 'Too many fare requests. Please wait a minute and try again.');

export const bookingLimiter = make(60 * 60 * 1000, 20, 'Too many booking requests. Please try again later.');
export const forgotLimiter = make(15 * 60 * 1000, 5, 'Too many OTP requests. Please try again after 15 minutes.');
export const resetLimiter = make(15 * 60 * 1000, 10, 'Too many attempts. Please try again after 15 minutes.');
export const paymentLimiter = make(15 * 60 * 1000, 30, 'Too many payment attempts. Please try again later.');
