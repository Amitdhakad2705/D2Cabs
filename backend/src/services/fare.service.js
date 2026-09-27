import { PRICING_RULES } from '../config/pricing.js';
import { ApiError } from '../utils/ApiError.js';

// PURE functions (no database, no network) so they are easy to test.
// This is the server copy of the fare engine from the old frontend
// (public/js/index.js: calculateFare / calculateDriverAllowance / calculateGST ...).
// tests/fare.test.js checks that both give identical results.

const round = Math.round;
const round1 = (n) => Math.round(n * 10) / 10;

export function engineKey(serviceType, tripType) {
  if (serviceType === 'local') return 'local';
  if (serviceType === 'airport') return 'airport';
  if (serviceType === 'outstation') return tripType === 'round_trip' ? 'outstation-roundtrip' : 'outstation-oneway';
  return null;
}

// Number of days for an outstation round trip (inclusive). No return date = 1 day,
// which is what the current frontend assumes.
export function tripDays(journeyDate, returnDate) {
  if (!journeyDate || !returnDate) return 1;
  const diff = Math.round((returnDate.getTime() - journeyDate.getTime()) / 86400000);
  return Math.max(1, diff + 1);
}

/**
 * cab: object with .pricing  (a Cab document / lean object)
 * returns whole-rupee amounts. finalAmount = fare + driverAllowance + gst.
 */
export function calculateBreakdown(cab, { serviceType, tripType, distanceKm, days = 1 }) {
  const key = engineKey(serviceType, tripType);
  const plan = cab && cab.pricing;
  if (!key || !plan) throw new ApiError(400, 'Invalid trip or cab pricing.');
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) throw new ApiError(400, 'Invalid distance.');

  const rules = PRICING_RULES;
  let fare;
  let driverAllowance = 0;
  let billableKm = distanceKm;

  switch (key) {
    case 'local':
      fare = plan.local.baseFare + distanceKm * plan.local.perKm;
      break;
    case 'airport':
      fare = plan.airport.baseFare + distanceKm * plan.airport.perKm;
      break;
    case 'outstation-oneway':
      fare = Math.max(plan.outstation.minimumFare, distanceKm * plan.outstation.perKm);
      driverAllowance = plan.outstation.driverAllowance;
      break;
    case 'outstation-roundtrip':
      billableKm = Math.max(distanceKm * 2, rules.roundTripMinBillableKm);
      fare = billableKm * plan.outstation.perKm;
      driverAllowance = rules.roundTripDriverAllowancePerDay * Math.max(1, round(days) || 1);
      break;
    default:
      throw new ApiError(400, 'Invalid trip type.');
  }

  const gst = key.startsWith('outstation') ? fare * rules.gstRate : 0;
  const rawFinal = fare + driverAllowance + gst;
  const rawOriginal = rawFinal * rules.originalPriceMarkup;
  const rawDiscount = Math.max(0, rawOriginal - rawFinal);

  return {
    billableKm: round1(billableKm),
    fare: round(fare),
    driverAllowance: round(driverAllowance),
    gst: round(gst),
    finalAmount: round(rawFinal),
    originalAmount: round(rawOriginal),
    discountAmount: round(rawDiscount),
    discountPercent: rawOriginal > 0 ? round((rawDiscount / rawOriginal) * 100) : 0,
  };
}
