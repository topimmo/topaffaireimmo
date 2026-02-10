// src/components/ProtectedRoute.tsx
import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[]; // "user", "agent", "merchant", "admin"
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, session, loading: authLoading } = useAuth();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);

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

  useEffect(() => {
    async function checkUserRole() {
      if (authLoading) return;
      
      if (!user) {
        setRoleLoading(false);
        return;
      }

      try {
        // Check if user is admin via admins table
        const { data: adminData } = await supabase
          .from("admins")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (adminData) {
          setIsAdmin(true);
          setUserRole("admin");
          setRoleLoading(false);
          return;
        }

        // Get user profile role
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_role, advertiser_type")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          // Map DB role to app role
          // DB: 'real_estate_advertiser' | 'commercial_advertiser'
          // App: 'user' | 'agent' | 'merchant'
          
          if (profile.user_role === 'commercial_advertiser') {
            setUserRole('merchant');
          } else if (profile.user_role === 'real_estate_advertiser') {
            // Further map based on advertiser_type
            const advertiserType = profile.advertiser_type;
            if (advertiserType === 'broker') {
              setUserRole('agent');
            } else if (advertiserType === 'agency') {
              setUserRole('merchant');
            } else {
              // owner or null defaults to user
              setUserRole('user');
            }
          } else {
            setUserRole('user');
          }
        }
      } catch (error) {
        console.error("[ProtectedRoute] Error checking user role:", error);
      } finally {
        setRoleLoading(false);
      }
    }

    checkUserRole();
  }, [user, authLoading]);

  if (authLoading || roleLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Loading...
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
  const hasRequiredRole = allowedRoles.includes(userRole || '') || (isAdmin && allowedRoles.includes('admin'));

  if (!hasRequiredRole) {
    console.warn(
      `[ProtectedRoute] Access denied. User role: ${userRole}, Required: ${allowedRoles.join(", ")}`
    );
    // Redirect to appropriate dashboard based on user's role
    if (isAdmin) {
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
