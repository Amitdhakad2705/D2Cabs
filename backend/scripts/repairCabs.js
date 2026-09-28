import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import Cab from '../src/models/Cab.js';

async function run() {
  await connectDB();

  const result = await Cab.updateMany(
    {
      key: {
        $in: ['wagonr', 'dzire', 'amaze', 'aura', 'ertiga', 'crysta'],
      },
    },
    {
      $set: { active: true },
    }
  );

  console.log(`Cabs repaired: ${result.modifiedCount}`);
}

run()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());