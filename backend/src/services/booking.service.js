import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../constants.js';
import { assertTransition } from './transitions.js';

export { assertTransition };

/** Changes status + writes the history entry. Caller saves the booking. */
export function applyStatus(booking, to, { by, note = '' } = {}) {
  assertTransition(booking.bookingStatus, to);
  booking.bookingStatus = to;
  booking.statusHistory.push({ status: to, by, note, at: new Date() });
}

/** :id in a URL can be the Mongo _id or the public booking id (D2C-2026-000123). */
export function idFilter(idParam) {
  return mongoose.isValidObjectId(idParam) ? { _id: idParam } : { bookingId: String(idParam) };
}

/** A driver cannot have two active trips whose time windows overlap. */
export async function findDriverConflict(driverId, booking) {
  return Booking.findOne({
    driverId,
    _id: { $ne: booking._id },
    bookingStatus: {
      $in: [BOOKING_STATUS.DRIVER_ASSIGNED, BOOKING_STATUS.DRIVER_ON_THE_WAY, BOOKING_STATUS.TRIP_STARTED],
    },
    startAt: { $lt: booking.endAt },
    endAt: { $gt: booking.startAt },
  })
    .select('bookingId journeyDate journeyTime')
    .lean();
}

/** Adds money received to a booking and recalculates its payment status. */
export async function creditBooking(bookingObjectId, amount) {
  const updated = await Booking.findByIdAndUpdate(bookingObjectId, { $inc: { paidAmount: amount } }, { new: true });
  const paymentStatus =
    updated.paidAmount >= updated.fare.finalAmount ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PARTIALLY_PAID;
  return Booking.findByIdAndUpdate(bookingObjectId, { $set: { paymentStatus } }, { new: true });
}

/** Removes refunded money from a booking and recalculates its payment status. */
export async function debitBooking(bookingObjectId, amount) {
  const updated = await Booking.findByIdAndUpdate(bookingObjectId, { $inc: { paidAmount: -amount } }, { new: true });
  let paymentStatus;
  if (updated.paidAmount <= 0) paymentStatus = PAYMENT_STATUS.REFUNDED;
  else if (updated.paidAmount >= updated.fare.finalAmount) paymentStatus = PAYMENT_STATUS.PAID;
  else paymentStatus = PAYMENT_STATUS.PARTIALLY_PAID;
  return Booking.findByIdAndUpdate(bookingObjectId, { $set: { paymentStatus } }, { new: true });
}

/** What a customer is allowed to see (no admin-only notes). */
export function customerView(bookingDoc) {
  const b = typeof bookingDoc.toObject === 'function' ? bookingDoc.toObject() : { ...bookingDoc };
  delete b.adminNote;
  delete b.__v;
  b.balanceDue = Math.max(0, (b.fare?.finalAmount || 0) - (b.paidAmount || 0));
  return b;
}
