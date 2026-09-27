import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { BOOKING_STATUS, PAYMENT_STATUS, PAY_PERCENT_OPTIONS } from '../constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePage } from '../utils/pick.js';
import { isString } from '../utils/validators.js';
import { creditBooking, debitBooking, idFilter } from '../services/booking.service.js';
import { notifyAdmin, notifyCustomer } from '../services/notify.service.js';
import {
  capturePayment,
  createOrder,
  fetchPayment,
  razorpayConfigured,
  refundPayment,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from '../services/razorpay.service.js';

const money = (n) => `Rs ${Math.round(n).toLocaleString('en-IN')}`;
const PAYABLE_STATUSES = [
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.DRIVER_ASSIGNED,
  BOOKING_STATUS.DRIVER_ON_THE_WAY,
  BOOKING_STATUS.TRIP_STARTED,
];

/* ------------------------- Customer: create order ------------------------- */
// The amount is worked out HERE from the booking in the database.
// Nothing the browser sends can change how much is charged.
export const createPaymentOrder = asyncHandler(async (req, res) => {
  if (!razorpayConfigured()) throw new ApiError(503, 'Online payment is not available right now. Please contact support.');
  const ref = req.body?.bookingId;
  if (!isString(ref)) throw new ApiError(400, 'bookingId is required.');

  const booking = await Booking.findOne({ ...idFilter(ref), customerId: req.user._id });
  if (!booking) throw new ApiError(404, 'Booking not found.');
  if (!PAYABLE_STATUSES.includes(booking.bookingStatus)) {
    throw new ApiError(409, 'This booking is not ready for payment. It must be approved first.');
  }

  const total = booking.fare.finalAmount;
  const remaining = total - booking.paidAmount;
  if (remaining <= 0) throw new ApiError(409, 'This booking is already fully paid.');

  const percent = PAY_PERCENT_OPTIONS.includes(req.body?.payPercent) ? req.body.payPercent : booking.payPercent;
  let amount;
  if (percent === 100) {
    amount = remaining;
  } else {
    if (booking.paidAmount > 0) throw new ApiError(409, 'The advance is already paid. Please pay the remaining amount.');
    amount = Math.min(remaining, Math.round((total * percent) / 100));
  }

  const order = await createOrder({
    amountPaise: amount * 100,
    receipt: booking.bookingId,
    notes: { bookingId: booking.bookingId },
  });
  const payment = await Payment.create({
    bookingId: booking._id,
    customerId: req.user._id,
    amount,
    status: PAYMENT_STATUS.PENDING,
    razorpayOrderId: order.id,
  });

  res.json({
    success: true,
    orderId: order.id,
    amount: order.amount, // paise, as Razorpay Checkout expects
    currency: order.currency,
    keyId: env.razorpay.keyId, // public key, safe to send
    paymentId: payment._id,
    bookingId: booking.bookingId,
  });
});

/* ---------- Shared by verify + webhook: mark a payment captured ONCE ---------- */
async function markCaptured(razorpayOrderId, rp) {
  // Atomic: only the first caller (verify or webhook) flips PENDING/FAILED -> PAID.
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId, status: { $ne: PAYMENT_STATUS.PAID } },
    {
      $set: {
        status: PAYMENT_STATUS.PAID,
        razorpayPaymentId: rp.id,
        method: rp.method || '',
        paidAt: new Date(),
        failureReason: '',
      },
    },
    { new: true }
  );
  if (!payment) return { payment: await Payment.findOne({ razorpayOrderId }), firstTime: false };

  const booking = await creditBooking(payment.bookingId, payment.amount);
  const user = await User.findById(payment.customerId);
  if (user) {
    await notifyCustomer({
      user,
      type: 'PAYMENT_SUCCESSFUL',
      title: 'Payment successful',
      message: `We received ${money(payment.amount)} for booking ${booking.bookingId}.${
        booking.paymentStatus === PAYMENT_STATUS.PAID ? ' Your booking is fully paid.' : ` Balance due: ${money(booking.fare.finalAmount - booking.paidAmount)}.`
      }`,
      booking,
    });
  }
  await notifyAdmin({
    type: 'PAYMENT_SUCCESSFUL',
    title: `Payment received ${booking.bookingId}`,
    message: `${money(payment.amount)} received for ${booking.bookingId} (${payment.method || 'online'}).`,
    booking,
  });
  return { payment, booking, firstTime: true };
}

