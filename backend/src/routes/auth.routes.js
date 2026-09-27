import { Router } from 'express';
import {
  addAddress,
  changePassword,
  deleteAddress,
  forgotPassword,
  resetPassword,
  updateProfile,
} from '../controllers/account.controller.js';
import { login, logout, me, register } from '../controllers/auth.controller.js';
import { requireCustomer } from '../middleware/auth.js';
import { forgotLimiter, loginLimiter, registerLimiter, resetLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.post('/forgot-password', forgotLimiter, forgotPassword);
router.post('/reset-password', resetLimiter, resetPassword);

router.get('/me', requireCustomer, me);
router.put('/profile', requireCustomer, updateProfile);
router.post('/addresses', requireCustomer, addAddress);
router.delete('/addresses/:addressId', requireCustomer, deleteAddress);
router.post('/change-password', requireCustomer, changePassword);

export default router;
