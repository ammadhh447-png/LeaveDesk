import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { leaveAPI } from '../../api';
import DataTable, { StatusBadge, formatDate, formatLeaveType } from '../../components/common/DataTable';
import LeaveDetailModal from '../../components/common/LeaveDetailModal';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { PAGE_SIZE } from '../../constants/pagination';

export default function LeaveRequests() {
  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [reviewNote, setReviewNote] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadLeaves = (p = page) => {
    setLoading(true);
    leaveAPI.getPending({ page: p, limit: PAGE_SIZE })
      .then(({ data }) => {
        setLeaves(data.data.leaves);
        setPagination(data.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadLeaves(); }, [page]);

  const openDetail = async (leave) => {
    setSelected(leave);
    setReviewNote('');
    if (leave.employee?._id) {
      const { data } = await leaveAPI.getEmployeeHistory(leave.employee._id);
      setHistory(data.data.leaves);
    }
  };

  const handleReview = async (status) => {
    setActionLoading(true);
    try {
      await leaveAPI.review(selected._id, { status, reviewNote });
      setMessage({ type: 'success', text: `Leave request ${status}.` });
      setSelected(null);
      loadLeaves();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: 'employee', label: 'Employee', render: (row) => row.employee?.name },
    { key: 'leaveType', label: 'Type', render: (row) => formatLeaveType(row.leaveType) },
    { key: 'startDate', label: 'Dates', render: (row) => `${formatDate(row.startDate)} - ${formatDate(row.endDate)}` },
    { key: 'days', label: 'Days' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      label: 'Details',
      render: (row) => (
        <button
          type="button"
          className="btn-secondary text-xs py-1.5"
          onClick={(e) => { e.stopPropagation(); openDetail(row); }}
        >
          <Eye className="h-3.5 w-3.5" /> View
        </button>
      ),
    },
  ];

  if (loading && !leaves.length) return <LoadingSpinner className="py-20" />;

  return (
    <div>
      <PageHeader title="Leave Requests" subtitle="Review and action pending team leave requests." />

      {message.text && <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />}

      <div className="mt-6">
        <DataTable columns={columns} data={leaves} emptyMessage="No pending leave requests" />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <LeaveDetailModal
        leave={selected}
        history={history}
        reviewNote={reviewNote}
        onReviewNoteChange={setReviewNote}
        onClose={() => setSelected(null)}
        onReview={handleReview}
        actionLoading={actionLoading}
      />
    </div>
  );
}
