// Emergency tool: set a new admin password from the server.
// Usage:  ADMIN_EMAIL=admin@example.com NEW_PASSWORD='long-new-password' npm run reset:admin-password
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import '../src/config/env.js';
import { ROLES } from '../src/constants.js';
import User from '../src/models/User.js';
import { normalizeEmail } from '../src/utils/validators.js';

async function run() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const password = process.env.NEW_PASSWORD || '';
  if (!email) throw new Error('Set ADMIN_EMAIL');
  if (password.length < 10 || password.length > 72) throw new Error('NEW_PASSWORD must be 10 to 72 characters.');
  await connectDB();
  const admin = await User.findOne({ email, role: ROLES.ADMIN });
  if (!admin) throw new Error('No admin with this email.');
  admin.passwordHash = await bcrypt.hash(password, 12);
  admin.passwordChangedAt = new Date();
  await admin.save();
  console.log('Admin password updated.');
}

run()
  .catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
