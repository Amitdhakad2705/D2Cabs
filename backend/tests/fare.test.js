// Run:  npm test      (needs no database and no internet)
// Compares the server fare engine with a copy of the ORIGINAL frontend formulas
// (customer/public/js/index.js) for every cab, trip type and many distances.
import assert from 'node:assert/strict';
import test from 'node:test';
import { cabs } from '../scripts/cabData.js';
import { calculateBreakdown, engineKey, tripDays } from '../src/services/fare.service.js';

/* ---- reference: formulas copied from the old frontend ---- */
const RULES = { gstRate: 0.05, roundTripMinBillableKm: 250, roundTripDriverAllowancePerDay: 300, originalPriceMarkup: 1.22 };
function refBreakdown(pricing, tripType, distanceKm, days = 1) {
  let fare;
  let allowance = 0;
  if (tripType === 'local') fare = pricing.local.baseFare + distanceKm * pricing.local.perKm;
  else if (tripType === 'airport') fare = pricing.airport.baseFare + distanceKm * pricing.airport.perKm;
  else if (tripType === 'outstation-oneway') {
    fare = Math.max(pricing.outstation.minimumFare, distanceKm * pricing.outstation.perKm);
    allowance = pricing.outstation.driverAllowance;
  } else {
    fare = Math.max(distanceKm * 2, RULES.roundTripMinBillableKm) * pricing.outstation.perKm;
    allowance = RULES.roundTripDriverAllowancePerDay * Math.max(1, Math.round(days) || 1);
  }
  const gst = tripType.startsWith('outstation') ? fare * RULES.gstRate : 0;
  const finalFare = fare + allowance + gst;
  const originalPrice = finalFare * RULES.originalPriceMarkup;
  const discountAmount = Math.max(0, originalPrice - finalFare);
  return {
    fare, allowance, gst, finalFare, originalPrice, discountAmount,
    discountPercent: (discountAmount / originalPrice) * 100,
  };
}

const TRIPS = [
  { key: 'local', serviceType: 'local', tripType: 'one_way' },
  { key: 'airport', serviceType: 'airport', tripType: 'one_way' },
  { key: 'outstation-oneway', serviceType: 'outstation', tripType: 'one_way' },
  { key: 'outstation-roundtrip', serviceType: 'outstation', tripType: 'round_trip' },
];
const DISTANCES = [0.5, 5, 12.5, 40, 99.9, 120, 300, 450.7, 1200];

test('server fare equals the old frontend fare for every cab / trip / distance / days', () => {
  for (const cab of cabs) {
    for (const t of TRIPS) {
      for (const distanceKm of DISTANCES) {
        for (const days of [1, 3]) {
          const ref = refBreakdown(cab.pricing, t.key, distanceKm, days);
          const got = calculateBreakdown(cab, { serviceType: t.serviceType, tripType: t.tripType, distanceKm, days });
          const label = `${cab.key} ${t.key} ${distanceKm}km ${days}d`;
          assert.equal(got.fare, Math.round(ref.fare), `fare ${label}`);
          assert.equal(got.driverAllowance, Math.round(ref.allowance), `allowance ${label}`);
          assert.equal(got.gst, Math.round(ref.gst), `gst ${label}`);
          assert.equal(got.finalAmount, Math.round(ref.finalFare), `final ${label}`);
          assert.equal(got.originalAmount, Math.round(ref.originalPrice), `original ${label}`);
          assert.equal(got.discountAmount, Math.round(ref.discountAmount), `discount ${label}`);
          assert.equal(got.discountPercent, Math.round(ref.discountPercent), `percent ${label}`);
        }
      }
    }
  }
});

test('worked example: Dzire, outstation one way, 300 km = Rs 4630', () => {
  const dzire = cabs.find((c) => c.key === 'dzire');
  const r = calculateBreakdown(dzire, { serviceType: 'outstation', tripType: 'one_way', distanceKm: 300 });
  assert.deepEqual([r.fare, r.driverAllowance, r.gst, r.finalAmount], [4200, 220, 210, 4630]);
});

test('minimum fare and round-trip 250 km floor apply', () => {
  const dzire = cabs.find((c) => c.key === 'dzire');
  const short = calculateBreakdown(dzire, { serviceType: 'outstation', tripType: 'one_way', distanceKm: 20 });
  assert.equal(short.fare, 1400);
  const rt = calculateBreakdown(dzire, { serviceType: 'outstation', tripType: 'round_trip', distanceKm: 50 });
  assert.equal(rt.billableKm, 250);
  assert.equal(rt.fare, 250 * 14);
});

test('round trip allowance is Rs 300 per day; days counted inclusively', () => {
  const dzire = cabs.find((c) => c.key === 'dzire');
  const r = calculateBreakdown(dzire, { serviceType: 'outstation', tripType: 'round_trip', distanceKm: 200, days: 3 });
  assert.equal(r.driverAllowance, 900);
  const d = (s) => new Date(`${s}T00:00:00.000Z`);
  assert.equal(tripDays(d('2026-10-01'), d('2026-10-03')), 3);
  assert.equal(tripDays(d('2026-10-01'), d('2026-10-01')), 1);
  assert.equal(tripDays(d('2026-10-01'), null), 1);
});

test('bad input is rejected', () => {
  const dzire = cabs.find((c) => c.key === 'dzire');
  assert.throws(() => calculateBreakdown(dzire, { serviceType: 'local', tripType: 'one_way', distanceKm: -5 }));
  assert.throws(() => calculateBreakdown(dzire, { serviceType: 'local', tripType: 'one_way', distanceKm: NaN }));
  assert.throws(() => calculateBreakdown(dzire, { serviceType: 'space', tripType: 'one_way', distanceKm: 10 }));
  assert.equal(engineKey('outstation', 'round_trip'), 'outstation-roundtrip');
});
