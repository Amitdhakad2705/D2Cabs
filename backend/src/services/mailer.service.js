import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;
const configured = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

if (configured) {
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
} else if (env.isProd) {
  console.warn('WARNING: SMTP is not configured. Forgot-password OTP and emails will NOT be delivered.');
}

export const mailConfigured = configured;

/** Never throws: a failed email must not break a booking. Returns true if sent. */
export async function sendMail({ to, subject, text }) {
  if (!to) return false;
  if (!transporter) {
    // Development helper: shows the email in the terminal instead of sending it.
    if (!env.isProd) console.log(`\n[DEV EMAIL] to: ${to}\nsubject: ${subject}\n${text}\n`);
    return false;
  }
  try {
    await transporter.sendMail({ from: env.smtp.from || env.smtp.user, to, subject, text });
    return true;
  } catch (err) {
    console.error('Email failed:', err.message);
    return false;
  }
}
