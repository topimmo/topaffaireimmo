// src/components/ProtectedRoute.tsx
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[]; // "user", "agent", "merchant", "admin"
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, session, loading: authLoading, profileReady } = useAuth();
  const { role: userRole, loading: roleLoading } = useUserRole();
  const location = useLocation();

  // CRITICAL: Never block /reset-password or /auth/callback routes
  const publicAuthRoutes = ['/reset-password', '/auth/callback'];
  if (publicAuthRoutes.includes(location.pathname)) {
    console.warn(
      `[ProtectedRoute] WARNING: ${location.pathname} should NOT be wrapped in ProtectedRoute.`
    );
    return <>{children}</>;
  }

  // Wait for both auth and profile to be ready
  if (authLoading || roleLoading || (user && !profileReady)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If no specific roles required, allow all authenticated users
  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Check if user has required role
  const hasRequiredRole = userRole && allowedRoles.includes(userRole);

  if (!hasRequiredRole) {
    console.warn(
      `[ProtectedRoute] Access denied. User role: ${userRole}, Required: ${allowedRoles.join(", ")}`
    );
    
    // Redirect to appropriate dashboard
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (userRole === 'merchant') {
      return <Navigate to="/merchant" replace />;
    } else if (userRole === 'agent') {
      return <Navigate to="/agent" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
