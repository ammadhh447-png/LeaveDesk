import {
  Bell, CheckCircle, XCircle, Info, CalendarDays, FileText, User, Trash2, UserCircle,
} from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const typeConfig = {
  leave_approved: { icon: CheckCircle, label: 'Approved' },
  leave_rejected: { icon: XCircle, label: 'Rejected' },
  leave_info: { icon: Info, label: 'Info' },
  holiday: { icon: CalendarDays, label: 'Holiday' },
  policy: { icon: FileText, label: 'Policy' },
  account: { icon: User, label: 'Account' },
  profile_update: { icon: UserCircle, label: 'Profile' },
  general: { icon: Bell, label: 'General' },
};

export default function NotificationFeed({
  notifications,
  onMarkRead,
  selectable = false,
  selectedIds = [],
  onToggleSelect,
  onDelete,
}) {
  const selectedSet = new Set(selectedIds);

  return (
    <div className="notif-list-panel">
      {notifications.map((n) => {
        const config = typeConfig[n.type] || typeConfig.general;
        const Icon = config.icon;
        const unread = !n.isRead;
        const isSelected = selectedSet.has(n._id);

        return (
          <article
            key={n._id}
            className={`notif-list-item ${unread ? 'notif-list-item-unread' : ''} ${isSelected ? 'notif-list-item-selected' : ''}`}
            onClick={() => {
              if (selectable) return;
              if (unread) onMarkRead?.(n._id);
            }}
            role={!selectable && unread ? 'button' : undefined}
            tabIndex={!selectable && unread ? 0 : undefined}
            onKeyDown={(e) => {
              if (!selectable && unread && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onMarkRead?.(n._id);
              }
            }}
          >
            {selectable && (
              <label className="notif-list-check" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect?.(n._id)}
                  aria-label={`Select ${n.title}`}
                />
              </label>
            )}

            <div className={`notif-list-icon ${unread ? 'notif-list-icon-unread' : ''}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>

            <div className="notif-list-content">
              <div className="notif-list-top">
                <h3 className={`notif-list-title ${unread ? 'notif-list-title-unread' : ''}`}>
                  {n.title}
                </h3>
                <time className="notif-list-date">{formatDate(n.createdAt)}</time>
              </div>
              <p className="notif-list-message">{n.message}</p>
            </div>

            <div className="notif-list-aside">
              <span className="notif-list-type">{config.label}</span>
              {unread && <span className="notif-list-dot" aria-label="Unread" />}
              {onDelete && (
                <button
                  type="button"
                  className="notif-list-delete"
                  title="Delete notification"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(n._id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export { typeConfig };
