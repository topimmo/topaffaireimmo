/**
 * Smart Dashboard Redirect
 * 
 * Redirects /dashboard to the appropriate location based on user role:
 * - user (default role) → /select-role (choose immobilier or services)
 * - agent → /agent (or stay on /dashboard)
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
  
  if (role === 'user') {
    // Default role - user needs to select their path
    targetPath = '/select-role';
  } else if (role === 'admin') {
    targetPath = '/admin';
  } else if (role === 'merchant') {
    targetPath = '/merchant';
  } else if (role === 'agent') {
    targetPath = '/agent';
  }

  // Prevent infinite redirect loop
  if (targetPath && location.pathname !== targetPath) {
    return <Navigate to={targetPath} replace />;
  }

  // If already on correct path, don't redirect
  return null;
}
