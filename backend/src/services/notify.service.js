import Notification from '../models/Notification.js';
import { env } from '../config/env.js';
import { sendMail } from './mailer.service.js';

// Every event creates an in-website notification and (if SMTP is set) an email.
// Failures are logged and swallowed: notifications must never break the main action.

export async function notifyCustomer({ user, type, title, message, booking }) {
  try {
    await Notification.create({ userId: user._id, type, title, message, bookingId: booking?._id });
    if (user.email) {
      await sendMail({ to: user.email, subject: `D2Cabs: ${title}`, text: `${message}\n\n- D2Cabs` });
    }
  } catch (err) {
    console.error('notifyCustomer failed:', err.message);
  }
}

export async function notifyAdmin({ type, title, message, booking }) {
  try {
    await Notification.create({ forAdmin: true, type, title, message, bookingId: booking?._id });
    if (env.adminNotifyEmail) {
      await sendMail({ to: env.adminNotifyEmail, subject: `D2Cabs admin: ${title}`, text: message });
    }
  } catch (err) {
    console.error('notifyAdmin failed:', err.message);
  }
}
