import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Loader2, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ArtisanProfile {
  id: string;
  is_verified: boolean;
}

interface ServiceCategory {
  id: string;
  name_fr: string;
  name_ar: string;
  slug: string;
}

interface ServiceSubcategory {
  id: string;
  category_id: string;
  name_fr: string;
  name_ar: string;
  slug: string;
}

interface ArtisanService {
  id: string;
  category_id: string;
  subcategory_id: string | null;
  city: string;
  is_active: boolean;
  service_categories?: ServiceCategory;
  service_subcategories?: ServiceSubcategory;
}

interface ServiceFormData {
  id?: string;
  category_id: string;
  subcategory_id: string;
  city: string;
  is_active: boolean;
}

const emptyForm: ServiceFormData = {
  category_id: '',
  subcategory_id: '',
  city: '',
  is_active: true,
};

export default function ArtisanServices() {
  const { isRTL } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ArtisanProfile | null>(null);
  const [services, setServices] = useState<ArtisanService[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [subcategories, setSubcategories] = useState<ServiceSubcategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<ServiceSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>(emptyForm);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?next=/artisan/services');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (formData.category_id) {
      setFilteredSubcategories(
        subcategories.filter((sub) => sub.category_id === formData.category_id)
      );
    } else {
      setFilteredSubcategories([]);
    }
  }, [formData.category_id, subcategories]);

  const fetchData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch artisan profile
      const { data: profileData, error: profileError } = await supabase
        .from('artisan_profiles')
        .select('id, is_verified')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profileData) {
        navigate('/artisan/onboarding');
        return;
      }

      setProfile(profileData);

      // Fetch artisan services
      const { data: servicesData, error: servicesError } = await supabase
        .from('artisan_services')
        .select(`
          *,
          service_categories (id, name_fr, name_ar, slug),
          service_subcategories (id, category_id, name_fr, name_ar, slug)
        `)
        .eq('artisan_id', user.id)
        .order('created_at', { ascending: false });

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('id, name_fr, name_ar, slug')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch subcategories
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('service_subcategories')
        .select('id, category_id, name_fr, name_ar, slug')
        .eq('is_active', true)
        .order('name_fr', { ascending: true });

      if (subcategoriesError) throw subcategoriesError;
      setSubcategories(subcategoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (service?: ArtisanService) => {
    if (service) {
      setFormData({
        id: service.id,
        category_id: service.category_id,
        subcategory_id: service.subcategory_id || '',
        city: service.city,
        is_active: service.is_active,
      });
    } else {
      setFormData(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData(emptyForm);
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate required fields
    if (!formData.category_id || !formData.city) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('artisan_upsert_service', {
        p_artisan_id: user.id,
        p_category_id: formData.category_id,
        p_subcategory_id: formData.subcategory_id || null,
        p_city: formData.city,
        p_is_active: formData.is_active,
      });

      if (error) throw error;

      const result = data[0];
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      handleCloseDialog();
      await fetchData();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذه الخدمة؟' : 'Êtes-vous sûr de supprimer ce service?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('artisan_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      toast.success(isRTL ? 'تم حذف الخدمة' : 'Service deleted');
      await fetchData();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
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
        <div className="container max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-semibold text-foreground">
                {isRTL ? 'خدماتي' : 'Mes Services'}
              </h1>
              <p className="text-muted-foreground mt-2">
                {isRTL
                  ? 'إدارة الخدمات التي تقدمها'
                  : 'Gérez les services que vous offrez'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/dashboard/artisan">
                  {isRTL ? 'العودة' : 'Retour'}
                </Link>
              </Button>
              <Button onClick={() => handleOpenDialog()} disabled={!profile?.is_verified}>
                <Plus className="h-4 w-4 mr-2" />
                {isRTL ? 'إضافة خدمة' : 'Ajouter un service'}
              </Button>
            </div>
          </div>

          {profile && !profile.is_verified && (
            <Alert className="mb-6 bg-yellow-50 dark:bg-yellow-950 border-yellow-300">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                {isRTL
                  ? 'يجب التحقق من ملفك الشخصي قبل إضافة أو تفعيل الخدمات'
                  : 'Votre profil doit être vérifié avant d\'ajouter ou activer des services'}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? 'جميع الخدمات' : 'Tous les services'}</CardTitle>
              <CardDescription>
                {isRTL
                  ? `إجمالي ${services.length} خدمة`
                  : `Total ${services.length} services`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isRTL ? 'لا توجد خدمات. أضف خدمة للبدء.' : 'Aucun service. Ajoutez-en un pour commencer.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isRTL ? 'الفئة' : 'Catégorie'}</TableHead>
                        <TableHead>{isRTL ? 'الفئة الفرعية' : 'Sous-catégorie'}</TableHead>
                        <TableHead>{isRTL ? 'المدينة' : 'Ville'}</TableHead>
                        <TableHead>{isRTL ? 'الحالة' : 'Statut'}</TableHead>
                        <TableHead>{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">
                            {isRTL
                              ? service.service_categories?.name_ar
                              : service.service_categories?.name_fr}
                          </TableCell>
                          <TableCell>
                            {service.service_subcategories
                              ? (isRTL
                                  ? service.service_subcategories.name_ar
                                  : service.service_subcategories.name_fr)
                              : '-'}
                          </TableCell>
                          <TableCell>{service.city}</TableCell>
                          <TableCell>
                            <Badge variant={service.is_active ? 'default' : 'outline'}>
                              {service.is_active
                                ? (isRTL ? 'نشط' : 'Actif')
                                : (isRTL ? 'غير نشط' : 'Inactif')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(service)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(service.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formData.id
                ? (isRTL ? 'تعديل الخدمة' : 'Modifier le service')
                : (isRTL ? 'إضافة خدمة جديدة' : 'Ajouter un nouveau service')}
            </DialogTitle>
            <DialogDescription>
              {isRTL
                ? 'املأ التفاصيل أدناه'
                : 'Remplissez les détails ci-dessous'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                {isRTL ? 'الفئة' : 'Catégorie'} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value, subcategory_id: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isRTL ? 'اختر فئة' : 'Sélectionnez une catégorie'} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {isRTL ? category.name_ar : category.name_fr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredSubcategories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="subcategory">{isRTL ? 'الفئة الفرعية' : 'Sous-catégorie'}</Label>
                <Select
                  value={formData.subcategory_id}
                  onValueChange={(value) => setFormData({ ...formData, subcategory_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? 'اختر فئة فرعية' : 'Sélectionnez une sous-catégorie'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      {isRTL ? 'بدون فئة فرعية' : 'Pas de sous-catégorie'}
                    </SelectItem>
                    {filteredSubcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {isRTL ? subcategory.name_ar : subcategory.name_fr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="city">
                {isRTL ? 'المدينة' : 'Ville'} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder={isRTL ? 'مثال: الدار البيضاء' : 'ex: Casablanca'}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                disabled={!profile?.is_verified}
              />
              <Label htmlFor="is_active">{isRTL ? 'نشط' : 'Actif'}</Label>
            </div>

            {!profile?.is_verified && (
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? 'يجب التحقق من ملفك الشخصي لتفعيل الخدمات'
                  : 'Votre profil doit être vérifié pour activer les services'}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={saving}>
              {isRTL ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isRTL ? 'حفظ' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
