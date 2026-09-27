import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

for (const key of ['MONGODB_URI', 'JWT_SECRET']) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key} (see .env.example)`);
    process.exit(1);
  }
}

if (isProd && process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters in production.');
  process.exit(1);
}

export const env = {
  isProd,
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresInDays: Number(process.env.JWT_EXPIRES_IN_DAYS) || 7,
  // Road-distance service. The public demo server is NOT for production use.
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || '',
  },
  adminNotifyEmail: process.env.ADMIN_NOTIFY_EMAIL || '',
  // If true, admin can assign a driver only after the advance payment is received.
  requirePaymentBeforeDriver: process.env.REQUIRE_PAYMENT_BEFORE_DRIVER === 'true',
  osrmBaseUrl: (process.env.OSRM_BASE_URL || 'https://router.project-osrm.org').replace(/\/+$/, ''),
  clientUrls: (process.env.CLIENT_URLS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
