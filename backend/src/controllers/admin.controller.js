import Booking from '../models/Booking.js';
import Feedback from '../models/Feedback.js';
import Payment from '../models/Payment.js';
import Setting from '../models/Setting.js';
import User from '../models/User.js';
import { ADDONS } from '../config/pricing.js';
import { BOOKING_STATUS, BUSINESS_TIMEZONE, PAYMENT_STATUS, PAY_PERCENT_OPTIONS, ROLES } from '../constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { escapeRegex, isPlainObject, parsePage } from '../utils/pick.js';
import { isString } from '../utils/validators.js';
import { parseDateOnly } from '../services/quote.service.js';

const istToday = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

/* ------------------------------- Dashboard ------------------------------- */

export const dashboard = asyncHandler(async (_req, res) => {
  const today = parseDateOnly(istToday(), 'today');
  const S = BOOKING_STATUS;
  const [byStatusRows, todaysTrips, totalCustomers, revenueRows, pendingPayments, recentPending] = await Promise.all([
    Booking.aggregate([{ $group: { _id: '$bookingStatus', n: { $sum: 1 } } }]),
    Booking.countDocuments({
      journeyDate: today,
      bookingStatus: { $in: [S.CONFIRMED, S.DRIVER_ASSIGNED, S.DRIVER_ON_THE_WAY, S.TRIP_STARTED, S.COMPLETED] },
    }),
    User.countDocuments({ role: ROLES.CUSTOMER }),
    Payment.aggregate([
      { $match: { status: { $in: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.REFUNDED] } } },
      { $group: { _id: null, gross: { $sum: '$amount' }, refunded: { $sum: { $ifNull: ['$refund.amount', 0] } } } },
    ]),
    Booking.countDocuments({
      paymentStatus: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PARTIALLY_PAID] },
      bookingStatus: { $nin: [S.CANCELLED, S.REJECTED, S.PENDING] },
    }),
    Booking.find({ bookingStatus: S.PENDING })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('bookingId pickup.address drop.address journeyDate journeyTime customerDetails.name fare.finalAmount')
      .lean(),
  ]);
  const by = Object.fromEntries(byStatusRows.map((r) => [r._id, r.n]));
  const total = byStatusRows.reduce((sum, r) => sum + r.n, 0);
  const rev = revenueRows[0] || { gross: 0, refunded: 0 };

  res.json({
    success: true,
    stats: {
      totalBookings: total,
      pendingRequests: by[S.PENDING] || 0,
      confirmedBookings: by[S.CONFIRMED] || 0,
      todaysTrips,
      completedTrips: by[S.COMPLETED] || 0,
      cancelledTrips: (by[S.CANCELLED] || 0) + (by[S.REJECTED] || 0),
      totalCustomers,
      totalRevenue: rev.gross - rev.refunded,
      pendingPayments,
    },
    recentPending,
  });
});

/* -------------------------------- Reports -------------------------------- */

const PERIODS = {
  daily: { format: '%Y-%m-%d', days: 30 },
  weekly: { format: '%G-W%V', days: 84 },
  monthly: { format: '%Y-%m', days: 366 },
};

export const reports = asyncHandler(async (req, res) => {
  const cfg = PERIODS[req.query.period] || PERIODS.daily;
  const since = new Date(Date.now() - cfg.days * 86400000);
  const label = (field) => ({ $dateToString: { format: cfg.format, date: field, timezone: BUSINESS_TIMEZONE } });

  const [bookingRows, revenueRows] = await Promise.all([
    Booking.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: label('$createdAt'),
          bookings: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$bookingStatus', BOOKING_STATUS.COMPLETED] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $in: ['$bookingStatus', [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED]] }, 1, 0] } },
        },
      },
    ]),
    Payment.aggregate([
      { $match: { status: { $in: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.REFUNDED] }, paidAt: { $gte: since } } },
      { $group: { _id: label('$paidAt'), revenue: { $sum: { $subtract: ['$amount', { $ifNull: ['$refund.amount', 0] }] } } } },
    ]),
  ]);

  const map = new Map();
  for (const r of bookingRows) map.set(r._id, { period: r._id, bookings: r.bookings, completed: r.completed, cancelled: r.cancelled, revenue: 0 });
  for (const r of revenueRows) {
    const row = map.get(r._id) || { period: r._id, bookings: 0, completed: 0, cancelled: 0, revenue: 0 };
    row.revenue = r.revenue;
    map.set(r._id, row);
  }
  const rows = [...map.values()].sort((a, b) => (a.period < b.period ? 1 : -1));
  res.json({ success: true, period: PERIODS[req.query.period] ? req.query.period : 'daily', rows });
});

