import { ActivityLog } from '../models/ActivityLog.js';
import { User } from '../models/User.js';
import { ROLES } from '../config/constants.js';
import { createBulkNotifications } from './notification.service.js';
import { resolveObjectId } from '../utils/helpers.js';

export const ACTIVITY_ACTIONS = {
  LEAVE_APPLIED: 'leave_applied',
  LEAVE_REVIEWED: 'leave_reviewed',
  PROFILE_UPDATED: 'profile_updated',
  PASSWORD_CHANGED: 'password_changed',
  NOTIFICATION_SETTINGS: 'notification_settings',
};

export const ACTIVITY_CATEGORIES = {
  LEAVE: 'leave',
  PROFILE: 'profile',
  SECURITY: 'security',
  ACCOUNT: 'account',
};

const PROFILE_FIELD_LABELS = {
  name: 'Full Name',
  phone: 'Phone',
  address: 'Address',
  emergencyContact: 'Emergency Contact',
  designation: 'Designation',
  department: 'Department',
  profilePicture: 'Profile Picture',
};

const formatValue = (field, value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (field === 'profilePicture') return value ? 'Updated' : '—';
  if (field === 'department' && typeof value === 'object') return value?.name || '—';
  return String(value);
};

export const buildProfileChanges = (before, after, updates) => {
  const changes = [];

  Object.entries(updates).forEach(([field, newValue]) => {
    if (field === 'department') {
      const oldName = before.department?.name || '—';
      const newName = after.department?.name || '—';
      if (oldName !== newName) {
        changes.push({ field, label: PROFILE_FIELD_LABELS.department, from: oldName, to: newName });
      }
      return;
    }

    const oldValue = formatValue(field, before[field]);
    const newValueFormatted = formatValue(field, newValue);
    if (oldValue !== newValueFormatted) {
      changes.push({
        field,
        label: PROFILE_FIELD_LABELS[field] || field,
        from: oldValue,
        to: newValueFormatted,
      });
    }
  });

  return changes;
};

export const logActivity = async ({
  userId,
  action,
  category,
  title,
  message,
  changes = [],
  relatedModel,
  relatedId,
  metadata,
}) => ActivityLog.create({
  user: userId,
  action,
  category,
  title,
  message,
  changes,
  relatedModel,
  relatedId,
  metadata,
});

export const notifyProfileChangeStakeholders = async (employee, activityId, summary) => {
  const recipientIds = new Set();

  const managerId = resolveObjectId(employee.manager);
  if (managerId) {
    recipientIds.add(managerId);
  }

  const admins = await User.find({ role: ROLES.ADMIN, status: 'active' }).select('_id');
  admins.forEach((admin) => recipientIds.add(admin._id.toString()));

  recipientIds.delete(employee._id.toString());

  if (!recipientIds.size) return;

  await createBulkNotifications(
    [...recipientIds].map((userId) => ({
      user: userId,
      title: 'Employee Profile Updated',
      message: `${employee.name} updated profile: ${summary}`,
      type: 'profile_update',
      relatedId: activityId,
    })),
  );
};
