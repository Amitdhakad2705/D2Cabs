import Cab from '../models/Cab.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { priceForCab, resolveTrip } from '../services/quote.service.js';

// POST /api/fare/quote
// The website sends: serviceType, tripType, pickup{latitude,longitude}, drop{latitude,longitude},
// optional journeyDate / returnDate (YYYY-MM-DD).  It gets back the fare for EVERY active cab.
// The browser never sends a distance or an amount - the server works both out.
export const quote = asyncHandler(async (req, res) => {
  const trip = await resolveTrip(req.body);
  const cabs = await Cab.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean();

  const quotes = cabs.map((cab) => ({
    cabId: cab._id,
    cabKey: cab.key,
    ...priceForCab(cab, trip),
  }));

  res.json({
    success: true,
    serviceType: trip.serviceType,
    tripType: trip.tripType,
    distanceKm: Math.round(trip.distanceKm * 10) / 10,
    durationMin: Math.round(trip.durationMin),
    days: trip.days,
    quotes,
  });
});
