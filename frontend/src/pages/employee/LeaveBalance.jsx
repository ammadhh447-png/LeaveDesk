import { useState, useEffect } from 'react';
import { CalendarDays, HeartPulse, Coffee, Home } from 'lucide-react';
import { userAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatLeaveType } from '../../utils/helpers';

const leaveIcons = {
  annual: CalendarDays,
  sick: HeartPulse,
  casual: Coffee,
  work_from_home: Home,
};

export default function LeaveBalance() {
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.getLeaveBalance().then(({ data }) => setBalances(data.data.leaveBalances)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="py-20" />;

  return (
    <div>
      <PageHeader title="Leave Balance" subtitle="Remaining leave days by type." />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(balances || {}).map(([type, days]) => {
          const Icon = leaveIcons[type] || CalendarDays;
          return (
            <div key={type} className="balance-card">
              <div className="balance-card-icon">
                <Icon className="h-5 w-5" />
              </div>
              <p className="balance-card-label">{formatLeaveType(type)}</p>
              <p className="balance-card-value">{days}</p>
              <p className="balance-card-sub">days remaining</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
