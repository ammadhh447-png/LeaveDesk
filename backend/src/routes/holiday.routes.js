import { Router } from 'express';
import {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from '../controllers/holiday.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

router.get('/', asyncHandler(getHolidays));

router.use(protect);
router.post('/', authorize('admin'), asyncHandler(createHoliday));
router.put('/:id', authorize('admin'), asyncHandler(updateHoliday));
router.delete('/:id', authorize('admin'), asyncHandler(deleteHoliday));

export default router;
