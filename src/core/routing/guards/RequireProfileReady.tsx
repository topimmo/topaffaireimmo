/**
 * RequireProfileReady Guard
 * Waits for profile to be fully loaded before rendering
 * Prevents race conditions by ensuring DB data is ready
 */

import { ReactNode } from 'react';
import { useAuth } from '@/core/auth/useAuth';
import { Loader2 } from 'lucide-react';

interface RequireProfileReadyProps {
  children: ReactNode;
}

export function RequireProfileReady({ children }: RequireProfileReadyProps) {
  const { profileReady, loading } = useAuth();

  // Show loading until profile is ready
  if (loading || !profileReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
