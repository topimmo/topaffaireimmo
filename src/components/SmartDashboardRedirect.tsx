/**
 * Smart Dashboard Redirect
 * 
 * Redirects /dashboard to the appropriate dashboard based on user role:
 * - user → /dashboard (stays on this page)
 * - agent → /agent
 * - merchant → /merchant
 * - admin → /admin
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

export default function SmartDashboardRedirect() {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const location = useLocation();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Determine target path based on role
  let targetPath: string | null = null;
  
  if (role === 'admin') {
    targetPath = '/admin';
  } else if (role === 'merchant') {
    targetPath = '/merchant';
  } else if (role === 'agent') {
    targetPath = '/agent';
  }
  // user role stays on /dashboard (targetPath = null)

  // Prevent infinite redirect loop
  if (targetPath && location.pathname !== targetPath) {
    return <Navigate to={targetPath} replace />;
  }

  // If user role or already on correct path, don't redirect
  return null;
}
