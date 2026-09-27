// Creates the first admin account from .env values.  Run once:  npm run seed:admin
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import '../src/config/env.js';
import { ROLES } from '../src/constants.js';
import User from '../src/models/User.js';
import { normalizeEmail, normalizePhone } from '../src/utils/validators.js';

const email = normalizeEmail(process.env.ADMIN_EMAIL);
const phone = normalizePhone(process.env.ADMIN_PHONE);
const password = process.env.ADMIN_PASSWORD || '';
const name = (process.env.ADMIN_NAME || 'D2Cabs Admin').trim();

async function run() {
  if (!email) throw new Error('Set a valid ADMIN_EMAIL in .env');
  if (!phone) throw new Error('Set a valid 10-digit ADMIN_PHONE in .env');
  if (password.length < 10 || password.length > 72) {
    throw new Error('ADMIN_PASSWORD must be 10 to 72 characters.');
  }

  await connectDB();
  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    console.log(`A user with this email/phone already exists (role: ${existing.role}). Nothing changed.`);
    return;
  }

  await User.create({
    name,
    email,
    phone,
    passwordHash: await bcrypt.hash(password, 12),
    role: ROLES.ADMIN,
  });
  console.log(`Admin created: ${email}`);
}

run()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
