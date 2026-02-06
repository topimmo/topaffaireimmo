import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * Connection Status Banner
 * 
 * Shows a non-intrusive banner when connection is lost or unstable
 * This replaces the aggressive offline page fallback
 */
export function ConnectionStatusBanner() {
  const isOnline = useOnlineStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      // User went offline - show warning banner
      setShowBanner(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // User came back online - show success banner briefly
      setShowBanner(true);
      
      // Auto-hide success banner after 3 seconds
      const timer = setTimeout(() => {
        setShowBanner(false);
        setWasOffline(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Don't render if banner shouldn't be shown
  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 ${
        isOnline ? 'bg-green-500' : 'bg-orange-500'
      } text-white shadow-lg animate-in slide-in-from-top duration-300`}
      role="alert"
      aria-live="polite"
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-3">
        {isOnline ? (
          <>
            <Wifi className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Connexion rétablie
            </p>
          </>
        ) : (
          <>
            <WifiOff className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Connexion instable - Certaines fonctionnalités peuvent être limitées
            </p>
          </>
        )}
      </div>
    </div>
  );
}
