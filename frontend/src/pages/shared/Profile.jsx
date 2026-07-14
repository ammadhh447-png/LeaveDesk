import { useState, useEffect, useRef, useMemo } from 'react';
import { User, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../api';
import Alert from '../../components/common/Alert';
import PasswordInput from '../../components/common/PasswordInput';
import { SubmitButton } from '../../components/common/ActionButton';

const roleLabels = {
  admin: 'Administrator',
  manager: 'Manager',
  employee: 'Employee',
};

export default function Profile() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: '', phone: '', address: '', emergencyContact: '',
  });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        emergencyContact: user.emergencyContact || '',
      });
    }
  }, [user]);

  const avatarUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return user?.profilePicture || '';
  }, [file, user?.profilePicture]);

  useEffect(() => () => {
    if (file && avatarUrl.startsWith('blob:')) URL.revokeObjectURL(avatarUrl);
  }, [file, avatarUrl]);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => formData.append(key, val));
      if (file) formData.append('profilePicture', file);

      const { data } = await userAPI.updateProfile(formData);
      updateUser(data.data.user);
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      {message.text && (
        <div className="profile-alert">
          <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} compact />
        </div>
      )}

      <section className="profile-summary">
        <div className="profile-summary-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="profile-summary-avatar-img" />
          ) : (
            <span className="profile-summary-avatar-fallback">
              {initials || <User className="h-5 w-5" />}
            </span>
          )}
        </div>
        <div className="profile-summary-copy">
          <p className="profile-summary-name">{user?.name}</p>
          <p className="profile-summary-line">
            {roleLabels[user?.role] || user?.role}
            {user?.department?.name ? ` · ${user.department.name}` : ''}
          </p>
          <p className="profile-summary-email">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{user?.email}</span>
          </p>
        </div>
      </section>

      <div className="profile-layout">
        <section className="profile-panel">
          <p className="profile-panel-title">Edit Profile</p>
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="profile-form-grid">
              <div className="profile-field">
                <label className="profile-label" htmlFor="profile-name">Full Name</label>
                <input id="profile-name" className="profile-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="profile-field">
                <label className="profile-label" htmlFor="profile-phone">Phone</label>
                <input id="profile-phone" className="profile-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Optional" />
              </div>
              <div className="profile-field profile-field-wide">
                <label className="profile-label" htmlFor="profile-address">Address</label>
                <input id="profile-address" className="profile-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Optional" />
              </div>
              <div className="profile-field profile-field-wide">
                <label className="profile-label" htmlFor="profile-emergency">Emergency Contact</label>
                <input id="profile-emergency" className="profile-input" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} placeholder="Optional" />
              </div>
              <div className="profile-field profile-field-wide">
                <label className="profile-label" htmlFor="profile-picture">Profile Picture</label>
                <div className="profile-file-row">
                  <span className="profile-file-name">{file?.name || 'No file selected'}</span>
                  <label htmlFor="profile-picture" className="profile-file-btn">Browse</label>
                  <input
                    id="profile-picture"
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="sr-only"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
                <p className="profile-field-hint">JPG, PNG or GIF · Max 5 MB</p>
              </div>
            </div>
            <SubmitButton loading={loading} className="profile-submit-btn">Save Changes</SubmitButton>
          </form>
        </section>

        <section className="profile-panel">
          <p className="profile-panel-title">Change Password</p>
          <PasswordForm />
        </section>
      </div>
    </div>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await userAPI.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="profile-form">
      {message.text && (
        <Alert type={message.type} message={message.text} onClose={() => setMessage({ type: '', text: '' })} compact />
      )}
      <div className="profile-form-grid profile-password-grid">
        <div className="profile-field profile-field-wide">
          <label className="profile-label" htmlFor="current-password">Current Password</label>
          <PasswordInput id="current-password" className="profile-input" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required />
        </div>
        <div className="profile-field">
          <label className="profile-label" htmlFor="new-password">New Password</label>
          <PasswordInput id="new-password" className="profile-input" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required minLength={6} />
        </div>
        <div className="profile-field">
          <label className="profile-label" htmlFor="confirm-password">Confirm Password</label>
          <PasswordInput id="confirm-password" className="profile-input" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required minLength={6} />
        </div>
      </div>
      <SubmitButton loading={loading} className="profile-submit-btn">Update Password</SubmitButton>
    </form>
  );
}
