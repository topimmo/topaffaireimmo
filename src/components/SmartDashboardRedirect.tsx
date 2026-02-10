/**
 * Smart Dashboard Redirect
 * 
 * Redirects /dashboard to the appropriate dashboard based on user role:
 * - user → /dashboard (stays on this page)
 * - agent → /agent
 * - merchant → /merchant
 * - admin → /admin
 */

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function SmartDashboardRedirect() {
  const { user, loading: authLoading } = useAuth();
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function determineRedirect() {
      if (authLoading) return;

      if (!user) {
        setRedirectPath("/login");
        setLoading(false);
        return;
      }

      try {
        // Check if admin
        const { data: adminData } = await supabase
          .from("admins")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (adminData) {
          setRedirectPath("/admin");
          setLoading(false);
          return;
        }

        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_role, advertiser_type")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          // Map to app role and redirect
          if (profile.user_role === 'commercial_advertiser') {
            setRedirectPath('/merchant');
          } else if (profile.user_role === 'real_estate_advertiser') {
            const advertiserType = profile.advertiser_type;
            if (advertiserType === 'broker') {
              setRedirectPath('/agent');
            } else if (advertiserType === 'agency') {
              setRedirectPath('/merchant');
            } else {
              // owner or null stays on /dashboard
              setRedirectPath(null); // Stay on current page
            }
          } else {
            setRedirectPath(null); // Stay on /dashboard
          }
        } else {
          setRedirectPath(null); // No profile, stay on /dashboard
        }
      } catch (error) {
        console.error("[SmartDashboardRedirect] Error:", error);
        setRedirectPath(null); // Error, stay on /dashboard
      } finally {
        setLoading(false);
      }
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

  // If we have a redirect path, redirect
  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  // Otherwise, return null and let the Dashboard component render
  // This is wrapped in App.tsx route
  return null;
}
