import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePWAInstall } from '@/contexts/PWAInstallContext';
import { Download, X } from 'lucide-react';
import { IOSInstallInstructions } from './IOSInstallInstructions';

export function MobileInstallBar() {
  const { t, isRTL } = useLanguage();
  const { 
    isStandalone, 
    isIOS, 
    showInstallPrompt, 
    handleInstall, 
    dismissInstall,
    setShowInstallPrompt,
    trackEvent
  } = usePWAInstall();
  
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      trackEvent('ios_instructions_opened', { source: 'mobile_bar' });
    } else {
      await handleInstall();
      trackEvent('install_clicked', { source: 'mobile_bar' });
    }
  };

  const handleDismiss = () => {
    dismissInstall();
    trackEvent('install_dismissed', { source: 'mobile_bar' });
  };

  // Don't show on desktop or if already installed or prompt not ready
  if (isStandalone || !showInstallPrompt) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {showInstallPrompt && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`
              fixed bottom-0 left-0 right-0 z-40 md:hidden
              bg-background/95 backdrop-blur-md border-t shadow-lg
              ${isRTL ? 'rtl' : 'ltr'}
            `}
          >
            <div className="container max-w-2xl mx-auto px-4 py-3">
              <div className="flex items-center gap-3">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="flex-shrink-0"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Download className="h-6 w-6 text-primary" />
                  </div>
                </motion.div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <motion.h3
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm font-semibold text-foreground truncate"
                  >
                    {t('pwa.installPrompt')}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-xs text-muted-foreground truncate"
                  >
                    {t('pwa.installDescription')}
                  </motion.p>
                </div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <Button
                    onClick={handleInstallClick}
                    size="sm"
                    className="gap-2 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {t('pwa.installButton')}
                  </Button>
                  
                  <Button
                    onClick={handleDismiss}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Instructions Modal */}
      <IOSInstallInstructions
        open={showIOSInstructions}
        onClose={() => setShowIOSInstructions(false)}
      />
    </>
  );
}
