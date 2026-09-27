import { Router } from 'express';
import {
  createDriver,
  deleteDriver,
  driverTrips,
  getDriver,
  listDrivers,
  updateDriver,
} from '../controllers/driver.controller.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(requireAdmin); // every route below is admin only

router.get('/', listDrivers);
router.post('/', createDriver);
router.get('/:id', getDriver);
router.put('/:id', updateDriver);
router.delete('/:id', deleteDriver);
router.get('/:id/trips', driverTrips);

export default router;
