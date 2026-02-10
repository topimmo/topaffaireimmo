/**
 * useUserRole Hook
 * 
 * Efficiently fetches and caches user role
 * Avoids redundant DB calls by caching in context
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export type AppRole = "user" | "agent" | "merchant" | "admin";

/**
 * Hook to get current user's role
 * Fetches once and caches the result
 */
export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function fetchRole() {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // Check admin first (fastest check)
        const { data: adminData } = await supabase
          .from("admins")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (isCancelled) return;

        if (adminData) {
          setRole("admin");
          setLoading(false);
          return;
        }

        // Get profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_role, advertiser_type")
          .eq("id", user.id)
          .maybeSingle();

        if (isCancelled) return;

        if (profile) {
          // Map to app role
          if (profile.user_role === 'commercial_advertiser') {
            setRole('merchant');
          } else if (profile.user_role === 'real_estate_advertiser') {
            const advertiserType = profile.advertiser_type;
            if (advertiserType === 'broker') {
              setRole('agent');
            } else if (advertiserType === 'agency') {
              setRole('merchant');
            } else {
              setRole('user');
            }
          } else {
            setRole('user');
          }
        } else {
          setRole('user'); // Default
        }
      } catch (error) {
        console.error("[useUserRole] Error fetching role:", error);
        if (!isCancelled) {
          setRole('user'); // Safe default
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchRole();

    return () => {
      isCancelled = true;
    };
  }, [user?.id]); // Only re-fetch if user ID changes

  return { role, loading };
}
