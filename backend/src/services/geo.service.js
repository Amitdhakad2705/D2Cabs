// PURE geography helpers. Same rules as detectTripType() in the old frontend:
// Airport > Local (both ends inside Indore city) > Outstation.
// The SERVER decides the service type from coordinates, so a customer cannot pick
// the cheaper "local" price for a long outstation trip.
const INDORE = { lat: 22.7196, lon: 75.8577 };
const INDORE_CITY_RADIUS_KM = 20;
const INDORE_AIRPORT = { lat: 22.7218, lon: 75.8011 }; // Devi Ahilyabai Holkar Airport
const INDORE_AIRPORT_RADIUS_KM = 3;

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const inCity = (p) => haversineKm(p.latitude, p.longitude, INDORE.lat, INDORE.lon) <= INDORE_CITY_RADIUS_KM;
const atAirport = (p) =>
  haversineKm(p.latitude, p.longitude, INDORE_AIRPORT.lat, INDORE_AIRPORT.lon) <= INDORE_AIRPORT_RADIUS_KM;

export function detectServiceType(from, to) {
  if (atAirport(from) || atAirport(to)) return 'airport';
  if (inCity(from) && inCity(to)) return 'local';
  return 'outstation';
}
