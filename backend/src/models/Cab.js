import mongoose from 'mongoose';

// Pricing mirrors CAB_PRICING_CONFIG in the old frontend (public/js/index.js).
// From Step 2 the server calculates fares from these numbers - never the browser.
const pricingSchema = new mongoose.Schema(
  {
    local: {
      baseFare: { type: Number, required: true, min: 0 },
      perKm: { type: Number, required: true, min: 0 },
    },
    outstation: {
      minimumFare: { type: Number, required: true, min: 0 },
      perKm: { type: Number, required: true, min: 0 },
      driverAllowance: { type: Number, required: true, min: 0 },
    },
    airport: {
      baseFare: { type: Number, required: true, min: 0 },
      perKm: { type: Number, required: true, min: 0 },
    },
  },
  { _id: false }
);

const cabSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true }, // wagonr, dzire ...
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true }, // Hatchback / Sedan / MPV / SUV
    image: { type: String, default: '' },
    seats: { type: Number, required: true, min: 1 },
    luggage: { type: String, default: '' }, // "2 Bags"
    fuel: { type: String, default: '' },
    ac: { type: Boolean, default: true },
    transmission: { type: String, enum: ['Manual', 'Automatic'], default: 'Manual' },
    pricing: { type: pricingSchema, required: true },
    active: { type: Boolean, default: true }, // admin can enable / disable
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Cab', cabSchema);
