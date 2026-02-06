import { useState, useEffect } from 'react';

/**
 * Hook to detect online/offline status of the browser
 * 
 * Returns true when online, false when offline
 * Updates automatically when connection status changes
 */
export function useOnlineStatus(): boolean {
  // Initialize with current online status
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    // Update status when going online
    const handleOnline = () => {
      console.log('[Online Status] Connection restored');
      setIsOnline(true);
    };

    // Update status when going offline
    const handleOffline = () => {
      console.log('[Online Status] Connection lost');
      setIsOnline(false);
    };

    // Listen to online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
