/**
 * Push Notification Toggle Component
 * 
 * A toggle switch for enabling/disabling push notifications
 * Respects user privacy - only asks for permission when user explicitly enables
 * Shows clear status and handles all edge cases gracefully
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Bell, BellOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  hasActiveSubscription,
} from '@/lib/pushNotifications';
import { cn } from '@/lib/utils';

export function PushNotificationToggle() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Check support and current state on mount
  useEffect(() => {
    checkPushStatus();
  }, [user]);

  async function checkPushStatus() {
    setIsLoading(true);
    
    // Check if push is supported
    const supported = isPushSupported();
    setIsSupported(supported);
    
    if (!supported) {
      setIsLoading(false);
      return;
    }

    // Check permission status
    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);

    // Check if user has active subscription
    const hasSubscription = await hasActiveSubscription();
    setIsEnabled(hasSubscription && currentPermission === 'granted');
    
    setIsLoading(false);
  }

  async function handleToggle(checked: boolean) {
    if (checked) {
      // Enabling notifications
      const currentPermission = getNotificationPermission();
      
      if (currentPermission === 'denied') {
        // Permission was denied - can't request again
        toast.error(t('push.permissionDenied'), {
          description: 'Veuillez autoriser les notifications dans les paramètres de votre navigateur',
        });
        return;
      }
      
      if (currentPermission === 'default') {
        // Need to request permission - show prompt first
        setShowPrompt(true);
        return;
      }
      
      // Permission already granted - just subscribe
      await enableNotifications();
    } else {
      // Disabling notifications
      await disableNotifications();
    }
  }

  async function enableNotifications() {
    setIsLoading(true);
    
    try {
      // Request permission if not already granted
      const currentPermission = getNotificationPermission();
      let finalPermission = currentPermission;
      
      if (currentPermission !== 'granted') {
        finalPermission = await requestNotificationPermission();
        setPermission(finalPermission);
      }
      
      if (finalPermission !== 'granted') {
        toast.error(t('push.errorEnable'), {
          description: 'Permission refusée',
        });
        setIsLoading(false);
        return;
      }

      // Subscribe to push notifications
      const result = await subscribeToPushNotifications(user?.id);
      
      if (result.success) {
        setIsEnabled(true);
        toast.success(t('push.successEnabled'));
      } else {
        toast.error(t('push.errorEnable'), {
          description: result.error,
        });
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error(t('push.errorEnable'));
    } finally {
      setIsLoading(false);
    }
  }

  async function disableNotifications() {
    setIsLoading(true);
    
    try {
      const result = await unsubscribeFromPushNotifications();
      
      if (result.success) {
        setIsEnabled(false);
        toast.success(t('push.successDisabled'));
      } else {
        toast.error(t('push.errorDisable'), {
          description: result.error,
        });
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast.error(t('push.errorDisable'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePromptAllow() {
    setShowPrompt(false);
    await enableNotifications();
  }

  function handlePromptCancel() {
    setShowPrompt(false);
  }

  // Don't show if push is not supported
  if (!isSupported) {
    return (
      <div className={cn(
        "flex items-center justify-between p-4 border rounded-lg bg-muted/50",
        isRTL && "flex-row-reverse"
      )}>
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <BellOff className="h-5 w-5 text-muted-foreground" />
          <div className={cn(isRTL && "text-right")}>
            <Label className="text-base font-medium text-muted-foreground">
              {t('push.title')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('push.notSupported')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show permission denied state
  if (permission === 'denied') {
    return (
      <div className={cn(
        "flex items-center justify-between p-4 border rounded-lg bg-destructive/10",
        isRTL && "flex-row-reverse"
      )}>
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div className={cn(isRTL && "text-right")}>
            <Label className="text-base font-medium">
              {t('push.title')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('push.permissionDenied')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        "flex items-center justify-between p-4 border rounded-lg",
        isRTL && "flex-row-reverse"
      )}>
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          {isEnabled ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          <div className={cn(isRTL && "text-right")}>
            <Label htmlFor="push-toggle" className="text-base font-medium cursor-pointer">
              {t('push.title')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('push.description')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isEnabled ? t('push.enabled') : t('push.disabled')}
            </p>
          </div>
        </div>
        <Switch
          id="push-toggle"
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
      </div>

      {/* Permission prompt dialog */}
      <AlertDialog open={showPrompt} onOpenChange={setShowPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={cn(isRTL && "text-right")}>
              {t('push.promptTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className={cn(isRTL && "text-right")}>
              {t('push.promptMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={cn(isRTL && "flex-row-reverse")}>
            <AlertDialogCancel onClick={handlePromptCancel}>
              {t('push.promptCancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handlePromptAllow}>
              {t('push.promptAllow')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
