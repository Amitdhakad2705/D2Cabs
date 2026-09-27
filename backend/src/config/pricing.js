// Rules shared by every cab. Same numbers as PRICING_RULES in the old frontend.
// Per-cab rates live in the database (Cab.pricing) so admin can edit them.
export const PRICING_RULES = Object.freeze({
  gstRate: 0.05, // 5% GST, outstation trips only (charged on the trip fare)
  roundTripMinBillableKm: 250, // outstation round trip: minimum billable km
  roundTripDriverAllowancePerDay: 300, // Rs per day, outstation round trip
  originalPriceMarkup: 1.22, // "before discount" price = final price x 1.22
});

// Optional extras. Same prices as ADDON_PRICES in the old frontend. Charged on top of the fare (no GST).
export const ADDONS = Object.freeze({
  roof: { label: 'Roof Carrier', price: 200 },
  language: { label: 'Driver Language', price: 150 },
  vehicle: { label: 'New Vehicle', price: 500 },
});
