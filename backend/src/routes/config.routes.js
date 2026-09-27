import { Router } from 'express';
import { publicConfig } from '../controllers/admin.controller.js';

const router = Router();
router.get('/', publicConfig); // public: company details, add-ons, pay options

export default router;
