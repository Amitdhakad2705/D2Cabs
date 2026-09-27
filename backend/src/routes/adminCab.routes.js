import { Router } from 'express';
import {
  adminCreateCab,
  adminDeleteCab,
  adminGetCab,
  adminListCabs,
  adminSetCabActive,
  adminUpdateCab,
} from '../controllers/cab.controller.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAdmin); // every route below is admin only

router.get('/', adminListCabs);
router.post('/', adminCreateCab);
router.get('/:id', adminGetCab);
router.put('/:id', adminUpdateCab);
router.patch('/:id/active', adminSetCabActive);
router.delete('/:id', adminDeleteCab);

export default router;
