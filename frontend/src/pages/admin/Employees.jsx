import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Filter } from 'lucide-react';
import ToolbarSearch from '../../components/common/ToolbarSearch';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../api';
import DataTable, { StatusBadge } from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { SubmitButton } from '../../components/common/ActionButton';
import { formatDate } from '../../utils/helpers';
import { PAGE_SIZE } from '../../constants/pagination';

const defaultFilters = { search: '', role: '', status: '' };

export default function Employees() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(defaultFilters);
  const [managers, setManagers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'employee',
    department: '', phone: '', manager: '', status: 'active',
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const load = (p = page, f = filters) => {
    setLoading(true);
    const params = { page: p, limit: PAGE_SIZE };
    if (f.search) params.search = f.search;
    if (f.role) params.role = f.role;
    if (f.status) params.status = f.status;

    Promise.all([
      userAPI.getAll(params),
      userAPI.getAll({ role: 'manager', status: 'active', all: 'true' }),
    ]).then(([usersRes, mgrRes]) => {
      setUsers(usersRes.data.data.users || []);
      setPagination(usersRes.data.data.pagination);
      setManagers(mgrRes.data.data.users || []);
    }).catch(() => {}).finally(() => {
      setLoading(false);
      setInitialLoad(false);
    });
  };

  useEffect(() => { load(); }, [page]);

  const applyFilters = (e) => {
    e?.preventDefault();
    setPage(1);
    load(1, filters);
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
    load(1, defaultFilters);
  };

  const clearSearch = () => {
    const next = { ...filters, search: '' };
    setFilters(next);
    setPage(1);
    load(1, next);
  };

  const openCreate = (role = 'employee') => {
    setEditing(null);
    setForm({
      name: '', email: '', password: '', role,
      department: '', phone: '', manager: '', status: 'active',
    });
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department?.name || '',
      phone: user.phone || '',
      manager: user.manager?._id || '',
      status: user.status,
    });
    setModalOpen(true);
  };

  const buildPayload = () => {
    const payload = { ...form };
    if (!payload.manager) delete payload.manager;
    if (!payload.department) delete payload.department;
    if (!payload.password) delete payload.password;
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = buildPayload();
      if (editing) {
        await userAPI.update(editing._id, payload);
        setMessage({ type: 'success', text: 'User updated.' });
      } else {
        const { data } = await userAPI.create(payload);
        const creds = data.data.credentials;
        const credText = creds ? ` Email: ${creds.email}, Password: ${payload.password}` : '';
        setMessage({
          type: 'success',
          text: `${data.message}${credText}`,
        });
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id, name) => {
    if (id === currentUser?._id) {
      setMessage({ type: 'error', text: 'You cannot delete your own account.' });
      return;
    }
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await userAPI.delete(id);
      setMessage({ type: 'success', text: 'User deleted.' });
      const remainingOnPage = users.length - 1;
      const nextPage = remainingOnPage === 0 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      load(nextPage, filters);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const columns = [
    {
      key: 'index',
      label: '#',
      render: (row, idx) => (
        <span className="text-muted-theme text-xs font-medium">
          {(pagination ? (pagination.page - 1) * pagination.limit : 0) + idx + 1}
        </span>
      ),
    },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (row) => <span className="capitalize">{row.role}</span> },
    { key: 'department', label: 'Department', render: (row) => row.department?.name || '-' },
    { key: 'phone', label: 'Phone', render: (row) => row.phone || '-' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'registered', label: 'Registered', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="action-icon-btn" title="Edit user">
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDelete(row._id, row.name); }}
            className="action-icon-btn action-icon-btn-danger"
            title="Delete user"
            disabled={row._id === currentUser?._id}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  if (initialLoad && loading) return <LoadingSpinner className="py-20" />;

  return (
    <div>
      <PageHeader
        title="User History"
        subtitle="Full history of all users — active, pending, and inactive — with edit and delete."
        action={
          <div className="flex gap-2">
            <button type="button" onClick={() => openCreate('manager')} className="btn-secondary">
              <Plus className="h-4 w-4" /> Add Manager
            </button>
            <button type="button" onClick={() => openCreate('employee')} className="btn-submit">
              <Plus className="h-4 w-4" /> Add Employee
            </button>
          </div>
        }
      />

      {message.text && <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />}

      <form onSubmit={applyFilters} className="toolbar mb-4">
        <ToolbarSearch
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          onClear={clearSearch}
          placeholder="Search by name or email"
        />
        <select className="toolbar-select" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
          <option value="">All roles</option>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <select className="toolbar-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
        <button type="submit" className="btn-submit"><Filter className="h-4 w-4" /> Apply</button>
        <button type="button" className="btn-secondary" onClick={clearFilters}>Show all</button>
      </form>

      <div className="mt-2">
        {loading ? <LoadingSpinner className="py-12" /> : (
          <>
            <DataTable columns={columns} data={users} emptyMessage="No users found" />
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : `Add ${form.role}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password {editing && '(blank to keep)'}</label>
              <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} {...(!editing && { required: true })} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Type department name" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required={form.role !== 'admin'} />
            </div>
            {form.role === 'employee' && (
              <div>
                <label className="label">Manager</label>
                <select className="input" value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })}>
                  <option value="">None</option>
                  {managers.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <SubmitButton>{editing ? 'Update' : 'Create'}</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
