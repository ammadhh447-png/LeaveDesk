import { Router } from 'express';
import {
  applyLeave,
  getMyLeaves,
  getLeaveById,
  getPendingLeaves,
  getEmployeeLeaveHistory,
  reviewLeave,
  getTeamCalendar,
  getManagerDashboard,
  updateLeaveStatus,
  getLeaveHistory,
  updateLeave,
  deleteLeave,
} from '../controllers/leave.controller.js';
import { protect, requireActive } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

router.use(protect);

router.post('/apply', requireActive, upload.single('attachment'), asyncHandler(applyLeave));
router.get('/history', authorize('manager', 'admin', 'employee'), requireActive, asyncHandler(getLeaveHistory));
router.get('/my', requireActive, asyncHandler(getMyLeaves));
router.get('/pending', authorize('manager', 'admin'), requireActive, asyncHandler(getPendingLeaves));
router.get('/calendar', authorize('manager', 'admin'), requireActive, asyncHandler(getTeamCalendar));
router.get('/manager-dashboard', authorize('manager'), requireActive, asyncHandler(getManagerDashboard));
router.get('/employee/:employeeId', authorize('manager', 'admin'), requireActive, asyncHandler(getEmployeeLeaveHistory));
router.get('/:id', asyncHandler(getLeaveById));
router.put('/:id/review', authorize('manager', 'admin'), requireActive, asyncHandler(reviewLeave));
router.put('/:id/status', authorize('admin'), asyncHandler(updateLeaveStatus));
router.put('/:id', authorize('admin'), asyncHandler(updateLeave));
router.delete('/:id', authorize('admin'), asyncHandler(deleteLeave));

export default router;
