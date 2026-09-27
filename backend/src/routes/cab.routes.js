import { Router } from 'express';
import { listActiveCabs } from '../controllers/cab.controller.js';

const router = Router();
router.get('/', listActiveCabs); // public

export default router;
