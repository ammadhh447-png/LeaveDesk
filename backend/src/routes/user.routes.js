import { Router } from 'express';
import {
  getDashboard,
  getProfile,
  updateProfile,
  changePassword,
  getLeaveBalance,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getPendingEmployees,
  approveEmployee,
  rejectEmployee,
  getTeamMembers,
  updateNotificationSettings,
} from '../controllers/user.controller.js';
import { protect, requireActive } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

router.use(protect);

router.get('/dashboard', requireActive, asyncHandler(getDashboard));
router.get('/profile', asyncHandler(getProfile));
router.put('/profile', upload.single('profilePicture'), asyncHandler(updateProfile));
router.put('/change-password', asyncHandler(changePassword));
router.get('/leave-balance', requireActive, asyncHandler(getLeaveBalance));
router.put('/notification-settings', asyncHandler(updateNotificationSettings));

router.get('/team', authorize('manager', 'admin'), requireActive, asyncHandler(getTeamMembers));
router.get('/pending', authorize('manager', 'admin'), requireActive, asyncHandler(getPendingEmployees));
router.put('/:id/approve', authorize('manager', 'admin'), requireActive, asyncHandler(approveEmployee));
router.put('/:id/reject', authorize('manager', 'admin'), requireActive, asyncHandler(rejectEmployee));

router.get('/', authorize('admin'), asyncHandler(getAllUsers));
router.post('/', authorize('admin'), asyncHandler(createUser));
router.get('/:id', authorize('admin', 'manager'), asyncHandler(getUserById));
router.put('/:id', authorize('admin'), asyncHandler(updateUser));
router.delete('/:id', authorize('admin'), asyncHandler(deleteUser));

export default router;
