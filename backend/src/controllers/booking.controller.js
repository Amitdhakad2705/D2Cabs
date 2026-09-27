import Booking from '../models/Booking.js';
import Cab from '../models/Cab.js';
import Driver from '../models/Driver.js';
import Feedback from '../models/Feedback.js';
import Payment from '../models/Payment.js';
import Setting from '../models/Setting.js';
import User from '../models/User.js';
import { ADDONS } from '../config/pricing.js';
import { env } from '../config/env.js';
import {
  BOOKING_STATUS,
  BUSINESS_UTC_OFFSET,
  CUSTOMER_CANCELLABLE,
  DASHBOARD_GROUPS,
  PAYMENT_STATUS,
  PAY_PERCENT_OPTIONS,
} from '../constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex, isPlainObject, parsePage } from '../utils/pick.js';
import { isString, normalizeEmail, normalizePhone, validateName } from '../utils/validators.js';
import {
  applyStatus,
  creditBooking,
  customerView,
  findDriverConflict,
  idFilter,
} from '../services/booking.service.js';
import { notifyAdmin, notifyCustomer } from '../services/notify.service.js';
import { parseDateOnly, priceForCab, resolveTrip } from '../services/quote.service.js';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const money = (n) => `Rs ${Math.round(n).toLocaleString('en-IN')}`;

function placeAddress(place, label) {
  const address = isString(place?.address) ? place.address.trim() : '';
  if (!address || address.length > 300) throw new ApiError(400, `Please enter the ${label} address.`);
  return address;
}

/* =========================== CUSTOMER =========================== */

