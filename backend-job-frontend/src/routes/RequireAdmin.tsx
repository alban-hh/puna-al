import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/useAuth';
import { FullPageLoader } from '@/components/feedback/FullPageLoader';
import { AccessDeniedPage } from '@/features/misc/ErrorScreens';

export function RequireAdmin() {
  const { status, isAdmin } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageLoader />;

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  if (!isAdmin) return <AccessDeniedPage />;

  return <Outlet />;
}
