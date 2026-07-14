import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { policyAPI } from '../../api';
import Modal from '../../components/common/Modal';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatLeaveType } from '../../utils/helpers';

export default function LeavePolicy() {
  const [policies, setPolicies] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ days: 0, description: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const load = () => {
    policyAPI.getAll().then(({ data }) => setPolicies(data.data.policies)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await policyAPI.update(editing._id, form);
      setMessage({ type: 'success', text: 'Policy updated. All employees have been notified.' });
      setEditing(null);
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  if (loading) return <LoadingSpinner className="py-20" />;

  return (
    <div className="space-y-6">
      <h1 className="page-title">Leave Policy</h1>
      <p className="page-subtitle">Configure leave allowances for each leave type</p>

      {message.text && <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {policies.map((p) => (
          <div key={p._id} className="card flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-theme">{formatLeaveType(p.leaveType)}</h3>
              <p className="text-3xl font-bold text-primary-600 mt-1">{p.days} <span className="text-sm font-normal text-muted-theme">days</span></p>
              {p.description && <p className="text-sm text-muted-theme mt-1">{p.description}</p>}
            </div>
            <button onClick={() => { setEditing(p); setForm({ days: p.days, description: p.description || '' }); }} className="btn-secondary">
              <Pencil className="h-4 w-4" /> Edit
            </button>
          </div>
        ))}
      </div>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={`Edit ${editing ? formatLeaveType(editing.leaveType) : ''} Policy`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Days Allowed</label><input type="number" className="input" value={form.days} onChange={(e) => setForm({ ...form, days: parseInt(e.target.value) })} required min={0} /></div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <button type="submit" className="btn-primary">Save Policy</button>
        </form>
      </Modal>
    </div>
  );
}