export const createBooking = asyncHandler(async (req, res) => {
  const b = req.body;
  if (!isPlainObject(b)) throw new ApiError(400, 'Invalid request body.');

  // 1. cab
  if (!isString(b.cabKey)) throw new ApiError(400, 'Please choose a cab.');
  const cab = await Cab.findOne({ key: b.cabKey.toLowerCase(), active: true }).lean();
  if (!cab) throw new ApiError(404, 'This cab is not available right now.');

  // 2. customer details
  const cd = b.customerDetails;
  const phone = normalizePhone(cd?.phone);
  const email = normalizeEmail(cd?.email);
  if (!validateName(cd?.name)) throw new ApiError(400, 'Please enter your name.');
  if (!phone) throw new ApiError(400, 'Please enter a valid 10-digit mobile number.');
  if (!email) throw new ApiError(400, 'Please enter a valid email address.');

  // 3. date and time (Indian Standard Time)
  parseDateOnly(b.journeyDate, 'journeyDate');
  if (!isString(b.journeyTime) || !TIME_RE.test(b.journeyTime)) throw new ApiError(400, 'journeyTime must be HH:mm.');
  const startAt = new Date(`${b.journeyDate}T${b.journeyTime}:00${BUSINESS_UTC_OFFSET}`);
  const settings = await Setting.getMain();
  if (startAt.getTime() < Date.now() + settings.minAdvanceHours * 3600 * 1000) {
    throw new ApiError(400, `Pickup time must be at least ${settings.minAdvanceHours} hour(s) from now.`);
  }

  // 4. trip + fare. Distance, service type and fare are ALL calculated here on the server.
  const trip = await resolveTrip({
    pickup: b.pickup,
    drop: b.drop,
    tripType: b.tripType,
    journeyDate: b.journeyDate,
    returnDate: b.returnDate,
  });
  let endAt;
  let returnDate;
  let returnTime;
  if (trip.tripType === 'round_trip') {
    if (!b.returnDate || !isString(b.returnTime) || !TIME_RE.test(b.returnTime)) {
      throw new ApiError(400, 'Round trips need returnDate (YYYY-MM-DD) and returnTime (HH:mm).');
    }
    endAt = new Date(`${b.returnDate}T${b.returnTime}:00${BUSINESS_UTC_OFFSET}`);
    if (endAt <= startAt) throw new ApiError(400, 'Return must be after the pickup time.');
    returnDate = parseDateOnly(b.returnDate, 'returnDate');
    returnTime = b.returnTime;
  } else {
    // travel time + 2 hours buffer
    endAt = new Date(startAt.getTime() + trip.durationMin * 60000 + 2 * 3600 * 1000);
  }
  const breakdown = priceForCab(cab, trip);

  // 5. add-ons (prices come from the server, not the browser)
  const addons = Array.isArray(b.addons) ? [...new Set(b.addons)] : [];
  if (!addons.every((k) => isString(k) && Object.hasOwn(ADDONS, k))) throw new ApiError(400, 'Unknown add-on.');
  const addonAmount = addons.reduce((sum, k) => sum + ADDONS[k].price, 0);

  // 6. spam guard
  const openRequests = await Booking.countDocuments({ customerId: req.user._id, bookingStatus: BOOKING_STATUS.PENDING });
  if (openRequests >= 5) {
    throw new ApiError(429, 'You already have 5 booking requests waiting for approval. Please wait for them to be reviewed.');
  }

  const booking = await Booking.create({
    customerId: req.user._id,
    serviceType: trip.serviceType,
    tripType: trip.tripType,
    pickup: { address: placeAddress(b.pickup, 'pickup'), latitude: trip.from.latitude, longitude: trip.from.longitude },
    drop: { address: placeAddress(b.drop, 'drop'), latitude: trip.to.latitude, longitude: trip.to.longitude },
    journeyDate: parseDateOnly(b.journeyDate, 'journeyDate'),
    journeyTime: b.journeyTime,
    returnDate,
    returnTime,
    startAt,
    endAt,
    cabId: cab._id,
    fare: {
      distanceKm: Math.round(trip.distanceKm * 10) / 10,
      billableKm: breakdown.billableKm,
      days: trip.days,
      baseFare: breakdown.fare,
      driverAllowance: breakdown.driverAllowance,
      addonAmount,
      gst: breakdown.gst,
      originalAmount: breakdown.originalAmount + addonAmount,
      discountAmount: breakdown.discountAmount,
      finalAmount: breakdown.finalAmount + addonAmount,
    },
    addons,
    customerDetails: {
      name: cd.name.trim(),
      phone,
      email,
      gender: isString(cd.gender) ? cd.gender.slice(0, 20) : '',
    },
    payPercent: PAY_PERCENT_OPTIONS.includes(b.payPercent) ? b.payPercent : 25,
    customerNote: isString(b.customerNote) ? b.customerNote.trim().slice(0, 500) : '',
    statusHistory: [{ status: BOOKING_STATUS.PENDING, by: req.user._id, note: 'Booking requested' }],
  });

  await Promise.all([
    notifyCustomer({
      user: req.user,
      type: 'BOOKING_REQUEST_RECEIVED',
      title: 'Booking request received',
      message: `We received your request ${booking.bookingId} (${booking.pickup.address} to ${booking.drop.address}). We will confirm it shortly.`,
      booking,
    }),
    notifyAdmin({
      type: 'BOOKING_REQUEST_RECEIVED',
      title: `New booking request ${booking.bookingId}`,
      message: `${booking.customerDetails.name} (${booking.customerDetails.phone}) requested ${cab.name}: ${booking.pickup.address} to ${booking.drop.address} on ${b.journeyDate} ${b.journeyTime}. Fare ${money(booking.fare.finalAmount)}.`,
      booking,
    }),
  ]);

  res.status(201).json({ success: true, booking: customerView(booking) });
});

export const myBookings = asyncHandler(async (req, res) => {
  const list = await Booking.find({ customerId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(200)
    .populate('cabId', 'key name category image seats')
    .lean();
  const groups = {};
  for (const [name, statuses] of Object.entries(DASHBOARD_GROUPS)) {
    groups[name] = list.filter((x) => statuses.includes(x.bookingStatus)).map(customerView);
  }
  // Ratings the customer already gave, keyed by booking _id (so the dashboard shows stars, not the form).
  const feedback = await Feedback.find({ customerId: req.user._id }).select('bookingId rating comment').lean();
  const ratings = Object.fromEntries(feedback.map((f) => [String(f.bookingId), { rating: f.rating, comment: f.comment }]));
  res.json({ success: true, groups, ratings });
});

async function findOwn(req) {
  const booking = await Booking.findOne({ ...idFilter(req.params.id), customerId: req.user._id });
  if (!booking) throw new ApiError(404, 'Booking not found.');
  return booking;
}

export const getMyBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ ...idFilter(req.params.id), customerId: req.user._id })
    .populate('cabId', 'key name category image seats')
    .lean();
  if (!booking) throw new ApiError(404, 'Booking not found.');
  const feedback = await Feedback.findOne({ bookingId: booking._id }).select('rating comment').lean();
  res.json({ success: true, booking: customerView(booking), feedback });
});

