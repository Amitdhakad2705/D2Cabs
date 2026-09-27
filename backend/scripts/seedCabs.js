// Loads the 6 cabs + prices that are currently hard-coded in the old frontend
// (public/js/index.js -> CAB_PRICING_CONFIG).  Run:  npm run seed:cabs
// Safe to re-run: existing cabs are NOT overwritten, so admin edits are kept.
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import '../src/config/env.js';
import Cab from '../src/models/Cab.js';
import { cabs } from './cabData.js';

async function run() {
  await connectDB();
  let added = 0;
  for (const cab of cabs) {
    const result = await Cab.updateOne({ key: cab.key }, { $setOnInsert: cab }, { upsert: true });
    if (result.upsertedCount) added += 1;
  }
  console.log(`Cabs added: ${added}, already present: ${cabs.length - added}`);
}

run()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
