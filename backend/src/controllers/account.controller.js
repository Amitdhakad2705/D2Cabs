import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import PasswordReset from '../models/PasswordReset.js';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { ROLES } from '../constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isPlainObject } from '../utils/pick.js';
import { ADMIN_COOKIE, CUSTOMER_COOKIE, setAuthCookie, signToken } from '../utils/token.js';
import { isString, normalizeEmail, normalizePhone, validateName, validatePassword } from '../utils/validators.js';
import { sendMail } from '../services/mailer.service.js';

const ROUNDS = 12;
const OTP_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

/* ------------------------------ Profile ------------------------------ */

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body || {};
  const user = req.user;
  if (name !== undefined) {
    if (!validateName(name)) throw new ApiError(400, 'Please enter your name (2-80 characters).');
    user.name = name.trim();
  }
  if (email !== undefined) {
    const clean = normalizeEmail(email);
    if (!clean) throw new ApiError(400, 'Please enter a valid email address.');
    if (clean !== user.email && (await User.exists({ email: clean, _id: { $ne: user._id } }))) {
      throw new ApiError(409, 'This email is already used by another account.');
    }
    user.email = clean;
  }
  // The mobile number is the login id, so it is changed only by D2Cabs support.
  await user.save();
  res.json({ success: true, user });
});

/* ----------------------------- Saved addresses ----------------------------- */

function parseAddress(body) {
  if (!isPlainObject(body)) throw new ApiError(400, 'Invalid request body.');
  const address = isString(body.address) ? body.address.trim() : '';
  if (!address || address.length > 300) throw new ApiError(400, 'Please enter the address.');
  const out = { address };
  if (body.label !== undefined) out.label = isString(body.label) ? body.label.trim().slice(0, 40) : '';
  for (const k of ['latitude', 'longitude']) {
    if (body[k] !== undefined && body[k] !== null) {
      if (typeof body[k] !== 'number' || !Number.isFinite(body[k])) throw new ApiError(400, `${k} must be a number.`);
      out[k] = body[k];
    }
  }
  return out;
}

export const addAddress = asyncHandler(async (req, res) => {
  if (req.user.addresses.length >= 10) throw new ApiError(400, 'You can save up to 10 addresses.');
  req.user.addresses.push(parseAddress(req.body));
  await req.user.save();
  res.status(201).json({ success: true, addresses: req.user.addresses });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const addr = req.user.addresses.id(req.params.addressId);
  if (!addr) throw new ApiError(404, 'Address not found.');
  addr.deleteOne();
  await req.user.save();
  res.json({ success: true, addresses: req.user.addresses });
});

/* --------------------------- Change password --------------------------- */

function makeChangePassword(cookieName) {
  return asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!isString(currentPassword) || !validatePassword(newPassword)) {
      throw new ApiError(400, 'Enter your current password and a new password of 8 to 72 characters.');
    }
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new ApiError(400, 'Current password is incorrect.');
    }
    user.passwordHash = await bcrypt.hash(newPassword, ROUNDS);
    user.passwordChangedAt = new Date(); // logs out every other device
    await user.save();
    setAuthCookie(res, cookieName, signToken(user)); // keep THIS device logged in
    res.json({ success: true });
  });
}
export const changePassword = makeChangePassword(CUSTOMER_COOKIE);
export const adminChangePassword = makeChangePassword(ADMIN_COOKIE);

/* -------------------------- Forgot / reset password -------------------------- */
// The OTP is emailed to the address on the account. (SMS needs a paid provider - see README.)

const hashOtp = (userId, otp) =>
  crypto.createHmac('sha256', env.jwtSecret).update(`${userId}:${otp}`).digest('hex');

async function findCustomerByIdentifier(identifier) {
  if (!isString(identifier) || !identifier.trim()) return null;
  const id = identifier.trim();
  const lookup = id.includes('@') ? { email: id.toLowerCase() } : { phone: normalizePhone(id) };
  if (lookup.phone === null) return null;
  const user = await User.findOne({ ...lookup, role: ROLES.CUSTOMER });
  return user && user.isActive ? user : null;
}

export const forgotPassword = asyncHandler(async (req, res) => {
  const generic = {
    success: true,
    message: 'If an account exists, a 6-digit OTP has been sent to its registered email address.',
  };
  const user = await findCustomerByIdentifier(req.body?.identifier);
  if (!user) return res.json(generic); // same answer whether the account exists or not

  const recent = await PasswordReset.findOne({ userId: user._id, createdAt: { $gt: new Date(Date.now() - 60000) } });
  if (recent) return res.json(generic); // one OTP per minute

  await PasswordReset.deleteMany({ userId: user._id });
  const otp = String(crypto.randomInt(100000, 1000000));
  await PasswordReset.create({
    userId: user._id,
    otpHash: hashOtp(user._id, otp),
    expiresAt: new Date(Date.now() + OTP_MINUTES * 60000),
  });
  await sendMail({
    to: user.email,
    subject: 'D2Cabs password reset OTP',
    text: `Your D2Cabs OTP is ${otp}. It is valid for ${OTP_MINUTES} minutes. If you did not ask for this, ignore this email.`,
  });
  res.json(generic);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { identifier, otp, newPassword } = req.body || {};
  const bad = new ApiError(400, 'The OTP is invalid or has expired.');
  if (!isString(otp) || !/^\d{6}$/.test(otp)) throw bad;
  if (!validatePassword(newPassword)) throw new ApiError(400, 'New password must be 8 to 72 characters.');

  const user = await findCustomerByIdentifier(identifier);
  if (!user) throw bad;
  const reset = await PasswordReset.findOne({ userId: user._id, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
  if (!reset) throw bad;

  // Count the try BEFORE checking, so guessing is limited to 5 attempts per OTP.
  const attempt = await PasswordReset.findOneAndUpdate(
    { _id: reset._id, attempts: { $lt: MAX_OTP_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { new: true }
  );
  if (!attempt) throw new ApiError(429, 'Too many wrong attempts. Please request a new OTP.');

  const a = Buffer.from(hashOtp(user._id, otp));
  const b = Buffer.from(reset.otpHash);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw bad;

  user.passwordHash = await bcrypt.hash(newPassword, ROUNDS);
  user.passwordChangedAt = new Date();
  await user.save();
  await PasswordReset.deleteMany({ userId: user._id });
  res.json({ success: true, message: 'Password changed. Please log in.' });
});