export const cancelMyBooking = asyncHandler(async (req, res) => {
  const booking = await findOwn(req);
  if (!CUSTOMER_CANCELLABLE.includes(booking.bookingStatus)) {
    throw new ApiError(409, 'This booking can no longer be cancelled online. Please contact D2Cabs support.');
  }
  const reason = isString(req.body?.reason) ? req.body.reason.trim().slice(0, 300) : '';
  applyStatus(booking, BOOKING_STATUS.CANCELLED, { by: req.user._id, note: reason || 'Cancelled by customer' });
  booking.cancelledBy = 'customer';
  await booking.save();

  await notifyAdmin({
    type: 'BOOKING_CANCELLED',
    title: `Booking ${booking.bookingId} cancelled by customer`,
    message: `${booking.customerDetails.name} cancelled ${booking.bookingId}.${
      booking.paidAmount > 0 ? ` REFUND DUE: ${money(booking.paidAmount)} was already paid.` : ''
    }`,
    booking,
  });
  res.json({ success: true, booking: customerView(booking) });
});

export const submitFeedback = asyncHandler(async (req, res) => {
  const booking = await findOwn(req);
  if (booking.bookingStatus !== BOOKING_STATUS.COMPLETED) {
    throw new ApiError(409, 'You can rate a trip after it is completed.');
  }
  const rating = req.body?.rating;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ApiError(400, 'Rating must be 1 to 5.');
  const comment = isString(req.body?.comment) ? req.body.comment.trim().slice(0, 1000) : '';
  if (await Feedback.exists({ bookingId: booking._id })) throw new ApiError(409, 'You have already rated this trip.');
  const feedback = await Feedback.create({ bookingId: booking._id, customerId: req.user._id, rating, comment });
  res.status(201).json({ success: true, feedback });
});

/* ============================= ADMIN ============================= */

const ADMIN_LIST_FIELDS =
  'bookingId customerId serviceType tripType pickup.address drop.address journeyDate journeyTime cabId ' +
  'fare.finalAmount paidAmount paymentStatus bookingStatus customerDetails.name customerDetails.phone driverSnapshot.name createdAt';

export const adminListBookings = asyncHandler(async (req, res) => {
  const { status, paymentStatus, q, from, to } = req.query;
  const filter = {};
  // status can be one value or several separated by commas (e.g. "DRIVER_ON_THE_WAY,TRIP_STARTED").
  if (isString(status)) {
    const wanted = status.split(',').filter((x) => Object.values(BOOKING_STATUS).includes(x));
    if (wanted.length) filter.bookingStatus = { $in: wanted };
  }
  if (Object.values(PAYMENT_STATUS).includes(paymentStatus)) filter.paymentStatus = paymentStatus;
  if (isString(q) && q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim().slice(0, 50)), 'i');
    filter.$or = [{ bookingId: rx }, { 'customerDetails.name': rx }, { 'customerDetails.phone': rx }];
  }
  if (isString(from) || isString(to)) {
    filter.journeyDate = {};
    if (isString(from)) filter.journeyDate.$gte = parseDateOnly(from, 'from');
    if (isString(to)) filter.journeyDate.$lte = parseDateOnly(to, 'to');
  }

  const { page, limit, skip } = parsePage(req.query);
  const [bookings, total, countRows] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select(ADMIN_LIST_FIELDS).populate('cabId', 'key name').lean(),
    Booking.countDocuments(filter),
    Booking.aggregate([{ $group: { _id: '$bookingStatus', n: { $sum: 1 } } }]),
  ]);
  const counts = Object.fromEntries(countRows.map((r) => [r._id, r.n]));
  res.json({ success: true, bookings, total, page, pages: Math.ceil(total / limit) || 1, counts });
});

export const adminGetBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne(idFilter(req.params.id))
    .populate('customerId', 'name email phone isActive')
    .populate('cabId', 'key name category')
    .populate('driverId', 'name phone vehicleName vehicleNumber')
    .lean();
  if (!booking) throw new ApiError(404, 'Booking not found.');
  const [payments, feedback] = await Promise.all([
    Payment.find({ bookingId: booking._id }).sort({ createdAt: -1 }).lean(),
    Feedback.findOne({ bookingId: booking._id }).lean(),
  ]);
  res.json({ success: true, booking, payments, feedback });
});

async function loadBooking(req) {
  const booking = await Booking.findOne(idFilter(req.params.id));
  if (!booking) throw new ApiError(404, 'Booking not found.');
  return booking;
}
const customerOf = (booking) => User.findById(booking.customerId);

