import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { isMonetizationEnabled } from '@/lib/platformSettings';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Briefcase, Loader2, Settings, AlertCircle, Wallet, TrendingUp } from 'lucide-react';
import WalletDisplay from '@/components/monetization/WalletDisplay';
import BoostToggle from '@/components/monetization/BoostToggle';

interface ArtisanProfile {
  id: string;
  business_name: string;
  is_verified: boolean;
  is_active: boolean;
  is_boosted: boolean;
}

export default function ArtisanDashboard() {
  const { isRTL } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ArtisanProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [monetizationOn, setMonetizationOn] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?next=/dashboard/artisan');
    }
  }, [user, authLoading, navigate]);

  // Check if user has an artisan profile and load monetization settings
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Fetch artisan profile
        const { data, error } = await supabase
          .from('artisan_profiles')
          .select('id, business_name, is_verified, is_active, is_boosted')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          setProfile(null);
          setLoading(false);
          navigate('/artisan/onboarding');
          return;
        }

        if (!data) {
          setProfile(null);
          navigate('/artisan/onboarding');
          return;
        }

        setProfile(data);

        // Check monetization settings
        const monetizationEnabled = await isMonetizationEnabled();
        setMonetizationOn(monetizationEnabled);

        // Ensure wallet exists
        await supabase.rpc('ensure_wallet_exists', { target_user_id: user.id });

        setLoading(false);
      } catch (err) {
        setProfile(null);
        setLoading(false);
      }
    };

    if (user) {
      checkProfile();
    }
  }, [user, navigate]);

  if (authLoading || loading) {
    return (
      <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="flex-1 flex items-center justify-center pt-24 pb-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return null; // Will be redirected to onboarding
  }

  return (
    <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-5xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-semibold text-foreground">
                {isRTL ? 'لوحة تحكم مزود الخدمة' : 'Tableau de bord artisan'}
              </h1>
              {user && profile && (
                <p className="text-muted-foreground mt-1">
                  {isRTL ? 'مرحباً' : 'Bienvenue'}, {profile.business_name}
                </p>
              )}
            </div>
            <Button asChild variant="outline">
              <Link to="/artisan/onboarding">
                <Settings className="h-4 w-4" />
                {isRTL ? 'تحديث الملف الشخصي' : 'Modifier le profil'}
              </Link>
            </Button>
          </div>

          {/* Pending Verification Banner */}
          {profile && !profile.is_verified && (
            <Alert className="mb-6 bg-yellow-50 dark:bg-yellow-950 border-yellow-300">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                {isRTL 
                  ? 'حسابك باقي ما تراجعش من طرف الإدارة. غادي يبان للناس منين يتأكّد.'
                  : 'Votre profil est en attente de validation. Il sera visible après vérification.'}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content - Profile Status */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Status Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>
                        {isRTL ? 'حالة الملف الشخصي' : 'Statut du profil'}
                      </CardTitle>
                      <CardDescription>
                        {profile.is_verified 
                          ? (isRTL ? 'نشط ومُفعّل' : 'Actif et vérifié')
                          : (isRTL ? 'بانتظار المراجعة' : 'En attente de validation')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? 'الحالة' : 'Statut'}
                      </p>
                      <p className="text-lg font-semibold">
                        {profile.is_verified 
                          ? (isRTL ? '✅ مُفعّل' : '✅ Vérifié')
                          : (isRTL ? '⏳ بالانتظار' : '⏳ En attente')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? 'الظهور' : 'Visibilité'}
                      </p>
                      <p className="text-lg font-semibold">
                        {profile.is_active 
                          ? (isRTL ? '👁️ مرئي' : '👁️ Visible')
                          : (isRTL ? '🔒 مخفي' : '🔒 Masqué')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Boost Toggle (only show when monetization is ON) */}
              {monetizationOn && profile && (
                <BoostToggle
                  artisanProfileId={profile.id}
                  currentBoostStatus={profile.is_boosted}
                  onBoostChange={(isBoosted) => {
                    setProfile((prev) => prev ? { ...prev, is_boosted: isBoosted } : null);
                  }}
                />
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? 'الإجراءات السريعة' : 'Actions rapides'}</CardTitle>
                  <CardDescription>
                    {isRTL
                      ? 'إدارة خدماتك وطلباتك'
                      : 'Gérez vos services et demandes'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link to="/artisan/services">
                      <Briefcase className="h-4 w-4 mr-2" />
                      {isRTL ? 'إدارة الخدمات' : 'Gérer les services'}
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link to="/artisan/requests">
                      <Briefcase className="h-4 w-4 mr-2" />
                      {isRTL ? 'الطلبات المعينة' : 'Demandes assignées'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Wallet (only show when monetization is ON) */}
            <div className="lg:col-span-1">
              {monetizationOn ? (
                <WalletDisplay />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {isRTL ? 'المحفظة' : 'Portefeuille'}
                    </CardTitle>
                    <CardDescription>
                      {isRTL 
                        ? 'النظام المالي موقّف حالياً'
                        : 'Système monétaire désactivé'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {isRTL 
                        ? 'التعبئة والأداء موقّفين حالياً.'
                        : 'Les fonctionnalités de paiement sont désactivées.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Coming Soon Notice */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>
                    {isRTL ? 'لوحة تحكم مزود الخدمة' : 'Tableau de bord artisan'}
                  </CardTitle>
                  <CardDescription>
                    {isRTL
                      ? 'إدارة خدماتك وعروضك والمحفظة'
                      : 'Gérez vos services, boosts et portefeuille'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                {isRTL
                  ? 'هذه اللوحة قيد التطوير. قريباً ستتمكن من:'
                  : 'Ce tableau de bord est en cours de développement. Bientôt vous pourrez:'}
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {isRTL ? 'تعزيز ظهورك' : 'Booster votre visibilité'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isRTL
                        ? 'استخدم النقاط لتعزيز ملفك الشخصي وظهوره في نتائج البحث'
                        : 'Utilisez des points pour mettre en avant votre profil dans les résultats'}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Wallet className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {isRTL ? 'إدارة محفظتك' : 'Gérer votre portefeuille'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isRTL
                        ? 'تتبع نقاطك وإدارة اشتراكاتك'
                        : 'Suivez vos points et gérez vos abonnements'}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Briefcase className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {isRTL ? 'عرض الطلبات' : 'Voir les demandes'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isRTL
                        ? 'تلقي طلبات عروض الأسعار من العملاء والرد عليها'
                        : 'Recevez et répondez aux demandes de devis des clients'}
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Placeholder Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  {isRTL ? 'الطلبات النشطة' : 'Demandes actives'}
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  {isRTL ? 'قريباً' : 'Bientôt disponible'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  {isRTL ? 'نقاط التعزيز' : 'Points boost'}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  {isRTL ? 'قريباً' : 'Bientôt disponible'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  {isRTL ? 'المحفظة' : 'Portefeuille'}
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0 MAD</div>
                <p className="text-xs text-muted-foreground">
                  {isRTL ? 'قريباً' : 'Bientôt disponible'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
