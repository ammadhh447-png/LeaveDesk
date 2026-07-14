import {
  FileText,
  UserCircle,
  Lock,
  Bell,
  ClipboardList,
  Activity,
} from 'lucide-react';

const ACTIVITY_ICONS = {
  leave_applied: FileText,
  leave_reviewed: ClipboardList,
  profile_updated: UserCircle,
  password_changed: Lock,
  notification_settings: Bell,
};

const CATEGORY_LABELS = {
  leave: 'Leave',
  profile: 'Profile',
  security: 'Security',
  account: 'Account',
};

export const ACTIVITY_CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'leave', label: 'Leave' },
  { value: 'profile', label: 'Profile' },
  { value: 'security', label: 'Security' },
  { value: 'account', label: 'Account' },
];

export function getActivityIcon(action) {
  return ACTIVITY_ICONS[action] || Activity;
}

export function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

export function formatActivityTime(date) {
  return new Date(date).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ACTIVITY_DOT_COLORS = {
  leave_applied: '#3b82f6',
  leave_reviewed_approved: '#22c55e',
  leave_reviewed_rejected: '#ef4444',
  leave_reviewed_pending: '#f59e0b',
  leave_reviewed_info_requested: '#f59e0b',
  profile_updated: '#8b5cf6',
  password_changed: '#6366f1',
  notification_settings: '#6b7280',
};

export function getActivityDotColor(action, metadata = {}) {
  if (action === 'leave_reviewed' && metadata?.status) {
    return ACTIVITY_DOT_COLORS[`leave_reviewed_${metadata.status}`]
      || ACTIVITY_DOT_COLORS.leave_reviewed_pending;
  }
  return ACTIVITY_DOT_COLORS[action] || '#94a3b8';
}
