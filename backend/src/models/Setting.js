import mongoose from 'mongoose';

// One document (key: 'main') with business settings the admin can edit.
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    companyProfile: {
      name: { type: String, default: 'D2Cabs' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    // Customers must book at least this many hours before pickup time.
    minAdvanceHours: { type: Number, default: 1, min: 0, max: 168 },
  },
  { timestamps: true }
);

settingSchema.statics.getMain = async function () {
  return this.findOneAndUpdate({ key: 'main' }, { $setOnInsert: { key: 'main' } }, { new: true, upsert: true });
};

export default mongoose.model('Setting', settingSchema);
