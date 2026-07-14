import { useState, useEffect } from 'react';
import { Eye, Filter, X } from 'lucide-react';
import ToolbarSearch from '../../components/common/ToolbarSearch';
import { leaveAPI } from '../../api';
import DataTable, { StatusBadge, formatDate, formatLeaveType } from '../../components/common/DataTable';
import LeaveDetailModal from '../../components/common/LeaveDetailModal';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';

import { PAGE_SIZE } from '../../constants/pagination';

const defaultFilters = { search: '', status: '', leaveType: '' };

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(defaultFilters);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = (p = page, f = filters) => {
    setLoading(true);
    leaveAPI.getMy({ page: p, limit: PAGE_SIZE, ...f })
      .then(({ data }) => {
        setLeaves(data.data.leaves);
        setPagination(data.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page]);

  const applyFilters = (e) => {
    e.preventDefault();
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

  const hasActiveFilters = filters.search || filters.status || filters.leaveType;

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
    {
      key: 'submitted',
      label: 'Submitted',
      render: (row) => <span className="text-secondary-theme">{formatDate(row.createdAt)}</span>,
    },
    { key: 'leaveType', label: 'Type', render: (row) => formatLeaveType(row.leaveType) },
    { key: 'dates', label: 'Dates', render: (row) => `${formatDate(row.startDate)} – ${formatDate(row.endDate)}` },
    { key: 'days', label: 'Days' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      label: 'Details',
      render: (row) => (
        <button
          type="button"
          className="btn-secondary text-xs py-1.5"
          onClick={(e) => { e.stopPropagation(); setSelected(row); }}
        >
          <Eye className="h-3.5 w-3.5" /> View
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="My Leaves"
        subtitle="Your submitted leave requests, newest first."
      />

      <form onSubmit={applyFilters} className="toolbar mb-4">
        <ToolbarSearch
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          onClear={clearSearch}
          placeholder="Search by reason or leave type"
        />
        <select
          className="toolbar-select"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="info_requested">Info Requested</option>
        </select>
        <select
          className="toolbar-select"
          value={filters.leaveType}
          onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
        >
          <option value="">All types</option>
          <option value="annual">Annual</option>
          <option value="sick">Sick</option>
          <option value="casual">Casual</option>
          <option value="work_from_home">Work From Home</option>
        </select>
        <button type="submit" className="btn-submit">
          <Filter className="h-4 w-4" /> Apply
        </button>
        {hasActiveFilters && (
          <button type="button" className="btn-secondary" onClick={clearFilters}>
            <X className="h-4 w-4" /> Clear
          </button>
        )}
      </form>

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : (
        <>
          <DataTable columns={columns} data={leaves} emptyMessage="No leave requests found" />
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}

      <LeaveDetailModal
        leave={selected}
        onClose={() => setSelected(null)}
        showActions={false}
      />
    </div>
  );
}
