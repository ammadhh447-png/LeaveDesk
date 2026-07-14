import { useState } from 'react';
import { Paperclip, CalendarDays } from 'lucide-react';
import { leaveAPI } from '../../api';
import Alert from '../../components/common/Alert';
import { SubmitButton } from '../../components/common/ActionButton';
import { calculateDays } from '../../utils/helpers';

export default function ApplyLeave() {
  const [form, setForm] = useState({
    leaveType: 'annual', startDate: '', endDate: '', reason: '',
  });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const days = form.startDate && form.endDate ? calculateDays(form.startDate, form.endDate) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => formData.append(key, val));
      if (file) formData.append('attachment', file);

      await leaveAPI.apply(formData);
      setMessage({ type: 'success', text: 'Leave request submitted successfully.' });
      setForm({ leaveType: 'annual', startDate: '', endDate: '', reason: '' });
      setFile(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="apply-page">
      <div className="apply-container">
        {message.text && (
          <div className="apply-alert">
            <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} compact />
          </div>
        )}

        <div className="apply-card">
          <div className="apply-card-head">
            <div className="apply-header-icon">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="apply-title">Apply for Leave</h1>
              <p className="apply-subtitle">Submit a new request for manager review</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="apply-form">
            <div className="apply-field">
              <label className="label" htmlFor="leaveType">Leave Type</label>
              <select
                id="leaveType"
                className="input"
                value={form.leaveType}
                onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                required
              >
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="work_from_home">Work From Home</option>
              </select>
            </div>

            <div className="apply-date-grid">
              <div className="apply-field">
                <label className="label" htmlFor="startDate">Start Date</label>
                <input
                  id="startDate"
                  type="date"
                  className="input"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="apply-field">
                <label className="label" htmlFor="endDate">End Date</label>
                <input
                  id="endDate"
                  type="date"
                  className="input"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                  min={form.startDate}
                />
              </div>
            </div>

            {days > 0 && (
              <div className="apply-summary">
                <span className="apply-summary-value">{days} day{days > 1 ? 's' : ''}</span>
                <span className="apply-summary-label">total duration</span>
              </div>
            )}

            <div className="apply-field">
              <label className="label" htmlFor="reason">Reason</label>
              <textarea
                id="reason"
                className="input apply-textarea"
                rows={2}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                required
                placeholder="Briefly explain why you need this leave"
              />
            </div>

            <div className="apply-field">
              <label className="label">Attachment (optional)</label>
              <div className="apply-file-row">
                <Paperclip className="h-4 w-4 icon-muted shrink-0" />
                <span className="apply-file-name">{file ? file.name : 'No file selected'}</span>
                <label htmlFor="attachment" className="apply-file-btn">Browse</label>
                <input
                  id="attachment"
                  type="file"
                  className="sr-only"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
              </div>
            </div>

            <div className="apply-actions">
              <SubmitButton loading={loading} className="apply-submit-btn">
                Submit Leave Request
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
