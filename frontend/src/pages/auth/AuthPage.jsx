import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/common/Alert';
import PasswordInput from '../../components/common/PasswordInput';
import ThemeToggle from '../../components/layout/ThemeToggle';
import { SubmitButton } from '../../components/common/ActionButton';
import { APP_NAME } from '../../constants/brand';

export default function AuthPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, signup, signupManager } = useAuth();

  const isRegister = location.pathname.includes('register');
  const [roleTab, setRoleTab] = useState(searchParams.get('role') === 'manager' ? 'manager' : 'employee');
  const [form, setForm] = useState({
    name: '', email: '', password: '', department: '', phone: '',
  });
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const role = searchParams.get('role');
    if (role === 'manager' || role === 'employee') {
      setRoleTab(role);
    }
  }, [searchParams]);

  useEffect(() => {
    document.body.classList.add('auth-body-lock');
    return () => document.body.classList.remove('auth-body-lock');
  }, []);

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(''), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  const resetForm = () => {
    setForm({ name: '', email: '', password: '', department: '', phone: '' });
    setConfirmed(false);
    setError('');
    setSuccess('');
  };

  const switchRole = (role) => {
    setRoleTab(role);
    resetForm();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email: form.email.trim(), password: form.password, role: roleTab });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!confirmed) {
      setError('Please confirm your role before registering.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = { ...form, email: form.email.trim() };
      const action = roleTab === 'manager' ? signupManager : signup;
      const result = await action(payload);
      setSuccess(result.message || 'Your account approval is pending. You will be able to sign in once approved.');
      setForm({ name: '', email: '', password: '', department: '', phone: '' });
      setConfirmed(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-theme-toggle">
        <ThemeToggle />
      </div>
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">{APP_NAME}</h1>
          <p className="auth-subtitle">{isRegister ? 'Create account' : 'Sign in'}</p>
        </div>

        <div className="auth-tabs">
          <button type="button" onClick={() => switchRole('employee')} className={`auth-tab ${roleTab === 'employee' ? 'auth-tab-active' : ''}`}>
            Employee
          </button>
          <button type="button" onClick={() => switchRole('manager')} className={`auth-tab ${roleTab === 'manager' ? 'auth-tab-active' : ''}`}>
            Manager
          </button>
        </div>

        <div className="auth-card">
          {error && <div className="auth-alert"><Alert type="error" message={error} onClose={() => setError('')} compact /></div>}
          {success && <div className="auth-alert"><Alert type="success" message={success} compact /></div>}

          {isRegister ? (
            <form onSubmit={handleRegister} className="auth-form auth-form-register">
              <div className="auth-field">
                <label className="auth-label">Full Name</label>
                <input className="auth-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input type="email" className="auth-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="auth-field">
                <label className="auth-label">Password</label>
                <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
              </div>
              <div className="auth-field">
                <label className="auth-label">Phone</label>
                <input className="auth-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </div>
              <div className="auth-field auth-field-full">
                <label className="auth-label">Department</label>
                <input
                  className="auth-input"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  required={roleTab === 'employee'}
                  placeholder={roleTab === 'manager' ? 'Optional' : 'IT Department'}
                />
              </div>
              <label className="auth-confirm auth-field-full">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                <span>I confirm I am registering as {roleTab}</span>
              </label>
              <div className="auth-field-full">
                <SubmitButton loading={loading} className="w-full">Register</SubmitButton>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <input type="email" className="auth-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="auth-field">
                <label className="auth-label">Password</label>
                <PasswordInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
              <SubmitButton loading={loading} className="w-full">Sign In</SubmitButton>
            </form>
          )}

          <p className="auth-footer">
            {isRegister ? (
              <>Have an account? <Link to={`/login?role=${roleTab}`} className="auth-link">Sign in</Link></>
            ) : (
              <>New here? <Link to={`/register?role=${roleTab}`} className="auth-link">Register</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
