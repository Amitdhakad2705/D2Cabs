import { BOOKING_TRANSITIONS } from '../constants.js';
import { ApiError } from '../utils/ApiError.js';

/** PURE: throws if a booking is not allowed to move from one status to another. */
export function assertTransition(from, to) {
  const allowed = BOOKING_TRANSITIONS[from] || [];
  if (!allowed.includes(to)) {
    throw new ApiError(409, `A booking that is ${from} cannot be changed to ${to}.`);
  }
}
