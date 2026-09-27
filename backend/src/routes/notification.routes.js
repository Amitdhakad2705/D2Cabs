import { Router } from 'express';
import { customerNotifications as c } from '../controllers/notification.controller.js';
import { requireCustomer } from '../middleware/auth.js';

const router = Router();
router.use(requireCustomer);

router.get('/', c.list);
router.post('/read-all', c.readAll); // keep BEFORE '/:id/read'
router.post('/:id/read', c.read);

export default router;
