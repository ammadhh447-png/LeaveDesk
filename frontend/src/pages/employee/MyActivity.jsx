import { useState, useEffect } from 'react';
import { Activity, FileText, UserCircle, Shield } from 'lucide-react';
import ToolbarSearch from '../../components/common/ToolbarSearch';
import { activityAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ActivityFeedList from '../../components/activity/ActivityFeedList';
import ActivityDetailModal from '../../components/activity/ActivityDetailModal';
import { ACTIVITY_PAGE_SIZE } from '../../constants/pagination';

const defaultFilters = { search: '' };

const summaryCards = [
  { key: 'total', label: 'Total recorded', icon: Activity },
  { key: 'leave', label: 'Leave actions', icon: FileText },
  { key: 'profile', label: 'Profile updates', icon: UserCircle },
  { key: 'security', label: 'Security events', icon: Shield },
];

function buildSummary(items, total) {
  const counts = { total: total ?? 0, leave: 0, profile: 0, security: 0, account: 0 };
  items.forEach((item) => {
    if (counts[item.category] !== undefined) counts[item.category] += 1;
  });
  return counts;
}

export default function MyActivity() {
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const load = (p = page, q = search) => {
    setLoading(true);
    const params = { page: p, limit: ACTIVITY_PAGE_SIZE };
    if (q.trim()) params.search = q.trim();

    activityAPI.getMy(params)
      .then(({ data }) => {
        setActivities(data.data.activities || []);
        setPagination(data.data.pagination);
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setInitialLoad(false);
      });
  };

  useEffect(() => {
    load();
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load(1, search);
  };

  const clearSearch = () => {
    setSearch('');
    setPage(1);
    load(1, '');
  };

  const handleViewDetails = async (activity) => {
    try {
      const { data } = await activityAPI.getById(activity._id);
      setSelected(data.data.activity);
    } catch {
      setSelected(activity);
    }
  };

  if (initialLoad && loading) return <LoadingSpinner className="py-20" />;

  const summary = buildSummary(activities, pagination?.total);
  const hasSearch = Boolean(search.trim());

  return (
    <div className="activity-page">
      <PageHeader
        title="My Activity"
        subtitle="A complete timeline of your leave requests, profile updates, and account changes."
      />

      <div className="activity-page-summary">
        {summaryCards.map(({ key, label, icon: Icon }) => (
          <div key={key} className="activity-summary-card">
            <div className="activity-summary-icon">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="activity-summary-value">
                {key === 'total' ? summary.total : summary[key]}
              </p>
              <p className="activity-summary-label">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="section-card activity-page-filters">
        <form onSubmit={handleSearch}>
          <ToolbarSearch
            wrapperClassName="activity-page-search"
            inputClassName="activity-page-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={clearSearch}
            placeholder="Search activity"
          />
        </form>
      </div>

      {loading ? (
        <div className="section-card activity-page-loading">
          <LoadingSpinner className="py-12" />
        </div>
      ) : activities.length ? (
        <div className="section-card activity-page-feed">
          <div className="activity-page-feed-header">
            <h2 className="activity-page-feed-title">History</h2>
            <Pagination
              pagination={pagination}
              onPageChange={setPage}
              className="activity-page-pagination"
              showStatus
              statusVariant="range"
            />
          </div>
          <ActivityFeedList
            items={activities}
            variant="timeline"
            onViewDetails={handleViewDetails}
          />
        </div>
      ) : (
        <div className="section-card">
          <EmptyState
            title="No activity found"
            description={hasSearch
              ? 'Try a different search term.'
              : 'Your leave requests and account changes will appear here.'}
          />
        </div>
      )}

      <ActivityDetailModal activity={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
