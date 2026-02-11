import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Loader2, Wallet, TrendingUp, Settings } from 'lucide-react';

export default function ArtisanDashboard() {
  const { isRTL } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?next=/dashboard/artisan');
    }
  }, [user, authLoading, navigate]);

  // Check if user has an artisan profile
  useEffect(() => {
    const checkProfile = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('artisan_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking artisan profile:', error);
          setHasProfile(false);
          setLoading(false);
          return;
        }

        setHasProfile(!!data);
        setLoading(false);

        // Redirect to onboarding if no profile exists
        if (!data) {
          navigate('/artisan/onboarding');
        }
      } catch (err) {
        console.error('Exception checking profile:', err);
        setHasProfile(false);
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

  if (!hasProfile) {
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
              {user && (
                <p className="text-muted-foreground mt-1">
                  {isRTL ? 'مرحباً' : 'Bienvenue'}, {user.email}
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
