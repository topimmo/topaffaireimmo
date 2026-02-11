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
  neighborhoodIds?: number[] | null;
  artisanName: string;
}

export default function RevealPhoneButton({
  phone,
  cityId,
  serviceCategoryId,
  neighborhoodIds,
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
          p_neighborhood_ids: neighborhoodIds || null,
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
        p_neighborhood_ids: neighborhoodIds || null,
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
              ? 'تم! دابا تقدر تشوف جميع الأرقام فـ هاد الحرفة فـ هاد المدينة لمدة 12 ساعة.'
              : 'C\'est bon ! Vous pouvez voir tous les numéros de cette catégorie dans cette ville pendant 12h.'
          );
        } else {
          toast.error(
            isRTL 
              ? 'رصيدك ما كافيش. عَمّر المحفظة باش تكشف الرقم.'
              : 'Solde insuffisant. Rechargez votre portefeuille pour afficher le numéro.'
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
          <span className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1 font-medium">
            <Unlock className="h-3 w-3" />
            {isRTL ? 'ولوج مفعل' : 'Accès actif'}
          </span>
        )}
      </div>
    );
  }

  // Show reveal button
  return (
    <>
      <div className="space-y-2">
        <Button
          onClick={handleRevealClick}
          className="flex items-center gap-2"
          variant="default"
        >
          <Lock className="h-4 w-4" />
          {isRTL ? `كشف الرقم (${fee} دراهم)` : `Afficher le numéro (${fee} MAD)`}
        </Button>
        <p className="text-xs text-muted-foreground">
          {isRTL 
            ? 'كتخلص غير مرة وحدة وكيبانولك جميع أرقام نفس الحرفة فـ نفس المدينة (والأحياء اللي مختار) لمدة 12 ساعة.'
            : 'Vous payez une seule fois et vous voyez tous les numéros de la même catégorie dans la même ville (et quartiers sélectionnés) pendant 12h.'}
        </p>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRTL ? 'تأكيد كشف الرقم' : 'Confirmer l\'affichage du numéro'}
            </DialogTitle>
            <DialogDescription>
              {isRTL 
                ? `غادي يخصم ${fee} درهم من رصيدك باش تكشف رقم ${artisanName}.`
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
                <p className="text-sm text-destructive font-medium">
                  {isRTL 
                    ? 'رصيدك ما كافيش. عَمّر المحفظة باش تكشف الرقم.'
                    : 'Solde insuffisant. Rechargez votre portefeuille pour afficher le numéro.'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {isRTL 
                    ? 'التعبئة كتدار يدوياً من طرف الإدارة حالياً.'
                    : 'Le rechargement est manuel (par l\'admin) pour le moment.'}
                </p>
              </div>
            )}

            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium mb-2">
                {isRTL ? 'باش تعرف:' : 'À savoir:'}
              </p>
              <p>
                {isRTL 
                  ? `✓ الولوج صالح لمدة ${duration} ساعة`
                  : `✓ Accès valable ${duration} heures`}
              </p>
              <p>
                {isRTL 
                  ? '✓ كتقدر تشوف جميع الأرقام فـ نفس الحرفة والمدينة'
                  : '✓ Vous pouvez voir tous les numéros de la même catégorie dans cette ville'}
              </p>
              {neighborhoodIds && neighborhoodIds.length > 0 ? (
                <p>
                  {isRTL 
                    ? 'هاذ الولوج كينطبق غير على الأحياء اللي مختار.'
                    : 'Cet accès couvre uniquement les quartiers sélectionnés.'}
                </p>
              ) : (
                <p>
                  {isRTL 
                    ? 'هاذ الولوج كينطبق على كامل المدينة.'
                    : 'Cet accès couvre toute la ville.'}
                </p>
              )}
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
                  {isRTL ? 'كنعالج الطلب...' : 'Traitement...'}
                </>
              ) : (
                <>
                  {isRTL ? `تأكيد (${fee} دراهم)` : `Confirmer (${fee} MAD)`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
