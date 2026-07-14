import { Link } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, Users, FileText, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { leaveAPI, userAPI, activityAPI } from '../../api';
import useDashboardData from '../../hooks/useDashboardData';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Alert from '../../components/common/Alert';
import DashboardStatCard from '../../components/dashboard/DashboardStatCard';
import { EmployeeAnnouncements, EmployeeHolidays } from '../../components/dashboard/EmployeeDashboardPanels';
import { TeamLeaveActivityPanel, PendingSignupsPanel, TeamProfileActivityPanel } from '../../components/dashboard/RoleDashboardPanels';
import ActivityDetailModal from '../../components/activity/ActivityDetailModal';
import { fetchDashboardExtras } from '../../utils/dashboardExtras';

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [selectedActivity, setSelectedActivity] = useState(null);

  const { data, loading, error, refresh } = useDashboardData(async () => {
    const [dashboardRes, extras, pendingRes, profileActivityRes] = await Promise.all([
      leaveAPI.getManagerDashboard(),
      fetchDashboardExtras(),
      userAPI.getPending({ limit: 3 }),
      activityAPI.getTeamProfile({ limit: 4 }),
    ]);

    const pendingUsers = pendingRes.data?.data?.employees
      ?? pendingRes.data?.data
      ?? [];

    return {
      ...dashboardRes.data.data,
      ...extras,
      recentPending: pendingUsers,
      teamProfileActivities: profileActivityRes.data?.data?.activities || [],
    };
  }, { pollInterval: 30000, refreshOnFocus: true });

  const handleViewDetails = async (activity) => {
    try {
      const { data } = await activityAPI.getById(activity._id);
      setSelectedActivity(data.data.activity);
    } catch {
      setSelectedActivity(activity);
    }
  };

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

  const { stats, recentLeaves, announcements, upcomingHolidays, recentPending, teamProfileActivities } = data || {};

  return (
    <div className="emp-dashboard">
      <div className="emp-dashboard-header">
        <div>
          <h1 className="emp-dashboard-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="emp-dashboard-subtitle">
            {user?.designation || 'Manager'}
            {user?.department?.name ? ` · ${user.department.name}` : ''}
            {' · '}Here&apos;s your team leave activity and pending actions.
          </p>
        </div>
        <div className="emp-dashboard-actions">
          <button type="button" className="dashboard-refresh-btn" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link to="/leave-requests" className="btn-submit emp-apply-btn">
            <FileText className="h-4 w-4" />
            Review Leaves
          </Link>
        </div>
      </div>

      <div className="emp-balance-grid">
        <DashboardStatCard
          label="Pending Leaves"
          value={stats?.pendingLeaves || 0}
          suffix="requests"
          hint="Team requests awaiting review"
          icon={Clock}
          link="/leave-requests"
        />
        <DashboardStatCard
          label="Approved Today"
          value={stats?.approvedToday || 0}
          suffix="approved"
          hint="Decisions made today"
          icon={CheckCircle}
        />
        <DashboardStatCard
          label="Rejected Today"
          value={stats?.rejectedToday || 0}
          suffix="rejected"
          hint="Decisions made today"
          icon={XCircle}
        />
        <DashboardStatCard
          label="Pending Accounts"
          value={stats?.pendingEmployees || 0}
          suffix="accounts"
          hint="Awaiting your approval"
          icon={Users}
          link="/pending-employees"
        />
      </div>

      <div className="emp-dashboard-grid">
        <EmployeeAnnouncements announcements={announcements} />
        <EmployeeHolidays holidays={upcomingHolidays} />
      </div>

      <div className="emp-dashboard-grid">
        <TeamLeaveActivityPanel leaves={recentLeaves} />
        <PendingSignupsPanel
          users={recentPending}
          title="Pending Team Approvals"
        />
      </div>

      <TeamProfileActivityPanel
        activities={teamProfileActivities}
        onViewDetails={handleViewDetails}
      />

      <ActivityDetailModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} />
    </div>
  );
}
