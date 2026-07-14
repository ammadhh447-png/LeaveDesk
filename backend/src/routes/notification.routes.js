import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteNotifications,
  deleteAllNotifications,
  getAnnouncements,
  getManageAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

router.use(protect);

router.get('/unread-count', asyncHandler(getUnreadCount));
router.get('/', asyncHandler(getNotifications));
router.put('/read-all', asyncHandler(markAllAsRead));
router.delete('/all', asyncHandler(deleteAllNotifications));
router.delete('/bulk', asyncHandler(deleteNotifications));
router.delete('/:id', asyncHandler(deleteNotification));
router.put('/:id/read', asyncHandler(markAsRead));

router.get('/announcements', asyncHandler(getAnnouncements));
router.get('/announcements/manage', authorize('admin', 'manager'), asyncHandler(getManageAnnouncements));
router.post('/announcements', authorize('admin', 'manager'), asyncHandler(createAnnouncement));
router.put('/announcements/:id', authorize('admin', 'manager'), asyncHandler(updateAnnouncement));
router.delete('/announcements/:id', authorize('admin', 'manager'), asyncHandler(deleteAnnouncement));

export default router;
