import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Spinner } from '../components/Spinner';
import { useAuth } from './AuthProvider';
import { loginPath } from './redirect';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  const location = useLocation();

  if (state.status === 'checking') return <Spinner />;
  if (state.status === 'anonymous') {
    return <Navigate to={loginPath(location.pathname + location.search)} replace />;
  }
  return children;
}
