import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { FullPageLoader } from '@/components/feedback/FullPageLoader';

export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageLoader />;

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}
