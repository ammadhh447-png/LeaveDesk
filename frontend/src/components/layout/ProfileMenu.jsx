import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="profile-menu-wrap" ref={ref}>
      <button
        type="button"
        className="profile-menu-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
      >
        {user?.profilePicture ? (
          <img src={user.profilePicture} alt="" className="profile-menu-avatar" />
        ) : (
          <span className="profile-menu-avatar profile-menu-avatar-fallback">
            {initials || <User className="h-4 w-4" />}
          </span>
        )}
      </button>

      {open && (
        <div className="profile-menu-dropdown">
          <div className="profile-menu-header">
            <div className="profile-menu-header-avatar">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="profile-menu-avatar profile-menu-avatar-fallback h-10 w-10 text-sm">
                  {initials || <User className="h-4 w-4" />}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="profile-menu-name">{user?.name}</p>
              <p className="profile-menu-email">{user?.email}</p>
              <p className="profile-menu-role capitalize">{user?.role}</p>
            </div>
          </div>

          <div className="profile-menu-actions">
            <Link to="/profile" className="profile-menu-item" onClick={() => setOpen(false)}>
              <Settings className="h-4 w-4" />
              Profile Settings
            </Link>
            <button type="button" className="profile-menu-item profile-menu-item-danger" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
