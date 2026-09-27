import mongoose from 'mongoose';
import { PAYMENT_STATUS } from '../constants.js';

const paymentSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 }, // in rupees
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, index: true },
    method: { type: String, default: '' }, // upi / card / netbanking ... / cash (recorded by admin)
    note: { type: String, default: '' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // set for cash payments
    failureReason: { type: String, default: '' },
    paidAt: Date,
    refund: {
      amount: Number,
      razorpayRefundId: String,
      refundedAt: Date,
      reason: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
