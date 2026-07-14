import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/helpers';
import { getPublisherLabel } from '../../utils/announcements';
import { PAGE_SIZE } from '../../constants/pagination';

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', message: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const canEdit = (announcement) => {
    if (user?.role === 'admin') return true;
    return announcement.createdBy?._id === user?._id || announcement.createdBy === user?._id;
  };

  const load = (p = page) => {
    setLoading(true);
    notificationAPI.getManageAnnouncements({ page: p, limit: PAGE_SIZE })
      .then(({ data }) => {
        setAnnouncements(data.data.announcements || []);
        setPagination(data.data.pagination);
      })
      .catch((err) => setMessage({ type: 'error', text: err.message }))
      .finally(() => {
        setLoading(false);
        setInitialLoad(false);
      });
  };

  useEffect(() => {
    load();
  }, [page]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', message: '' });
    setModalOpen(true);
  };

  const openEdit = (announcement) => {
    setEditing(announcement);
    setForm({ title: announcement.title, message: announcement.message });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await notificationAPI.updateAnnouncement(editing._id, form);
        setMessage({ type: 'success', text: 'Announcement updated. Changes are visible to all users.' });
      } else {
        await notificationAPI.createAnnouncement(form);
        setMessage({ type: 'success', text: 'Announcement published. It is now visible to all users.' });
      }
      setModalOpen(false);
      load(page);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await notificationAPI.deleteAnnouncement(id);
      setMessage({ type: 'success', text: 'Announcement removed.' });
      const remainingOnPage = announcements.length - 1;
      const nextPage = remainingOnPage === 0 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      load(nextPage);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (initialLoad && loading) return <LoadingSpinner className="py-20" />;

  return (
    <div>
      <PageHeader
        title="Manage Announcements"
        subtitle="Create and edit posts shown on the company announcements page."
        action={(
          <button type="button" onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> New Announcement
          </button>
        )}
      />

      {message.text && (
        <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />
      )}

      {loading ? <LoadingSpinner className="py-12" /> : (
        <>
          <div className="space-y-3">
            {announcements.length ? announcements.map((item) => (
              <div key={item._id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-theme">{item.title}</p>
                    <p className="text-sm text-muted-theme mt-1 whitespace-pre-wrap">{item.message}</p>
                    <p className="text-xs text-faint-theme mt-2">
                      {getPublisherLabel(item.createdBy)} · {formatDate(item.createdAt)}
                    </p>
                  </div>
                  {canEdit(item) && (
                    <div className="flex gap-2 shrink-0">
                      <button type="button" onClick={() => openEdit(item)} className="text-secondary-theme hover:text-theme">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => handleDelete(item._id)} className="text-secondary-theme hover:text-theme">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )) : (
              <div className="card"><EmptyState title="No announcements yet" description="Create one to share updates with employees." /></div>
            )}
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Announcement' : 'New Announcement'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary">{editing ? 'Save changes' : 'Publish'}</button>
        </form>
      </Modal>
    </div>
  );
}
