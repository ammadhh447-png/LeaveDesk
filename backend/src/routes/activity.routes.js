import { Router } from 'express';
import {
  getMyActivities,
  getTeamProfileActivities,
  getActivityById,
  deleteActivity,
  deleteActivities,
  deleteAllProfileActivities,
} from '../controllers/activity.controller.js';
import { protect, requireActive } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

router.use(protect, requireActive);

router.get('/my', asyncHandler(getMyActivities));
router.get('/team-profile', authorize('manager', 'admin'), asyncHandler(getTeamProfileActivities));
router.delete('/bulk', authorize('admin'), asyncHandler(deleteActivities));
router.delete('/all-profile', authorize('admin'), asyncHandler(deleteAllProfileActivities));
router.get('/:id', asyncHandler(getActivityById));
router.delete('/:id', authorize('admin'), asyncHandler(deleteActivity));

export default router;
