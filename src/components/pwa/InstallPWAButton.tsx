import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePWAInstall } from '@/contexts/PWAInstallContext';
import { Download, X } from 'lucide-react';
import { IOSInstallInstructions } from './IOSInstallInstructions';

/**
 * InstallPWAButton - Desktop/Header install button
 * This component appears in the header for desktop users
 * For mobile, use MobileInstallBar instead
 */
export function InstallPWAButton() {
  const { t, isRTL } = useLanguage();
  const { 
    isStandalone, 
    isIOS, 
    showInstallPrompt, 
    deferredPrompt,
    handleInstall, 
    dismissInstall,
    trackEvent
  } = usePWAInstall();
  
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      trackEvent('ios_instructions_opened', { source: 'header_button' });
    } else {
      await handleInstall();
      trackEvent('install_clicked', { source: 'header_button' });
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissInstall();
    trackEvent('install_dismissed', { source: 'header_button' });
  };

  // Don't show if already installed or no prompt available
  if (isStandalone || !showInstallPrompt || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key="install-button"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="relative group"
        >
          <Button
            onClick={handleInstallClick}
            variant="outline"
            size="sm"
            className="gap-2 relative overflow-hidden"
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ 
                duration: 0.5, 
                repeat: Infinity, 
                repeatDelay: 3,
                ease: "easeInOut"
              }}
            >
              <Download className="h-4 w-4" />
            </motion.div>
            <span className="hidden sm:inline">{t('pwa.install')}</span>
          </Button>
          
          {/* Dismiss button - shows on hover */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            onClick={handleDismiss}
            className={`
              absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} 
              bg-muted hover:bg-destructive hover:text-destructive-foreground 
              rounded-full p-0.5 
              opacity-0 group-hover:opacity-100 
              transition-all duration-200
              z-10
            `}
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </motion.button>
        </motion.div>
      </AnimatePresence>

      {/* iOS Instructions Modal */}
      <IOSInstallInstructions
        open={showIOSInstructions}
        onClose={() => setShowIOSInstructions(false)}
      />
    </>
  );
}