/* ------------------------- Customer: verify payment ------------------------- */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
  if (![orderId, paymentId, signature].every(isString)) throw new ApiError(400, 'Payment details are missing.');

  const payment = await Payment.findOne({ razorpayOrderId: orderId, customerId: req.user._id });
  if (!payment) throw new ApiError(404, 'Payment not found.');

  if (payment.status === PAYMENT_STATUS.PAID) {
    const booking = await Booking.findById(payment.bookingId).lean();
    return res.json({ success: true, verified: true, captured: true, bookingId: booking.bookingId, amountPaidRupees: payment.amount, paymentStatus: booking.paymentStatus });
  }

  // 1. The signature proves Razorpay (not the browser) issued this payment id.
  if (!verifyCheckoutSignature({ orderId, paymentId, signature })) {
    throw new ApiError(400, 'Payment signature could not be verified.');
  }

  // 2. Ask Razorpay directly: right order, right amount, and captured.
  let rp = await fetchPayment(paymentId);
  if (rp.order_id !== orderId || rp.amount !== payment.amount * 100 || rp.currency !== 'INR') {
    throw new ApiError(400, 'Payment details do not match this booking.');
  }
  if (rp.status === 'authorized') rp = await capturePayment(paymentId, rp.amount);
  if (rp.status !== 'captured') {
    return res.status(402).json({ success: false, verified: true, captured: false, message: 'Payment is not captured yet.' });
  }

  const { booking } = await markCaptured(orderId, rp);
  const fresh = booking || (await Booking.findById(payment.bookingId));
  res.json({
    success: true,
    verified: true,
    captured: true,
    bookingId: fresh.bookingId,
    amountPaidRupees: payment.amount,
    paymentStatus: fresh.paymentStatus,
  });
});

/* ------------------------------ Razorpay webhook ------------------------------ */
// Mounted in app.js with express.raw() so the signature is checked against the exact bytes.
export async function razorpayWebhook(req, res) {
  const signature = req.get('x-razorpay-signature');
  if (!env.razorpay.webhookSecret) {
    console.error('Webhook received but RAZORPAY_WEBHOOK_SECRET is not set.');
    return res.status(503).json({ success: false });
  }
  if (!Buffer.isBuffer(req.body) || !verifyWebhookSignature(req.body, signature)) {
    return res.status(400).json({ success: false, message: 'Invalid signature.' });
  }

  try {
    const event = JSON.parse(req.body.toString('utf8'));
    const rp = event?.payload?.payment?.entity;
    if (event.event === 'payment.captured' && rp?.order_id) {
      await markCaptured(rp.order_id, rp);
    } else if (event.event === 'payment.failed' && rp?.order_id) {
      await Payment.updateOne(
        { razorpayOrderId: rp.order_id, status: { $ne: PAYMENT_STATUS.PAID } },
        { $set: { status: PAYMENT_STATUS.FAILED, razorpayPaymentId: rp.id, failureReason: rp.error_description || '' } }
      );
    }
    // refunds are recorded when the admin issues them (refundPaymentAdmin below)
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ success: false }); // Razorpay will retry
  }
}

/* ================================= ADMIN ================================= */

export const adminListPayments = asyncHandler(async (req, res) => {
  const filter = {};
  if (Object.values(PAYMENT_STATUS).includes(req.query.status)) filter.status = req.query.status;
  const { page, limit, skip } = parsePage(req.query);
  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('bookingId', 'bookingId customerDetails.name customerDetails.phone bookingStatus')
      .lean(),
    Payment.countDocuments(filter),
  ]);
  res.json({ success: true, payments, total, page, pages: Math.ceil(total / limit) || 1 });
});

// Refund an online payment (full or partial). Cash payments must be refunded outside the system.
export const adminRefund = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, 'Payment not found.');
  if (payment.status !== PAYMENT_STATUS.PAID || !payment.razorpayPaymentId) {
    throw new ApiError(409, 'Only a successful online payment can be refunded here.');
  }
  const alreadyRefunded = payment.refund?.amount || 0;
  const maxRefund = payment.amount - alreadyRefunded;
  const amount = req.body?.amount === undefined ? maxRefund : req.body.amount;
  if (!Number.isInteger(amount) || amount < 1 || amount > maxRefund) {
    throw new ApiError(400, `Refund must be a whole number between 1 and ${maxRefund}.`);
  }
  const reason = isString(req.body?.reason) ? req.body.reason.trim().slice(0, 200) : '';

  const refund = await refundPayment(payment.razorpayPaymentId, amount * 100, { reason });
  payment.refund = {
    amount: alreadyRefunded + amount,
    razorpayRefundId: refund.id,
    refundedAt: new Date(),
    reason,
  };
  if (payment.refund.amount >= payment.amount) payment.status = PAYMENT_STATUS.REFUNDED;
  await payment.save();

  const booking = await debitBooking(payment.bookingId, amount);
  const user = await User.findById(payment.customerId);
  if (user) {
    await notifyCustomer({
      user,
      type: 'PAYMENT_REFUNDED',
      title: 'Refund initiated',
      message: `A refund of ${money(amount)} for booking ${booking.bookingId} has been initiated. It usually reaches your account in 5-7 working days.`,
      booking,
    });
  }
  res.json({ success: true, payment, booking });
});
