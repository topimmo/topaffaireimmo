import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isStandalone: boolean;
  isIOS: boolean;
  showInstallPrompt: boolean;
  setShowInstallPrompt: (show: boolean) => void;
  handleInstall: () => Promise<void>;
  dismissInstall: () => void;
  trackEvent: (event: string, data?: Record<string, any>) => void;
}

const PWAInstallContext = createContext<PWAInstallContextType | undefined>(undefined);

export function PWAInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [userHasSpentTime, setUserHasSpentTime] = useState(false);

  // Track events (console logging for now, can be extended)
  const trackEvent = (event: string, data?: Record<string, any>) => {
    console.log(`[PWA Install] ${event}`, data || {});
  };

  useEffect(() => {
    // Check if already installed (running in standalone mode)
    const checkStandaloneMode = () => {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')
      );
    };

    const standalone = checkStandaloneMode();
    setIsStandalone(standalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Don't show anything if already installed
    if (standalone) {
      trackEvent('app_already_installed');
      return;
    }

    // For iOS: check if user has dismissed before
    if (isIOSDevice) {
      const dismissed = localStorage.getItem('pwa-ios-install-dismissed');
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
        
        if (daysSinceDismissed < 7) {
          trackEvent('ios_install_recently_dismissed', { daysSinceDismissed });
          return;
        }
      }
    }

    // Listen for beforeinstallprompt (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      trackEvent('beforeinstallprompt_captured');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      setIsStandalone(true);
      trackEvent('app_installed_success');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Scroll detection
    const handleScroll = () => {
      if (!userHasScrolled && window.scrollY > 100) {
        setUserHasScrolled(true);
        trackEvent('user_scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Time-based trigger (17 seconds - middle of 15-20s range for optimal engagement)
    const timeoutId = setTimeout(() => {
      setUserHasSpentTime(true);
      trackEvent('user_spent_time', { seconds: 17 });
    }, 17000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [userHasScrolled, isIOS]); // Added missing dependencies

  // Show prompt when user has scrolled OR spent time
  useEffect(() => {
    if (isStandalone) return;

    const shouldShowPrompt = userHasScrolled || userHasSpentTime;
    
    if (shouldShowPrompt && (deferredPrompt || isIOS)) {
      setShowInstallPrompt(true);
      trackEvent('install_prompt_shown', { 
        trigger: userHasScrolled ? 'scroll' : 'time',
        platform: isIOS ? 'ios' : 'android/desktop'
      });
    }
  }, [userHasScrolled, userHasSpentTime, deferredPrompt, isIOS, isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      trackEvent('install_prompt_interaction', { outcome });
      
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      trackEvent('install_error', { error: String(error) });
    }
  };

  const dismissInstall = () => {
    setShowInstallPrompt(false);
    
    if (isIOS) {
      localStorage.setItem('pwa-ios-install-dismissed', Date.now().toString());
      trackEvent('install_dismissed', { platform: 'ios' });
    } else {
      trackEvent('install_dismissed', { platform: 'android/desktop' });
    }
  };

  const value: PWAInstallContextType = {
    deferredPrompt,
    isStandalone,
    isIOS,
    showInstallPrompt,
    setShowInstallPrompt,
    handleInstall,
    dismissInstall,
    trackEvent,
  };

  return (
    <PWAInstallContext.Provider value={value}>
      {children}
    </PWAInstallContext.Provider>
  );
}

export function usePWAInstall() {
  const context = useContext(PWAInstallContext);
  if (!context) {
    throw new Error('usePWAInstall must be used within PWAInstallProvider');
  }
  return context;
}
