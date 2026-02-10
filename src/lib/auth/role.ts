/**
 * Role-based authentication helpers for TopAffaireImmo
 * 
 * Provides a single source of truth for user roles and role-based access control.
 * Maps database user_role values to simplified application roles.
 */

import { supabase } from "@/lib/supabase";

// Simplified application roles
export type AppRole = "user" | "advertiser" | "artisan" | "admin";

// Database user_role values from profiles table
export type DbUserRole = "admin" | "real_estate_advertiser" | "commercial_advertiser";

/**
 * Map database user_role to simplified app role
 * 
 * Mapping logic:
 * - admin → admin
 * - real_estate_advertiser → advertiser  
 * - commercial_advertiser → advertiser
 * - default → user
 */
export function mapDbRoleToAppRole(dbRole: DbUserRole | string | null | undefined): AppRole {
  if (!dbRole) return "user";
  
  switch (dbRole) {
    case "admin":
      return "admin";
    case "real_estate_advertiser":
    case "commercial_advertiser":
      return "advertiser";
    default:
      return "user";
  }
}

/**
 * Get current user's role from the database
 * Returns null if not authenticated or error occurs
 */
export async function getCurrentUserRole(): Promise<AppRole | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    // Check if user is admin via admins table
    const { data: adminData } = await supabase
      .from("admins")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (adminData) return "admin";

    // Get user profile and role
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) return "user";

    return mapDbRoleToAppRole(profile.user_role);
  } catch (error) {
    console.error("[Role] Error getting current user role:", error);
    return null;
  }
}

/**
 * Check if current user has one of the allowed roles
 * Returns false if not authenticated or role doesn't match
 */
export async function hasRole(allowedRoles: AppRole[]): Promise<boolean> {
  const currentRole = await getCurrentUserRole();
  if (!currentRole) return false;
  
  return allowedRoles.includes(currentRole);
}

/**
 * Get dashboard path for a given role
 */
export function getDashboardPath(role: AppRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "advertiser":
      return "/dashboard/advertiser";
    case "artisan":
      return "/dashboard/artisan";
    case "user":
    default:
      return "/dashboard/user";
  }
}

/**
 * Get redirect path based on user's role
 * Used for smart /dashboard redirect
 */
export async function getRedirectPathForUser(): Promise<string> {
  const role = await getCurrentUserRole();
  if (!role) return "/login";
  
  return getDashboardPath(role);
}

/**
 * Check if user is admin (via admins table)
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: adminData } = await supabase
      .from("admins")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    return !!adminData;
  } catch (error) {
    console.error("[Role] Error checking admin status:", error);
    return false;
  }
}

/**
 * Role labels for display
 */
export function getRoleLabel(role: AppRole, language: "fr" | "ar" = "fr"): string {
  const labels: Record<AppRole, { fr: string; ar: string }> = {
    user: { fr: "Utilisateur", ar: "مستخدم" },
    advertiser: { fr: "Annonceur", ar: "معلن" },
    artisan: { fr: "Artisan", ar: "حرفي" },
    admin: { fr: "Administrateur", ar: "مسؤول" },
  };

  return labels[role][language];
}