/* ------------------------------- Customers ------------------------------- */

export const listCustomers = asyncHandler(async (req, res) => {
  const filter = { role: ROLES.CUSTOMER };
  if (isString(req.query.q) && req.query.q.trim()) {
    const rx = new RegExp(escapeRegex(req.query.q.trim().slice(0, 50)), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const { page, limit, skip } = parsePage(req.query);
  const [customers, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('name email phone isActive createdAt').lean(),
    User.countDocuments(filter),
  ]);
  const counts = await Booking.aggregate([
    { $match: { customerId: { $in: customers.map((c) => c._id) } } },
    { $group: { _id: '$customerId', n: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.n]));
  for (const c of customers) c.bookingCount = countMap.get(String(c._id)) || 0;
  res.json({ success: true, customers, total, page, pages: Math.ceil(total / limit) || 1 });
});

export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await User.findOne({ _id: req.params.id, role: ROLES.CUSTOMER }).lean();
  if (!customer) throw new ApiError(404, 'Customer not found.');
  delete customer.passwordHash;
  const bookings = await Booking.find({ customerId: customer._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .select('bookingId pickup.address drop.address journeyDate bookingStatus paymentStatus fare.finalAmount')
    .lean();
  res.json({ success: true, customer, bookings });
});

export const setCustomerActive = asyncHandler(async (req, res) => {
  if (typeof req.body?.active !== 'boolean') throw new ApiError(400, 'active must be true or false.');
  const customer = await User.findOneAndUpdate(
    { _id: req.params.id, role: ROLES.CUSTOMER },
    { $set: { isActive: req.body.active } },
    { new: true }
  );
  if (!customer) throw new ApiError(404, 'Customer not found.');
  res.json({ success: true, customer });
});

/* -------------------------------- Feedback -------------------------------- */

export const listFeedback = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePage(req.query);
  const [feedback, total] = await Promise.all([
    Feedback.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'name')
      .populate('bookingId', 'bookingId')
      .lean(),
    Feedback.countDocuments(),
  ]);
  res.json({ success: true, feedback, total, page, pages: Math.ceil(total / limit) || 1 });
});

export const setFeedbackVisible = asyncHandler(async (req, res) => {
  if (typeof req.body?.isVisible !== 'boolean') throw new ApiError(400, 'isVisible must be true or false.');
  const f = await Feedback.findByIdAndUpdate(req.params.id, { $set: { isVisible: req.body.isVisible } }, { new: true });
  if (!f) throw new ApiError(404, 'Feedback not found.');
  res.json({ success: true, feedback: f });
});

/* -------------------------------- Settings -------------------------------- */

export const getSettings = asyncHandler(async (_req, res) => {
  res.json({ success: true, settings: await Setting.getMain() });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const b = req.body;
  if (!isPlainObject(b)) throw new ApiError(400, 'Invalid request body.');
  const settings = await Setting.getMain();
  if (b.companyProfile !== undefined) {
    if (!isPlainObject(b.companyProfile)) throw new ApiError(400, 'companyProfile must be an object.');
    for (const k of ['name', 'phone', 'email', 'address']) {
      const v = b.companyProfile[k];
      if (v === undefined) continue;
      if (!isString(v) || v.length > 200) throw new ApiError(400, `companyProfile.${k} must be text up to 200 characters.`);
      settings.companyProfile[k] = v.trim();
    }
  }
  if (b.minAdvanceHours !== undefined) {
    if (!Number.isInteger(b.minAdvanceHours) || b.minAdvanceHours < 0 || b.minAdvanceHours > 168) {
      throw new ApiError(400, 'minAdvanceHours must be a whole number from 0 to 168.');
    }
    settings.minAdvanceHours = b.minAdvanceHours;
  }
  await settings.save();
  res.json({ success: true, settings });
});

// Public: what the website needs to show (company details, add-ons, pay options).
export const publicConfig = asyncHandler(async (_req, res) => {
  const s = await Setting.getMain();
  res.json({
    success: true,
    company: s.companyProfile,
    minAdvanceHours: s.minAdvanceHours,
    payOptions: PAY_PERCENT_OPTIONS,
    addons: Object.entries(ADDONS).map(([key, a]) => ({ key, ...a })),
  });
});
