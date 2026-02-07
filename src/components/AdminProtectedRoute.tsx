import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AdminProtectedRouteProps {
  children: ReactNode;
}

/**
 * Protected route component for admin-only pages
 * Checks if user is in the admins table
 */
export default function AdminProtectedRoute({
  children,
}: AdminProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading, error } = useAdmin();
  const location = useLocation();

  // CRITICAL: Never block /reset-password or /auth/callback routes
  // These routes need to establish session FROM url tokens before auth check
  const publicAuthRoutes = ['/reset-password', '/auth/callback'];
  if (publicAuthRoutes.includes(location.pathname)) {
    console.error(
      `[AdminProtectedRoute] ERROR: ${location.pathname} should NEVER be wrapped in AdminProtectedRoute! ` +
      `This route must be public to allow session establishment from URL tokens.`
    );
    // Allow access anyway to prevent breaking the flow
    return <>{children}</>;
  }

  // Debug logging for admin access
  useEffect(() => {
    console.log('[AdminProtectedRoute] Auth state:', {
      path: location.pathname,
      userExists: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authLoading,
      adminLoading,
      isAdmin,
      error: error?.message,
    });
  }, [user, authLoading, adminLoading, isAdmin, error, location.pathname]);

  // Wait for auth and admin status to finish loading
  if (authLoading || adminLoading) {
    console.log('[AdminProtectedRoute] Loading auth or admin status...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if no user
  if (!user) {
    console.log('[AdminProtectedRoute] No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Show error fallback if there was an error checking admin status
  // Don't redirect - keep user on admin route so they can retry/refresh
  if (error) {
    console.log('[AdminProtectedRoute] Error checking admin status:', error.message);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="text-destructive">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Error Checking Admin Access
          </h2>
          <p className="text-muted-foreground">
            We couldn't verify your admin status due to a server error. Please try refreshing the page. If the problem persists, please contact support.
          </p>
          <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
            {error.message}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            aria-label="Refresh page to retry admin access check"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if not admin (and no error)
  if (!isAdmin) {
    console.log('[AdminProtectedRoute] User is not admin, redirecting to dashboard');
    toast.error("Access denied", {
      description: "You don't have permission to access the admin area.",
    });
    return <Navigate to="/dashboard" replace />;
  }

  // User is admin, allow access
  console.log('[AdminProtectedRoute] Admin access granted');
  return <>{children}</>;
}
