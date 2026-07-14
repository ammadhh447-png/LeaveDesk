import { Router } from 'express';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/department.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

router.get('/', asyncHandler(getDepartments));

router.use(protect);
router.post('/', authorize('admin'), asyncHandler(createDepartment));
router.put('/:id', authorize('admin'), asyncHandler(updateDepartment));
router.delete('/:id', authorize('admin'), asyncHandler(deleteDepartment));

export default router;
