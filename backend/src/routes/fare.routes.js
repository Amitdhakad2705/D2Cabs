import { Router } from 'express';
import { quote } from '../controllers/fare.controller.js';
import { quoteLimiter } from '../middleware/rateLimiters.js';

const router = Router();
router.post('/quote', quoteLimiter, quote); // public: the homepage needs prices before login

export default router;
