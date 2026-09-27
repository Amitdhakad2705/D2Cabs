import { Router } from 'express';
import { adminChangePassword } from '../controllers/account.controller.js';
import { adminLogin, adminLogout, adminMe } from '../controllers/auth.controller.js';
import { requireAdmin } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.post('/login', loginLimiter, adminLogin);
router.post('/logout', adminLogout);
router.get('/me', requireAdmin, adminMe);
router.post('/change-password', requireAdmin, adminChangePassword);

export default router;
