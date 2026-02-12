/**
 * Artisan Pending Verification Page
 * Shows when artisan profile is submitted but not yet verified
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/core/auth/useAuth';
import { getOnboardingState } from '@/features/artisans/application/artisanOnboardingService';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, CheckCircle } from 'lucide-react';

export default function ArtisanPending() {
  const { user, profile, profileReady } = useAuth();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | null>(null);

  useEffect(() => {
    async function checkStatus() {
      if (!user || !profileReady) return;

      const state = await getOnboardingState(user.id);
      
      if (state.status === 'verified') {
        // Artisan is now verified, redirect to dashboard
        navigate('/dashboard/artisan', { replace: true });
      } else if (state.status === 'pending') {
        setVerificationStatus('pending');
      } else if (!state.hasExistingProfile) {
        // No profile, redirect to onboarding
        navigate('/artisan/onboarding', { replace: true });
      }

      setLoading(false);
    }

    checkStatus();
  }, [user, profileReady, navigate]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-12 min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-12 min-h-screen">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {verificationStatus === 'pending' ? (
                <Clock className="h-16 w-16 text-yellow-500" />
              ) : (
                <CheckCircle className="h-16 w-16 text-green-500" />
              )}
            </div>
            <CardTitle>
              {isRTL ? 'في انتظار التحقق' : 'En attente de vérification'}
            </CardTitle>
            <CardDescription>
              {isRTL
                ? 'شكراً لتسجيلك كحرفي. سيتم مراجعة ملفك الشخصي من قبل فريقنا.'
                : 'Merci pour votre inscription en tant qu\'artisan. Votre profil est en cours de vérification par notre équipe.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">
                {isRTL ? 'ماذا يحدث الآن؟' : 'Que se passe-t-il maintenant ?'}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>
                    {isRTL
                      ? 'يقوم فريقنا بمراجعة معلومات عملك'
                      : 'Notre équipe examine vos informations professionnelles'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>
                    {isRTL
                      ? 'يتم التحقق من صحة بياناتك'
                      : 'Nous vérifions l\'exactitude de vos données'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>
                    {isRTL
                      ? 'ستتلقى إشعاراً عند الموافقة على ملفك'
                      : 'Vous recevrez une notification une fois approuvé'}
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                {isRTL ? 'المدة المتوقعة' : 'Délai estimé'}
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {isRTL
                  ? 'عادة ما تستغرق عملية التحقق من 24 إلى 48 ساعة. سنبلغك عبر البريد الإلكتروني.'
                  : 'La vérification prend généralement 24 à 48 heures. Nous vous préviendrons par email.'}
              </p>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                {isRTL ? 'العودة إلى لوحة القيادة' : 'Retour au tableau de bord'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
}