export const adminApprove = asyncHandler(async (req, res) => {
  const booking = await loadBooking(req);
  applyStatus(booking, BOOKING_STATUS.CONFIRMED, { by: req.user._id, note: 'Approved by admin' });
  booking.paymentStatus = PAYMENT_STATUS.PENDING; // customer can pay now
  if (isString(req.body?.adminNote)) booking.adminNote = req.body.adminNote.trim().slice(0, 1000);
  await booking.save();

  const user = await customerOf(booking);
  if (user) {
    await notifyCustomer({
      user,
      type: 'BOOKING_CONFIRMED',
      title: 'Booking confirmed - please pay',
      message: `Your booking ${booking.bookingId} is confirmed. Please pay ${money((booking.fare.finalAmount * booking.payPercent) / 100)} (${booking.payPercent}%) from My Bookings to secure your cab.`,
      booking,
    });
  }
  res.json({ success: true, booking });
});

export const adminReject = asyncHandler(async (req, res) => {
  const reason = isString(req.body?.reason) ? req.body.reason.trim().slice(0, 300) : '';
  if (!reason) throw new ApiError(400, 'Please give a reason for rejecting.');
  const booking = await loadBooking(req);
  applyStatus(booking, BOOKING_STATUS.REJECTED, { by: req.user._id, note: reason });
  booking.adminNote = reason;
  await booking.save();

  const user = await customerOf(booking);
  if (user) {
    await notifyCustomer({
      user,
      type: 'BOOKING_REJECTED',
      title: 'Booking could not be confirmed',
      message: `Sorry, we could not confirm booking ${booking.bookingId}. Reason: ${reason}. No payment was taken.`,
      booking,
    });
  }
  res.json({ success: true, booking });
});

export const adminAssignDriver = asyncHandler(async (req, res) => {
  const b = req.body;
  if (!isPlainObject(b)) throw new ApiError(400, 'Invalid request body.');
  const booking = await loadBooking(req);

  if (![BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.DRIVER_ASSIGNED].includes(booking.bookingStatus)) {
    throw new ApiError(409, 'A driver can be assigned only to a confirmed booking.');
  }
  if (
    env.requirePaymentBeforeDriver &&
    ![PAYMENT_STATUS.PAID, PAYMENT_STATUS.PARTIALLY_PAID].includes(booking.paymentStatus)
  ) {
    throw new ApiError(409, 'The customer has not paid the advance yet.');
  }

  const text = (v, max) => (isString(v) ? v.trim().slice(0, max) : '');
  let driver = null;
  let snapshot;
  if (b.driverId) {
    driver = await Driver.findById(b.driverId);
    if (!driver || !driver.active) throw new ApiError(400, 'Driver not found or disabled.');
    snapshot = {
      name: driver.name,
      phone: driver.phone,
      vehicleName: text(b.vehicleName, 60) || driver.vehicleName,
      vehicleNumber: (text(b.vehicleNumber, 20) || driver.vehicleNumber).toUpperCase(),
    };
  } else {
    const phone = normalizePhone(b.driverPhone);
    const vehicleNumber = text(b.vehicleNumber, 20).toUpperCase();
    if (!validateName(b.driverName) || !phone || !vehicleNumber) {
      throw new ApiError(400, 'Choose a saved driver, or enter driver name, mobile number and vehicle number.');
    }
    snapshot = { name: b.driverName.trim(), phone, vehicleName: text(b.vehicleName, 60), vehicleNumber };
  }
  snapshot.vehicleType = text(b.vehicleType, 30);
  snapshot.specialInstructions = text(b.specialInstructions, 500);

  if (driver && b.force !== true) {
    const clash = await findDriverConflict(driver._id, booking);
    if (clash) {
      throw new ApiError(
        409,
        `${driver.name} is already assigned to ${clash.bookingId} at a time that overlaps this trip. Choose another driver.`
      );
    }
  }

  const wasAssigned = booking.bookingStatus === BOOKING_STATUS.DRIVER_ASSIGNED;
  booking.driverId = driver ? driver._id : undefined;
  booking.driverSnapshot = snapshot;
  if (wasAssigned) {
    booking.statusHistory.push({ status: BOOKING_STATUS.DRIVER_ASSIGNED, by: req.user._id, note: `Driver changed to ${snapshot.name}` });
  } else {
    applyStatus(booking, BOOKING_STATUS.DRIVER_ASSIGNED, { by: req.user._id, note: `Driver ${snapshot.name} assigned` });
  }
  await booking.save();

  const user = await customerOf(booking);
  if (user) {
    await notifyCustomer({
      user,
      type: 'DRIVER_ASSIGNED',
      title: 'Your driver is assigned',
      message: `Booking ${booking.bookingId}: Driver ${snapshot.name}, phone ${snapshot.phone}, car ${snapshot.vehicleName || ''} ${snapshot.vehicleNumber}. Pickup ${booking.pickup.address} on ${booking.journeyTime}.`,
      booking,
    });
  }
  res.json({ success: true, booking });
});

