/**
 * WalletDisplay Component
 * 
 * Shows user's wallet balance and recent transactions.
 * Used in artisan dashboard and user profile.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, RefreshCw, ArrowUpCircle, ArrowDownCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  amount_mad: number;
  reason: string;
  created_at: string;
  meta?: any;
}

export default function WalletDisplay() {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWalletData = async () => {
    if (!user) return;

    try {
      // Fetch balance
      const { data: balanceData, error: balanceError } = await supabase.rpc('get_my_wallet_balance');

      if (balanceError) {
        console.error('Error fetching wallet balance:', balanceError);
        toast.error(isRTL ? 'فشل تحميل الرصيد' : 'Échec du chargement du solde');
        return;
      }

      if (balanceData && balanceData.length > 0) {
        setBalance(balanceData[0].balance_mad);
      } else {
        setBalance(0);
      }

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('wallet_transactions')
        .select('id, amount_mad, reason, created_at, meta')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
      } else {
        setTransactions(transactionsData || []);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWalletData();
  };

  const formatReason = (reason: string) => {
    const reasonMap: Record<string, { fr: string; ar: string }> = {
      contact_reveal: { fr: 'Révélation de contact', ar: 'كشف الهاتف' },
      admin_topup: { fr: 'Recharge admin', ar: 'شحن من الإدارة' },
      boost_fee: { fr: 'Frais de boost', ar: 'رسوم التعزيز' },
    };

    const mapped = reasonMap[reason];
    return mapped ? (isRTL ? mapped.ar : mapped.fr) : reason;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Balance Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              <CardTitle>{isRTL ? 'محفظتي' : 'Ma Wallet'}</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <CardDescription>
            {isRTL ? 'رصيدك الحالي في النظام' : 'Votre solde actuel dans le système'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-2">
            {isRTL ? 'الرصيد:' : 'Solde :'}
          </div>
          <div className="text-4xl font-bold text-primary">
            {balance !== null ? `${balance}` : '...'} {balance !== null && (isRTL ? 'درهم' : 'MAD')}
          </div>
          {balance === 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              {isRTL 
                ? 'مازال ماعندكش رصيد.'
                : 'Vous n\'avez pas encore de solde.'}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {isRTL 
              ? 'التعبئة كتدار يدوياً من طرف الإدارة حالياً.'
              : 'Le rechargement est manuel (par l\'admin) pour le moment.'}
          </p>
        </CardContent>
      </Card>

      {/* Transactions Card */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{isRTL ? 'آخر المعاملات' : 'Transactions récentes'}</CardTitle>
            <CardDescription>
              {isRTL ? 'آخر 10 معاملات' : 'Les 10 dernières transactions'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const isCredit = transaction.amount_mad > 0;
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {isCredit ? (
                        <ArrowUpCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">{formatReason(transaction.reason)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleString(isRTL ? 'ar-MA' : 'fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className={`font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                      {isCredit ? '+' : ''}{transaction.amount_mad} MAD
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
