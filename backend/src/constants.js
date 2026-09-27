export const ROLES = Object.freeze({ CUSTOMER: 'customer', ADMIN: 'admin' });

export const SERVICE_TYPES = Object.freeze(['local', 'outstation', 'airport']);
export const TRIP_TYPES = Object.freeze(['one_way', 'round_trip']);

export const BOOKING_STATUS = Object.freeze({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  DRIVER_ASSIGNED: 'DRIVER_ASSIGNED',
  DRIVER_ON_THE_WAY: 'DRIVER_ON_THE_WAY',
  TRIP_STARTED: 'TRIP_STARTED',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
});

// Payment is tracked separately from booking status.
export const PAYMENT_STATUS = Object.freeze({
  NOT_REQUESTED: 'NOT_REQUESTED', // booking still PENDING, admin has not approved
  PENDING: 'PENDING', // admin approved, customer has to pay
  PARTIALLY_PAID: 'PARTIALLY_PAID', // advance (e.g. 25%) paid, balance due
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
});

// Which status can move to which. Used by the booking APIs (Step 3+).
export const BOOKING_TRANSITIONS = Object.freeze({
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['DRIVER_ASSIGNED', 'CANCELLED'],
  DRIVER_ASSIGNED: ['DRIVER_ON_THE_WAY', 'TRIP_STARTED', 'CANCELLED'],
  DRIVER_ON_THE_WAY: ['TRIP_STARTED', 'CANCELLED'],
  TRIP_STARTED: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
});

export const NOTIFICATION_TYPES = Object.freeze([
  'BOOKING_REQUEST_RECEIVED',
  'BOOKING_CONFIRMED',
  'BOOKING_REJECTED',
  'DRIVER_ASSIGNED',
  'DRIVER_ON_THE_WAY',
  'TRIP_STARTED',
  'TRIP_REMINDER',
  'TRIP_COMPLETED',
  'PAYMENT_SUCCESSFUL',
  'PAYMENT_REFUNDED',
  'BOOKING_CANCELLED',
  'CUSTOMER_MESSAGE',
]);

// The business runs in India. Dates/times typed by customers are Indian Standard Time.
export const BUSINESS_UTC_OFFSET = '+05:30';
export const BUSINESS_TIMEZONE = 'Asia/Kolkata';

export const PAY_PERCENT_OPTIONS = Object.freeze([25, 100]);

// Groups used by the customer dashboard tabs.
export const DASHBOARD_GROUPS = Object.freeze({
  active: ['DRIVER_ON_THE_WAY', 'TRIP_STARTED'],
  upcoming: ['PENDING', 'CONFIRMED', 'DRIVER_ASSIGNED'],
  completed: ['COMPLETED'],
  cancelled: ['CANCELLED', 'REJECTED'],
});

// Customer may cancel themselves only before the driver is on the way.
export const CUSTOMER_CANCELLABLE = Object.freeze(['PENDING', 'CONFIRMED', 'DRIVER_ASSIGNED']);
