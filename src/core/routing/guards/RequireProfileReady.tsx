/**
 * RequireProfileReady Guard
 * Waits for profile to be fully loaded before rendering
 * Prevents race conditions by ensuring DB data is ready
 */

import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Timeout constant - max time to wait for profile to be ready
const PROFILE_READY_TIMEOUT_MS = 10000; // 10 seconds (profile may take longer)

interface RequireProfileReadyProps {
  children: ReactNode;
}

export function RequireProfileReady({ children }: RequireProfileReadyProps) {
  const { profileReady, loading } = useAuth();
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = () => {
    setTimedOut(false);
    setRetryKey(prev => prev + 1);
  };

  // Set timeout to prevent infinite loading
  useEffect(() => {
    if (profileReady) {
      setTimedOut(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (!profileReady) {
        console.error('RequireProfileReady: Profile loading timeout exceeded');
        setTimedOut(true);
      }
    }, PROFILE_READY_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [profileReady, retryKey]);

  // Show timeout error with retry option
  if (timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">
                Impossible de charger le profil
              </h2>
              <p className="text-muted-foreground text-sm">
                Le chargement de votre profil a pris trop de temps. Veuillez réessayer.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={handleRetry} className="w-full">
                Réessayer
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Retour au tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
