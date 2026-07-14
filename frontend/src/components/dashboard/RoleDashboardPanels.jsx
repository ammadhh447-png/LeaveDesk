import { Link } from 'react-router-dom';
import { ClipboardList, UserPlus, UserCircle } from 'lucide-react';
import { StatusBadge, formatDate, formatLeaveType } from '../common/DataTable';
import { PanelTitle } from './EmployeeDashboardPanels';
import ActivityFeedList from '../activity/ActivityFeedList';

const PREVIEW_LIMIT = 3;
const PROFILE_PREVIEW_LIMIT = 4;

export function TeamLeaveActivityPanel({ leaves = [], viewAllHref = '/leave-requests', title = 'Recent Team Leave Activity' }) {
  const items = leaves.slice(0, PREVIEW_LIMIT);

  return (
    <div className="emp-panel">
      <div className="emp-panel-header">
        <PanelTitle icon={ClipboardList}>{title}</PanelTitle>
        {items.length > 0 && <Link to={viewAllHref} className="emp-panel-link">View all</Link>}
      </div>
      {items.length ? (
        <div className="emp-recent-table-wrap">
          <table className="emp-recent-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Applied On</th>
              </tr>
            </thead>
            <tbody>
              {items.map((leave) => (
                <tr key={leave._id}>
                  <td>{leave.employee?.name || '—'}</td>
                  <td>{formatLeaveType(leave.leaveType)}</td>
                  <td>{formatDate(leave.startDate)} – {formatDate(leave.endDate)}</td>
                  <td><StatusBadge status={leave.status} /></td>
                  <td>{formatDate(leave.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="emp-panel-empty">No recent leave activity.</p>
      )}
    </div>
  );
}

export function PendingSignupsPanel({ users = [], viewAllHref = '/pending-employees', title = 'Pending Account Signups' }) {
  const items = users.slice(0, PREVIEW_LIMIT);

  return (
    <div className="emp-panel">
      <div className="emp-panel-header">
        <PanelTitle icon={UserPlus}>{title}</PanelTitle>
        {items.length > 0 && <Link to={viewAllHref} className="emp-panel-link">View all</Link>}
      </div>
      {items.length ? (
        <div className="emp-recent-table-wrap">
          <table className="emp-recent-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {items.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td className="capitalize">{user.role}</td>
                  <td><StatusBadge status={user.status} /></td>
                  <td>{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="emp-panel-empty">No pending signups.</p>
      )}
    </div>
  );
}

export function TeamProfileActivityPanel({
  activities = [],
  viewAllHref = '/team-activity',
  title = 'Team Profile Activity',
  onViewDetails,
}) {
  const items = activities.slice(0, PROFILE_PREVIEW_LIMIT);

  return (
    <div className="emp-panel">
      <div className="emp-panel-header">
        <PanelTitle icon={UserCircle}>{title}</PanelTitle>
        {items.length > 0 && <Link to={viewAllHref} className="emp-panel-link">View all</Link>}
      </div>
      {items.length ? (
        <ActivityFeedList items={items} showEmployee onViewDetails={onViewDetails} />
      ) : (
        <p className="emp-panel-empty">No recent profile updates from your team.</p>
      )}
    </div>
  );
}
