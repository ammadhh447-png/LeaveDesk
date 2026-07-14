import { useState, useEffect } from 'react';
import { leaveAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatLeaveType } from '../../utils/helpers';

export default function TeamCalendar() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaveAPI.getCalendar().then(({ data }) => setLeaves(data.data.leaves)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-20" />;

  return (
    <div>
      <PageHeader title="Team Calendar" subtitle="Upcoming approved leaves for your team." />

      <div className="space-y-3">
        {leaves.length ? leaves.map((leave) => (
          <div key={leave._id} className="section-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-theme">{leave.employee?.name}</p>
              <p className="text-sm text-muted-theme">{formatLeaveType(leave.leaveType)}</p>
            </div>
            <p className="text-sm font-medium text-secondary-theme">
              {formatDate(leave.startDate)} {leave.days > 1 && `- ${formatDate(leave.endDate)}`}
            </p>
          </div>
        )) : (
          <EmptyState title="No upcoming team leaves" />
        )}
      </div>
    </div>
  );
}
