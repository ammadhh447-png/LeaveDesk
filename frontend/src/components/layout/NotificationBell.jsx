import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationAPI } from '../../api';
import { formatDate } from '../../utils/helpers';

const NOTIFY_CHANGED = 'notifications-changed';

export const notifyNotificationsChanged = () => {
  window.dispatchEvent(new CustomEvent(NOTIFY_CHANGED));
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  const loadUnreadCount = useCallback(async () => {
    try {
      const { data } = await notificationAPI.getUnreadCount();
      setUnreadCount(data.data.unreadCount);
    } catch {
      // keep current badge count on error
    }
  }, []);

  const loadRecent = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationAPI.getAll({ recent: true, isRead: 'false' });
      setNotifications(data.data.notifications);
      setUnreadCount(data.data.unreadCount);
      setLoaded(true);
    } catch {
      // keep current state on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    const onFocus = () => loadUnreadCount();
    const onChanged = () => {
      loadUnreadCount();
      if (loaded) loadRecent();
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener(NOTIFY_CHANGED, onChanged);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener(NOTIFY_CHANGED, onChanged);
    };
  }, [loadUnreadCount, loadRecent, loaded]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadRecent();
  };

  const handleMarkAll = async () => {
    try {
      await notificationAPI.markAllRead();
      setUnreadCount(0);
      setNotifications([]);
      notifyNotificationsChanged();
    } catch {
      loadRecent();
    }
  };

  const handleMarkOne = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((count) => Math.max(0, count - 1));
      notifyNotificationsChanged();
    } catch {
      loadRecent();
    }
  };

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button
        type="button"
        className="notif-bell-btn"
        onClick={handleToggle}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="notif-badge" title={`${unreadCount} unread`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <p className="notif-dropdown-title">Notifications</p>
            <button type="button" className="notif-mark-all-btn" onClick={handleMarkAll}>
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          </div>

          <div className="notif-list">
            {loading ? (
              <p className="notif-empty">Loading...</p>
            ) : notifications.length ? (
              notifications.map((n) => (
                <button
                  key={n._id}
                  type="button"
                  className="notif-item notif-item-unread"
                  onClick={() => handleMarkOne(n._id)}
                >
                  <p className="notif-item-title">{n.title}</p>
                  <p className="notif-item-msg">{n.message}</p>
                  <p className="notif-item-date">{formatDate(n.createdAt)}</p>
                </button>
              ))
            ) : (
              <p className="notif-empty">No new notifications</p>
            )}
          </div>

          <div className="notif-dropdown-footer">
            <Link
              to="/notifications"
              className="notif-settings-link"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
