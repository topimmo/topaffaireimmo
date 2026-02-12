/**
 * RequireCapability Guard
 * Checks if user has required capability before accessing route
 * Redirects to appropriate page if capability is missing
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/core/auth/useAuth';
import { can } from '@/core/permissions/can';
import type { Capability } from '@/core/permissions/capabilities';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RequireCapabilityProps {
  children: ReactNode;
  capability: Capability;
  fallbackPath?: string;
}

export function RequireCapability({ 
  children, 
  capability, 
  fallbackPath 
}: RequireCapabilityProps) {
  const { profile, profileReady } = useAuth();

  // Wait for profile to be ready (should be handled by RequireProfileReady, but double-check)
  if (!profileReady) {
    return null;
  }

  // Check capability
  if (!can(profile, capability)) {
    // Determine fallback path based on profile state
    const defaultFallback = determineFallbackPath(profile, capability);
    const redirectPath = fallbackPath || defaultFallback;

    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

/**
 * Determine appropriate fallback path based on profile state and missing capability
 */
function determineFallbackPath(
  profile: any, 
  capability: Capability
): string {
  // Admin capabilities -> go to main dashboard
  if (capability === 'can_access_admin' || capability.startsWith('can_manage_')) {
    return '/dashboard';
  }

  // Artisan dashboard -> check if needs onboarding
  if (capability === 'can_access_artisan_dashboard') {
    // If no artisan profile, go to onboarding
    if (!profile?.artisanProfile) {
      return '/artisan/onboarding';
    }
    // If pending verification, show pending page
    if (profile.artisanProfile && !profile.artisanProfile.is_verified) {
      return '/artisan/pending';
    }
  }

  // Default fallback
  return '/dashboard';
}

/**
 * Component to show when user lacks capability (alternative to redirect)
 */
export function AccessDenied({ 
  message = "Vous n'avez pas accès à cette page",
  returnPath = '/dashboard'
}: { 
  message?: string;
  returnPath?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Accès refusé</h1>
        <p className="text-muted-foreground mb-6">{message}</p>
        <Button asChild>
          <a href={returnPath}>Retour</a>
        </Button>
      </div>
    </div>
  );
}
