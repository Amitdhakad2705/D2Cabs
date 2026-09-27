import User from '../models/User.js';
import { ROLES } from '../constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ADMIN_COOKIE, CUSTOMER_COOKIE, verifyToken } from '../utils/token.js';

function authenticate(cookieName, role) {
  return asyncHandler(async (req, _res, next) => {
    const token = req.cookies?.[cookieName];
    if (!token) throw new ApiError(401, 'Please log in.');

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new ApiError(401, 'Session expired. Please log in again.');
    }
    if (payload.role !== role) throw new ApiError(403, 'You are not allowed to do this.');

    // Always re-check the database: a blocked user or a demoted admin loses access immediately.
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive || user.role !== role) throw new ApiError(401, 'Please log in.');

    // A password change logs out every older session (token issued before the change).
    if (user.passwordChangedAt && payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
      throw new ApiError(401, 'Session expired. Please log in again.');
    }

    req.user = user;
    next();
  });
}

export const requireCustomer = authenticate(CUSTOMER_COOKIE, ROLES.CUSTOMER);
export const requireAdmin = authenticate(ADMIN_COOKIE, ROLES.ADMIN);
