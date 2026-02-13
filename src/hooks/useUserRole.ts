/**
 * useUserRole Hook
 * 
 * Fetches user role from profiles.user_role field ONLY.
 * This is the single source of truth for all permissions and routing.
 * 
 * Valid roles: user | agent | merchant | admin
 * 
 * - user: Default role for all new signups
 * - agent: Real estate agents (immobilier)
 * - merchant: Service providers (services/artisan)
 * - admin: Platform administrators
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
        // Get profile - user_role is the ONLY source of truth for permissions
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_role")
          .eq("id", user.id)
          .maybeSingle();

        if (isCancelled) return;

        if (profile) {
          // Direct mapping - user_role is canonical
          const role = profile.user_role as AppRole;
          
          // Validate role is one of our expected values
          if (['user', 'agent', 'merchant', 'admin'].includes(role)) {
            setRole(role);
          } else {
            // Invalid role, default to user
            console.warn(`[useUserRole] Invalid user_role: ${role}, defaulting to user`);
            setRole('user');
          }
        } else {
          // No profile found, try to ensure it exists
          try {
            const { data, error } = await supabase.rpc('ensure_profile_exists');
            if (error) {
              console.error("[useUserRole] Error ensuring profile exists:", error);
            }
            // Default to user role
            setRole('user');
          } catch (ensureError) {
            console.error("[useUserRole] Error calling ensure_profile_exists:", ensureError);
            setRole('user'); // Safe default
          }
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
