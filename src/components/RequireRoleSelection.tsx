/**
 * Role Guard Component
 * 
 * Ensures users have selected their role before accessing protected content.
 * Redirects users with role='user' to /select-role page.
 */

import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";

interface RequireRoleSelectionProps {
  children: ReactNode;
}

/**
 * Wrapper component that ensures users have selected their role.
 * 
 * - If user has role='user' (default), redirects to /select-role
 * - If user has any other role, allows access
 * - Skips redirect if already on /select-role
 */
export default function RequireRoleSelection({
  children,
}: RequireRoleSelectionProps) {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const location = useLocation();

  // Debug logging
  useEffect(() => {
    if (!authLoading && !roleLoading) {
      console.log('[RequireRoleSelection] Role check:', {
        path: location.pathname,
        userExists: !!user,
        role,
        needsRoleSelection: role === 'user',
      });
    }
  }, [user, role, authLoading, roleLoading, location.pathname]);

  // Wait for auth and role to finish loading
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated, don't redirect here - let auth guards handle it
  if (!user) {
    return <>{children}</>;
  }

  // If already on select-role page, don't redirect
  if (location.pathname === '/select-role') {
    return <>{children}</>;
  }

  // If user has default 'user' role, redirect to role selection
  // Allow access to certain public pages even with user role
  const publicPagesAllowedForUserRole = [
    '/',
    '/search',
    '/buy',
    '/rent',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/services',
    '/agencies',
    '/guides',
    '/login',
    '/register',
    '/reset-password',
    '/auth/callback',
  ];

  const isPublicPage = publicPagesAllowedForUserRole.some(
    (page) => location.pathname === page || 
    (location.pathname.startsWith(page + '/') && page !== '/')
  );

  // Only redirect to role selection if:
  // 1. User has 'user' role (needs to select path)
  // 2. Not on a public page
  if (role === 'user' && !isPublicPage) {
    console.log('[RequireRoleSelection] Redirecting to role selection');
    return <Navigate to="/select-role" state={{ from: location.pathname }} replace />;
  }

  // User has selected a role or is on a public page, allow access
  return <>{children}</>;
}
