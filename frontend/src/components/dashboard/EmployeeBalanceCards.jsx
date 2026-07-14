import { Link } from 'react-router-dom';
import { CalendarDays, HeartPulse, Coffee, Clock } from 'lucide-react';

const cardConfig = {
  annual: { label: 'Annual Leave', icon: CalendarDays },
  sick: { label: 'Sick Leave', icon: HeartPulse },
  casual: { label: 'Casual Leave', icon: Coffee },
};

export function EmployeeBalanceCard({ type, remaining, total }) {
  const config = cardConfig[type];
  if (!config) return null;

  const Icon = config.icon;
  const safeTotal = total || remaining || 1;
  const percent = Math.min(100, Math.round((remaining / safeTotal) * 100));

  return (
    <div className="emp-balance-card">
      <div className="emp-balance-card-top">
        <div>
          <p className="emp-balance-card-label">{config.label}</p>
          <p className="emp-balance-card-value">{remaining} <span>days left</span></p>
        </div>
        <div className="emp-balance-card-icon">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="emp-balance-progress">
        <div className="emp-balance-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="emp-balance-card-total">Total: {safeTotal} days</p>
    </div>
  );
}

export function EmployeePendingCard({ count }) {
  return (
    <div className="emp-balance-card">
      <div className="emp-balance-card-top">
        <div>
          <p className="emp-balance-card-label">Pending Requests</p>
          <p className="emp-balance-card-value">{count} <span>requests</span></p>
        </div>
        <div className="emp-balance-card-icon">
          <Clock className="h-5 w-5" />
        </div>
      </div>
      <Link to="/my-leaves" className="emp-balance-card-link">View all</Link>
    </div>
  );
}
