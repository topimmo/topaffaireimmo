/**
 * Smart Dashboard Redirect
 * 
 * Redirects users to the appropriate dashboard based on their role:
 * - Admin → /admin
 * - Advertiser → /dashboard/advertiser
 * - Artisan → /dashboard/artisan
 * - User → /dashboard/user
 * - Not logged in → /login
 */

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentUserRole, getDashboardPath } from "@/lib/auth/role";

export default function DashboardRedirect() {
  const { user, loading: authLoading } = useAuth();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function determineRedirect() {
      // Wait for auth to load
      if (authLoading) return;

      // Not logged in - redirect to login
      if (!user) {
        setRedirectPath("/login");
        setLoading(false);
        return;
      }

      // Get user role and determine dashboard
      const role = await getCurrentUserRole();
      if (role) {
        setRedirectPath(getDashboardPath(role));
      } else {
        // Fallback to user dashboard if role can't be determined
        setRedirectPath("/dashboard/user");
      }
      
      setLoading(false);
    }

    determineRedirect();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  // Fallback
  return <Navigate to="/dashboard/user" replace />;
}
