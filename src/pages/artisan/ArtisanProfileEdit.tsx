/**
 * Artisan Profile Edit Page
 * Allows artisans to update their profile, avatar, and services
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import AvatarUpload from '@/components/artisan/AvatarUpload';
import MultiServiceSelector from '@/components/artisan/MultiServiceSelector';

// Timeout constant for profile loading
const PROFILE_LOAD_TIMEOUT_MS = 8000; // 8 seconds max

interface ArtisanProfile {
  id: string;
  user_id: string;
  service_category_id: string;
  business_name: string;
  description_fr: string | null;
  description_ar: string | null;
  city_id: number;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_active: boolean;
}

interface City {
  id: number;
  name_fr: string;
  name_ar: string;
}

export default function ArtisanProfileEdit() {
  const { isRTL } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ArtisanProfile | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    business_name: '',
    description_fr: '',
    description_ar: '',
    phone: '',
    whatsapp: '',
    email: '',
    avatar_url: '',
  });

  const [selectedServices, setSelectedServices] = useState<any[]>([]);

  const handleRetry = () => {
    // Force a re-fetch by toggling loading state
    setLoading(true);
    setLoadingError(null);
    // The useEffect will re-run because we're changing the loading state
    // But we need to trigger fetchData again, so let's use a key state
    window.location.reload();
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?next=/artisan/profile/edit');
    }
  }, [user, authLoading, navigate]);

  // Load profile and cities with timeout protection
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let cancelled = false;

    const fetchData = async () => {
      if (!user) return;

      setLoading(true);
      setLoadingError(null);

      // Set a timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        if (!cancelled && loading) {
          console.error('Profile loading timeout exceeded');
          setLoading(false);
          setLoadingError(
            isRTL
              ? 'انتهت مهلة تحميل الملف الشخصي. يرجى المحاولة مرة أخرى.'
              : 'Le chargement du profil a expiré. Veuillez réessayer.'
          );
        }
      }, PROFILE_LOAD_TIMEOUT_MS);

      try {
        // Fetch artisan profile
        const { data: profileData, error: profileError } = await supabase
          .from('artisan_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (cancelled) return;

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          throw new Error(profileError.message || 'Failed to load profile');
        }

        if (!profileData) {
          toast.error(isRTL ? 'الملف الشخصي غير موجود' : 'Profil non trouvé');
          navigate('/artisan/onboarding');
          return;
        }

        setProfile(profileData);
        setFormData({
          business_name: profileData.business_name || '',
          description_fr: profileData.description_fr || '',
          description_ar: profileData.description_ar || '',
          phone: profileData.phone || '',
          whatsapp: profileData.whatsapp || '',
          email: profileData.email || '',
          avatar_url: profileData.avatar_url || '',
        });

        // Fetch cities
        const { data: citiesData, error: citiesError } = await supabase
          .from('cities')
          .select('id, name_fr, name_ar')
          .eq('is_active', true)
          .order('name_fr', { ascending: true });

        if (cancelled) return;

        if (citiesError) {
          console.error('Error fetching cities:', citiesError);
          throw new Error(citiesError.message || 'Failed to load cities');
        }

        setCities(citiesData || []);
        setLoadingError(null);
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching data:', err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : isRTL
            ? 'خطأ في تحميل البيانات'
            : 'Erreur de chargement';
        setLoadingError(errorMessage);
        toast.error(errorMessage);
      } finally {
        if (!cancelled) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [user, isRTL, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAvatarUpload = (url: string) => {
    setFormData(prev => ({ ...prev, avatar_url: url }));
  };

  const handleAvatarRemove = () => {
    setFormData(prev => ({ ...prev, avatar_url: '' }));
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    setSaving(true);

    try {
      // Update artisan profile
      const { error: profileError } = await supabase
        .from('artisan_profiles')
        .update({
          business_name: formData.business_name,
          description_fr: formData.description_fr || null,
          description_ar: formData.description_ar || null,
          phone: formData.phone,
          whatsapp: formData.whatsapp || null,
          email: formData.email || null,
          avatar_url: formData.avatar_url || null,
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // Update services using RPC function
      if (selectedServices.length > 0) {
        const { error: servicesError } = await supabase.rpc('upsert_artisan_services', {
          artisan_user_id: user.id,
          services: selectedServices,
        });

        if (servicesError) throw servicesError;
      }

      toast.success(isRTL ? 'تم حفظ التغييرات بنجاح' : 'Modifications enregistrées avec succès');
      navigate('/dashboard/artisan');
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error(isRTL ? 'فشل حفظ التغييرات' : 'Échec de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="flex-1 flex items-center justify-center pt-24 pb-16">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">
              {isRTL ? 'جاري تحميل الملف الشخصي...' : 'Chargement du profil...'}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show error state with retry and go back options
  if (loadingError) {
    return (
      <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="flex-1 flex items-center justify-center pt-24 pb-16">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">
                  {isRTL ? 'تعذر تحميل الملف الشخصي' : 'Impossible de charger le profil'}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {loadingError}
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button onClick={handleRetry} className="w-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {isRTL ? 'إعادة المحاولة' : 'Réessayer'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard/artisan')}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {isRTL ? 'العودة' : 'Retour'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) return null;

  const currentCity = cities.find(c => c.id === profile.city_id);

  return (
    <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold text-foreground">
              {isRTL ? 'تحديث الملف الشخصي' : 'Modifier le profil'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL
                ? 'تحديث معلومات ملفك الشخصي والخدمات'
                : 'Mettez à jour vos informations et services'}
            </p>
          </div>

          <div className="space-y-6">
            {/* Avatar Section */}
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'صورة الملف الشخصي' : 'Photo de profil'}</CardTitle>
                <CardDescription>
                  {isRTL
                    ? 'أضف صورة لملفك الشخصي لتبدو أكثر احترافية'
                    : 'Ajoutez une photo pour un profil plus professionnel'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AvatarUpload
                  currentAvatarUrl={formData.avatar_url}
                  userId={user!.id}
                  userName={formData.business_name}
                  onUploadSuccess={handleAvatarUpload}
                  onRemove={handleAvatarRemove}
                  size="xl"
                />
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'المعلومات الأساسية' : 'Informations de base'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">
                    {isRTL ? 'اسم العمل' : 'Nom de l\'entreprise'} *
                  </Label>
                  <Input
                    id="business_name"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description_fr">
                    {isRTL ? 'الوصف (فرنسي)' : 'Description (français)'}
                  </Label>
                  <Textarea
                    id="description_fr"
                    name="description_fr"
                    value={formData.description_fr}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder={
                      isRTL
                        ? 'صف خدماتك وخبراتك...'
                        : 'Décrivez vos services et votre expérience...'
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description_ar">
                    {isRTL ? 'الوصف (عربي)' : 'Description (arabe)'}
                  </Label>
                  <Textarea
                    id="description_ar"
                    name="description_ar"
                    value={formData.description_ar}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder={isRTL ? 'وصف الخدمات...' : 'Description des services...'}
                    dir="rtl"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'معلومات الاتصال' : 'Coordonnées'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">{isRTL ? 'الهاتف' : 'Téléphone'} *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+212 6XX XXX XXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">{isRTL ? 'واتساب' : 'WhatsApp'}</Label>
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    type="tel"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    placeholder="+212 6XX XXX XXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="contact@example.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Services Section */}
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'الخدمات' : 'Services'}</CardTitle>
                <CardDescription>
                  {isRTL
                    ? 'اختر حتى 5 خدمات تقدمها (يمكنك تغييرها لاحقاً)'
                    : 'Sélectionnez jusqu\'à 5 services que vous offrez (modifiable ultérieurement)'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentCity && (
                  <MultiServiceSelector
                    userId={user!.id}
                    currentCity={currentCity.name_fr}
                    onServicesChange={setSelectedServices}
                    maxServices={5}
                  />
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/artisan')}
                disabled={saving}
              >
                {isRTL ? 'إلغاء' : 'Annuler'}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isRTL ? 'جاري الحفظ...' : 'Enregistrement...'}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isRTL ? 'حفظ التغييرات' : 'Enregistrer'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
