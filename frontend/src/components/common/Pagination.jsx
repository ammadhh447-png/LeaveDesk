import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  pagination,
  onPageChange,
  className = '',
  showStatus = true,
  statusVariant = 'page',
}) {
  if (!pagination || pagination.total === 0) return null;

  const { page, totalPages, hasPrev, hasNext, total, limit = 10 } = pagination;
  const rangeStart = (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  const withEllipsis = [];
  pages.forEach((p, idx) => {
    if (idx > 0 && p - pages[idx - 1] > 1) withEllipsis.push('...');
    withEllipsis.push(p);
  });

  const statusText = statusVariant === 'range'
    ? `${rangeStart}-${rangeEnd} of ${total}`
    : `Showing ${page} of ${totalPages}`;

  return (
    <div className={`pagination-bar${className ? ` ${className}` : ''}`}>
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button type="button" className="pagination-btn" disabled={!hasPrev} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>
          <div className="pagination-pages">
            {withEllipsis.map((p, idx) => (
              typeof p === 'number' ? (
                <button
                  key={p}
                  type="button"
                  className={`pagination-page ${p === page ? 'pagination-page-active' : ''}`}
                  onClick={() => onPageChange(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              ) : (
                <span key={`e-${idx}`} className="pagination-ellipsis">...</span>
              )
            ))}
          </div>
          <button type="button" className="pagination-btn" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {showStatus && (
        <div className="pagination-info">
          <span className="pagination-status">{statusText}</span>
        </div>
      )}
    </div>
  );
}
