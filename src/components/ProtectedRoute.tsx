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
    profile
  ) {
    // Get effective role (prefer new 'role' field, fallback to 'user_role')
    const effectiveRole = profile.role || profile.user_role;
    
    // If profile exists but has no role, deny access (data issue)
    if (!effectiveRole) {
      console.error('❌ ProtectedRoute: Profile loaded but role/user_role is missing');
      console.error('Profile details:', profile);
      return <Navigate to="/login" replace />;
    }
    
    // Check if user's role is in the allowed list
    // Support both new and old role values
    const isAllowed = allowedRoles.some(allowedRole => {
      // Direct match
      if (allowedRole === effectiveRole) return true;
      
      // Map old to new for comparison
      if (allowedRole === 'real_estate_advertiser' && ['user', 'agent', 'merchant'].includes(effectiveRole)) return true;
      if (allowedRole === 'commercial_advertiser' && effectiveRole === 'merchant') return true;
      if (allowedRole === 'admin' && effectiveRole === 'admin') return true;
      
      // Map new to old for comparison (if allowedRoles uses new values)
      if (allowedRole === 'user' && effectiveRole === 'real_estate_advertiser') return true;
      if (allowedRole === 'agent' && effectiveRole === 'real_estate_advertiser') return true;
      if (allowedRole === 'merchant' && ['real_estate_advertiser', 'commercial_advertiser'].includes(effectiveRole)) return true;
      
      return false;
    });
    
    if (!isAllowed) {
      console.warn('⚠️ ProtectedRoute: User role not allowed for this route');
      console.warn('User role:', effectiveRole);
      console.warn('Allowed roles:', allowedRoles);
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
