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
    if (!loading) {
      setHydrationTimedOut(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      setHydrationTimedOut(true);
      console.warn('[ProtectedRoute] Auth loading exceeded 4s timeout', {
        path: location.pathname,
      });
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

  // Wait for auth to finish loading
  if (loading && hydrationTimedOut) {
    const nextParam = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${nextParam}`} replace />;
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Loading...
        {hydrationTimedOut && (
          <div style={{ marginTop: '1rem', color: '#9f1239' }}>
            Still loading... Redirecting you to login.
          </div>
        )}
      </div>
    );
  }

  // Redirect to login if no user
  if (!user || !session) {
    // Save the current location to redirect back after login
    const nextParam = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${nextParam}`} replace />;
  }

  // No role checking - all authenticated users allowed
  return <>{children}</>;
}
