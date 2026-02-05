import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePWAInstall } from '@/contexts/PWAInstallContext';
import { Download, Share, Plus, X } from 'lucide-react';

interface IOSInstallInstructionsProps {
  open: boolean;
  onClose: () => void;
}

export function IOSInstallInstructions({ open, onClose }: IOSInstallInstructionsProps) {
  const { t, isRTL } = useLanguage();
  const { dismissInstall, trackEvent } = usePWAInstall();

  const handleClose = () => {
    trackEvent('ios_instructions_closed');
    dismissInstall();
    onClose();
  };

  const steps = isRTL ? [
    {
      icon: Share,
      text: 'اضغط على زر المشاركة في شريط الأدوات السفلي',
      highlight: true
    },
    {
      icon: Plus,
      text: 'قم بالتمرير للأسفل واختر "إضافة إلى الشاشة الرئيسية"',
      highlight: false
    },
    {
      icon: Download,
      text: 'اضغط على "إضافة" للتأكيد',
      highlight: false
    }
  ] : [
    {
      icon: Share,
      text: 'Appuyez sur le bouton Partager dans la barre d\'outils',
      highlight: true
    },
    {
      icon: Plus,
      text: 'Faites défiler et sélectionnez "Ajouter à l\'écran d\'accueil"',
      highlight: false
    },
    {
      icon: Download,
      text: 'Appuyez sur "Ajouter" pour confirmer',
      highlight: false
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${isRTL ? 'rtl' : 'ltr'} max-w-md`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <Download className="h-6 w-6 text-primary" />
            </motion.div>
            {t('pwa.iosTitle')}
          </DialogTitle>
          <DialogDescription className="pt-4">
            {t('pwa.iosInstructions')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <AnimatePresence mode="wait">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  flex items-start gap-3 p-4 rounded-lg transition-colors
                  ${step.highlight ? 'bg-primary/10 border border-primary/20' : 'bg-muted'}
                `}
              >
                <div className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                  ${step.highlight ? 'bg-primary text-primary-foreground' : 'bg-background'}
                `}>
                  <span className="text-sm font-semibold">{index + 1}</span>
                </div>
                <div className="flex-1 flex items-start gap-2 pt-1">
                  <step.icon className={`h-5 w-5 flex-shrink-0 ${isRTL && step.icon === Share ? 'rotate-180' : ''}`} />
                  <p className="text-sm leading-relaxed">{step.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Visual representation of iOS Share button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 p-4 bg-muted/50 rounded-lg border border-dashed"
        >
          <Share className={`h-6 w-6 text-primary ${isRTL ? 'rotate-180' : ''}`} />
          <span className="text-sm text-muted-foreground">
            {isRTL ? 'ابحث عن هذا الرمز في Safari' : 'Recherchez cette icône dans Safari'}
          </span>
        </motion.div>

        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={handleClose} variant="default" className="gap-2">
            {isRTL ? 'فهمت' : 'Compris'}
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
