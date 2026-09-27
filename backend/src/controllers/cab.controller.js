import Booking from '../models/Booking.js';
import Cab from '../models/Cab.js';
import Driver from '../models/Driver.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isPlainObject } from '../utils/pick.js';
import { isString } from '../utils/validators.js';

const isMoney = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1000000;

function parsePricing(p) {
  const bad = () => {
    throw new ApiError(
      400,
      'pricing must include local{baseFare,perKm}, outstation{minimumFare,perKm,driverAllowance}, airport{baseFare,perKm} as numbers.'
    );
  };
  if (!isPlainObject(p) || !isPlainObject(p.local) || !isPlainObject(p.outstation) || !isPlainObject(p.airport)) bad();
  const { local, outstation, airport } = p;
  const all = [
    local.baseFare, local.perKm,
    outstation.minimumFare, outstation.perKm, outstation.driverAllowance,
    airport.baseFare, airport.perKm,
  ];
  if (!all.every(isMoney)) bad();
  return {
    local: { baseFare: local.baseFare, perKm: local.perKm },
    outstation: {
      minimumFare: outstation.minimumFare,
      perKm: outstation.perKm,
      driverAllowance: outstation.driverAllowance,
    },
    airport: { baseFare: airport.baseFare, perKm: airport.perKm },
  };
}

// create: every required field must be present. update: only the fields that are sent.
function parseCabBody(body, { create }) {
  if (!isPlainObject(body)) throw new ApiError(400, 'Invalid request body.');
  const out = {};
  const has = (k) => body[k] !== undefined;
  const need = (k) => {
    if (create && !has(k)) throw new ApiError(400, `${k} is required.`);
    return has(k);
  };
  const text = (k, max) => {
    if (!need(k)) return;
    if (!isString(body[k]) || !body[k].trim() || body[k].trim().length > max) {
      throw new ApiError(400, `${k} must be text (1-${max} characters).`);
    }
    out[k] = body[k].trim();
  };

  if (create) {
    if (!isString(body.key) || !/^[a-z0-9-]{2,30}$/.test(body.key)) {
      throw new ApiError(400, 'key must be 2-30 characters: lowercase letters, numbers, hyphen.');
    }
    out.key = body.key; // never changes after creation (the website uses it as the cab id)
  }
  text('name', 80);
  text('category', 30);

  if (has('image')) {
    if (!isString(body.image) || body.image.length > 300 || !/^(\/|https:\/\/)/.test(body.image)) {
      throw new ApiError(400, 'image must be a path starting with / or an https:// link.');
    }
    out.image = body.image;
  }
  if (need('seats')) {
    if (!Number.isInteger(body.seats) || body.seats < 1 || body.seats > 20) {
      throw new ApiError(400, 'seats must be a whole number from 1 to 20.');
    }
    out.seats = body.seats;
  }
  if (has('luggage')) {
    if (!isString(body.luggage) || body.luggage.length > 30) throw new ApiError(400, 'luggage is too long.');
    out.luggage = body.luggage.trim();
  }
  if (has('fuel')) {
    if (!isString(body.fuel) || body.fuel.length > 20) throw new ApiError(400, 'fuel is too long.');
    out.fuel = body.fuel.trim();
  }
  if (has('ac')) {
    if (typeof body.ac !== 'boolean') throw new ApiError(400, 'ac must be true or false.');
    out.ac = body.ac;
  }
  if (has('transmission')) {
    if (!['Manual', 'Automatic'].includes(body.transmission)) {
      throw new ApiError(400, 'transmission must be Manual or Automatic.');
    }
    out.transmission = body.transmission;
  }
  if (need('pricing')) out.pricing = parsePricing(body.pricing);
  if (has('active')) {
    if (typeof body.active !== 'boolean') throw new ApiError(400, 'active must be true or false.');
    out.active = body.active;
  }
  if (has('sortOrder')) {
    if (!Number.isInteger(body.sortOrder) || body.sortOrder < 0 || body.sortOrder > 1000) {
      throw new ApiError(400, 'sortOrder must be a whole number from 0 to 1000.');
    }
    out.sortOrder = body.sortOrder;
  }
  return out;
}

/* ------------------------------ Public ------------------------------ */

// Cabs the website shows. Prices are public on the site anyway.
export const listActiveCabs = asyncHandler(async (_req, res) => {
  const cabs = await Cab.find({ active: true }).sort({ sortOrder: 1, name: 1 }).select('-__v').lean();
  res.json({ success: true, cabs });
});

/* ------------------------------ Admin ------------------------------ */

export const adminListCabs = asyncHandler(async (_req, res) => {
  const cabs = await Cab.find().sort({ sortOrder: 1, name: 1 }).select('-__v').lean();
  res.json({ success: true, cabs });
});

export const adminGetCab = asyncHandler(async (req, res) => {
  const cab = await Cab.findById(req.params.id).select('-__v').lean();
  if (!cab) throw new ApiError(404, 'Cab not found.');
  res.json({ success: true, cab });
});

export const adminCreateCab = asyncHandler(async (req, res) => {
  const data = parseCabBody(req.body, { create: true });
  const cab = await Cab.create(data); // duplicate key -> 409 from errorHandler
  res.status(201).json({ success: true, cab });
});

export const adminUpdateCab = asyncHandler(async (req, res) => {
  const data = parseCabBody(req.body, { create: false });
  if (!Object.keys(data).length) throw new ApiError(400, 'Nothing to update.');
  const cab = await Cab.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true });
  if (!cab) throw new ApiError(404, 'Cab not found.');
  res.json({ success: true, cab });
});

export const adminSetCabActive = asyncHandler(async (req, res) => {
  if (typeof req.body?.active !== 'boolean') throw new ApiError(400, 'active must be true or false.');
  const cab = await Cab.findByIdAndUpdate(req.params.id, { $set: { active: req.body.active } }, { new: true });
  if (!cab) throw new ApiError(404, 'Cab not found.');
  res.json({ success: true, cab });
});

export const adminDeleteCab = asyncHandler(async (req, res) => {
  const [usedInBooking, usedByDriver] = await Promise.all([
    Booking.exists({ cabId: req.params.id }),
    Driver.exists({ cabId: req.params.id }),
  ]);
  if (usedInBooking || usedByDriver) {
    throw new ApiError(409, 'This cab is used by bookings or drivers. Disable it instead of deleting.');
  }
  const cab = await Cab.findByIdAndDelete(req.params.id);
  if (!cab) throw new ApiError(404, 'Cab not found.');
  res.json({ success: true });
});
