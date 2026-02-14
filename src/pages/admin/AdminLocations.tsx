import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/auditLog';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface City {
  id: string;
  name_en: string;
  name_fr: string;
  name_ar: string;
  slug: string;
}

interface Neighborhood {
  id: string;
  city_id: string;
  name_en: string;
  name_fr: string;
  name_ar: string;
  slug: string;
  city?: City;
}

export default function AdminLocations() {
  const { language, isRTL } = useLanguage();
  const [cities, setCities] = useState<City[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [editingNeighborhood, setEditingNeighborhood] = useState<Neighborhood | null>(null);
  const [formData, setFormData] = useState({
    name_en: '',
    name_fr: '',
    name_ar: '',
    slug: '',
    city_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [citiesResult, neighborhoodsResult] = await Promise.all([
        supabase.from('cities').select('*').order('name_en').limit(200),
        supabase
          .from('neighborhoods')
          .select('*, city:cities(name_en, name_fr, name_ar)')
          .order('name_en')
          .limit(1000),
      ]);

      if (citiesResult.data) setCities(citiesResult.data);
      if (neighborhoodsResult.data) setNeighborhoods(neighborhoodsResult.data as any);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error(isRTL ? 'خطأ في جلب البيانات' : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleOpenDialog = (type: 'city' | 'neighborhood', item?: City | Neighborhood) => {
    if (type === 'city') {
      const city = item as City | undefined;
      setEditingCity(city || null);
      setEditingNeighborhood(null);
      setFormData({
        name_en: city?.name_en || '',
        name_fr: city?.name_fr || '',
        name_ar: city?.name_ar || '',
        slug: city?.slug || '',
        city_id: '',
      });
    } else {
      const neighborhood = item as Neighborhood | undefined;
      setEditingNeighborhood(neighborhood || null);
      setEditingCity(null);
      setFormData({
        name_en: neighborhood?.name_en || '',
        name_fr: neighborhood?.name_fr || '',
        name_ar: neighborhood?.name_ar || '',
        slug: neighborhood?.slug || '',
        city_id: neighborhood?.city_id || '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const table = editingCity !== null || (!editingNeighborhood && !formData.city_id) ? 'cities' : 'neighborhoods';
    const isEditing = editingCity || editingNeighborhood;

    try {
      const dataToSave: any = {
        name_en: formData.name_en,
        name_fr: formData.name_fr,
        name_ar: formData.name_ar,
        slug: formData.slug || generateSlug(formData.name_en),
      };

      if (table === 'neighborhoods') {
        dataToSave.city_id = formData.city_id;
      }

      let result;
      if (isEditing) {
        const id = editingCity?.id || editingNeighborhood?.id;
        result = await supabase.from(table).update(dataToSave).eq('id', id);
        
        await logAdminAction({
          action: 'update',
          entity_type: 'location',
          entity_id: id,
          metadata: { name: formData.name_en, type: table },
        });
      } else {
        result = await supabase.from(table).insert(dataToSave);
        
        await logAdminAction({
          action: 'create',
          entity_type: 'location',
          metadata: { name: formData.name_en, type: table },
        });
      }

      if (result.error) {
        toast.error(isRTL ? 'خطأ في الحفظ' : 'Error saving');
        console.error(result.error);
        return;
      }

      toast.success(
        isRTL
          ? isEditing
            ? 'تم التحديث بنجاح'
            : 'تمت الإضافة بنجاح'
          : isEditing
          ? 'Updated successfully'
          : 'Added successfully'
      );

      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error(isRTL ? 'خطأ في الحفظ' : 'Error saving');
    }
  };

  const handleDelete = async (type: 'city' | 'neighborhood', id: string) => {
    const confirmed = window.confirm(
      isRTL ? 'هل تريد حذف هذا العنصر؟' : 'Are you sure you want to delete this item?'
    );

    if (!confirmed) return;

    try {
      const table = type === 'city' ? 'cities' : 'neighborhoods';
      const { error } = await supabase.from(table).delete().eq('id', id);

      if (error) {
        toast.error(isRTL ? 'خطأ في الحذف' : 'Error deleting');
        console.error(error);
        return;
      }

      await logAdminAction({
        action: 'delete',
        entity_type: 'location',
        entity_id: id,
        metadata: { type: table },
      });

      toast.success(isRTL ? 'تم الحذف بنجاح' : 'Deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(isRTL ? 'خطأ في الحذف' : 'Error deleting');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isRTL ? 'المواقع' : 'Locations'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isRTL ? 'إدارة المدن والأحياء' : 'Manage cities and neighborhoods'}
          </p>
        </div>

        <Tabs defaultValue="cities" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cities">
              {isRTL ? 'المدن' : 'Cities'} ({cities.length})
            </TabsTrigger>
            <TabsTrigger value="neighborhoods">
              {isRTL ? 'الأحياء' : 'Neighborhoods'} ({neighborhoods.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cities">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{isRTL ? 'قائمة المدن' : 'Cities List'}</CardTitle>
                <Button onClick={() => handleOpenDialog('city')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {isRTL ? 'إضافة مدينة' : 'Add City'}
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isRTL ? 'الاسم (EN)' : 'Name (EN)'}</TableHead>
                        <TableHead>{isRTL ? 'الاسم (FR)' : 'Name (FR)'}</TableHead>
                        <TableHead>{isRTL ? 'الاسم (AR)' : 'Name (AR)'}</TableHead>
                        <TableHead>{isRTL ? 'Slug' : 'Slug'}</TableHead>
                        <TableHead className="text-right">{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cities.map((city) => (
                        <TableRow key={city.id}>
                          <TableCell>{city.name_en}</TableCell>
                          <TableCell>{city.name_fr}</TableCell>
                          <TableCell>{city.name_ar}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">{city.slug}</code>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog('city', city)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete('city', city.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="neighborhoods">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{isRTL ? 'قائمة الأحياء' : 'Neighborhoods List'}</CardTitle>
                <Button onClick={() => handleOpenDialog('neighborhood')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {isRTL ? 'إضافة حي' : 'Add Neighborhood'}
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isRTL ? 'الاسم (EN)' : 'Name (EN)'}</TableHead>
                        <TableHead>{isRTL ? 'الاسم (FR)' : 'Name (FR)'}</TableHead>
                        <TableHead>{isRTL ? 'الاسم (AR)' : 'Name (AR)'}</TableHead>
                        <TableHead>{isRTL ? 'المدينة' : 'City'}</TableHead>
                        <TableHead>{isRTL ? 'Slug' : 'Slug'}</TableHead>
                        <TableHead className="text-right">{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {neighborhoods.map((neighborhood) => (
                        <TableRow key={neighborhood.id}>
                          <TableCell>{neighborhood.name_en}</TableCell>
                          <TableCell>{neighborhood.name_fr}</TableCell>
                          <TableCell>{neighborhood.name_ar}</TableCell>
                          <TableCell>
                            {language === 'ar'
                              ? neighborhood.city?.name_ar
                              : neighborhood.city?.name_fr}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {neighborhood.slug}
                            </code>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog('neighborhood', neighborhood)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete('neighborhood', neighborhood.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCity || editingNeighborhood
                ? isRTL
                  ? 'تعديل'
                  : 'Edit'
                : isRTL
                ? 'إضافة'
                : 'Add'}{' '}
              {editingCity !== null || (!editingNeighborhood && !formData.city_id)
                ? isRTL
                  ? 'مدينة'
                  : 'City'
                : isRTL
                ? 'حي'
                : 'Neighborhood'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isRTL ? 'الاسم (EN)' : 'Name (EN)'}</Label>
              <Input
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? 'الاسم (FR)' : 'Name (FR)'}</Label>
              <Input
                value={formData.name_fr}
                onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? 'الاسم (AR)' : 'Name (AR)'}</Label>
              <Input
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder={generateSlug(formData.name_en)}
              />
            </div>

            {(editingNeighborhood || (!editingCity && formData.city_id !== undefined)) && (
              <div className="space-y-2">
                <Label>{isRTL ? 'المدينة' : 'City'}</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.city_id}
                  onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
                >
                  <option value="">{isRTL ? 'اختر مدينة' : 'Select a city'}</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {language === 'ar' ? city.name_ar : city.name_fr}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSave}>
              {isRTL ? 'حفظ' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
