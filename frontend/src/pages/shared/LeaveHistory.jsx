import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Pencil, Trash2 } from 'lucide-react';
import ToolbarSearch from '../../components/common/ToolbarSearch';
import { useAuth } from '../../context/AuthContext';
import { leaveAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import DataTable, { StatusBadge, formatDate, formatLeaveType } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { SubmitButton } from '../../components/common/ActionButton';
import { PAGE_SIZE } from '../../constants/pagination';

export default function LeaveHistory() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';

  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    leaveType: '',
    employeeId: params.get('employeeId') || '',
  });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', reason: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const load = (p = page, f = filters) => {
    setLoading(true);
    leaveAPI.getHistory({ page: p, limit: PAGE_SIZE, ...f })
      .then(({ data }) => {
        setLeaves(data.data.leaves);
        setPagination(data.data.pagination);
        setSelected([]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

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

  const toggleAll = () => {
    setSelected(selected.length === leaves.length ? [] : leaves.map((l) => l._id));
  };

  const toggleOne = (id) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this leave record?')) return;
    try {
      await leaveAPI.delete(id);
      setMessage({ type: 'success', text: 'Record deleted.' });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleBulkDelete = async () => {
    if (!selected.length || !confirm(`Delete ${selected.length} selected records?`)) return;
    try {
      await Promise.all(selected.map((id) => leaveAPI.delete(id)));
      setMessage({ type: 'success', text: 'Selected records deleted.' });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const openEdit = (leave) => {
    setEditing(leave);
    setEditForm({ status: leave.status, reason: leave.reason });
  };

  const saveEdit = async () => {
    try {
      await leaveAPI.update(editing._id, editForm);
      setMessage({ type: 'success', text: 'Record updated.' });
      setEditing(null);
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const columns = [
    ...(isAdmin ? [{
      key: 'select',
      label: (
        <input type="checkbox" checked={selected.length === leaves.length && leaves.length > 0} onChange={toggleAll} />
      ),
      render: (row) => <input type="checkbox" checked={selected.includes(row._id)} onChange={() => toggleOne(row._id)} />,
    }] : []),
    ...(isAdmin || user?.role === 'manager' ? [{ key: 'employee', label: 'Employee', render: (row) => row.employee?.name || '-' }] : []),
    { key: 'leaveType', label: 'Type', render: (row) => formatLeaveType(row.leaveType) },
    { key: 'dates', label: 'Dates', render: (row) => `${formatDate(row.startDate)} - ${formatDate(row.endDate)}` },
    { key: 'days', label: 'Days' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    ...(isAdmin ? [{
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => openEdit(row)} className="action-icon-btn"><Pencil className="h-4 w-4" /></button>
          <button type="button" onClick={() => handleDelete(row._id)} className="action-icon-btn action-icon-btn-danger"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div>
      <PageHeader
        title="Leave History"
        subtitle={
          isAdmin
            ? 'All leave records with admin edit and delete.'
            : isEmployee
              ? 'Your complete leave request history.'
              : 'Leave history for your team employees.'
        }
      />

      {message.text && <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />}

      <form onSubmit={applyFilters} className="toolbar mb-4">
        <ToolbarSearch
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          onClear={clearSearch}
          placeholder={isEmployee ? 'Search by leave type or reason' : 'Search employee'}
        />
        <select className="toolbar-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select className="toolbar-select" value={filters.leaveType} onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}>
          <option value="">All types</option>
          <option value="annual">Annual</option>
          <option value="sick">Sick</option>
          <option value="casual">Casual</option>
          <option value="work_from_home">Work From Home</option>
        </select>
        <button type="submit" className="btn-submit"><Filter className="h-4 w-4" /> Apply</button>
        {isAdmin && selected.length > 0 && (
          <button type="button" className="btn-danger" onClick={handleBulkDelete}>Delete selected ({selected.length})</button>
        )}
      </form>

      {loading ? <LoadingSpinner className="py-20" /> : (
        <>
          <DataTable columns={columns} data={leaves} emptyMessage="No leave history found" />
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Edit Leave Record">
        <div className="space-y-4">
          <div>
            <label className="label">Status</label>
            <select className="input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="info_requested">Info Requested</option>
            </select>
          </div>
          <div>
            <label className="label">Reason</label>
            <textarea className="input" rows={3} value={editForm.reason} onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })} />
          </div>
          <SubmitButton type="button" onClick={saveEdit}>Save Changes</SubmitButton>
        </div>
      </Modal>
    </div>
  );
}
