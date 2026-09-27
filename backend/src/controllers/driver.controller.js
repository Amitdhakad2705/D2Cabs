import Booking from '../models/Booking.js';
import Cab from '../models/Cab.js';
import Driver from '../models/Driver.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex, isPlainObject, parsePage } from '../utils/pick.js';
import { isString, normalizePhone } from '../utils/validators.js';

const STATUSES = ['AVAILABLE', 'ON_TRIP', 'OFF_DUTY'];

async function parseDriverBody(body, { create }) {
  if (!isPlainObject(body)) throw new ApiError(400, 'Invalid request body.');
  const out = {};
  const has = (k) => body[k] !== undefined;

  if (create || has('name')) {
    if (!isString(body.name) || body.name.trim().length < 2 || body.name.trim().length > 80) {
      throw new ApiError(400, 'Driver name must be 2-80 characters.');
    }
    out.name = body.name.trim();
  }
  if (create || has('phone')) {
    const phone = normalizePhone(body.phone);
    if (!phone) throw new ApiError(400, 'Please enter a valid 10-digit mobile number.');
    out.phone = phone;
  }
  if (has('licenseNumber')) {
    if (!isString(body.licenseNumber) || body.licenseNumber.length > 30) throw new ApiError(400, 'Invalid licenseNumber.');
    out.licenseNumber = body.licenseNumber.trim().toUpperCase();
  }
  if (has('vehicleName')) {
    if (!isString(body.vehicleName) || body.vehicleName.length > 60) throw new ApiError(400, 'Invalid vehicleName.');
    out.vehicleName = body.vehicleName.trim();
  }
  if (has('vehicleNumber')) {
    const v = isString(body.vehicleNumber) ? body.vehicleNumber.trim().toUpperCase() : null;
    if (v === null || v.length > 20 || (v && !/^[A-Z0-9 -]+$/.test(v))) {
      throw new ApiError(400, 'vehicleNumber can contain only letters, numbers, space and hyphen.');
    }
    out.vehicleNumber = v;
  }
  if (has('cabId')) {
    if (body.cabId === null || body.cabId === '') {
      out.cabId = null;
    } else {
      if (!isString(body.cabId) || !(await Cab.exists({ _id: body.cabId }))) throw new ApiError(400, 'cabId does not exist.');
      out.cabId = body.cabId;
    }
  }
  if (has('status')) {
    if (!STATUSES.includes(body.status)) throw new ApiError(400, `status must be one of ${STATUSES.join(', ')}.`);
    out.status = body.status;
  }
  if (has('active')) {
    if (typeof body.active !== 'boolean') throw new ApiError(400, 'active must be true or false.');
    out.active = body.active;
  }
  return out;
}

async function assertPhoneFree(phone, exceptId) {
  const clash = await Driver.findOne({ phone, ...(exceptId ? { _id: { $ne: exceptId } } : {}) }).lean();
  if (clash) throw new ApiError(409, 'A driver with this mobile number already exists.');
}

export const listDrivers = asyncHandler(async (req, res) => {
  const filter = {};
  if (isString(req.query.q) && req.query.q.trim()) {
    const rx = new RegExp(escapeRegex(req.query.q.trim().slice(0, 50)), 'i');
    filter.$or = [{ name: rx }, { phone: rx }, { vehicleNumber: rx }];
  }
  if (req.query.active === 'true' || req.query.active === 'false') filter.active = req.query.active === 'true';
  if (STATUSES.includes(req.query.status)) filter.status = req.query.status;

  const { page, limit, skip } = parsePage(req.query);
  const [drivers, total] = await Promise.all([
    Driver.find(filter).sort({ name: 1 }).skip(skip).limit(limit).populate('cabId', 'key name').select('-__v').lean(),
    Driver.countDocuments(filter),
  ]);
  res.json({ success: true, drivers, total, page, pages: Math.ceil(total / limit) || 1 });
});

export const getDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id).populate('cabId', 'key name').select('-__v').lean();
  if (!driver) throw new ApiError(404, 'Driver not found.');
  res.json({ success: true, driver });
});

export const createDriver = asyncHandler(async (req, res) => {
  const data = await parseDriverBody(req.body, { create: true });
  await assertPhoneFree(data.phone);
  const driver = await Driver.create(data);
  res.status(201).json({ success: true, driver });
});

export const updateDriver = asyncHandler(async (req, res) => {
  const data = await parseDriverBody(req.body, { create: false });
  if (!Object.keys(data).length) throw new ApiError(400, 'Nothing to update.');
  if (data.phone) await assertPhoneFree(data.phone, req.params.id);
  const driver = await Driver.findByIdAndUpdate(req.params.id, { $set: data }, { new: true, runValidators: true });
  if (!driver) throw new ApiError(404, 'Driver not found.');
  res.json({ success: true, driver });
});

export const deleteDriver = asyncHandler(async (req, res) => {
  if (await Booking.exists({ driverId: req.params.id })) {
    throw new ApiError(409, 'This driver has trips in the system. Disable the driver instead of deleting.');
  }
  const driver = await Driver.findByIdAndDelete(req.params.id);
  if (!driver) throw new ApiError(404, 'Driver not found.');
  res.json({ success: true });
});

// Driver trip history (bookings this driver was assigned to)
export const driverTrips = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const filter = { driverId: req.params.id };
  const [trips, total] = await Promise.all([
    Booking.find(filter)
      .sort({ journeyDate: -1 })
      .skip(skip)
      .limit(limit)
      .select('bookingId pickup.address drop.address journeyDate journeyTime bookingStatus customerDetails.name fare.finalAmount')
      .lean(),
    Booking.countDocuments(filter),
  ]);
  res.json({ success: true, trips, total, page, pages: Math.ceil(total / limit) || 1 });
});
