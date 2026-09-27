import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

// Road distance is calculated HERE on the server, so a customer cannot send a fake
// distance to get a cheaper fare.  Uses OSRM (set OSRM_BASE_URL in .env).
// NOTE: the free public OSRM demo server is not meant for production traffic.
// Before going live, self-host OSRM or swap this one function for Google/Mapbox.

export function parseCoords(place, label) {
  // IMPORTANT: `typeof place?.latitude !== 'undefined'` used to be the only
  // "is it present" check here. JSON has no NaN, so when the browser sends
  // NaN it gets serialized as `null` — and `null` is not `undefined`, and
  // `Number(null) === 0`, which is finite and within range. That let a
  // missing/invalid coordinate silently pass validation as (0, 0) and reach
  // OSRM. Require an actual number (not null, not a numeric string) and
  // explicitly reject the (0, 0) "null island" pair, which is never a real
  // pickup/drop point for this service.
  const latitude = place?.latitude;
  const longitude = place?.longitude;
  const valid =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    !(latitude === 0 && longitude === 0);
  if (!valid) throw new ApiError(400, `Please choose a valid ${label} location from the suggestions.`);
  return { latitude, longitude };
}

export async function getRoadRoute(from, to) {
  const url =
    `${env.osrmBaseUrl}/route/v1/driving/` +
    `${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=false`;
   console.log("OSRM URL:", url);
   console.log("FROM:", from);
   console.log("TO:", to);
  let res;
  try {
    res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
  } catch {
    throw new ApiError(503, 'Distance service is not reachable right now. Please try again.');
  }
  if (!res.ok) throw new ApiError(503, 'Distance service is not available right now. Please try again.');

  const data = await res.json().catch(() => null);
  if (!data || data.code !== 'Ok' || !data.routes?.length) {
    throw new ApiError(422, 'No road route found between pickup and drop.');
  }

  const distanceKm = data.routes[0].distance / 1000;
  const durationMin = data.routes[0].duration / 60;
  if (!(distanceKm >= 0.1)) throw new ApiError(422, 'Pickup and drop locations are too close.');
  return { distanceKm, durationMin };
}
