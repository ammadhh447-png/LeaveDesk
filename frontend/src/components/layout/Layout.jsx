import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, FileText, Users, Settings,
  BarChart3, Building2, CalendarDays, Menu, ClipboardList, History, Briefcase, Bell, Megaphone, PenLine, Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import ProfileMenu from './ProfileMenu';
import { APP_NAME } from '../../constants/brand';

const navConfig = {
  employee: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/leave-balance', label: 'Leave Balance', icon: Calendar },
    { path: '/apply-leave', label: 'Apply Leave', icon: FileText },
    { path: '/my-leaves', label: 'My Leaves', icon: ClipboardList },
    { path: '/my-activity', label: 'My Activity', icon: Activity },
    { path: '/leave-history', label: 'Leave History', icon: History },
    { path: '/company-announcements', label: 'Announcements', icon: Megaphone },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ],
  manager: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/leave-requests', label: 'Leave Requests', icon: FileText },
    { path: '/team-employees', label: 'Team Employees', icon: Users },
    { path: '/leave-history', label: 'Leave History', icon: History },
    { path: '/pending-employees', label: 'Pending Approvals', icon: ClipboardList },
    { path: '/team-calendar', label: 'Team Calendar', icon: CalendarDays },
    { path: '/team-activity', label: 'Profile Activity', icon: Activity },
    { path: '/company-announcements', label: 'Company News', icon: Megaphone },
    { path: '/announcements', label: 'Manage Posts', icon: PenLine },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ],
  admin: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employees', label: 'User History', icon: Users },
    { path: '/pending-employees', label: 'Pending Approvals', icon: ClipboardList },
    { path: '/leave-history', label: 'Leave History', icon: History },
    { path: '/departments', label: 'Departments', icon: Building2 },
    { path: '/leave-policy', label: 'Leave Policy', icon: Settings },
    { path: '/holidays', label: 'Holidays', icon: CalendarDays },
    { path: '/team-activity', label: 'Profile Activity', icon: Activity },
    { path: '/company-announcements', label: 'Company News', icon: Megaphone },
    { path: '/announcements', label: 'Manage Posts', icon: PenLine },
    { path: '/leave-requests', label: 'Leave Requests', icon: FileText },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ],
};

export default function Layout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = navConfig[user?.role] || navConfig.employee;
  const currentPage = navItems.find((item) => item.path === location.pathname)
    || (location.pathname === '/profile' ? { label: 'Profile Settings' } : null);
  const isApplyLeave = location.pathname === '/apply-leave';
  const isProfile = location.pathname === '/profile';
  const isFixedHeight = isApplyLeave || isProfile;

  return (
    <div className={`app-shell flex ${isFixedHeight ? 'h-dvh max-h-dvh overflow-hidden' : 'min-h-screen'}`}>
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`app-sidebar fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="app-sidebar-brand">
            <div className="app-brand-icon">
              <Briefcase className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="app-sidebar-title">{APP_NAME}</h1>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`app-nav-link ${isActive ? 'app-nav-link-active' : ''}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="app-topbar">
          <button type="button" onClick={() => setSidebarOpen(true)} className="topbar-menu-btn">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="topbar-eyebrow">Workspace</p>
            <h2 className="topbar-title">
              {currentPage?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <ThemeToggle />
            <NotificationBell />
            <ProfileMenu />
          </div>
        </header>

        <main className={`app-main flex-1 min-h-0 ${isFixedHeight ? 'overflow-hidden' : 'overflow-auto'}`}>
          <div className={`app-content${isApplyLeave ? ' apply-content h-full' : ''}${isProfile ? ' profile-content h-full' : ''}`}>{children}</div>
        </main>
      </div>
    </div>
  );
}
