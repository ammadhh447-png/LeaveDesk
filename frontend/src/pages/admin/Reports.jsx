import { useState, useEffect, useMemo } from 'react';
import {
  Download,
  FileText,
  CheckCircle,
  Clock,
  CalendarDays,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Building2,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { reportAPI } from '../../api';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DashboardStatCard from '../../components/dashboard/DashboardStatCard';
import { PanelTitle } from '../../components/dashboard/EmployeeDashboardPanels';
import { formatLeaveType } from '../../utils/helpers';

const CHART_HEIGHT = 190;

const CHART_COLORS = {
  approved: '#22c55e',
  pending: '#f59e0b',
  rejected: '#ef4444',
  infoRequested: '#6366f1',
  neutral: '#6b7280',
};

const LEAVE_TYPE_COLORS = {
  annual: '#16a34a',
  sick: '#dc2626',
  casual: '#7c3aed',
  work_from_home: '#2563eb',
};

const STATUS_COLORS = {
  approved: CHART_COLORS.approved,
  pending: CHART_COLORS.pending,
  rejected: CHART_COLORS.rejected,
  info_requested: CHART_COLORS.infoRequested,
};

const STATUS_LABELS = {
  approved: 'Approved',
  pending: 'Pending',
  rejected: 'Rejected',
  info_requested: 'Info Requested',
};

const AXIS_TICK = { fontSize: 11, fill: 'var(--tp-text-muted)' };
const LEGEND_STYLE = { fontSize: '12px', color: 'var(--tp-text-secondary)' };
const TOOLTIP_STYLE = {
  backgroundColor: 'var(--tp-bg-surface)',
  border: '1px solid var(--tp-border)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--tp-text)',
};

const truncateLabel = (value, max = 12) => {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

const getReportPeriodText = (year, isCurrentYear) => {
  if (!isCurrentYear) return `Calendar year ${year}`;
  const today = new Date();
  const endDate = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `1 January – ${endDate} ${year}`;
};

export default function Reports() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [analytics, setAnalytics] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const yearOptions = useMemo(
    () => [currentYear, currentYear - 1, currentYear - 2],
    [currentYear],
  );

  const load = (targetYear = year) => {
    setLoading(true);
    reportAPI.getAnalytics({ year: targetYear })
      .then(({ data }) => setAnalytics(data.data))
      .catch((err) => setMessage({ type: 'error', text: err.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(year);
  }, [year]);

  const handleExport = async () => {
    setExporting(true);
    setMessage({ type: '', text: '' });
    try {
      const { data } = await reportAPI.export({ type: 'annual', format: 'csv', year });
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leave-report-${year}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setExporting(false);
    }
  };

  if (loading && !analytics) return <LoadingSpinner className="py-20" />;

  const summary = analytics?.summary || {};
  const isYearToDate = analytics?.isYearToDate;
  const periodText = getReportPeriodText(year, isYearToDate);
  const periodHint = isYearToDate ? `Since 1 January ${year}` : `Calendar year ${year}`;

  const statusData = (analytics?.statusStats || [])
    .filter((s) => s.count > 0)
    .map((s) => ({
      name: STATUS_LABELS[s.status] || s.status,
      value: s.count,
      color: STATUS_COLORS[s.status] || CHART_COLORS.neutral,
    }));

  const leaveTypeData = (analytics?.leaveTypeStats || []).map((s) => ({
    name: formatLeaveType(s.type),
    type: s.type,
    requests: s.count,
    days: s.days,
    color: LEAVE_TYPE_COLORS[s.type] || CHART_COLORS.neutral,
  }));

  const departmentData = [...(analytics?.departmentStats || [])]
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 8)
    .map((s) => ({
      name: truncateLabel(s.name, 12),
      fullName: s.name,
      requests: s.requests,
      approved: s.approved,
    }));

  const monthlyTrend = analytics?.monthlyTrend || [];
  const hasTrendData = monthlyTrend.some((d) => d.approved || d.pending || d.rejected || d.infoRequested);

  return (
    <div className="emp-dashboard reports-page">
      <div className="emp-dashboard-header">
        <div>
          <h1 className="emp-dashboard-title">Reports</h1>
          <p className="emp-dashboard-subtitle">
            {periodText} — {summary.totalEmployees || 0} employees, {summary.totalDepartments || 0} departments.
          </p>
        </div>
        <div className="emp-dashboard-actions flex-wrap">
          <select
            className="toolbar-select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            aria-label="Report year"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button type="button" className="dashboard-refresh-btn" onClick={() => load(year)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={handleExport} className="btn-secondary text-sm" disabled={exporting}>
            <Download className="h-4 w-4" /> {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      {message.text && (
        <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />
      )}

      <div className="reports-stat-grid">
        <DashboardStatCard
          label="Total Requests"
          value={summary.totalLeaves || 0}
          hint={periodHint}
          icon={FileText}
        />
        <DashboardStatCard
          label="Approved"
          value={summary.approvedLeaves || 0}
          hint={`${summary.approvalRate || 0}% approval rate`}
          icon={CheckCircle}
        />
        <DashboardStatCard
          label="Pending"
          value={summary.pendingLeaves || 0}
          hint={summary.rejectedLeaves ? `${summary.rejectedLeaves} rejected` : 'Awaiting review'}
          icon={Clock}
        />
        <DashboardStatCard
          label="Days Taken"
          value={summary.totalDaysTaken || 0}
          suffix="days"
          hint={summary.onLeaveToday ? `${summary.onLeaveToday} on leave today` : 'Approved leave days'}
          icon={CalendarDays}
        />
      </div>

      <div className="emp-dashboard-grid reports-charts-grid">
        <div className="emp-panel reports-panel">
          <div className="emp-panel-header">
            <PanelTitle icon={TrendingUp}>Monthly Trend</PanelTitle>
            <span className="emp-panel-badge">{year}</span>
          </div>
          {hasTrendData ? (
            <div className="emp-chart-wrap reports-chart">
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--tp-border)" />
                  <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} width={32} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: 'var(--tp-text)' }} itemStyle={{ color: 'var(--tp-text-secondary)' }} />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                  <Line type="monotone" dataKey="approved" name="Approved" stroke={CHART_COLORS.approved} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="pending" name="Pending" stroke={CHART_COLORS.pending} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="rejected" name="Rejected" stroke={CHART_COLORS.rejected} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="emp-panel-empty">No leave requests for {periodText}.</p>
          )}
        </div>

        <div className="emp-panel reports-panel">
          <div className="emp-panel-header">
            <PanelTitle icon={PieChartIcon}>Status Breakdown</PanelTitle>
          </div>
          {statusData.length ? (
            <div className="emp-chart-wrap reports-chart">
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: 'var(--tp-text)' }} itemStyle={{ color: 'var(--tp-text-secondary)' }} />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="emp-panel-empty">No status data for {periodText}.</p>
          )}
        </div>
      </div>

      <div className="emp-dashboard-grid reports-charts-grid">
        <div className="emp-panel reports-panel">
          <div className="emp-panel-header">
            <PanelTitle icon={BarChart3}>Leave Types</PanelTitle>
          </div>
          {leaveTypeData.length ? (
            <div className="emp-chart-wrap reports-chart">
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <BarChart data={leaveTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--tp-border)" />
                  <XAxis dataKey="name" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} width={32} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: 'var(--tp-text)' }} itemStyle={{ color: 'var(--tp-text-secondary)' }} />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                  <Bar dataKey="requests" name="Requests" radius={[4, 4, 0, 0]}>
                    {leaveTypeData.map((entry) => (
                      <Cell key={`requests-${entry.type}`} fill={entry.color} />
                    ))}
                  </Bar>
                  <Bar dataKey="days" name="Days" radius={[4, 4, 0, 0]}>
                    {leaveTypeData.map((entry) => (
                      <Cell key={`days-${entry.type}`} fill={entry.color} fillOpacity={0.55} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="emp-panel-empty">No leave type data for {periodText}.</p>
          )}
        </div>

        <div className="emp-panel reports-panel">
          <div className="emp-panel-header">
            <PanelTitle icon={Building2}>Top Departments</PanelTitle>
            <span className="emp-panel-badge">Top 8</span>
          </div>
          {departmentData.length ? (
            <div className="emp-chart-wrap reports-chart">
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <BarChart data={departmentData} layout="vertical" margin={{ left: 4, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--tp-border)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={72}
                    tick={{ fontSize: 10, fill: 'var(--tp-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelStyle={{ color: 'var(--tp-text)' }}
                    itemStyle={{ color: 'var(--tp-text-secondary)' }}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || _}
                  />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                  <Bar dataKey="requests" name="Requests" fill={CHART_COLORS.neutral} radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar dataKey="approved" name="Approved" fill={CHART_COLORS.approved} radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="emp-panel-empty">No department data for {periodText}.</p>
          )}
        </div>
      </div>
    </div>
  );
}
