import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/auditLog';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

interface DummyProperty {
  id: string;
  transaction_type: string;
  property_type: string;
  city_id: number;
  neighborhood_id?: number | null;
  title_fr: string;
  title_ar: string;
  description_fr?: string | null;
  description_ar?: string | null;
  price: number;
  area?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  images?: string[] | null;
  featured_rank: number;
  is_active: boolean;
  created_at: string;
  city?: City;
  neighborhood?: Neighborhood;
}

export default function AdminDummyProperties() {
  const { isRTL } = useLanguage();
  const [dummyProperties, setDummyProperties] = useState<DummyProperty[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<DummyProperty | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    transaction_type: 'sale',
    property_type: 'apartment',
    city_id: '',
    neighborhood_id: '',
    title_fr: '',
    title_ar: '',
    description_fr: '',
    description_ar: '',
    price: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    featured_rank: '0',
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      // Fetch dummy properties
      // Note: dummy_properties table does not exist in the current schema
      // This page is kept for backward compatibility
      const dummyError = new Error('Table dummy_properties does not exist');
      if (dummyError) throw dummyError;

      setDummyProperties([]);
      setCities([]);
      setNeighborhoods([]);
    } catch (error: any) {
      console.warn('Dummy properties table not available:', error);
      // Silently handle the error - this is expected
      setDummyProperties([]);
      setCities([]);
      setNeighborhoods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (property?: DummyProperty) => {
    if (property) {
      setEditingProperty(property);
      setFormData({
        transaction_type: property.transaction_type,
        property_type: property.property_type,
        city_id: property.city_id.toString(),
        neighborhood_id: property.neighborhood_id?.toString() || '',
        title_fr: property.title_fr,
        title_ar: property.title_ar,
        description_fr: property.description_fr || '',
        description_ar: property.description_ar || '',
        price: property.price.toString(),
        area: property.area?.toString() || '',
        bedrooms: property.bedrooms?.toString() || '',
        bathrooms: property.bathrooms?.toString() || '',
        featured_rank: property.featured_rank.toString(),
        is_active: property.is_active,
      });
    } else {
      setEditingProperty(null);
      setFormData({
        transaction_type: 'sale',
        property_type: 'apartment',
        city_id: '',
        neighborhood_id: '',
        title_fr: '',
        title_ar: '',
        description_fr: '',
        description_ar: '',
        price: '',
        area: '',
        bedrooms: '',
        bathrooms: '',
        featured_rank: '0',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.title_fr || !formData.title_ar || !formData.price || !formData.city_id) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    setActionLoading('save');

    try {
      const dataToSave = {
        transaction_type: formData.transaction_type,
        property_type: formData.property_type,
        city_id: parseInt(formData.city_id),
        neighborhood_id: formData.neighborhood_id ? parseInt(formData.neighborhood_id) : null,
        title_fr: formData.title_fr,
        title_ar: formData.title_ar,
        description_fr: formData.description_fr || null,
        description_ar: formData.description_ar || null,
        price: parseFloat(formData.price),
        area: formData.area ? parseFloat(formData.area) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        featured_rank: parseInt(formData.featured_rank),
        is_active: formData.is_active,
      };

      if (editingProperty) {
        // Update existing
        const { error } = await supabase
          .from('dummy_properties')
          .update(dataToSave)
          .eq('id', editingProperty.id);

        if (error) throw error;

        await logAdminAction({
          action: 'update',
          entity_type: 'dummy_property',
          entity_id: editingProperty.id,
          metadata: { title_fr: formData.title_fr },
        });

        toast.success(isRTL ? 'تم تحديث الإعلان الوهمي بنجاح' : 'Dummy property updated successfully');
      } else {
        // Create new - use select to get the created record
        const { data: newProperty, error } = await supabase
          .from('dummy_properties')
          .insert(dataToSave)
          .select()
          .single();

        if (error) throw error;

        await logAdminAction({
          action: 'create',
          entity_type: 'dummy_property',
          entity_id: newProperty.id, // Safe to use without optional chaining since error would have been thrown
          metadata: { title_fr: formData.title_fr },
        });

        toast.success(isRTL ? 'تم إنشاء الإعلان الوهمي بنجاح' : 'Dummy property created successfully');
      }

      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving dummy property:', error);
      toast.error(isRTL ? 'خطأ في حفظ الإعلان الوهمي' : 'Error saving dummy property');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا الإعلان الوهمي؟' : 'Are you sure you want to delete this dummy property?')) {
      return;
    }

    setActionLoading(id);

    try {
      const { error } = await supabase
        .from('dummy_properties')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await logAdminAction({
        action: 'delete',
        entity_type: 'dummy_property',
        entity_id: id,
      });

      setDummyProperties((prev) => prev.filter((p) => p.id !== id));
      toast.success(isRTL ? 'تم حذف الإعلان الوهمي بنجاح' : 'Dummy property deleted successfully');
    } catch (error) {
      console.error('Error deleting dummy property:', error);
      toast.error(isRTL ? 'خطأ في حذف الإعلان الوهمي' : 'Error deleting dummy property');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setActionLoading(id);

    try {
      const { error } = await supabase
        .from('dummy_properties')
        .update({ is_active: !currentActive })
        .eq('id', id);

      if (error) throw error;

      await logAdminAction({
        action: currentActive ? 'deactivate' : 'activate',
        entity_type: 'dummy_property',
        entity_id: id,
      });

      setDummyProperties((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !currentActive } : p))
      );

      toast.success(isRTL ? 'تم تحديث الحالة بنجاح' : 'Status updated successfully');
    } catch (error) {
      console.error('Error toggling active status:', error);
      toast.error(isRTL ? 'خطأ في تحديث الحالة' : 'Error updating status');
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR');
  };

  const getPropertyType = (type: string) => {
    const types: Record<string, { fr: string; ar: string }> = {
      apartment: { fr: 'Appartement', ar: 'شقة' },
      house: { fr: 'Maison', ar: 'منزل' },
      villa: { fr: 'Villa', ar: 'فيلا' },
      commercial: { fr: 'Commercial', ar: 'تجاري' },
      land: { fr: 'Terrain', ar: 'أرض' },
    };
    return isRTL ? types[type]?.ar : types[type]?.fr;
  };

  const getTransactionType = (type: string) => {
    return type === 'sale' ? (isRTL ? 'بيع' : 'Vente') : (isRTL ? 'إيجار' : 'Location');
  };

  return (
    <AdminLayout>
      <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {isRTL ? 'إدارة العقارات الوهمية' : 'Dummy Properties Management'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isRTL
                ? 'عقارات احتياطية تُعرض عندما لا توجد عقارات مميزة كافية'
                : 'Fallback properties displayed when not enough featured properties exist'}
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            {isRTL ? 'إضافة عقار وهمي' : 'Add Dummy Property'}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : dummyProperties.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/50">
            <p className="text-muted-foreground font-medium mb-2">
              {isRTL ? 'جدول العقارات الوهمية غير متاح' : 'Dummy Properties table not available'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isRTL 
                ? 'هذه الميزة معطلة حاليًا. استخدم العقارات المميزة بدلاً من ذلك.'
                : 'This feature is currently disabled. Use featured properties instead.'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRTL ? 'العنوان' : 'Title'}</TableHead>
                <TableHead>{isRTL ? 'النوع' : 'Type'}</TableHead>
                <TableHead>{isRTL ? 'المعاملة' : 'Transaction'}</TableHead>
                <TableHead>{isRTL ? 'المدينة' : 'City'}</TableHead>
                <TableHead>{isRTL ? 'السعر' : 'Price'}</TableHead>
                <TableHead className="text-center">{isRTL ? 'الترتيب' : 'Rank'}</TableHead>
                <TableHead className="text-center">{isRTL ? 'نشط' : 'Active'}</TableHead>
                <TableHead className="text-right">{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyProperties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="font-medium">
                    {isRTL ? property.title_ar : property.title_fr}
                  </TableCell>
                  <TableCell>{getPropertyType(property.property_type)}</TableCell>
                  <TableCell>{getTransactionType(property.transaction_type)}</TableCell>
                  <TableCell>
                    {isRTL ? property.city?.name_ar : property.city?.name_fr}
                  </TableCell>
                  <TableCell>{formatPrice(property.price)} DH</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{property.featured_rank}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(property.id, property.is_active)}
                      disabled={actionLoading === property.id}
                      className={cn(
                        'h-8 w-8 p-0',
                        property.is_active ? 'text-green-600' : 'text-gray-400'
                      )}
                    >
                      {actionLoading === property.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : property.is_active ? (
                        <ToggleRight className="h-5 w-5" />
                      ) : (
                        <ToggleLeft className="h-5 w-5" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(property)}
                        disabled={actionLoading === property.id}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(property.id)}
                        disabled={actionLoading === property.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {actionLoading === property.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProperty
                ? (isRTL ? 'تعديل عقار وهمي' : 'Edit Dummy Property')
                : (isRTL ? 'إضافة عقار وهمي جديد' : 'Add New Dummy Property')}
            </DialogTitle>
            <DialogDescription>
              {isRTL
                ? 'املأ النموذج أدناه لإنشاء أو تحديث عقار وهمي'
                : 'Fill out the form below to create or update a dummy property'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRTL ? 'نوع المعاملة' : 'Transaction Type'}</Label>
                <Select
                  value={formData.transaction_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, transaction_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sale">{isRTL ? 'بيع' : 'Sale'}</SelectItem>
                    <SelectItem value="rent">{isRTL ? 'إيجار' : 'Rent'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{isRTL ? 'نوع العقار' : 'Property Type'}</Label>
                <Select
                  value={formData.property_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, property_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">{isRTL ? 'شقة' : 'Apartment'}</SelectItem>
                    <SelectItem value="house">{isRTL ? 'منزل' : 'House'}</SelectItem>
                    <SelectItem value="villa">{isRTL ? 'فيلا' : 'Villa'}</SelectItem>
                    <SelectItem value="commercial">{isRTL ? 'تجاري' : 'Commercial'}</SelectItem>
                    <SelectItem value="land">{isRTL ? 'أرض' : 'Land'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRTL ? 'المدينة *' : 'City *'}</Label>
                <Select
                  value={formData.city_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, city_id: value, neighborhood_id: '' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? 'اختر المدينة' : 'Select City'} />
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

              <div className="space-y-2">
                <Label>{isRTL ? 'الحي' : 'Neighborhood'}</Label>
                <Select
                  value={formData.neighborhood_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, neighborhood_id: value })
                  }
                  disabled={!formData.city_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? 'اختر الحي' : 'Select Neighborhood'} />
                  </SelectTrigger>
                  <SelectContent>
                    {neighborhoods
                      .filter((n) => !formData.city_id || n.city_id === parseInt(formData.city_id))
                      .map((neighborhood) => (
                        <SelectItem key={neighborhood.id} value={neighborhood.id.toString()}>
                          {isRTL ? neighborhood.name_ar : neighborhood.name_fr}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? 'العنوان (فرنسي) *' : 'Title (French) *'}</Label>
              <Input
                value={formData.title_fr}
                onChange={(e) => setFormData({ ...formData, title_fr: e.target.value })}
                placeholder="Appartement de Luxe..."
              />
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? 'العنوان (عربي) *' : 'Title (Arabic) *'}</Label>
              <Input
                value={formData.title_ar}
                onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                placeholder="شقة فاخرة..."
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? 'الوصف (فرنسي)' : 'Description (French)'}</Label>
              <Textarea
                value={formData.description_fr}
                onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
                placeholder="Description en français..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
              <Textarea
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                placeholder="الوصف بالعربية..."
                rows={3}
                dir="rtl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isRTL ? 'السعر (DH) *' : 'Price (DH) *'}</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="2500000"
                />
              </div>

              <div className="space-y-2">
                <Label>{isRTL ? 'المساحة (م²)' : 'Area (m²)'}</Label>
                <Input
                  type="number"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="120"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{isRTL ? 'غرف النوم' : 'Bedrooms'}</Label>
                <Input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  placeholder="3"
                />
              </div>

              <div className="space-y-2">
                <Label>{isRTL ? 'الحمامات' : 'Bathrooms'}</Label>
                <Input
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  placeholder="2"
                />
              </div>

              <div className="space-y-2">
                <Label>{isRTL ? 'الترتيب' : 'Rank'}</Label>
                <Input
                  type="number"
                  value={formData.featured_rank}
                  onChange={(e) => setFormData({ ...formData, featured_rank: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={actionLoading === 'save'}>
              {actionLoading === 'save' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isRTL ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
