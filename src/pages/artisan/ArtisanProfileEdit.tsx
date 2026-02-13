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
import { Loader2, Save } from 'lucide-react';
import AvatarUpload from '@/components/artisan/AvatarUpload';
import MultiServiceSelector from '@/components/artisan/MultiServiceSelector';

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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?next=/artisan/profile/edit');
    }
  }, [user, authLoading, navigate]);

  // Load profile and cities
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);

      try {
        // Fetch artisan profile
        const { data: profileData, error: profileError } = await supabase
          .from('artisan_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;

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

        if (citiesError) throw citiesError;

        setCities(citiesData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error(isRTL ? 'خطأ في تحميل البيانات' : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
