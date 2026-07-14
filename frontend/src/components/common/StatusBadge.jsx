import { Clock, CheckCircle, XCircle, Info } from 'lucide-react';
import { capitalize } from '../../utils/helpers';

const statusConfig = {
  pending: { icon: Clock, className: 'badge-pending' },
  approved: { icon: CheckCircle, className: 'badge-approved' },
  rejected: { icon: XCircle, className: 'badge-rejected' },
  info_requested: { icon: Info, className: 'badge-info' },
  active: { icon: CheckCircle, className: 'badge-approved' },
  inactive: { icon: XCircle, className: 'badge-rejected' },
};

export default function StatusBadge({ status, className = '' }) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`${config.className}${className ? ` ${className}` : ''}`}>
      <Icon className="h-3 w-3 shrink-0" />
      <span className="status-badge-label">{capitalize(status)}</span>
    </span>
  );
}
