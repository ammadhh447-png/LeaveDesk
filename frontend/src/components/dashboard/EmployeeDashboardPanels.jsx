import { Link } from 'react-router-dom';
import {
  Megaphone,
  CalendarDays,
  Activity,
  ClipboardList,
  HeartPulse,
  Coffee,
  Briefcase,
} from 'lucide-react';
import { StatusBadge, formatDate, formatLeaveType } from '../common/DataTable';
import { formatActivityTime, getActivityDotColor } from '../../utils/activity';

const DASHBOARD_PREVIEW_LIMIT = 3;
const HOLIDAY_PREVIEW_LIMIT = 3;
const ACTIVITY_PREVIEW_LIMIT = 4;

const leaveTypeConfig = {
  annual: { icon: CalendarDays, className: 'emp-leave-type-annual' },
  sick: { icon: HeartPulse, className: 'emp-leave-type-sick' },
  casual: { icon: Coffee, className: 'emp-leave-type-casual' },
  work_from_home: { icon: Briefcase, className: 'emp-leave-type-wfh' },
};

function PanelTitle({ icon: Icon, children }) {
  return (
    <h2 className="emp-panel-title">
      <span className="emp-panel-icon">
        <Icon className="h-4 w-4" />
      </span>
      {children}
    </h2>
  );
}

export function EmployeeRecentLeaves({ leaves = [], viewAllHref = '/leave-history' }) {
  const items = leaves.slice(0, DASHBOARD_PREVIEW_LIMIT);

  return (
    <div className="emp-panel emp-panel-tall">
      <div className="emp-panel-header">
        <PanelTitle icon={ClipboardList}>Recent Leaves</PanelTitle>
        {items.length > 0 && <Link to={viewAllHref} className="emp-panel-link">View all</Link>}
      </div>
      {items.length ? (
        <div className="emp-recent-table-wrap">
          <table className="emp-recent-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Applied On</th>
              </tr>
            </thead>
            <tbody>
              {items.map((leave) => {
                const typeConfig = leaveTypeConfig[leave.leaveType] || leaveTypeConfig.annual;
                const TypeIcon = typeConfig.icon;
                return (
                  <tr key={leave._id}>
                    <td>
                      <span className="emp-recent-type">
                        <span className={`emp-leave-type-icon ${typeConfig.className}`}>
                          <TypeIcon className="h-3.5 w-3.5" />
                        </span>
                        {formatLeaveType(leave.leaveType)}
                      </span>
                    </td>
                    <td>{formatDate(leave.startDate)} – {formatDate(leave.endDate)}</td>
                    <td><StatusBadge status={leave.status} /></td>
                    <td>{formatDate(leave.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="emp-panel-empty">No leave requests yet.</p>
      )}
    </div>
  );
}

export function EmployeeRecentActivity({ activities = [], viewAllHref = '/my-activity' }) {
  const items = activities.slice(0, ACTIVITY_PREVIEW_LIMIT);

  return (
    <div className="emp-panel emp-panel-tall">
      <div className="emp-panel-header">
        <PanelTitle icon={Activity}>Recent Activity</PanelTitle>
        {items.length > 0 && <Link to={viewAllHref} className="emp-panel-link">View all</Link>}
      </div>
      {items.length ? (
        <div className="emp-activity-timeline">
          {items.map((item, index) => (
            <div key={item._id} className="emp-activity-timeline-item">
              <div className="emp-activity-timeline-track">
                <span
                  className="emp-activity-timeline-dot"
                  style={{ backgroundColor: getActivityDotColor(item.action, item.metadata) }}
                />
                {index < items.length - 1 && <span className="emp-activity-timeline-line" aria-hidden="true" />}
              </div>
              <div className="emp-activity-timeline-body">
                <div className="emp-activity-timeline-head">
                  <p className="emp-activity-timeline-title">{item.title}</p>
                  <time className="emp-activity-timeline-time">{formatActivityTime(item.createdAt)}</time>
                </div>
                <p className="emp-activity-timeline-msg">{item.message}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="emp-panel-empty">No recent activity yet.</p>
      )}
    </div>
  );
}

export { PanelTitle };

export function EmployeeAnnouncements({ announcements = [] }) {
  const items = announcements.slice(0, DASHBOARD_PREVIEW_LIMIT);

  return (
    <div className="emp-panel emp-panel-tall">
      <div className="emp-panel-header">
        <PanelTitle icon={Megaphone}>Announcements</PanelTitle>
        <Link to="/company-announcements" className="emp-panel-link">View all</Link>
      </div>
      {items.length ? (
        <div className="emp-announce-list">
          {items.map((item) => (
            <div key={item._id} className="emp-announce-item">
              <div className="emp-announce-main">
                <div>
                  <p className="emp-announce-title">{item.title}</p>
                  <p className="emp-announce-msg">{item.message}</p>
                </div>
              </div>
              <time className="emp-announce-date">
                {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </time>
            </div>
          ))}
        </div>
      ) : (
        <p className="emp-panel-empty">No announcements at this time.</p>
      )}
    </div>
  );
}

export function EmployeeHolidays({ holidays = [] }) {
  const items = holidays.slice(0, HOLIDAY_PREVIEW_LIMIT);

  return (
    <div className="emp-panel emp-panel-tall">
      <div className="emp-panel-header">
        <PanelTitle icon={CalendarDays}>Upcoming Public Holidays</PanelTitle>
      </div>
      {items.length ? (
        <div className="emp-holiday-list">
          {items.map((holiday) => {
            const date = new Date(holiday.date);
            return (
              <div key={holiday._id} className="emp-holiday-item">
                <div className="emp-holiday-datebox">
                  <span className="emp-holiday-day">{date.getDate()}</span>
                  <span className="emp-holiday-month">{date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}</span>
                </div>
                <div className="emp-holiday-body">
                  <p className="emp-holiday-name">{holiday.name}</p>
                  <p className="emp-holiday-weekday">{date.toLocaleDateString('en-GB', { weekday: 'long' })}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="emp-panel-empty">No upcoming holidays scheduled.</p>
      )}
    </div>
  );
}
