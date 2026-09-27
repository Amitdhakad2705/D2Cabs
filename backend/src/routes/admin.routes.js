import { Router } from 'express';
import {
  dashboard,
  getCustomer,
  getSettings,
  listCustomers,
  listFeedback,
  reports,
  setCustomerActive,
  setFeedbackVisible,
  updateSettings,
} from '../controllers/admin.controller.js';
import {
  adminApprove,
  adminAssignDriver,
  adminGetBooking,
  adminListBookings,
  adminRecordCash,
  adminReject,
  adminSetNote,
  adminSetStatus,
} from '../controllers/booking.controller.js';
import { adminNotifications as n } from '../controllers/notification.controller.js';
import { adminListPayments, adminRefund } from '../controllers/payment.controller.js';
import { requireAdmin } from '../middleware/auth.js';

// Mounted at /api/admin AFTER the more specific /auth, /cabs and /drivers routers.
const router = Router();
router.use(requireAdmin); // every route below is admin only

router.get('/dashboard', dashboard);
router.get('/reports', reports);

router.get('/bookings', adminListBookings);
router.get('/bookings/:id', adminGetBooking);
router.post('/bookings/:id/approve', adminApprove);
router.post('/bookings/:id/reject', adminReject);
router.post('/bookings/:id/assign-driver', adminAssignDriver);
router.post('/bookings/:id/status', adminSetStatus);
router.patch('/bookings/:id/note', adminSetNote);
router.post('/bookings/:id/record-cash', adminRecordCash);

router.get('/payments', adminListPayments);
router.post('/payments/:id/refund', adminRefund);

router.get('/customers', listCustomers);
router.get('/customers/:id', getCustomer);
router.patch('/customers/:id/active', setCustomerActive);

router.get('/feedback', listFeedback);
router.patch('/feedback/:id/visibility', setFeedbackVisible);

router.get('/notifications', n.list);
router.post('/notifications/read-all', n.readAll);
router.post('/notifications/:id/read', n.read);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;
