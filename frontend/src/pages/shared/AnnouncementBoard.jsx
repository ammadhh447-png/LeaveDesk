import { useState, useEffect, useCallback } from 'react';
import { Megaphone } from 'lucide-react';
import ToolbarSearch from '../../components/common/ToolbarSearch';
import { notificationAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/helpers';
import { getPublisherLabel } from '../../utils/announcements';
import { PAGE_SIZE } from '../../constants/pagination';

const LIVE_REFRESH_MS = 30000;

export default function AnnouncementBoard() {
  const [announcements, setAnnouncements] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback((p = page, term = search) => {
    setLoading(true);
    const params = { page: p, limit: PAGE_SIZE };
    if (term.trim()) params.search = term.trim();

    notificationAPI.getAnnouncements(params)
      .then(({ data }) => {
        setAnnouncements(data.data.announcements);
        setPagination(data.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    load(page, search);
  }, [page]);

  useEffect(() => {
    const intervalId = setInterval(() => load(page, search), LIVE_REFRESH_MS);
    const onFocus = () => load(page, search);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, [load, page, search]);

  const applySearch = (e) => {
    e.preventDefault();
    setPage(1);
    load(1, search);
  };

  const clearSearch = () => {
    setSearch('');
    setPage(1);
    load(1, '');
  };

  return (
    <div>
      <PageHeader
        title="Company Announcements"
        subtitle="Official updates and notices from management and HR."
      />

      <form onSubmit={applySearch} className="announce-board-search mb-4">
        <ToolbarSearch
          wrapperClassName="announce-board-search-field"
          inputClassName="announce-board-search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={clearSearch}
          placeholder="Search announcements"
        />
        <button type="submit" className="btn-submit announce-board-search-btn">
          Search
        </button>
      </form>

      {loading ? (
        <LoadingSpinner className="py-20" />
      ) : announcements.length ? (
        <>
          <div className="announce-board-list">
            {announcements.map((item) => (
              <article key={item._id} className="announce-board-card">
                <div className="announce-board-card-header">
                  <span className="announce-board-icon">
                    <Megaphone className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="announce-board-title">{item.title}</h2>
                    <p className="announce-board-meta">
                      {getPublisherLabel(item.createdBy)} · {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>
                <p className="announce-board-message">{item.message}</p>
              </article>
            ))}
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      ) : (
        <EmptyState
          title="No announcements found"
          description={search ? 'Try a different search term.' : 'New company announcements will appear here.'}
        />
      )}
    </div>
  );
}
