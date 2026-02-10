/**
 * Role-Protected Route Component
 * 
 * Enforces role-based access control for routes
 * Redirects to appropriate dashboard if user doesn't have required role
 */

import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentUserRole, getDashboardPath, type AppRole } from "@/lib/auth/role";

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: AppRole[];
}

export default function RoleProtectedRoute({
  children,
  allowedRoles,
}: RoleProtectedRouteProps) {
  const { user, session, loading: authLoading } = useAuth();
  const location = useLocation();
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      if (authLoading) return;
      
      if (!user || !session) {
        setLoading(false);
        return;
      }

      const role = await getCurrentUserRole();
      setUserRole(role);
      setLoading(false);
    }

    checkRole();
  }, [user, session, authLoading]);

  // Show loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user || !session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // No role found - redirect to user dashboard as fallback
  if (!userRole) {
    console.warn("[RoleProtectedRoute] Could not determine user role, redirecting to user dashboard");
    return <Navigate to="/dashboard/user" replace />;
  }

  // Check if user has required role
  if (!allowedRoles.includes(userRole)) {
    console.warn(
      `[RoleProtectedRoute] Access denied. User role: ${userRole}, Required: ${allowedRoles.join(", ")}`
    );
    // Redirect to user's appropriate dashboard
    return <Navigate to={getDashboardPath(userRole)} replace />;
  }

  // User has required role - allow access
  return <>{children}</>;
}
