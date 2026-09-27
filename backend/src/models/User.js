import mongoose from 'mongoose';
import { ROLES } from '../constants.js';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 40 }, // Home / Office
    address: { type: String, required: true, trim: true, maxlength: 300 },
    latitude: Number,
    longitude: Number,
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // 10-digit Indian mobile number, stored without +91
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CUSTOMER },
    profileImage: { type: String, default: '' },
    addresses: { type: [addressSchema], default: [] },
    isActive: { type: Boolean, default: true }, // admin can block a customer
    passwordChangedAt: { type: Date }, // old login sessions stop working after a password change
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
