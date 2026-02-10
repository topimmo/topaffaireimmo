/**
 * AdminWalletTopup Component
 * 
 * Dialog for admins to top up user wallets.
 * Used in AdminUsers page.
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Wallet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminWalletTopupProps {
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

export default function AdminWalletTopup({
  userId,
  userName,
  onSuccess,
}: AdminWalletTopupProps) {
  const { isRTL } = useLanguage();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('100');
  const [reason, setReason] = useState('admin_topup');
  const [loading, setLoading] = useState(false);

  const handleTopup = async () => {
    const amountNum = parseInt(amount);
    
    if (!amountNum || amountNum <= 0) {
      toast.error(isRTL ? 'الرجاء إدخال مبلغ صحيح' : 'Veuillez entrer un montant valide');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('admin_topup_wallet', {
        p_target_user_id: userId,
        p_amount_mad: amountNum,
        p_reason: reason || 'admin_topup',
      });

      if (error) {
        console.error('Error topping up wallet:', error);
        toast.error(isRTL ? 'فشل شحن المحفظة' : 'Échec de la recharge');
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        
        if (result.success) {
          toast.success(
            isRTL 
              ? `تم شحن ${amountNum} درهم. الرصيد الجديد: ${result.new_balance} درهم`
              : `${amountNum} MAD ajoutés. Nouveau solde: ${result.new_balance} MAD`
          );
          setOpen(false);
          setAmount('100');
          setReason('admin_topup');
          onSuccess?.();
        } else {
          toast.error(
            isRTL 
              ? result.message || 'فشل العملية'
              : result.message || 'Opération échouée'
          );
        }
      }
    } catch (error) {
      console.error('Error topping up wallet:', error);
      toast.error(isRTL ? 'حدث خطأ' : 'Une erreur s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Wallet className="h-4 w-4 mr-2" />
          {isRTL ? 'شحن' : 'Recharger'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isRTL ? 'شحن المحفظة' : 'Recharger la wallet'}
          </DialogTitle>
          <DialogDescription>
            {isRTL 
              ? `شحن محفظة ${userName}`
              : `Recharger la wallet de ${userName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">
              {isRTL ? 'المبلغ (درهم)' : 'Montant (MAD)'}
            </Label>
            <Input
              id="amount"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={isRTL ? 'أدخل المبلغ' : 'Entrez le montant'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              {isRTL ? 'السبب (اختياري)' : 'Raison (optionnel)'}
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isRTL ? 'سبب الشحن' : 'Raison de la recharge'}
              rows={3}
            />
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              {isRTL 
                ? '⚠️ سيتم إضافة هذا المبلغ إلى رصيد المستخدم فوراً'
                : '⚠️ Ce montant sera ajouté immédiatement au solde de l\'utilisateur'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            {isRTL ? 'إلغاء' : 'Annuler'}
          </Button>
          <Button onClick={handleTopup} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isRTL ? 'جاري الشحن...' : 'Recharge...'}
              </>
            ) : (
              <>
                {isRTL ? 'تأكيد الشحن' : 'Confirmer la recharge'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
