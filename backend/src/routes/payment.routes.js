import { Router } from 'express';
import { createPaymentOrder, verifyPayment } from '../controllers/payment.controller.js';
import { requireCustomer } from '../middleware/auth.js';
import { paymentLimiter } from '../middleware/rateLimiters.js';

// The webhook route is mounted separately in app.js (it needs the raw body).
const router = Router();
router.use(requireCustomer, paymentLimiter);

router.post('/create-order', createPaymentOrder);
router.post('/verify-payment', verifyPayment);

export default router;
