import { Router } from 'express';
import {
  getMonthlyLeaves,
  getDepartmentLeaves,
  getEmployeeHistory,
  getAnalytics,
  exportReport,
  getAdminDashboard,
} from '../controllers/report.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', asyncHandler(getAdminDashboard));
router.get('/monthly', asyncHandler(getMonthlyLeaves));
router.get('/department/:departmentId', asyncHandler(getDepartmentLeaves));
router.get('/employee/:employeeId', asyncHandler(getEmployeeHistory));
router.get('/analytics', asyncHandler(getAnalytics));
router.get('/export', asyncHandler(exportReport));

export default router;
