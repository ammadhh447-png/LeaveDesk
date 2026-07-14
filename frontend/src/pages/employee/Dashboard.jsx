import { Link } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../api';
import useDashboardData from '../../hooks/useDashboardData';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import { EmployeeBalanceCard, EmployeePendingCard } from '../../components/dashboard/EmployeeBalanceCards';
import {
  EmployeeAnnouncements,
  EmployeeHolidays,
  EmployeeRecentLeaves,
  EmployeeRecentActivity,
} from '../../components/dashboard/EmployeeDashboardPanels';

export default function EmployeeDashboard() {
  const { user } = useAuth();

  const { data, loading, error, refresh } = useDashboardData(async () => {
    const { data: res } = await userAPI.getDashboard();
    return res.data;
  }, { pollInterval: 30000, refreshOnFocus: true });

  if (loading && !data) return <LoadingSpinner className="py-20" />;

  if (error && !data) {
    return (
      <div className="py-12 max-w-lg mx-auto">
        <Alert type="error" message={error} />
        <button type="button" className="dashboard-refresh-btn mt-4" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Retry
        </button>
      </div>
    );
  }

  const {
    stats,
    upcomingHolidays,
    announcements,
    recentLeaves,
    recentActivities,
  } = data || {};

  const balances = stats?.leaveBalances || {};
  const totals = stats?.policyTotals || {};

  return (
    <div className="emp-dashboard">
      <div className="emp-dashboard-header">
        <div>
          <h1 className="emp-dashboard-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="emp-dashboard-subtitle">
            {user?.designation || 'Employee'}
            {user?.department?.name ? ` · ${user.department.name}` : ''}
            {' · '}Here&apos;s what&apos;s happening with your leaves and activities.
          </p>
        </div>
        <div className="emp-dashboard-actions">
          <button type="button" className="dashboard-refresh-btn" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link to="/apply-leave" className="btn-submit emp-apply-btn">
            <Plus className="h-4 w-4" />
            Apply Leave
          </Link>
        </div>
      </div>

      <div className="emp-balance-grid">
        <EmployeeBalanceCard type="annual" remaining={balances.annual ?? 0} total={totals.annual} />
        <EmployeeBalanceCard type="sick" remaining={balances.sick ?? 0} total={totals.sick} />
        <EmployeeBalanceCard type="casual" remaining={balances.casual ?? 0} total={totals.casual} />
        <EmployeePendingCard count={stats?.pendingRequests || 0} />
      </div>

      <div className="emp-dashboard-grid">
        <EmployeeAnnouncements announcements={announcements} />
        <EmployeeHolidays holidays={upcomingHolidays} />
      </div>

      <div className="emp-dashboard-grid">
        <EmployeeRecentLeaves leaves={recentLeaves} />
        <EmployeeRecentActivity activities={recentActivities} />
      </div>
    </div>
  );
}
