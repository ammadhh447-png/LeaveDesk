import { Link } from 'react-router-dom';

export default function DashboardStatCard({ label, value, suffix, hint, icon: Icon, link, linkLabel = 'View all' }) {
  return (
    <div className="emp-balance-card">
      <div className="emp-balance-card-top">
        <div>
          <p className="emp-balance-card-label">{label}</p>
          <p className="emp-balance-card-value">
            {value}
            {suffix ? <> <span>{suffix}</span></> : null}
          </p>
          {hint ? <p className="emp-balance-card-total">{hint}</p> : null}
        </div>
        <div className="emp-balance-card-icon">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {link ? <Link to={link} className="emp-balance-card-link">{linkLabel}</Link> : null}
    </div>
  );
}
