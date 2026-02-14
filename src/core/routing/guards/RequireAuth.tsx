/**
 * RequireAuth Guard
 * Ensures user is authenticated before accessing route
 */

import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Timeout constant - max time to wait for auth to resolve
const AUTH_GUARD_TIMEOUT_MS = 8000; // 8 seconds

interface RequireAuthProps {
  children: ReactNode;
  redirectTo?: string;
}

export function RequireAuth({ children, redirectTo = '/login' }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);

  // Set timeout to prevent infinite loading
  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error('RequireAuth: Auth loading timeout exceeded');
        setTimedOut(true);
      }
    }, AUTH_GUARD_TIMEOUT_MS);

    return () => clearTimeout(timeoutId);
  }, [loading]);

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
                Délai d'authentification dépassé
              </h2>
              <p className="text-muted-foreground text-sm">
                La vérification de votre session a pris trop de temps. Veuillez réessayer.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => window.location.reload()} className="w-full">
                Réessayer
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(redirectTo)}
                className="w-full"
              >
                Retour à la connexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    const currentPath = location.pathname + location.search;
    return <Navigate to={`${redirectTo}?next=${encodeURIComponent(currentPath)}`} replace />;
  }

  return <>{children}</>;
}
