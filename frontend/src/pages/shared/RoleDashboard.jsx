import { useAuth } from '../../context/AuthContext';
import EmployeeDashboard from '../employee/Dashboard';
import ManagerDashboard from '../manager/Dashboard';
import AdminDashboard from '../admin/Dashboard';

export default function RoleDashboard() {
  const { user } = useAuth();

  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'manager') return <ManagerDashboard />;
  return <EmployeeDashboard />;
}
