import Modal from './Modal';
import { StatusBadge, formatDate, formatLeaveType } from './DataTable';
import { ApproveButton, RejectButton } from './ActionButton';
import { User, Building2, Calendar, FileText, Paperclip } from 'lucide-react';

export default function LeaveDetailModal({
  leave,
  history = [],
  reviewNote,
  onReviewNoteChange,
  onClose,
  onReview,
  actionLoading,
  showActions = true,
}) {
  if (!leave) return null;

  return (
    <Modal isOpen={!!leave} onClose={onClose} title="Leave Request" size="lg">
      <div className="detail-modal">
        <div className="detail-hero">
          <div>
            <p className="detail-hero-label">Employee</p>
            <p className="detail-hero-title">{leave.employee?.name}</p>
            <p className="detail-hero-sub">{leave.employee?.department?.name || 'No department'}</p>
          </div>
          <StatusBadge status={leave.status} />
        </div>

        <div className="detail-grid">
          <div className="detail-item">
            <User className="h-4 w-4 icon-muted" />
            <div>
              <p className="detail-item-label">Leave Type</p>
              <p className="detail-item-value">{formatLeaveType(leave.leaveType)}</p>
            </div>
          </div>
          <div className="detail-item">
            <Calendar className="h-4 w-4 icon-muted" />
            <div>
              <p className="detail-item-label">Duration</p>
              <p className="detail-item-value">{leave.days} day{leave.days > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="detail-item detail-item-full">
            <Building2 className="h-4 w-4 icon-muted" />
            <div>
              <p className="detail-item-label">Dates</p>
              <p className="detail-item-value">{formatDate(leave.startDate)} — {formatDate(leave.endDate)}</p>
            </div>
          </div>
          <div className="detail-item detail-item-full">
            <FileText className="h-4 w-4 icon-muted" />
            <div>
              <p className="detail-item-label">Reason</p>
              <p className="detail-item-value">{leave.reason}</p>
            </div>
          </div>
          {leave.attachment && (
            <div className="detail-item detail-item-full">
              <Paperclip className="h-4 w-4 icon-muted" />
              <div>
                <p className="detail-item-label">Attachment</p>
                <a href={leave.attachment} target="_blank" rel="noreferrer" className="detail-link">View document</a>
              </div>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="detail-section">
            <p className="detail-section-title">Previous Leave History</p>
            <div className="detail-history-list">
              {history.slice(0, 5).map((h) => (
                <div key={h._id} className="detail-history-row">
                  <span>{formatLeaveType(h.leaveType)} · {formatDate(h.startDate)}</span>
                  <StatusBadge status={h.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {showActions ? (
          <>
            <div className="detail-section">
              <label className="label">Review Note</label>
              <textarea className="input" rows={2} value={reviewNote} onChange={(e) => onReviewNoteChange(e.target.value)} placeholder="Optional note for employee" />
            </div>
            <div className="detail-actions">
              <ApproveButton onClick={() => onReview('approved')} loading={actionLoading} />
              <RejectButton onClick={() => onReview('rejected')} loading={actionLoading} />
              <button onClick={() => onReview('info_requested')} className="btn-reject" disabled={actionLoading}>
                Ask For More Info
              </button>
            </div>
          </>
        ) : leave.reviewNote && (
          <div className="detail-section">
            <p className="detail-section-title">Manager Review</p>
            <p className="note-box">{leave.reviewNote}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
