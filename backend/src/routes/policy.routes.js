import { Router } from 'express';
import {
  getPolicies,
  createPolicy,
  updatePolicy,
  deletePolicy,
} from '../controllers/policy.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

router.get('/', asyncHandler(getPolicies));

router.use(protect);
router.post('/', authorize('admin'), asyncHandler(createPolicy));
router.put('/:id', authorize('admin'), asyncHandler(updatePolicy));
router.delete('/:id', authorize('admin'), asyncHandler(deletePolicy));

export default router;
