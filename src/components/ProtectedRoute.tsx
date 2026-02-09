// src/components/ProtectedRoute.tsx
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AUTH_HYDRATION_TIMEOUT_MS } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[]; // Deprecated - kept for compatibility but not enforced
}

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const { user, session, loading } = useAuth();
  const location = useLocation();
  const [hydrationTimedOut, setHydrationTimedOut] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        setHydrationTimedOut(true);
        console.warn('[ProtectedRoute] Auth loading exceeded 4s timeout', {
          path: location.pathname,
        });
      }
    }, AUTH_HYDRATION_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [loading, location.pathname]);

  // CRITICAL: Never block /reset-password or /auth/callback routes
  // These routes need to establish session FROM url tokens before auth check
  const publicAuthRoutes = ['/reset-password', '/auth/callback'];
  if (publicAuthRoutes.includes(location.pathname)) {
    console.warn(
      `[ProtectedRoute] WARNING: ${location.pathname} should NOT be wrapped in ProtectedRoute. ` +
      `This route must be public to allow session establishment from URL tokens.`
    );
    // Allow access anyway to prevent breaking the flow
    return <>{children}</>;
  }

  if (loading && hydrationTimedOut) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  if (!user || !session) {
    return <Navigate to="/login" replace />;
  }

  // No role checking - all authenticated users allowed
  return <>{children}</>;
}
