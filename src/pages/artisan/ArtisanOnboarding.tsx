import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

export default function ArtisanOnboarding() {
  const { isRTL } = useLanguage();
  const { user, loading: authLoading } = useAuth();
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?next=/artisan/onboarding');
    }
  }, [user, authLoading, navigate]);

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

        setServiceCategories(categoriesData || []);
        setCities(citiesData || []);
        setLoading(false);
      } catch (err) {
        setError(isRTL ? 'حدث خطأ غير متوقع' : 'Une erreur inattendue s\'est produite');
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, isRTL]);

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
          .order('name_fr', { ascending: true });

        if (error) {
          return;
        }

        setNeighborhoods(data || []);
        setSelectedNeighborhoods([]); // Reset selection when city changes
      } catch (err) {
        // Silently handle neighborhood fetching errors
      }
    };

    fetchNeighborhoods();
  }, [formData.city_id]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNeighborhoodToggle = (neighborhoodId: number) => {
    setSelectedNeighborhoods((prev) =>
      prev.includes(neighborhoodId) ? prev.filter((id) => id !== neighborhoodId) : [...prev, neighborhoodId]
    );
  };

  const validateForm = (): boolean => {
    // Required fields
    if (!formData.service_category_id) {
      toast.error(isRTL ? 'يرجى اختيار فئة الخدمة' : 'Veuillez sélectionner une catégorie de service');
      return false;
    }
    if (!formData.business_name.trim()) {
      toast.error(isRTL ? 'يرجى إدخال اسم العمل' : 'Veuillez entrer le nom de l\'entreprise');
      return false;
    }
    if (!formData.city_id) {
      toast.error(isRTL ? 'يرجى اختيار المدينة' : 'Veuillez sélectionner une ville');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error(isRTL ? 'يرجى إدخال رقم الهاتف' : 'Veuillez entrer un numéro de téléphone');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('create_my_artisan_profile', {
        p_service_category_id: formData.service_category_id,
        p_business_name: formData.business_name,
        p_description_fr: formData.description_fr || null,
        p_description_ar: formData.description_ar || null,
        p_city_id: parseInt(formData.city_id),
        p_neighborhood_ids: selectedNeighborhoods.length > 0 ? selectedNeighborhoods : null,
        p_phone: formData.phone,
        p_whatsapp: formData.whatsapp || null,
        p_email: formData.email || null,
      });

      if (rpcError) {
        const errorMsg = isRTL
          ? `خطأ في إنشاء الملف الشخصي: ${rpcError.message}`
          : `Erreur lors de la création du profil: ${rpcError.message}`;
        setError(errorMsg);
        toast.error(errorMsg);
        setSubmitting(false);
        return;
      }

      // Show success message
      toast.success(isRTL ? 'تم إنشاء حسابك! دابا كاين فمرحلة المراجعة.' : 'Profil créé ! Il est en attente de validation.');
      navigate('/dashboard/artisan');
    } catch (err) {
      const errorMsg = isRTL ? 'حدث خطأ غير متوقع' : 'Une erreur inattendue s\'est produite';
      setError(errorMsg);
      toast.error(errorMsg);
      setSubmitting(false);
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

  return (
    <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-3xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              {isRTL ? 'إنشاء حساب حرفي' : 'Créer un profil prestataire'}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isRTL
                ? 'قم بإنشاء ملفك الشخصي كمزود خدمة وابدأ في تلقي طلبات العملاء'
                : 'Créez votre profil de prestataire et commencez à recevoir des demandes de clients'}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isRTL ? 'معلومات الملف الشخصي' : 'Informations du profil'}
              </CardTitle>
              <CardDescription>
                {isRTL
                  ? 'جميع الحقول المميزة بـ * إلزامية'
                  : 'Tous les champs marqués d\'un * sont obligatoires'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Service Category */}
                <div className="space-y-2">
                  <Label htmlFor="service_category">
                    {isRTL ? 'الحرفة' : 'Catégorie de service'} *
                  </Label>
                  <Select
                    value={formData.service_category_id}
                    onValueChange={(value) => handleInputChange('service_category_id', value)}
                  >
                    <SelectTrigger id="service_category">
                      <SelectValue
                        placeholder={isRTL ? 'اختر فئة الخدمة' : 'Sélectionnez une catégorie'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {isRTL ? category.name_ar : category.name_fr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Business Name */}
                <div className="space-y-2">
                  <Label htmlFor="business_name">
                    {isRTL ? 'الإسم التجاري' : 'Nom / Activité'} *
                  </Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    placeholder={
                      isRTL ? 'أدخل اسم عملك' : 'Entrez le nom de votre entreprise'
                    }
                  />
                </div>

                {/* City Select */}
                <div className="space-y-2">
                  <Label htmlFor="city">
                    {isRTL ? 'المدينة' : 'Ville'} *
                  </Label>
                  <Select
                    value={formData.city_id}
                    onValueChange={(value) => handleInputChange('city_id', value)}
                  >
                    <SelectTrigger id="city">
                      <SelectValue
                        placeholder={isRTL ? 'اختر المدينة' : 'Sélectionnez une ville'}
                      />
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

                {/* Neighborhoods Multi-Select (filtered by city) */}
                {formData.city_id && neighborhoods.length > 0 && (
                  <div className="space-y-2">
                    <Label>
                      {isRTL ? 'الأحياء (اختياري)' : 'Quartiers (optionnel)'}
                    </Label>
                    <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {neighborhoods.map((neighborhood) => (
                          <div key={neighborhood.id} className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox
                              id={`neighborhood-${neighborhood.id}`}
                              checked={selectedNeighborhoods.includes(neighborhood.id)}
                              onCheckedChange={() => handleNeighborhoodToggle(neighborhood.id)}
                            />
                            <Label
                              htmlFor={`neighborhood-${neighborhood.id}`}
                              className="text-sm font-normal cursor-pointer flex-1"
                            >
                              {isRTL ? neighborhood.name_ar : neighborhood.name_fr}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    {selectedNeighborhoods.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {selectedNeighborhoods.length}{' '}
                        {isRTL ? 'حي محدد' : 'quartier(s) sélectionné(s)'}
                      </p>
                    )}
                  </div>
                )}

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {isRTL ? 'رقم الهاتف' : 'Numéro de téléphone'} *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder={isRTL ? 'مثال: 0612345678' : 'Ex: 0612345678'}
                  />
                </div>

                {/* WhatsApp (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">
                    {isRTL ? 'واتساب (اختياري)' : 'WhatsApp (optionnel)'}
                  </Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                    placeholder={isRTL ? 'مثال: 0612345678' : 'Ex: 0612345678'}
                  />
                </div>

                {/* Email (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    {isRTL ? 'البريد الإلكتروني (اختياري)' : 'Email (optionnel)'}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder={isRTL ? 'مثال: contact@example.com' : 'Ex: contact@example.com'}
                  />
                </div>

                {/* Description FR (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="description_fr">
                    {isRTL ? 'وصف الخدمة (اختياري)' : 'Description (optionnel)'}
                  </Label>
                  <Textarea
                    id="description_fr"
                    value={formData.description_fr}
                    onChange={(e) => handleInputChange('description_fr', e.target.value)}
                    placeholder={
                      isRTL
                        ? 'اكتب وصفاً لخدماتك بالفرنسية...'
                        : 'Décrivez vos services en français...'
                    }
                    rows={4}
                  />
                </div>

                {/* Description AR (Optional) - Hidden, we'll use description_fr for both */}
                {false && (
                <div className="space-y-2">
                  <Label htmlFor="description_ar">
                    {isRTL ? 'الوصف بالعربية (اختياري)' : 'Description en arabe (optionnel)'}
                  </Label>
                  <Textarea
                    id="description_ar"
                    value={formData.description_ar}
                    onChange={(e) => handleInputChange('description_ar', e.target.value)}
                    placeholder={
                      isRTL
                        ? 'اكتب وصفاً لخدماتك بالعربية...'
                        : 'Décrivez vos services en arabe...'
                    }
                    rows={4}
                    dir="rtl"
                  />
                </div>
                )}

                {/* Submit Button */}
                <div className="flex items-center gap-4 pt-4">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isRTL ? 'جاري الإنشاء...' : 'Création en cours...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        {isRTL ? 'تأكيد وإنشاء الحساب' : 'Valider et créer'}
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link to="/services">
                      {isRTL ? 'إلغاء' : 'Annuler'}
                    </Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
