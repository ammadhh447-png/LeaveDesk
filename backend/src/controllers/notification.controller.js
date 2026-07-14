import { Notification } from '../models/Notification.js';
import { Announcement } from '../models/Announcement.js';
import { AppError } from '../utils/AppError.js';
import { successResponse, getPagination, buildPaginationMeta } from '../utils/helpers.js';

const notificationFields = 'title message type isRead createdAt';

export const getUnreadCount = async (req, res) => {
  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  });
  successResponse(res, { unreadCount });
};

export const getNotifications = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search, isRead, type } = req.query;
  const isDropdown = req.query.recent === 'true';
  const queryLimit = isDropdown ? 5 : limit;

  const filter = { user: req.user._id };

  if (isRead === 'true') filter.isRead = true;
  if (isRead === 'false') filter.isRead = false;
  if (type) filter.type = type;
  if (search?.trim()) {
    filter.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { message: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const notificationsPromise = Notification.find(filter)
    .select(notificationFields)
    .sort({ createdAt: -1 })
    .skip(isDropdown ? 0 : skip)
    .limit(queryLimit)
    .lean();

  const unreadPromise = Notification.countDocuments({ user: req.user._id, isRead: false });

  if (isDropdown) {
    const [notifications, unreadCount] = await Promise.all([notificationsPromise, unreadPromise]);
    return successResponse(res, { notifications, unreadCount, pagination: null });
  }

  const totalPromise = Notification.countDocuments(filter);
  const [notifications, total, unreadCount] = await Promise.all([
    notificationsPromise,
    totalPromise,
    unreadPromise,
  ]);

  successResponse(res, {
    notifications,
    unreadCount,
    pagination: buildPaginationMeta(total, page, limit),
  });
};

export const markAsRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw new AppError('Notification not found.', 404);
  successResponse(res, { notification });
};

export const markAllAsRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  successResponse(res, null, 'All notifications marked as read.');
};

export const deleteNotification = async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!notification) throw new AppError('Notification not found.', 404);
  successResponse(res, null, 'Notification deleted.');
};

export const deleteNotifications = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) {
    throw new AppError('Select at least one notification to delete.');
  }

  const result = await Notification.deleteMany({
    _id: { $in: ids },
    user: req.user._id,
  });

  successResponse(res, { deletedCount: result.deletedCount }, 'Selected notifications deleted.');
};

export const deleteAllNotifications = async (req, res) => {
  const result = await Notification.deleteMany({ user: req.user._id });
  successResponse(res, { deletedCount: result.deletedCount }, 'All notifications deleted.');
};

export const getAnnouncements = async (req, res) => {
  const { search } = req.query;
  const { page, limit, skip } = getPagination(req.query);
  const filter = { isActive: true };

  if (search?.trim()) {
    filter.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { message: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const [announcements, total] = await Promise.all([
    Announcement.find(filter)
      .populate('createdBy', 'role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Announcement.countDocuments(filter),
  ]);

  successResponse(res, {
    announcements,
    pagination: buildPaginationMeta(total, page, limit),
  });
};

export const getManageAnnouncements = async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [announcements, total] = await Promise.all([
    Announcement.find({ isActive: true })
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Announcement.countDocuments({ isActive: true }),
  ]);

  successResponse(res, {
    announcements,
    pagination: buildPaginationMeta(total, page, limit),
  });
};

const canManageAnnouncement = (user, announcement) => {
  if (user.role === 'admin') return true;
  return announcement.createdBy.toString() === user._id.toString();
};

export const createAnnouncement = async (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) throw new AppError('Title and message are required.');

  const announcement = await Announcement.create({
    title,
    message,
    createdBy: req.user._id,
  });

  const populated = await Announcement.findById(announcement._id).populate('createdBy', 'name role');
  successResponse(res, { announcement: populated }, 'Announcement published.', 201);
};

export const updateAnnouncement = async (req, res) => {
  const { title, message, isActive } = req.body;
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) throw new AppError('Announcement not found.', 404);

  if (!canManageAnnouncement(req.user, announcement)) {
    throw new AppError('You can only edit your own announcements.', 403);
  }

  if (title !== undefined) announcement.title = title;
  if (message !== undefined) announcement.message = message;
  if (isActive !== undefined) announcement.isActive = isActive;
  await announcement.save();

  const populated = await Announcement.findById(announcement._id).populate('createdBy', 'name role');
  successResponse(res, { announcement: populated }, 'Announcement updated.');
};

export const deleteAnnouncement = async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) throw new AppError('Announcement not found.', 404);

  if (!canManageAnnouncement(req.user, announcement)) {
    throw new AppError('You can only delete your own announcements.', 403);
  }

  await announcement.deleteOne();
  successResponse(res, null, 'Announcement deleted.');
};
