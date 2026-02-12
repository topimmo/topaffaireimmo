import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Plus,
  Image as ImageIcon,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  LogIn,
  Megaphone,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BannerSlot {
  id: number;
  name_en: string;
  name_fr: string;
  name_ar: string;
  page: string;
  position: string;
  size: string;
  description_en: string;
  description_fr: string;
  description_ar: string;
}

interface BannerRequest {
  id: string;
  company_name: string;
  contact_email: string;
  duration_days: number;
  price: number;
  banner_image_url: string;
  target_url: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  slot: BannerSlot;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
};

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  approved: CheckCircle,
  active: CheckCircle,
  rejected: XCircle,
  expired: AlertCircle,
};

const pricing = [
  { days: 7, price: 800 },
  { days: 15, price: 1400 },
  { days: 30, price: 2500 },
];

export default function Advertising() {
  const { t, language, isRTL } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [slots, setSlots] = useState<BannerSlot[]>([]);
  const [requests, setRequests] = useState<BannerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch user profile
  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfileLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          const isRlsBlocked = error.code === '42501' || error.message?.toLowerCase().includes('permission');
          console.error('Error fetching profile:', error);
          if (isRlsBlocked) {
            toast.error(isRTL ? 'سياسة الأمان منعت تحميل ملفك الشخصي (RLS).' : 'RLS/policy blocked profiles.');
          }
        } else if (data) {
          setProfile(data);
        } else {
          // Profile doesn't exist - should have been created by trigger
          console.warn('[Advertising] Profile missing for authenticated user, creating with default role...', {
            userId: user.id,
            email: user.email,
          });
          
          const { data: created, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
              user_role: 'user', // Default role - user must explicitly upgrade
              google_id: user.user_metadata?.google_id || null,
            })
            .select('*')
            .single();

          if (createError) {
            console.error('[Advertising] Error auto-creating profile:', createError);
            const isRlsBlocked = createError.code === '42501';
            if (isRlsBlocked) {
              toast.error(isRTL ? 'سياسة الأمان منعت إنشاء ملفك الشخصي (RLS).' : 'RLS/policy blocked profiles.');
            }
          } else if (created) {
            setProfile(created);
            console.log('[Advertising] Successfully created missing profile with user role');
            // Note: User has 'user' role - may need to upgrade to access commercial features
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setProfileLoading(false);
      }
    }
    
    fetchProfile();
  }, [user]);

  // Redirect real estate advertisers away from commercial advertising
  useEffect(() => {
    if (!authLoading && !profileLoading && profile && profile.user_role === 'real_estate_advertiser') {
      navigate('/dashboard');
    }
  }, [authLoading, profileLoading, profile, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    } else if (!authLoading && !profileLoading) {
      setLoading(false);
    }
  }, [user, authLoading, profileLoading]);

  const fetchData = async () => {
    setLoading(true);
    
    const [slotsRes, requestsRes] = await Promise.all([
      supabase.from('banner_slots').select('*').eq('is_active', true),
      supabase
        .from('banner_requests')
        .select(`
          *,
          slot:banner_slots(*)
        `)
        .eq('advertiser_id', user!.id)
        .order('created_at', { ascending: false }),
    ]);

    if (slotsRes.data) setSlots(slotsRes.data);
    if (requestsRes.data) setRequests(requestsRes.data as unknown as BannerRequest[]);
    
    setLoading(false);
  };

  const getSlotName = (slot: BannerSlot) => {
    if (language === 'ar') return slot.name_ar;
    return slot.name_fr;
  };

  const getSlotDescription = (slot: BannerSlot) => {
    if (language === 'ar') return slot.description_ar;
    return slot.description_fr;
  };

  const getStatusLabel = (status: string) => {
    return t(`advertising.${status}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-MA');
  };

  const getPageLabel = (page: string) => {
    const labels: Record<string, Record<string, string>> = {
      home: { fr: 'Page d\'accueil', ar: 'الصفحة الرئيسية' },
      search: { fr: 'Résultats de recherche', ar: 'نتائج البحث' },
      property_details: { fr: 'Détails du bien', ar: 'تفاصيل العقار' },
    };
    return labels[page]?.[language === 'ar' ? 'ar' : 'fr'] || page;
  };

  if (authLoading || profileLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Show login message for non-authenticated users
  if (!user) {
    return (
      <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="flex-1 flex items-center justify-center pt-20 px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <LogIn className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground mb-4">
              {t('advertising.loginRequired')}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t('advertising.loginMessage')}
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link to="/login" state={{ from: '/advertising' }}>
                  {t('nav.login')}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/register">{t('nav.register')}</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
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
                {t('advertising.dashboard')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isRTL 
                  ? 'أعلن عن عملك على TopAffaireImmo'
                  : 'Faites la promotion de votre entreprise sur TopAffaireImmo'}
              </p>
            </div>
            <Button asChild>
              <Link to="/advertising/new">
                <Plus className="h-4 w-4" />
                {t('advertising.newRequest')}
              </Link>
            </Button>
          </div>

          <Tabs defaultValue="ads" className="space-y-6">
            <TabsList>
              <TabsTrigger value="ads">{t('advertising.myAds')}</TabsTrigger>
              <TabsTrigger value="slots">{t('advertising.availableSlots')}</TabsTrigger>
              <TabsTrigger value="pricing">{t('advertising.pricing')}</TabsTrigger>
            </TabsList>

            {/* My Ads Tab */}
            <TabsContent value="ads" className="space-y-4">
              {requests.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Megaphone className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                    {t('advertising.noAds')}
                  </h2>
                  <p className="text-muted-foreground mb-6">{t('advertising.createFirst')}</p>
                  <Button asChild>
                    <Link to="/advertising/new">
                      <Plus className="h-4 w-4" />
                      {t('advertising.newRequest')}
                    </Link>
                  </Button>
                </div>
              ) : (
                requests.map((request) => {
                  const StatusIcon = statusIcons[request.status] || Clock;
                  return (
                    <div
                      key={request.id}
                      className="bg-white rounded-xl border p-4 sm:p-6 flex flex-col sm:flex-row gap-4"
                    >
                      {/* Banner Preview */}
                      <div className="w-full sm:w-48 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {request.banner_image_url ? (
                          <img
                            src={request.banner_image_url}
                            alt={request.company_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge
                            variant="secondary"
                            className={cn('font-normal', statusColors[request.status])}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {getStatusLabel(request.status)}
                          </Badge>
                          <Badge variant="outline" className="font-normal">
                            {request.duration_days} {t('advertising.days')}
                          </Badge>
                        </div>

                        <h3 className="font-display text-lg font-semibold text-foreground">
                          {request.company_name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {getSlotName(request.slot)}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>
                            {t('advertising.price')}: <strong>{formatPrice(request.price)} MAD</strong>
                          </span>
                          {request.start_date && (
                            <span>
                              {t('advertising.startDate')}: {formatDate(request.start_date)}
                            </span>
                          )}
                          {request.end_date && (
                            <span>
                              {t('advertising.endDate')}: {formatDate(request.end_date)}
                            </span>
                          )}
                        </div>

                        {request.target_url && (
                          <a
                            href={request.target_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {request.target_url}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>

            {/* Available Slots Tab */}
            <TabsContent value="slots" className="space-y-4">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="bg-white rounded-xl border p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                        {getSlotName(slot)}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {getSlotDescription(slot)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {t('advertising.page')}: {getPageLabel(slot.page)}
                        </Badge>
                        <Badge variant="outline">
                          {t('advertising.size')}: {slot.size}
                        </Badge>
                      </div>
                    </div>
                    <Button asChild size="sm">
                      <Link to={`/advertising/new?slot=${slot.id}`}>
                        {isRTL ? 'حجز هذا الموقع' : 'Réserver'}
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing">
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-display text-xl font-semibold text-foreground mb-6">
                  {t('advertising.pricing')}
                </h3>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {pricing.map((tier) => (
                    <div
                      key={tier.days}
                      className="rounded-xl border-2 p-6 text-center hover:border-primary transition-colors"
                    >
                      <p className="text-3xl font-display font-semibold text-primary mb-1">
                        {tier.days}
                      </p>
                      <p className="text-muted-foreground mb-4">
                        {t('advertising.days')}
                      </p>
                      <p className="font-mono-price text-2xl font-bold text-foreground">
                        {formatPrice(tier.price)} <span className="text-sm font-normal">MAD</span>
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">{t('advertising.bankTransfer')}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {isRTL 
                      ? 'يرجى إجراء تحويل بنكي إلى الحساب التالي وإرفاق إثبات الدفع مع طلبك:'
                      : 'Veuillez effectuer un virement bancaire au compte suivant et joindre la preuve de paiement à votre demande:'}
                  </p>
                  <div className="bg-white rounded p-3 text-sm font-mono">
                    <p>IBAN: MA64 XXX XXXX XXXX XXXX XXXX XXX</p>
                    <p>BIC: XXXXXXXX</p>
                    <p>{isRTL ? 'المستفيد' : 'Bénéficiaire'}: TopAffaireImmo SARL</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
