import { useAuth } from './context/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="app-shell min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <AppRoutes />;
}
