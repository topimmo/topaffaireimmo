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
  const { isAdmin, loading: adminLoading } = useAdmin();
  const location = useLocation();

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
    });
  }, [user, authLoading, adminLoading, isAdmin, location.pathname]);

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

  // Redirect to dashboard if not admin
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