const ADMIN_SETTABLE = [
  BOOKING_STATUS.DRIVER_ON_THE_WAY,
  BOOKING_STATUS.TRIP_STARTED,
  BOOKING_STATUS.COMPLETED,
  BOOKING_STATUS.CANCELLED,
];
const STATUS_TEXT = {
  DRIVER_ON_THE_WAY: ['DRIVER_ON_THE_WAY', 'Driver is on the way', 'Your driver is on the way to the pickup point.'],
  TRIP_STARTED: ['TRIP_STARTED', 'Trip started', 'Your trip has started. Have a safe journey!'],
  COMPLETED: ['TRIP_COMPLETED', 'Trip completed', 'Your trip is completed. Thank you for riding with D2Cabs! Please rate your trip.'],
  CANCELLED: ['BOOKING_CANCELLED', 'Booking cancelled', 'Your booking was cancelled by D2Cabs.'],
};

export const adminSetStatus = asyncHandler(async (req, res) => {
  const status = req.body?.status;
  if (!ADMIN_SETTABLE.includes(status)) throw new ApiError(400, `status must be one of ${ADMIN_SETTABLE.join(', ')}.`);
  const note = isString(req.body?.note) ? req.body.note.trim().slice(0, 300) : '';
  const booking = await loadBooking(req);

  applyStatus(booking, status, { by: req.user._id, note });
  if (status === BOOKING_STATUS.CANCELLED) booking.cancelledBy = 'admin';
  await booking.save();

  if (booking.driverId) {
    if (status === BOOKING_STATUS.TRIP_STARTED) await Driver.updateOne({ _id: booking.driverId }, { status: 'ON_TRIP' });
    if ([BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED].includes(status)) {
      await Driver.updateOne({ _id: booking.driverId }, { status: 'AVAILABLE' });
    }
  }

  const user = await customerOf(booking);
  const [type, title, message] = STATUS_TEXT[status];
  if (user) await notifyCustomer({ user, type, title, message: `${message} (${booking.bookingId})`, booking });
  res.json({ success: true, booking });
});

export const adminSetNote = asyncHandler(async (req, res) => {
  if (!isString(req.body?.adminNote)) throw new ApiError(400, 'adminNote must be text.');
  const booking = await Booking.findOneAndUpdate(
    idFilter(req.params.id),
    { $set: { adminNote: req.body.adminNote.trim().slice(0, 1000) } },
    { new: true }
  );
  if (!booking) throw new ApiError(404, 'Booking not found.');
  res.json({ success: true, booking });
});

// Balance collected in cash (or bank transfer) - admin records it.
export const adminRecordCash = asyncHandler(async (req, res) => {
  const booking = await loadBooking(req);
  if ([BOOKING_STATUS.PENDING, BOOKING_STATUS.REJECTED, BOOKING_STATUS.CANCELLED].includes(booking.bookingStatus)) {
    throw new ApiError(409, 'Payment can be recorded only for a confirmed booking.');
  }
  const remaining = booking.fare.finalAmount - booking.paidAmount;
  const amount = req.body?.amount;
  if (!Number.isInteger(amount) || amount < 1 || amount > remaining) {
    throw new ApiError(400, `Amount must be a whole number between 1 and ${remaining}.`);
  }
  const payment = await Payment.create({
    bookingId: booking._id,
    customerId: booking.customerId,
    amount,
    status: PAYMENT_STATUS.PAID,
    method: 'cash',
    note: isString(req.body?.note) ? req.body.note.trim().slice(0, 200) : '',
    paidAt: new Date(),
    recordedBy: req.user._id,
  });
  const updated = await creditBooking(booking._id, amount);

  const user = await customerOf(booking);
  if (user) {
    await notifyCustomer({
      user,
      type: 'PAYMENT_SUCCESSFUL',
      title: 'Payment received',
      message: `We received ${money(amount)} for booking ${booking.bookingId}.`,
      booking,
    });
  }
  res.status(201).json({ success: true, payment, booking: updated });
});
