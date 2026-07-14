import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Building2, Users, UserCog } from 'lucide-react';
import ToolbarSearch from '../../components/common/ToolbarSearch';
import { departmentAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { SubmitButton } from '../../components/common/ActionButton';
import { PAGE_SIZE } from '../../constants/pagination';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const load = (p = page, q = search) => {
    setLoading(true);
    departmentAPI.getAll({ page: p, limit: PAGE_SIZE, search: q })
      .then(({ data }) => {
        setDepartments(data.data.departments);
        setSummary(data.data.summary || null);
        setPagination(data.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  useEffect(() => {
    const onFocus = () => load(page, search);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [page, search]);

  const applyFilters = (e) => {
    e?.preventDefault();
    setPage(1);
    load(1, search);
  };

  const clearSearch = () => {
    setSearch('');
    setPage(1);
    load(1, '');
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (dept) => {
    setEditing(dept);
    setForm({ name: dept.name, description: dept.description || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await departmentAPI.update(editing._id, form);
        setMessage({ type: 'success', text: 'Department updated.' });
      } else {
        await departmentAPI.create(form);
        setMessage({ type: 'success', text: 'Department created.' });
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this department?')) return;
    try {
      await departmentAPI.delete(id);
      setMessage({ type: 'success', text: 'Department deleted.' });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Department',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="dept-table-icon">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-theme">{row.name}</p>
            {row.description && (
              <p className="text-xs text-muted-theme mt-0.5 line-clamp-1">{row.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'managers',
      label: 'Managers',
      render: (row) => (
        <span
          className="inline-flex items-center gap-1.5 text-sm text-secondary-theme"
          title={row.managers?.length ? row.managers.map((m) => m.name).join(', ') : 'No managers assigned'}
        >
          <UserCog className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium text-theme">{row.managerCount ?? 0}</span>
        </span>
      ),
    },
    {
      key: 'employees',
      label: 'Employees',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-secondary-theme" title={`${row.activeEmployeeCount || 0} active of ${row.employeeCount || 0} total`}>
          <Users className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium text-theme">{row.employeeCount ?? 0}</span>
          {row.activeEmployeeCount !== row.employeeCount && (
            <span className="text-xs text-muted-theme">({row.activeEmployeeCount} active)</span>
          )}
        </span>
      ),
    },
    {
      key: 'created',
      label: 'Created',
      render: (row) => (
        <span className="text-sm text-muted-theme">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="action-icon-btn">
            <Pencil className="h-4 w-4" />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(row._id); }} className="action-icon-btn action-icon-btn-danger">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Manage organization departments and team structure."
        action={
          <button type="button" onClick={openCreate} className="btn-submit">
            <Plus className="h-4 w-4" /> Add Department
          </button>
        }
      />

      {message.text && <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />}

      {!loading && summary && (
        <div className="dept-summary-bar mb-4">
          <span><Building2 className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />{summary.totalDepartments} departments</span>
          <span><Users className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />{summary.totalEmployees} employees ({summary.activeEmployees} active)</span>
          <span><UserCog className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />{summary.assignedManagers} managers assigned</span>
        </div>
      )}

      <form onSubmit={applyFilters} className="toolbar mb-4">
        <ToolbarSearch
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={clearSearch}
          placeholder="Search departments"
        />
        <button type="submit" className="btn-submit">
          <Search className="h-4 w-4" /> Search
        </button>
      </form>

      {loading ? <LoadingSpinner className="py-20" /> : (
        <>
          <DataTable columns={columns} data={departments} emptyMessage="No departments found" />
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Department Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
          </div>
          <SubmitButton>{editing ? 'Update Department' : 'Create Department'}</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
