import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import adminAuthRoutes from './routes/adminAuth.routes.js';
import adminCabRoutes from './routes/adminCab.routes.js';
import adminRoutes from './routes/admin.routes.js';
import adminDriverRoutes from './routes/adminDriver.routes.js';
import authRoutes from './routes/auth.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import cabRoutes from './routes/cab.routes.js';
import configRoutes from './routes/config.routes.js';
import fareRoutes from './routes/fare.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import { razorpayWebhook } from './controllers/payment.controller.js';
import { ApiError } from './utils/ApiError.js';

const app = express();

if (env.isProd) app.set('trust proxy', 1); // running behind a proxy/host (needed for rate limiting)

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // No Origin header = Postman / server-to-server (e.g. Razorpay webhook later).
      if (!origin || env.clientUrls.includes(origin)) return callback(null, true);
      callback(new ApiError(403, 'This origin is not allowed.'));
    },
    credentials: true, // lets the browser send the httpOnly login cookie
  })
);
// Razorpay webhook needs the RAW body to check its signature, so it comes BEFORE express.json().
app.post('/api/payments/webhook', express.raw({ type: 'application/json', limit: '100kb' }), razorpayWebhook);

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok' }));

app.use('/api/auth', authRoutes); // customer: register, login, logout, me
app.use('/api/admin/auth', adminAuthRoutes); // admin: login, logout, me
app.use('/api/cabs', cabRoutes); // public: active cabs
app.use('/api/fare', fareRoutes); // public: fare quote (server-side pricing)
app.use('/api/admin/cabs', adminCabRoutes); // admin: manage cabs + pricing
app.use('/api/admin/drivers', adminDriverRoutes); // admin: manage drivers
app.use('/api/admin', adminRoutes); // admin: dashboard, bookings, payments, customers, feedback, notifications, settings, reports
app.use('/api/bookings', bookingRoutes); // customer: create / list / cancel / rate
app.use('/api/payments', paymentRoutes); // customer: create-order, verify-payment
app.use('/api/notifications', notificationRoutes); // customer notifications
app.use('/api/config', configRoutes); // public config

app.use(notFound);
app.use(errorHandler);

export default app;
