import { User, CalendarDays, ArrowRight } from 'lucide-react';
import Modal from '../common/Modal';
import {
  formatActivityTime,
  getCategoryLabel,
  getActivityIcon,
  getActivityDotColor,
} from '../../utils/activity';

export default function ActivityDetailModal({ activity, onClose }) {
  if (!activity) return null;

  const Icon = getActivityIcon(activity.action);
  const employeeName = activity.user?.name || 'You';
  const departmentName = activity.user?.department?.name;
  const accentColor = getActivityDotColor(activity.action, activity.metadata);
  const hasChanges = activity.changes?.length > 0;

  return (
    <Modal isOpen={!!activity} onClose={onClose} title="Activity Details" size="lg">
      <div className="activity-detail-modal">
        <div className="activity-detail-hero">
          <div className="activity-detail-hero-icon" style={{ color: accentColor }}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="activity-detail-hero-body">
            <p className="activity-detail-hero-label">Activity</p>
            <p className="activity-detail-hero-title">{activity.title}</p>
            <p className="activity-detail-hero-sub">{activity.message}</p>
          </div>
          <span className={`activity-category-badge activity-category-${activity.category}`}>
            {getCategoryLabel(activity.category)}
          </span>
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <User className="h-4 w-4 icon-muted shrink-0" />
            <div className="min-w-0">
              <p className="detail-item-label">Employee</p>
              <p className="detail-item-value">{employeeName}</p>
              {departmentName && (
                <p className="activity-detail-dept">{departmentName}</p>
              )}
            </div>
          </div>
          <div className="detail-item">
            <CalendarDays className="h-4 w-4 icon-muted shrink-0" />
            <div className="min-w-0">
              <p className="detail-item-label">Date &amp; time</p>
              <p className="detail-item-value">{formatActivityTime(activity.createdAt)}</p>
            </div>
          </div>
        </div>

        {hasChanges ? (
          <div className="activity-detail-section">
            <p className="detail-section-title">Changes made</p>
            <div className="activity-change-list">
              {activity.changes.map((change) => (
                <div key={change.field} className="activity-change-card">
                  <p className="activity-change-field">{change.label}</p>
                  <div className="activity-change-values">
                    <div className="activity-change-box activity-change-from">
                      <span className="activity-change-box-label">Previous</span>
                      <span className="activity-change-box-value">{change.from || '—'}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 activity-change-arrow shrink-0" aria-hidden="true" />
                    <div className="activity-change-box activity-change-to">
                      <span className="activity-change-box-label">Updated</span>
                      <span className="activity-change-box-value">{change.to || '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="activity-detail-message">
            <p className="detail-section-title">Summary</p>
            <p className="activity-detail-message-text">{activity.message}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
