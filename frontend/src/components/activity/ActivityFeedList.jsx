import { ChevronRight } from 'lucide-react';
import { getActivityIcon, formatActivityTime, getCategoryLabel, getActivityDotColor } from '../../utils/activity';

function ActivityListItem({
  item,
  showEmployee,
  onViewDetails,
  selectable = false,
  selected = false,
  onToggleSelect,
}) {
  const Icon = getActivityIcon(item.action);
  const employeeName = item.user?.name;
  const hasDetails = onViewDetails && item.changes?.length > 0;

  return (
    <div className={`activity-feed-item${selected ? ' activity-feed-item-selected' : ''}`}>
      {selectable && (
        <label className="activity-feed-check" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect?.(item._id)}
            aria-label={`Select ${item.title}`}
          />
        </label>
      )}
      <div className="activity-feed-icon">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="activity-feed-body">
        <span className={`activity-category-badge activity-category-${item.category}`}>
          {getCategoryLabel(item.category)}
        </span>
        <p className="activity-feed-title">{item.title}</p>
        {showEmployee && employeeName && (
          <p className="activity-feed-employee">{employeeName}</p>
        )}
        <p className="activity-feed-message">{item.message}</p>
      </div>
      <div className="activity-feed-side">
        <time className="activity-feed-time">{formatActivityTime(item.createdAt)}</time>
        {hasDetails ? (
          <button type="button" className="activity-feed-link" onClick={() => onViewDetails(item)}>
            View details
            <ChevronRight className="h-3 w-3" />
          </button>
        ) : (
          <span className="activity-feed-side-spacer" aria-hidden="true" />
        )}
      </div>
    </div>
  );
}

function ActivityTimelineItem({ item, isLast, onViewDetails, showEmployee }) {
  const hasDetails = onViewDetails && item.changes?.length > 0;
  const employeeName = item.user?.name;

  return (
    <article className="activity-timeline-item">
      <div className="activity-timeline-track">
        <span
          className="activity-timeline-dot"
          style={{ backgroundColor: getActivityDotColor(item.action, item.metadata) }}
        />
        {!isLast && <span className="activity-timeline-line" aria-hidden="true" />}
      </div>
      <div className={`activity-timeline-card${hasDetails ? ' activity-timeline-card-clickable' : ''}`}>
        <div className="activity-timeline-head">
          <div className="activity-timeline-main">
            <span className={`activity-category-badge activity-category-${item.category}`}>
              {getCategoryLabel(item.category)}
            </span>
            <h3 className="activity-timeline-title">{item.title}</h3>
            {showEmployee && employeeName && (
              <p className="activity-feed-employee">{employeeName}</p>
            )}
            <p className="activity-timeline-message">{item.message}</p>
          </div>
          <div className="activity-timeline-side">
            <time className="activity-timeline-time">{formatActivityTime(item.createdAt)}</time>
            {hasDetails ? (
              <button type="button" className="activity-timeline-details" onClick={() => onViewDetails(item)}>
                View details
                <ChevronRight className="h-3 w-3" />
              </button>
            ) : (
              <span className="activity-feed-side-spacer" aria-hidden="true" />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ActivityFeedList({
  items = [],
  onViewDetails,
  showEmployee = false,
  variant = 'list',
  selectable = false,
  selectedIds = [],
  onToggleSelect,
}) {
  if (!items.length) return null;

  const selectedSet = new Set(selectedIds);

  if (variant === 'timeline') {
    return (
      <div className="activity-timeline">
        {items.map((item, index) => (
          <ActivityTimelineItem
            key={item._id}
            item={item}
            isLast={index === items.length - 1}
            onViewDetails={onViewDetails}
            showEmployee={showEmployee}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="activity-feed-list">
      {items.map((item) => (
        <ActivityListItem
          key={item._id}
          item={item}
          showEmployee={showEmployee}
          onViewDetails={onViewDetails}
          selectable={selectable}
          selected={selectedSet.has(item._id)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}
