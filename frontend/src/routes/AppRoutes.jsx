import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Layout from '../components/layout/Layout';
import AuthPage from '../pages/auth/AuthPage';

import RoleDashboard from '../pages/shared/RoleDashboard';
import Profile from '../pages/shared/Profile';
import Notifications from '../pages/shared/Notifications';
import LeaveHistory from '../pages/shared/LeaveHistory';
import Announcements from '../pages/shared/Announcements';
import AnnouncementBoard from '../pages/shared/AnnouncementBoard';
import TeamProfileActivity from '../pages/shared/TeamProfileActivity';

import LeaveBalance from '../pages/employee/LeaveBalance';
import ApplyLeave from '../pages/employee/ApplyLeave';
import MyLeaves from '../pages/employee/MyLeaves';
import MyActivity from '../pages/employee/MyActivity';

import LeaveRequests from '../pages/manager/LeaveRequests';
import PendingEmployees from '../pages/manager/PendingEmployees';
import TeamEmployees from '../pages/manager/TeamEmployees';
import TeamCalendar from '../pages/manager/TeamCalendar';

import Employees from '../pages/admin/Employees';
import Departments from '../pages/admin/Departments';
import LeavePolicy from '../pages/admin/LeavePolicy';
import Holidays from '../pages/admin/Holidays';
import Reports from '../pages/admin/Reports';

function AppLayout({ children }) {
  return <Layout>{children}</Layout>;
}

export default function AppRoutes() {
  const { authenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={authenticated ? <Navigate to="/dashboard" /> : <AuthPage />} />
      <Route path="/register" element={authenticated ? <Navigate to="/dashboard" /> : <AuthPage />} />
      <Route path="/signup" element={<Navigate to="/register" replace />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><RoleDashboard /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <AppLayout><Profile /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/leave-balance" element={
        <ProtectedRoute roles={['employee']}>
          <AppLayout><LeaveBalance /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/apply-leave" element={
        <ProtectedRoute roles={['employee']}>
          <AppLayout><ApplyLeave /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/my-leaves" element={
        <ProtectedRoute roles={['employee']}>
          <AppLayout><MyLeaves /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/my-activity" element={
        <ProtectedRoute roles={['employee']}>
          <AppLayout><MyActivity /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/team-activity" element={
        <ProtectedRoute roles={['manager', 'admin']}>
          <AppLayout><TeamProfileActivity /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/leave-requests" element={
        <ProtectedRoute roles={['manager', 'admin']}>
          <AppLayout><LeaveRequests /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/pending-employees" element={
        <ProtectedRoute roles={['manager', 'admin']}>
          <AppLayout><PendingEmployees /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/team-employees" element={
        <ProtectedRoute roles={['manager']}>
          <AppLayout><TeamEmployees /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/leave-history" element={
        <ProtectedRoute roles={['manager', 'admin', 'employee']}>
          <AppLayout><LeaveHistory /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/team-calendar" element={
        <ProtectedRoute roles={['manager', 'admin']}>
          <AppLayout><TeamCalendar /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/employees" element={
        <ProtectedRoute roles={['admin']}>
          <AppLayout><Employees /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/departments" element={
        <ProtectedRoute roles={['admin']}>
          <AppLayout><Departments /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/leave-policy" element={
        <ProtectedRoute roles={['admin']}>
          <AppLayout><LeavePolicy /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/holidays" element={
        <ProtectedRoute roles={['admin']}>
          <AppLayout><Holidays /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/reports" element={
        <ProtectedRoute roles={['admin']}>
          <AppLayout><Reports /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/notifications" element={
        <ProtectedRoute>
          <AppLayout><Notifications /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/company-announcements" element={
        <ProtectedRoute>
          <AppLayout><AnnouncementBoard /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/announcements" element={
        <ProtectedRoute roles={['manager', 'admin']}>
          <AppLayout><Announcements /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to={authenticated ? '/dashboard' : '/login'} />} />
    </Routes>
  );
}
