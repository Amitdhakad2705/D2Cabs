import mongoose from 'mongoose';

// Drivers never log in. Only the admin creates them and assigns them to bookings.
const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true },
    licenseNumber: { type: String, trim: true, uppercase: true, default: '' },
    cabId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cab' },
    vehicleName: { type: String, trim: true, default: '' }, // e.g. Maruti Suzuki Dzire
    vehicleNumber: { type: String, trim: true, uppercase: true, default: '' }, // e.g. MP09 AB 1234
    status: { type: String, enum: ['AVAILABLE', 'ON_TRIP', 'OFF_DUTY'], default: 'AVAILABLE' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Driver', driverSchema);
