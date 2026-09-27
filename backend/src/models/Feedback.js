import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000, default: '' },
    isVisible: { type: Boolean, default: true }, // admin can hide
  },
  { timestamps: true }
);

export default mongoose.model('Feedback', feedbackSchema);
