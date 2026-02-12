/**
 * Artisan Onboarding Page (Refactored with Clean Architecture)
 * Uses artisanOnboardingService for business logic
 * Persists state to DB for resumable onboarding
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle, Briefcase } from 'lucide-react';
import { 
  getOnboardingState, 
  submitForVerification 
} from '@/features/artisans/application/artisanOnboardingService';
import type { ArtisanProfileCreateInput } from '@/features/artisans/domain/types';
import { RequireAuth } from '@/core/routing/guards/RequireAuth';
import { RequireProfileReady } from '@/core/routing/guards/RequireProfileReady';

interface ServiceCategory {
  id: string;
  name_fr: string;
  name_ar: string;
  slug: string;
}

interface City {
  id: number;
  name_fr: string;
  name_ar: string;
}

interface Neighborhood {
  id: number;
  city_id: number;
  name_fr: string;
  name_ar: string;
}

function ArtisanOnboardingContent() {
  const { isRTL } = useLanguage();
  const { user, profile, profileReady, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    service_category_id: '',
    business_name: '',
    description_fr: '',
    description_ar: '',
    city_id: '',
    phone: '',
    whatsapp: '',
    email: '',
  });
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<number[]>([]);

  // Check onboarding state on mount
  useEffect(() => {
    async function checkOnboardingState() {
      if (!user || !profileReady) return;

      try {
        const state = await getOnboardingState(user.id);

        if (state.status === 'verified') {
          // Already verified, go to dashboard
          navigate('/dashboard/artisan', { replace: true });
          return;
        }

        if (state.status === 'pending') {
          // Waiting for verification
          navigate('/artisan/pending', { replace: true });
          return;
        }

        // If has existing profile but not verified, pre-fill form
        if (state.hasExistingProfile && state.categoryId) {
          setFormData(prev => ({
            ...prev,
            service_category_id: state.categoryId || '',
          }));
        }
      } catch (err) {
        console.error('Error checking onboarding state:', err);
      }
    }

    checkOnboardingState();
  }, [user, profileReady, navigate]);

  // Load service categories and cities
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch service categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('service_categories')
          .select('id, name_fr, name_ar, slug')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (categoriesError) {
          setError(isRTL ? 'خطأ في تحميل فئات الخدمات' : 'Erreur lors du chargement des catégories');
          setLoading(false);
          return;
        }

        setServiceCategories(categoriesData || []);

        // Fetch cities
        const { data: citiesData, error: citiesError } = await supabase
          .from('cities')
          .select('id, name_fr, name_ar')
          .eq('is_active', true)
          .order('name_fr', { ascending: true });

        if (citiesError) {
          setError(isRTL ? 'خطأ في تحميل المدن' : 'Erreur lors du chargement des villes');
          setLoading(false);
          return;
        }

        setCities(citiesData || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(isRTL ? 'حدث خطأ غير متوقع' : 'Une erreur inattendue s\'est produite');
        setLoading(false);
      }
    };

    fetchData();
  }, [isRTL]);

  // Load neighborhoods when city changes
  useEffect(() => {
    const fetchNeighborhoods = async () => {
      if (!formData.city_id) {
        setNeighborhoods([]);
        setSelectedNeighborhoods([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('neighborhoods')
          .select('id, city_id, name_fr, name_ar')
          .eq('city_id', parseInt(formData.city_id))
          .eq('is_active', true)
          .order('name_fr', { ascending: true });

        if (error) {
          console.error('Error fetching neighborhoods:', error);
          setNeighborhoods([]);
          return;
        }

        setNeighborhoods(data || []);
      } catch (err) {
        console.error('Error fetching neighborhoods:', err);
        setNeighborhoods([]);
      }
    };

    fetchNeighborhoods();
  }, [formData.city_id]);

  const handleNeighborhoodToggle = (neighborhoodId: number) => {
    setSelectedNeighborhoods(prev => 
      prev.includes(neighborhoodId)
        ? prev.filter(id => id !== neighborhoodId)
        : [...prev, neighborhoodId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error(isRTL ? 'يجب تسجيل الدخول' : 'Vous devez être connecté');
      return;
    }

    // Validation
    if (!formData.service_category_id || !formData.business_name || !formData.city_id || !formData.phone) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Veuillez remplir tous les champs requis');
      return;
    }

    if (selectedNeighborhoods.length === 0) {
      toast.error(isRTL ? 'يرجى اختيار حي واحد على الأقل' : 'Veuillez sélectionner au moins un quartier');
      return;
    }

    setSubmitting(true);

    try {
      const input: ArtisanProfileCreateInput = {
        service_category_id: formData.service_category_id,
        business_name: formData.business_name,
        description_fr: formData.description_fr,
        description_ar: formData.description_ar,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        email: formData.email,
        city_id: formData.city_id,
        neighborhood_ids: selectedNeighborhoods,
      };

      const result = await submitForVerification(user.id, input);

      if (!result.success) {
        toast.error(result.error || (isRTL ? 'فشل التسجيل' : 'Échec de l\'inscription'));
        setSubmitting(false);
        return;
      }

      toast.success(isRTL ? 'تم تقديم طلبك بنجاح!' : 'Votre demande a été soumise avec succès !');

      // Refresh profile to get updated artisan profile
      await refreshProfile();

      // Redirect to pending page
      navigate('/artisan/pending');
    } catch (err) {
      console.error('Error submitting artisan profile:', err);
      toast.error(isRTL ? 'حدث خطأ غير متوقع' : 'Une erreur inattendue s\'est produite');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-12 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isRTL ? 'جاري التحميل...' : 'Chargement...'}
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-12 min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <CardTitle>{isRTL ? 'خطأ' : 'Erreur'}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                {isRTL ? 'إعادة المحاولة' : 'Réessayer'}
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-12 min-h-screen">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">
                {isRTL ? 'التسجيل كحرفي' : 'Inscription en tant qu\'artisan'}
              </CardTitle>
            </div>
            <CardDescription>
              {isRTL
                ? 'املأ المعلومات التالية للتسجيل كحرفي على منصتنا'
                : 'Remplissez les informations suivantes pour vous inscrire en tant qu\'artisan sur notre plateforme'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Category */}
              <div>
                <Label htmlFor="service_category_id">
                  {isRTL ? 'فئة الخدمة' : 'Catégorie de service'} *
                </Label>
                <Select
                  value={formData.service_category_id}
                  onValueChange={(value) => setFormData({ ...formData, service_category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? 'اختر فئة' : 'Sélectionnez une catégorie'} />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {isRTL ? cat.name_ar : cat.name_fr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Business Name */}
              <div>
                <Label htmlFor="business_name">
                  {isRTL ? 'اسم العمل' : 'Nom de l\'entreprise'} *
                </Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder={isRTL ? 'أدخل اسم عملك' : 'Entrez le nom de votre entreprise'}
                  required
                />
              </div>

              {/* Description FR */}
              <div>
                <Label htmlFor="description_fr">
                  {isRTL ? 'الوصف (بالفرنسية)' : 'Description (Français)'}
                </Label>
                <Textarea
                  id="description_fr"
                  value={formData.description_fr}
                  onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
                  placeholder={isRTL ? 'صف خدماتك بالفرنسية' : 'Décrivez vos services en français'}
                  rows={3}
                />
              </div>

              {/* Description AR */}
              <div>
                <Label htmlFor="description_ar">
                  {isRTL ? 'الوصف (بالعربية)' : 'Description (Arabe)'}
                </Label>
                <Textarea
                  id="description_ar"
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  placeholder={isRTL ? 'صف خدماتك بالعربية' : 'Décrivez vos services en arabe'}
                  rows={3}
                  dir="rtl"
                />
              </div>

              {/* City */}
              <div>
                <Label htmlFor="city_id">
                  {isRTL ? 'المدينة' : 'Ville'} *
                </Label>
                <Select
                  value={formData.city_id}
                  onValueChange={(value) => setFormData({ ...formData, city_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? 'اختر مدينة' : 'Sélectionnez une ville'} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id.toString()}>
                        {isRTL ? city.name_ar : city.name_fr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Neighborhoods */}
              {formData.city_id && neighborhoods.length > 0 && (
                <div>
                  <Label>
                    {isRTL ? 'الأحياء التي تخدمها' : 'Quartiers desservis'} *
                  </Label>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-2 border rounded">
                    {neighborhoods.map((neighborhood) => (
                      <div key={neighborhood.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`neighborhood-${neighborhood.id}`}
                          checked={selectedNeighborhoods.includes(neighborhood.id)}
                          onCheckedChange={() => handleNeighborhoodToggle(neighborhood.id)}
                        />
                        <label
                          htmlFor={`neighborhood-${neighborhood.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {isRTL ? neighborhood.name_ar : neighborhood.name_fr}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phone */}
              <div>
                <Label htmlFor="phone">
                  {isRTL ? 'رقم الهاتف' : 'Téléphone'} *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={isRTL ? 'أدخل رقم هاتفك' : 'Entrez votre numéro de téléphone'}
                  required
                />
              </div>

              {/* WhatsApp */}
              <div>
                <Label htmlFor="whatsapp">
                  {isRTL ? 'واتساب' : 'WhatsApp'}
                </Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder={isRTL ? 'رقم واتساب (اختياري)' : 'Numéro WhatsApp (optionnel)'}
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">
                  {isRTL ? 'البريد الإلكتروني' : 'Email'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={isRTL ? 'بريدك الإلكتروني (اختياري)' : 'Votre email (optionnel)'}
                />
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  disabled={submitting}
                >
                  {isRTL ? 'إلغاء' : 'Annuler'}
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isRTL ? 'جاري الإرسال...' : 'Envoi en cours...'}
                    </>
                  ) : (
                    <>{isRTL ? 'إرسال الطلب' : 'Soumettre la demande'}</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
}

export default function ArtisanOnboarding() {
  return (
    <RequireAuth>
      <RequireProfileReady>
        <ArtisanOnboardingContent />
      </RequireProfileReady>
    </RequireAuth>
  );
}
