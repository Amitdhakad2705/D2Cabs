import mongoose from 'mongoose';
import Counter from './Counter.js';
import { BOOKING_STATUS, PAYMENT_STATUS, SERVICE_TYPES, TRIP_TYPES } from '../constants.js';

const placeSchema = new mongoose.Schema(
  {
    address: { type: String, required: true, trim: true, maxlength: 300 },
    latitude: Number,
    longitude: Number,
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, unique: true, index: true }, // D2C-2026-000123 (auto)
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    serviceType: { type: String, enum: SERVICE_TYPES, required: true },
    tripType: { type: String, enum: TRIP_TYPES, required: true },
    pickup: { type: placeSchema, required: true },
    drop: { type: placeSchema, required: true },
    journeyDate: { type: Date, required: true },
    journeyTime: { type: String, required: true }, // "HH:mm"
    returnDate: { type: Date }, // round trips
    returnTime: { type: String }, // "HH:mm"

    // Trip window used to stop a driver being double-booked.
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },

    cabId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cab', required: true },
    // Calculated by the SERVER (Step 2). Never trust an amount sent by the browser.
    fare: {
      distanceKm: { type: Number, default: 0 },
      billableKm: { type: Number, default: 0 },
      days: { type: Number, default: 1 },
      baseFare: { type: Number, default: 0 }, // trip fare before allowance / GST
      driverAllowance: { type: Number, default: 0 },
      addonAmount: { type: Number, default: 0 },
      gst: { type: Number, default: 0 },
      originalAmount: { type: Number, default: 0 }, // "before discount" price
      discountAmount: { type: Number, default: 0 },
      finalAmount: { type: Number, required: true }, // what the customer pays (whole rupees)
    },

    addons: { type: [String], default: [] }, // keys from ADDONS (roof, language, vehicle)

    customerDetails: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true },
      gender: { type: String, default: '' },
    },

    // Filled by admin. driverSnapshot keeps history even if the driver is edited later.
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    driverSnapshot: {
      name: String,
      vehicleType: String,
      phone: String,
      vehicleName: String,
      vehicleNumber: String,
      specialInstructions: String,
    },

    payPercent: { type: Number, enum: [25, 100], default: 25 }, // customer's chosen advance
    paidAmount: { type: Number, default: 0 }, // total rupees received so far (online + cash)
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.NOT_REQUESTED,
    },
    bookingStatus: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
      index: true,
    },
    statusHistory: { type: [statusHistorySchema], default: [] },

    adminNote: { type: String, default: '' },
    customerNote: { type: String, default: '', maxlength: 500 },
    cancelledBy: { type: String, enum: ['customer', 'admin', ''], default: '' },
  },
  { timestamps: true }
);

bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ driverId: 1, startAt: 1 });

// Generate D2C-<year>-<6 digit running number> before first save.
bookingSchema.pre('validate', async function () {
  if (this.bookingId) return;
  const year = new Date().getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { key: `booking-${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  this.bookingId = `D2C-${year}-${String(counter.seq).padStart(6, '0')}`;
});

export default mongoose.model('Booking', bookingSchema);
