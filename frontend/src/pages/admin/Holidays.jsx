import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { holidayAPI } from '../../api';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { formatDate } from '../../utils/helpers';
import { PAGE_SIZE } from '../../constants/pagination';

export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', date: '', description: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const load = (p = page) => {
    setLoading(true);
    holidayAPI.getAll({ page: p, limit: PAGE_SIZE })
      .then(({ data }) => {
        setHolidays(data.data.holidays || []);
        setPagination(data.data.pagination);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setInitialLoad(false);
      });
  };

  useEffect(() => { load(); }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await holidayAPI.update(editing._id, form);
        setMessage({ type: 'success', text: 'Holiday updated.' });
      } else {
        await holidayAPI.create(form);
        setMessage({ type: 'success', text: 'Holiday added. All employees notified.' });
      }
      setModalOpen(false);
      load(page);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this holiday?')) return;
    try {
      await holidayAPI.delete(id);
      setMessage({ type: 'success', text: 'Holiday deleted.' });
      const remainingOnPage = holidays.length - 1;
      const nextPage = remainingOnPage === 0 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      load(nextPage);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (initialLoad && loading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Holiday Management</h1>
        <button onClick={() => { setEditing(null); setForm({ name: '', date: '', description: '' }); setModalOpen(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Holiday
        </button>
      </div>

      {message.text && <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />}

      {loading ? <LoadingSpinner className="py-12" /> : (
        <>
          <div className="space-y-3">
            {holidays.length ? holidays.map((h) => (
              <div key={h._id} className="card flex items-center justify-between">
                <div>
                  <p className="font-semibold text-theme">{h.name}</p>
                  <p className="text-sm text-primary-600">{formatDate(h.date)}</p>
                  {h.description && <p className="text-sm text-muted-theme">{h.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(h); setForm({ name: h.name, date: h.date.split('T')[0], description: h.description || '' }); setModalOpen(true); }} className="text-primary-600"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(h._id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            )) : (
              <div className="card"><EmptyState title="No holidays configured" /></div>
            )}
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Holiday' : 'Add Holiday'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Holiday Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Eid, Pakistan Day" /></div>
          <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <button type="submit" className="btn-primary">{editing ? 'Update' : 'Add Holiday'}</button>
        </form>
      </Modal>
    </div>
  );
}
