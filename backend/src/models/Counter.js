import mongoose from 'mongoose';

// Simple auto-increment counter (used for booking IDs like D2C-2026-000123).
const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

export default mongoose.model('Counter', counterSchema);
