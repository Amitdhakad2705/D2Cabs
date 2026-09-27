import { TRIP_TYPES } from '../constants.js';
import { ApiError } from '../utils/ApiError.js';
import { calculateBreakdown, tripDays } from './fare.service.js';
import { detectServiceType } from './geo.service.js';
import { getRoadRoute, parseCoords } from './routing.service.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOnly(value, label) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) {
    throw new ApiError(400, `${label} must be in YYYY-MM-DD format.`);
  }
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) {
    throw new ApiError(400, `${label} is not a valid date.`);
  }
  return d;
}

/**
 * Validates the trip and asks the routing service for the real road distance.
 * Used by POST /api/fare/quote now and by booking creation in Step 3.
 */
export async function resolveTrip(input) {
  const { pickup, drop, journeyDate, returnDate } = input || {};
  let { tripType } = input || {};

  if (tripType === undefined) tripType = 'one_way';
  if (!TRIP_TYPES.includes(tripType)) throw new ApiError(400, 'Invalid trip type.');

  const from = parseCoords(pickup, 'pickup');
  const to = parseCoords(drop, 'drop');

  // The server decides Local / Airport / Outstation from the coordinates.
  // Any serviceType sent by the browser is ignored.
  const serviceType = detectServiceType(from, to);
  // Round trip only exists for outstation. Local / airport are always one_way.
  if (serviceType !== 'outstation') tripType = 'one_way';

  let days = 1;
  let journey = null;
  if (journeyDate !== undefined) journey = parseDateOnly(journeyDate, 'journeyDate');
  if (returnDate !== undefined && tripType === 'round_trip') {
    const ret = parseDateOnly(returnDate, 'returnDate');
    if (!journey) throw new ApiError(400, 'journeyDate is required with returnDate.');
    if (ret < journey) throw new ApiError(400, 'returnDate cannot be before journeyDate.');
    days = tripDays(journey, ret);
    if (days > 60) throw new ApiError(400, 'Round trips longer than 60 days are not supported online.');
  }

  const { distanceKm, durationMin } = await getRoadRoute(from, to);
  return { serviceType, tripType, distanceKm, durationMin, days, from, to };
}

export function priceForCab(cab, trip) {
  return calculateBreakdown(cab, trip);
}
