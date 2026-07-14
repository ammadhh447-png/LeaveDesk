import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { resolveObjectId } from '../utils/helpers.js';

export const createNotification = async ({ userId, title, message, type = 'general', relatedId }) => {
  const resolvedUserId = resolveObjectId(userId);
  if (!resolvedUserId) return null;

  const user = await User.findById(resolvedUserId).select('notificationsEnabled');
  if (user && user.notificationsEnabled === false) return null;

  return Notification.create({
    user: resolvedUserId,
    title,
    message,
    type,
    relatedId,
  });
};

export const createBulkNotifications = async (notifications) => {
  const userIds = [...new Set(
    notifications.map((n) => resolveObjectId(n.user)).filter(Boolean),
  )];
  const disabledUsers = await User.find({
    _id: { $in: userIds },
    notificationsEnabled: false,
  }).select('_id');
  const disabledIds = new Set(disabledUsers.map((u) => u._id.toString()));

  const filtered = notifications
    .map((n) => ({ ...n, user: resolveObjectId(n.user) }))
    .filter((n) => n.user && !disabledIds.has(n.user));
  if (!filtered.length) return [];
  return Notification.insertMany(filtered);
};
