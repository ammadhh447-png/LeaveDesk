import { Link } from 'react-router-dom';
import { Users, UserCheck, Clock, Building2, FileText, UserPlus, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { reportAPI } from '../../api';
import useDashboardData from '../../hooks/useDashboardData';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import DashboardStatCard from '../../components/dashboard/DashboardStatCard';
import { EmployeeAnnouncements, EmployeeHolidays } from '../../components/dashboard/EmployeeDashboardPanels';
import { TeamLeaveActivityPanel, PendingSignupsPanel } from '../../components/dashboard/RoleDashboardPanels';
import { fetchDashboardExtras } from '../../utils/dashboardExtras';

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data, loading, error, refresh } = useDashboardData(async () => {
    const [dashboardRes, extras] = await Promise.all([
      reportAPI.getAdminDashboard(),
      fetchDashboardExtras(),
    ]);

    return {
      ...dashboardRes.data.data,
      ...extras,
    };
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

  const { stats, recentLeaves, recentPending, announcements, upcomingHolidays } = data || {};

  return (
    <div className="emp-dashboard">
      <div className="emp-dashboard-header">
        <div>
          <h1 className="emp-dashboard-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="emp-dashboard-subtitle">
            {user?.designation || 'Administrator'}
            {' · '}Organization-wide leave management and account overview.
          </p>
        </div>
        <div className="emp-dashboard-actions">
          <button type="button" className="dashboard-refresh-btn" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link to="/pending-employees" className="btn-submit emp-apply-btn">
            <UserPlus className="h-4 w-4" />
            Pending Approvals
          </Link>
        </div>
      </div>

      <div className="emp-balance-grid-5">
        <DashboardStatCard
          label="Employees"
          value={stats?.totalEmployees || 0}
          suffix="active"
          hint="Registered employees"
          icon={Users}
          link="/employees"
          linkLabel="Manage users"
        />
        <DashboardStatCard
          label="Managers"
          value={stats?.totalManagers || 0}
          suffix="active"
          hint="Registered managers"
          icon={UserCheck}
        />
        <DashboardStatCard
          label="Pending Accounts"
          value={stats?.pendingEmployees || 0}
          suffix="accounts"
          hint="Awaiting approval"
          icon={Clock}
          link="/pending-employees"
        />
        <DashboardStatCard
          label="Pending Leaves"
          value={stats?.pendingLeaves || 0}
          suffix="requests"
          hint="Needs review"
          icon={FileText}
          link="/leave-requests"
        />
        <DashboardStatCard
          label="Departments"
          value={stats?.totalDepartments || 0}
          suffix="total"
          hint="Registered departments"
          icon={Building2}
          link="/departments"
          linkLabel="Manage departments"
        />
      </div>

      <div className="emp-dashboard-grid">
        <EmployeeAnnouncements announcements={announcements} />
        <EmployeeHolidays holidays={upcomingHolidays} />
      </div>

      <div className="emp-dashboard-grid">
        <TeamLeaveActivityPanel
          leaves={recentLeaves}
          title="Recent Leave Requests"
        />
        <PendingSignupsPanel users={recentPending} />
      </div>
    </div>
  );
}
