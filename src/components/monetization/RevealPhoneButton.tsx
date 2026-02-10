/**
 * RevealPhoneButton Component
 * 
 * Handles the pay-per-contact flow for revealing artisan phone numbers.
 * Shows phone directly if monetization is OFF or user has valid access pass.
 * Otherwise, shows button to purchase access.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import {
  isPayPerContactEnabled,
  getContactRevealFee,
  getContactPassDuration,
} from '@/lib/platformSettings';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Phone, Lock, Unlock, Wallet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RevealPhoneButtonProps {
  phone: string;
  cityId: number;
  serviceCategoryId: string;
  artisanName: string;
}

export default function RevealPhoneButton({
  phone,
  cityId,
  serviceCategoryId,
  artisanName,
}: RevealPhoneButtonProps) {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  
  const [isMonetizationEnabled, setIsMonetizationEnabled] = useState(false);
  const [fee, setFee] = useState(5);
  const [duration, setDuration] = useState(12);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Check monetization settings
  useEffect(() => {
    const checkMonetization = async () => {
      setLoading(true);
      try {
        const enabled = await isPayPerContactEnabled();
        const revealFee = await getContactRevealFee();
        const passDuration = await getContactPassDuration();
        
        setIsMonetizationEnabled(enabled);
        setFee(revealFee);
        setDuration(passDuration);
        
        // If monetization is disabled, auto-reveal
        if (!enabled) {
          setRevealed(true);
          setHasAccess(true);
        }
      } catch (error) {
        console.error('Error checking monetization:', error);
        // Default to free on error
        setRevealed(true);
        setHasAccess(true);
      } finally {
        setLoading(false);
      }
    };

    checkMonetization();
  }, []);

  // Check if user has existing access pass
  useEffect(() => {
    if (!isMonetizationEnabled || !user || hasAccess) return;

    const checkAccess = async () => {
      setCheckingAccess(true);
      try {
        const { data, error } = await supabase.rpc('check_contact_access', {
          p_user_id: user.id,
          p_city_id: cityId,
          p_service_category_id: serviceCategoryId,
        });

        if (error) {
          console.error('Error checking access:', error);
          return;
        }

        if (data && data.length > 0 && data[0].has_access) {
          setHasAccess(true);
          setRevealed(true);
        }
      } catch (error) {
        console.error('Error checking access:', error);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, [isMonetizationEnabled, user, cityId, serviceCategoryId, hasAccess]);

  // Fetch wallet balance when showing dialog
  const fetchWalletBalance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_my_wallet_balance');

      if (error) {
        console.error('Error fetching wallet balance:', error);
        return;
      }

      if (data && data.length > 0) {
        setWalletBalance(data[0].balance_mad);
      } else {
        setWalletBalance(0);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      setWalletBalance(0);
    }
  };

  const handleRevealClick = async () => {
    // If not logged in, redirect to login
    if (!user) {
      toast.error(isRTL ? 'يرجى تسجيل الدخول أولاً' : 'Veuillez vous connecter d\'abord');
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    // If already has access, just reveal
    if (hasAccess) {
      setRevealed(true);
      return;
    }

    // Show confirmation dialog
    await fetchWalletBalance();
    setShowConfirmDialog(true);
  };

  const handlePurchaseAccess = async () => {
    if (!user) return;

    setPurchasing(true);

    try {
      const { data, error } = await supabase.rpc('debit_wallet_for_contact', {
        p_city_id: cityId,
        p_service_category_id: serviceCategoryId,
      });

      if (error) {
        console.error('Error purchasing access:', error);
        toast.error(isRTL ? 'فشل الشراء' : 'Échec de l\'achat');
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        
        if (result.success) {
          setHasAccess(true);
          setRevealed(true);
          setShowConfirmDialog(false);
          toast.success(
            isRTL 
              ? `تم الكشف عن الهاتف بنجاح! الرصيد الجديد: ${result.new_balance} درهم`
              : `Téléphone révélé ! Nouveau solde: ${result.new_balance} MAD`
          );
        } else {
          toast.error(
            isRTL 
              ? result.message || 'رصيد غير كافٍ'
              : result.message || 'Solde insuffisant'
          );
        }
      }
    } catch (error) {
      console.error('Error purchasing access:', error);
      toast.error(isRTL ? 'حدث خطأ' : 'Une erreur s\'est produite');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading || checkingAccess) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">{isRTL ? 'جاري التحميل...' : 'Chargement...'}</span>
      </div>
    );
  }

  // If revealed (either free or purchased), show phone
  if (revealed) {
    return (
      <div className="flex items-center gap-3">
        <a
          href={`tel:${phone}`}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Phone className="h-4 w-4" />
          <span className="font-semibold">{phone}</span>
        </a>
        {hasAccess && isMonetizationEnabled && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Unlock className="h-3 w-3" />
            {isRTL ? 'لديك وصول' : 'Accès actif'}
          </span>
        )}
      </div>
    );
  }

  // Show reveal button
  return (
    <>
      <Button
        onClick={handleRevealClick}
        className="flex items-center gap-2"
        variant="default"
      >
        <Lock className="h-4 w-4" />
        {isRTL ? `كشف الهاتف (${fee} درهم)` : `Révéler le téléphone (${fee} MAD)`}
      </Button>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRTL ? 'تأكيد الكشف عن الهاتف' : 'Confirmer la révélation du téléphone'}
            </DialogTitle>
            <DialogDescription>
              {isRTL 
                ? `سيتم خصم ${fee} درهم من رصيدك للكشف عن رقم هاتف ${artisanName}.`
                : `${fee} MAD seront déduits de votre solde pour révéler le numéro de ${artisanName}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">
                  {isRTL ? 'رصيدك الحالي:' : 'Votre solde actuel:'}
                </span>
              </div>
              <span className="text-lg font-bold">
                {walletBalance !== null ? `${walletBalance} MAD` : '...'}
              </span>
            </div>

            {walletBalance !== null && walletBalance < fee && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">
                  {isRTL 
                    ? `رصيد غير كافٍ. تحتاج إلى ${fee - walletBalance} درهم إضافي.`
                    : `Solde insuffisant. Vous avez besoin de ${fee - walletBalance} MAD supplémentaires.`}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {isRTL 
                    ? 'يرجى الاتصال بالإدارة لشحن رصيدك.'
                    : 'Veuillez contacter l\'administration pour recharger votre solde.'}
                </p>
              </div>
            )}

            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                {isRTL 
                  ? `✓ الوصول صالح لمدة ${duration} ساعة`
                  : `✓ Accès valable ${duration} heures`}
              </p>
              <p>
                {isRTL 
                  ? '✓ يمكنك الاتصال بجميع الحرفيين في نفس المدينة والفئة'
                  : '✓ Contactez tous les artisans de la même ville et catégorie'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={purchasing}
            >
              {isRTL ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button
              onClick={handlePurchaseAccess}
              disabled={purchasing || (walletBalance !== null && walletBalance < fee)}
            >
              {purchasing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isRTL ? 'جاري الشراء...' : 'Achat...'}
                </>
              ) : (
                <>
                  {isRTL ? `تأكيد (${fee} درهم)` : `Confirmer (${fee} MAD)`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
