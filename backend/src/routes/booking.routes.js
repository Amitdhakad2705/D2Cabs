import { Router } from 'express';
import {
  cancelMyBooking,
  createBooking,
  getMyBooking,
  myBookings,
  submitFeedback,
} from '../controllers/booking.controller.js';
import { requireCustomer } from '../middleware/auth.js';
import { bookingLimiter } from '../middleware/rateLimiters.js';

const router = Router();
router.use(requireCustomer); // every booking route needs a logged-in customer

router.post('/', bookingLimiter, createBooking);
router.get('/my', myBookings); // keep BEFORE '/:id'
router.get('/:id', getMyBooking);
router.post('/:id/cancel', cancelMyBooking);
router.post('/:id/feedback', submitFeedback);

export default router;
