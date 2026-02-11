/**
 * BoostToggle Component
 * 
 * Allows artisans to enable/disable boost for their profile.
 * Checks wallet balance requirement before enabling.
 */

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import {
  isPayToBeVisibleEnabled,
  getArtisanMinWallet,
} from '@/lib/platformSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Zap, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BoostToggleProps {
  artisanProfileId: string;
  currentBoostStatus: boolean;
  onBoostChange?: (isBoosted: boolean) => void;
}

export default function BoostToggle({
  artisanProfileId,
  currentBoostStatus,
  onBoostChange,
}: BoostToggleProps) {
  const { isRTL } = useLanguage();
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(false);
  const [minWallet, setMinWallet] = useState(50);
  const [isBoosted, setIsBoosted] = useState(currentBoostStatus);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    const checkFeature = async () => {
      setLoading(true);
      try {
        const enabled = await isPayToBeVisibleEnabled();
        const minBalance = await getArtisanMinWallet();
        
        setIsFeatureEnabled(enabled);
        setMinWallet(minBalance);
        
        // Fetch wallet balance
        const { data, error } = await supabase.rpc('get_my_wallet_balance');
        if (!error && data && data.length > 0) {
          setWalletBalance(data[0].balance_mad);
        } else {
          setWalletBalance(0);
        }
      } catch (error) {
        console.error('Error checking boost feature:', error);
      } finally {
        setLoading(false);
      }
    };

    checkFeature();
  }, []);

  useEffect(() => {
    setIsBoosted(currentBoostStatus);
  }, [currentBoostStatus]);

  const handleToggleBoost = async (checked: boolean) => {
    setToggling(true);

    try {
      const { data, error } = await supabase.rpc('toggle_artisan_boost', {
        p_artisan_profile_id: artisanProfileId,
        p_enable_boost: checked,
      });

      if (error) {
        console.error('Error toggling boost:', error);
        toast.error(isRTL ? 'فشل تغيير حالة التعزيز' : 'Échec de la modification du boost');
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        
        if (result.success) {
          setIsBoosted(result.is_boosted);
          onBoostChange?.(result.is_boosted);
          
          // Update wallet balance if returned
          if (result.new_balance !== null && result.new_balance !== undefined) {
            setWalletBalance(result.new_balance);
          }
          
          toast.success(
            isRTL 
              ? (result.is_boosted ? 'تم تفعيل التعزيز' : 'تم إلغاء التعزيز')
              : result.message || (result.is_boosted ? 'Boost activé' : 'Boost désactivé')
          );
        } else {
          toast.error(
            isRTL 
              ? result.message || 'فشل العملية'
              : result.message || 'Opération échouée'
          );
        }
      }
    } catch (error) {
      console.error('Error toggling boost:', error);
      toast.error(isRTL ? 'حدث خطأ' : 'Une erreur s\'est produite');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // If feature is disabled, don't show anything
  if (!isFeatureEnabled) {
    return null;
  }

  const canEnableBoost = walletBalance !== null && walletBalance >= minWallet;
  const isDisabled = !canEnableBoost && !isBoosted;

  return (
    <Card className={isBoosted ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' : ''}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className={`h-5 w-5 ${isBoosted ? 'text-yellow-600' : ''}`} />
          <CardTitle>{isRTL ? 'الرفع فنتائج البحث (Boost)' : 'Boost de visibilité'}</CardTitle>
        </div>
        <CardDescription>
          {isRTL 
            ? 'ظهر أولاً في نتائج البحث لمدنك وفئاتك'
            : 'Apparaissez en premier dans les résultats de recherche'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="boost-toggle" className="text-base font-semibold">
              {isRTL ? 'فعّل الرفع ديال الظهور' : 'Activer le boost'}
            </Label>
            <p className="text-sm text-muted-foreground">
              {isRTL 
                ? `خاص يكون فالرصيد على الأقل ${minWallet} درهم باش تقدر تفعّل الرفع.`
                : `Il faut au moins ${minWallet} MAD de solde pour activer le boost.`}
            </p>
          </div>
          <Switch
            id="boost-toggle"
            checked={isBoosted}
            onCheckedChange={handleToggleBoost}
            disabled={toggling || isDisabled}
          />
        </div>

        {/* Status indicator */}
        <div className={`p-3 rounded-lg ${
          isBoosted 
            ? 'bg-green-100 dark:bg-green-950 border border-green-300' 
            : 'bg-muted'
        }`}>
          <div className="flex items-center gap-2">
            {isBoosted ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    {isRTL ? 'مفعّل — غادي تبان من الأوائل فـ المدينة ديالك.' : 'Activé — vous apparaissez en haut dans votre ville.'}
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    {isRTL 
                      ? 'سيظهر ملفك الشخصي أولاً في نتائج البحث'
                      : 'Votre profil apparaît en premier dans les résultats'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-semibold">
                    {isRTL ? 'موقّف — غادي تبان عادي ولكن من اللخر.' : 'Désactivé — vous restez visible mais plus bas.'}
                  </p>
                  {!canEnableBoost && walletBalance !== null && (
                    <p className="text-sm text-muted-foreground">
                      {isRTL 
                        ? `رصيدك: ${walletBalance} درهم (تحتاج ${minWallet - walletBalance} درهم إضافي)`
                        : `Votre solde: ${walletBalance} MAD (besoin de ${minWallet - walletBalance} MAD supplémentaires)`}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>
            {isRTL 
              ? '💡 رسوم التفعيل تُخصم من رصيدك عند تفعيل الرفع.'
              : '💡 Des frais d\'activation sont déduits de votre solde lors de l\'activation du boost.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
