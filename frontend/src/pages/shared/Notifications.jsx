import { useState, useEffect, useRef, useCallback } from 'react';
import { Filter, Settings, CheckCheck, Trash2 } from 'lucide-react';
import ToolbarSearch from '../../components/common/ToolbarSearch';
import { notificationAPI, userAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Alert from '../../components/common/Alert';
import NotificationFeed from '../../components/notifications/NotificationFeed';
import { notifyNotificationsChanged } from '../../components/layout/NotificationBell';
import { PAGE_SIZE } from '../../constants/pagination';

const NOTIFY_CHANGED = 'notifications-changed';

export default function Notifications() {
  const settingsRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', isRead: '', type: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [enabled, setEnabled] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback((p = page, f = filters) => {
    setLoading(true);
    const params = { page: p, limit: PAGE_SIZE };
    if (f.search) params.search = f.search;
    if (f.isRead) params.isRead = f.isRead;
    if (f.type) params.type = f.type;

    notificationAPI.getAll(params)
      .then(({ data }) => {
        setNotifications(data.data.notifications);
        setPagination(data.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filters]);

  useEffect(() => {
    load(page, filters);
  }, [page]);

  useEffect(() => {
    setSelectedIds([]);
  }, [page, filters]);

  useEffect(() => {
    userAPI.getProfile()
      .then(({ data }) => setEnabled(data.data.user.notificationsEnabled !== false))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onChanged = () => load(page, filters);
    window.addEventListener(NOTIFY_CHANGED, onChanged);
    return () => window.removeEventListener(NOTIFY_CHANGED, onChanged);
  }, [load, page, filters]);

  useEffect(() => {
    if (window.location.hash === '#settings') {
      setSettingsOpen(true);
      requestAnimationFrame(() => {
        settingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, []);

  const applyFilters = (e) => {
    e?.preventDefault();
    setPage(1);
    load(1, filters);
  };

  const clearSearch = () => {
    const next = { ...filters, search: '' };
    setFilters(next);
    setPage(1);
    load(1, next);
  };

  const refreshList = () => {
    load(page, filters);
    notifyNotificationsChanged();
  };

  const handleMarkRead = async (id) => {
    await notificationAPI.markRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    refreshList();
  };

  const handleMarkAllRead = async () => {
    await notificationAPI.markAllRead();
    setMessage({ type: 'success', text: 'All notifications marked as read.' });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    refreshList();
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ));
  };

  const handleSelectAllPage = () => {
    const pageIds = notifications.map((n) => n._id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  const handleDeleteOne = async (id) => {
    if (!confirm('Delete this notification?')) return;
    setDeleting(true);
    try {
      await notificationAPI.delete(id);
      setMessage({ type: 'success', text: 'Notification deleted.' });
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      refreshList();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Delete ${selectedIds.length} selected notification${selectedIds.length > 1 ? 's' : ''}?`)) return;
    setDeleting(true);
    try {
      await notificationAPI.deleteMany(selectedIds);
      setMessage({ type: 'success', text: `${selectedIds.length} notification${selectedIds.length > 1 ? 's' : ''} deleted.` });
      setSelectedIds([]);
      refreshList();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setDeleting(false);
    }
  };

  const saveSettings = async () => {
    try {
      await userAPI.updateNotificationSettings({ notificationsEnabled: enabled });
      setMessage({ type: 'success', text: 'Notification settings saved.' });
      setSettingsOpen(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const pageIds = notifications.map((n) => n._id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const someSelected = selectedIds.length > 0;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="View notification history and manage your preferences."
      />

      {message.text && (
        <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />
      )}

      <form onSubmit={applyFilters} className="toolbar mb-4">
        <ToolbarSearch
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          onClear={clearSearch}
          placeholder="Search notifications"
        />
        <select
          className="toolbar-select"
          value={filters.isRead}
          onChange={(e) => setFilters({ ...filters, isRead: e.target.value })}
        >
          <option value="">All status</option>
          <option value="false">Unread</option>
          <option value="true">Read</option>
        </select>
        <select
          className="toolbar-select"
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">All types</option>
          <option value="leave_approved">Leave Approved</option>
          <option value="leave_rejected">Leave Rejected</option>
          <option value="leave_info">Leave Info</option>
          <option value="holiday">Holiday</option>
          <option value="policy">Policy</option>
          <option value="account">Account</option>
          <option value="profile_update">Profile Update</option>
          <option value="general">General</option>
        </select>
        <button type="submit" className="btn-submit">
          <Filter className="h-3.5 w-3.5" /> Apply
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleSelectAllPage}
          disabled={!notifications.length}
        >
          {allPageSelected ? 'Deselect all' : 'Select all'}
        </button>
        {someSelected && (
          <button
            type="button"
            className="btn-danger"
            onClick={handleDeleteSelected}
            disabled={deleting}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete ({selectedIds.length})
          </button>
        )}
        <button type="button" className="btn-secondary" onClick={handleMarkAllRead}>
          <CheckCheck className="h-3.5 w-3.5" /> Mark all read
        </button>
        <button
          type="button"
          className={`toolbar-icon-btn ${settingsOpen ? 'toolbar-icon-btn-active' : ''}`}
          title="Notification settings"
          onClick={() => setSettingsOpen((v) => !v)}
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </form>

      {settingsOpen && (
        <div id="settings" ref={settingsRef} className="section-card mb-4 scroll-mt-24">
          <label className="flex items-center gap-2 text-sm text-secondary-theme">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            Receive in-app notifications
          </label>
          <button type="button" className="btn-submit mt-3" onClick={saveSettings}>Save settings</button>
        </div>
      )}

      {loading ? <LoadingSpinner className="py-20" /> : (
        <>
          {notifications.length ? (
            <NotificationFeed
              notifications={notifications}
              onMarkRead={handleMarkRead}
              selectable
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onDelete={handleDeleteOne}
            />
          ) : (
            <EmptyState title="No notifications" description="No notifications match your filters" />
          )}

          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
