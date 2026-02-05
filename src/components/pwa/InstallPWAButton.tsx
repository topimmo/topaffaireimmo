import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWAButton() {
  const { t, isRTL } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (running in standalone mode)
    const isInStandaloneMode = () => {
      return (
        (window.matchMedia('(display-mode: standalone)').matches) ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://')
      );
    };

    setIsStandalone(isInStandaloneMode());

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // For iOS: show install hint if not already installed
    if (isIOSDevice && !isInStandaloneMode()) {
      // Only show on iOS if user hasn't dismissed it recently
      const dismissed = localStorage.getItem('pwa-ios-install-dismissed');
      const dismissedTime = dismissed ? parseInt(dismissed) : 0;
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      
      if (!dismissed || daysSinceDismissed > 7) {
        setShowInstallButton(true);
      }
    }

    // For Android/Desktop: listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful install
    const handleAppInstalled = () => {
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show iOS instructions
      setShowIOSInstructions(true);
    } else if (deferredPrompt) {
      // Show Android/Desktop install prompt
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA installed');
      }
      
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallButton(false);
    
    // For iOS, remember dismissal
    if (isIOS) {
      localStorage.setItem('pwa-ios-install-dismissed', Date.now().toString());
    }
  };

  const handleCloseIOSInstructions = () => {
    setShowIOSInstructions(false);
  };

  // Don't show if already installed
  if (isStandalone || !showInstallButton) {
    return null;
  }

  return (
    <>
      {/* Install Button */}
      <div className="relative">
        <Button
          onClick={handleInstallClick}
          variant="outline"
          size="sm"
          className="gap-2 relative group"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">{t('pwa.install')}</span>
        </Button>
        
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} bg-muted hover:bg-muted-foreground/10 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity`}
          aria-label="Dismiss"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* iOS Instructions Dialog */}
      <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <DialogContent className={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              {t('pwa.iosTitle')}
            </DialogTitle>
            <DialogDescription className="pt-4 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                <Share className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
                <p className="text-sm leading-relaxed">
                  {t('pwa.iosInstructions')}
                </p>
              </div>
              
              <ol className={`text-sm space-y-2 ${isRTL ? 'pr-4' : 'pl-4'} list-decimal`}>
                <li>{isRTL ? 'اضغط على زر المشاركة في شريط الأدوات السفلي' : 'Appuyez sur le bouton Partager dans la barre d\'outils'}</li>
                <li>{isRTL ? 'قم بالتمرير للأسفل واختر "إضافة إلى الشاشة الرئيسية"' : 'Faites défiler et sélectionnez "Ajouter à l\'écran d\'accueil"'}</li>
                <li>{isRTL ? 'اضغط على "إضافة" للتأكيد' : 'Appuyez sur "Ajouter" pour confirmer'}</li>
              </ol>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={handleCloseIOSInstructions} variant="default">
              {isRTL ? 'فهمت' : 'Compris'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
