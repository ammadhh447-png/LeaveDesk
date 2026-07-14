import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import ToolbarSearch from '../../components/common/ToolbarSearch';
import { useAuth } from '../../context/AuthContext';
import { activityAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Alert from '../../components/common/Alert';
import ActivityFeedList from '../../components/activity/ActivityFeedList';
import ActivityDetailModal from '../../components/activity/ActivityDetailModal';
import { PAGE_SIZE } from '../../constants/pagination';

export default function TeamProfileActivity() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const load = (p = page, q = search) => {
    setLoading(true);
    const params = { page: p, limit: PAGE_SIZE };
    if (q.trim()) params.search = q.trim();

    activityAPI.getTeamProfile(params)
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

  useEffect(() => {
    setSelectedIds([]);
  }, [page, search]);

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

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => (
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    ));
  };

  const pageIds = activities.map((item) => item._id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  const handleSelectAllPage = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Delete ${selectedIds.length} selected activit${selectedIds.length > 1 ? 'ies' : 'y'}?`)) return;
    setDeleting(true);
    setMessage({ type: '', text: '' });
    try {
      await activityAPI.deleteMany(selectedIds);
      setMessage({ type: 'success', text: `${selectedIds.length} activit${selectedIds.length > 1 ? 'ies' : 'y'} deleted.` });
      setSelectedIds([]);
      const remaining = activities.length - selectedIds.length;
      const nextPage = remaining <= 0 && page > 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      else load(page, search);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Delete all profile activity records? This cannot be undone.')) return;
    setDeleting(true);
    setMessage({ type: '', text: '' });
    try {
      const { data } = await activityAPI.deleteAllProfile();
      const count = data.data?.deletedCount ?? 0;
      setMessage({ type: 'success', text: `${count} activit${count === 1 ? 'y' : 'ies'} deleted.` });
      setSelectedIds([]);
      setPage(1);
      load(1, search);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setDeleting(false);
    }
  };

  if (initialLoad && loading) return <LoadingSpinner className="py-20" />;

  const subtitle = isAdmin
    ? 'Profile and security updates from employees and managers across the organization.'
    : 'Profile and security updates from employees on your team.';

  return (
    <div className="activity-page">
      <PageHeader title="Profile Activity" subtitle={subtitle} />

      {message.text && (
        <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />
      )}

      <div className="section-card activity-page-filters">
        <form onSubmit={handleSearch} className="toolbar activity-page-toolbar">
          <ToolbarSearch
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={clearSearch}
            placeholder="Search by employee name or activity"
          />
          <button type="submit" className="btn-submit">Search</button>
          {isAdmin && activities.length > 0 && (
            <>
              <button type="button" className="btn-secondary" onClick={handleSelectAllPage}>
                {allPageSelected ? 'Deselect all' : 'Select all'}
              </button>
              {selectedIds.length > 0 && (
                <button type="button" className="btn-danger" onClick={handleDeleteSelected} disabled={deleting}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete ({selectedIds.length})
                </button>
              )}
              <button type="button" className="btn-secondary" onClick={handleDeleteAll} disabled={deleting}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete all
              </button>
            </>
          )}
        </form>
      </div>

      {loading ? (
        <div className="section-card activity-page-loading">
          <LoadingSpinner className="py-12" />
        </div>
      ) : activities.length ? (
        <div className="section-card activity-page-feed p-0 overflow-hidden">
          <ActivityFeedList
            items={activities}
            showEmployee
            onViewDetails={handleViewDetails}
            selectable={isAdmin}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
          />
        </div>
      ) : (
        <div className="section-card">
          <EmptyState title="No profile activity" description="Employee profile updates will appear here." />
        </div>
      )}

      <Pagination pagination={pagination} onPageChange={setPage} />

      <ActivityDetailModal activity={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
