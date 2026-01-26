// src/components/ProtectedRoute.tsx
import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, profile, loading, profileLoading } = useAuth();
  const location = useLocation();

  // Wait for both auth and profile to finish loading
  if (loading || profileLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  // Redirect to login if no user
  if (!user) {
    // Save the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check role only if allowedRoles is specified AND profile is loaded
  // If profile isn't loaded yet (shouldn't happen due to loading check above), 
  // but just in case, we allow access if user is authenticated
  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    profile
  ) {
    // If profile exists but has no user_role, deny access (data issue)
    if (!profile.user_role) {
      console.error('❌ ProtectedRoute: Profile loaded but user_role is missing');
      console.error('Profile details:', profile);
      return <Navigate to="/login" replace />;
    }
    
    // Check if user's role is in the allowed list
    if (!allowedRoles.includes(profile.user_role)) {
      console.warn('⚠️ ProtectedRoute: User role not allowed for this route');
      console.warn('User role:', profile.user_role);
      console.warn('Allowed roles:', allowedRoles);
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
