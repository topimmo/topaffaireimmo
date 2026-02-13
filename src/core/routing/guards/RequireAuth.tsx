/**
 * RequireAuth Guard
 * Ensures user is authenticated before accessing route
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
  children: ReactNode;
  redirectTo?: string;
}

export function RequireAuth({ children, redirectTo = '/login' }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    const currentPath = location.pathname + location.search;
    return <Navigate to={`${redirectTo}?next=${encodeURIComponent(currentPath)}`} replace />;
  }

  return <>{children}</>;
}
