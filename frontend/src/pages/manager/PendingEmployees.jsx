import { useState, useEffect } from 'react';
import ToolbarSearch from '../../components/common/ToolbarSearch';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ApproveButton, RejectButton } from '../../components/common/ActionButton';
import EmptyState from '../../components/common/EmptyState';
import { PAGE_SIZE } from '../../constants/pagination';

export default function PendingEmployees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const load = (p = page, q = search) => {
    setLoading(true);
    userAPI.getPending({ page: p, limit: PAGE_SIZE, search: q })
      .then(({ data }) => {
        setEmployees(data.data.employees);
        setPagination(data.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load(1, search);
  };

  const clearSearch = () => {
    setSearch('');
    setPage(1);
    load(1, '');
  };

  const handleApprove = async (id) => {
    try {
      await userAPI.approve(id);
      setMessage({ type: 'success', text: 'Account approved.' });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleReject = async (id) => {
    try {
      await userAPI.reject(id);
      setMessage({ type: 'success', text: 'Account rejected.' });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const title = user?.role === 'admin' ? 'Pending Approvals' : 'Pending Employees';

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={user?.role === 'admin' ? 'Review pending manager and employee signups.' : 'Approve employees assigned to your team.'}
      />

      {message.text && <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />}

      <form onSubmit={handleSearch} className="toolbar mb-4">
        <ToolbarSearch
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={clearSearch}
          placeholder="Search by name or email"
        />
        <button type="submit" className="btn-submit">Search</button>
      </form>

      {loading ? <LoadingSpinner className="py-20" /> : (
        <>
          <div className="space-y-3">
            {employees.length ? employees.map((emp) => (
              <div key={emp._id} className="section-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-theme">{emp.name}</p>
                    <span className="role-pill">{emp.role}</span>
                  </div>
                  <p className="text-sm text-muted-theme mt-1">{emp.department?.name || 'No department'} · {emp.email}</p>
                  {emp.phone && <p className="text-sm text-secondary-theme">{emp.phone}</p>}
                </div>
                <div className="flex gap-3">
                  <ApproveButton onClick={() => handleApprove(emp._id)} />
                  <RejectButton onClick={() => handleReject(emp._id)} />
                </div>
              </div>
            )) : (
              <div className="section-card"><EmptyState title="No pending accounts" /></div>
            )}
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
