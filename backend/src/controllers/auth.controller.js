import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { ROLES } from '../constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  isString,
  normalizeEmail,
  normalizePhone,
  validateName,
  validatePassword,
} from '../utils/validators.js';
import { ADMIN_COOKIE, CUSTOMER_COOKIE, clearAuthCookie, setAuthCookie, signToken } from '../utils/token.js';

const BCRYPT_ROUNDS = 12;
// Compared against when the user does not exist, so response time does not reveal
// whether an email/phone is registered.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

/* ---------------------------- Customer ---------------------------- */

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body || {};

  const cleanEmail = normalizeEmail(email);
  const cleanPhone = normalizePhone(phone);
  if (!validateName(name)) throw new ApiError(400, 'Please enter your name (2-80 characters).');
  if (!cleanEmail) throw new ApiError(400, 'Please enter a valid email address.');
  if (!cleanPhone) throw new ApiError(400, 'Please enter a valid 10-digit mobile number.');
  if (!validatePassword(password)) throw new ApiError(400, 'Password must be 8 to 72 characters.');

  const exists = await User.findOne({ $or: [{ email: cleanEmail }, { phone: cleanPhone }] }).lean();
  if (exists) throw new ApiError(409, 'An account with this email or mobile number already exists.');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  // role is ALWAYS customer here. Admins are only created with `npm run seed:admin`.
  const user = await User.create({
    name: name.trim(),
    email: cleanEmail,
    phone: cleanPhone,
    passwordHash,
    role: ROLES.CUSTOMER,
  });

  setAuthCookie(res, CUSTOMER_COOKIE, signToken(user));
  res.status(201).json({ success: true, user });
});

// identifier = email OR mobile number (same single-field login as the current frontend)
function makeLogin(role, cookieName) {
  return asyncHandler(async (req, res) => {
    const { identifier, password } = req.body || {};
    if (!isString(identifier) || !isString(password) || !identifier.trim() || !password) {
      throw new ApiError(400, 'Please enter your email or mobile number and password.');
    }

    const id = identifier.trim();
    const isEmail = id.includes('@');
    const lookup = isEmail ? { email: id.toLowerCase() } : { phone: normalizePhone(id) };

    const user =
      !isEmail && !lookup.phone ? null : await User.findOne(lookup).select('+passwordHash');
    const passwordOk = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH);

    // One generic message for every failure (wrong id, wrong password, wrong role).
    if (!user || !passwordOk || user.role !== role) throw new ApiError(401, 'Invalid login details.');
    if (!user.isActive) throw new ApiError(403, 'Your account is disabled. Please contact D2Cabs support.');

    setAuthCookie(res, cookieName, signToken(user));
    res.json({ success: true, user });
  });
}

export const login = makeLogin(ROLES.CUSTOMER, CUSTOMER_COOKIE);

export const logout = (_req, res) => {
  clearAuthCookie(res, CUSTOMER_COOKIE);
  res.json({ success: true });
};

export const me = (req, res) => res.json({ success: true, user: req.user });

/* ------------------------------ Admin ------------------------------ */

export const adminLogin = makeLogin(ROLES.ADMIN, ADMIN_COOKIE);

export const adminLogout = (_req, res) => {
  clearAuthCookie(res, ADMIN_COOKIE);
  res.json({ success: true });
};

export const adminMe = (req, res) => res.json({ success: true, user: req.user });
