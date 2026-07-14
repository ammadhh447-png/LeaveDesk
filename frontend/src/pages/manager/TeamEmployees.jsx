import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';
import ToolbarSearch from '../../components/common/ToolbarSearch';
import { userAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { PAGE_SIZE } from '../../constants/pagination';

export default function TeamEmployees() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (p = page, q = search) => {
    setLoading(true);
    userAPI.getTeam({ page: p, limit: PAGE_SIZE, search: q })
      .then(({ data }) => {
        setMembers(data.data.members);
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

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'department', label: 'Department', render: (row) => row.department?.name || '-' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'actions',
      label: 'History',
      render: (row) => (
        <button
          type="button"
          className="btn-secondary text-xs py-1.5"
          onClick={(e) => { e.stopPropagation(); navigate(`/leave-history?employeeId=${row._id}`); }}
        >
          <History className="h-3.5 w-3.5" /> View
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Team Employees" subtitle="Active employees assigned to you." />

      <form onSubmit={handleSearch} className="toolbar mb-4">
        <ToolbarSearch
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={clearSearch}
          placeholder="Search by name or email"
        />
        <button type="submit" className="btn-submit">Search</button>
        <button type="button" className="btn-secondary" onClick={() => navigate('/leave-history')}>
          <History className="h-4 w-4" /> Full History
        </button>
      </form>

      {loading ? <LoadingSpinner className="py-20" /> : (
        <>
          <DataTable columns={columns} data={members} emptyMessage="No active employees found" />
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
