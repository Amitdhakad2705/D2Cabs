import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Two different cookies so a customer and an admin can be logged in
// in the same browser without overwriting each other.
export const CUSTOMER_COOKIE = 'd2_customer_token';
export const ADMIN_COOKIE = 'd2_admin_token';

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: `${env.jwtExpiresInDays}d`,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
}

const baseCookie = () => ({
  httpOnly: true, // JavaScript in the browser cannot read it (protects against XSS theft)
  secure: env.isProd, // HTTPS only in production
  sameSite: env.isProd ? 'none' : 'lax',
  path: '/',
});

export function setAuthCookie(res, name, token) {
  res.cookie(name, token, { ...baseCookie(), maxAge: env.jwtExpiresInDays * 24 * 60 * 60 * 1000 });
}

export function clearAuthCookie(res, name) {
  res.clearCookie(name, baseCookie());
}
