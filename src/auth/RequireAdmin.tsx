import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RequireAdminProps {
  children: ReactNode;
}

/**
 * Route guard component for admin-only pages
 * 
 * Behavior:
 * - If loading: show a simple loader
 * - If not logged in: redirect to /login with return path
 * - If logged in but not admin: redirect to / with error message
 * - If admin: render children
 */
export function RequireAdmin({ children }: RequireAdminProps) {
  const { loading, isAdmin } = useAdmin();
  const location = useLocation();
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [hasShownToast, setHasShownToast] = useState(false);

  // Check if user has a session when admin check completes
  useEffect(() => {
    if (!loading && !isAdmin) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setHasSession(!!session);
      });
    }
  }, [loading, isAdmin]);

  // Show toast notification when access is denied (only once)
  useEffect(() => {
    if (!loading && !isAdmin && hasSession && !hasShownToast) {
      toast.error('Access denied', {
        description: "You don't have permission to access the admin area.",
      });
      setHasShownToast(true);
    }
  }, [loading, isAdmin, hasSession, hasShownToast]);

  // Show loader while checking admin status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If not admin, determine whether to redirect to login or home
  if (!isAdmin) {
    // Still checking session
    if (hasSession === null) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      );
    }

    // Not logged in - redirect to login
    if (!hasSession) {
      return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    // Logged in but not admin - redirect to home
    return <Navigate to="/" replace />;
  }

  // User is admin, render children
  return <>{children}</>;
}
