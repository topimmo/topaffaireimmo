import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/auditLog';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Plus, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface ServiceCategory {
  id: string;
  name_fr: string;
  name_ar: string;
  slug: string;
}

interface ServiceSubcategory {
  id: string;
  category_id: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  is_active: boolean;
  created_at: string;
  service_categories?: ServiceCategory;
}

interface SubcategoryFormData {
  id?: string;
  category_id: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  is_active: boolean;
}

const emptyForm: SubcategoryFormData = {
  category_id: '',
  slug: '',
  name_fr: '',
  name_ar: '',
  is_active: true,
};

export default function AdminServiceSubcategories() {
  const { isRTL } = useLanguage();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [subcategories, setSubcategories] = useState<ServiceSubcategory[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<ServiceSubcategory[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<SubcategoryFormData>(emptyForm);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCategoryFilter === 'all') {
      setFilteredSubcategories(subcategories);
    } else {
      setFilteredSubcategories(
        subcategories.filter((sub) => sub.category_id === selectedCategoryFilter)
      );
    }
  }, [selectedCategoryFilter, subcategories]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('id, name_fr, name_ar, slug')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch subcategories with category info
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('service_subcategories')
        .select(`
          *,
          service_categories (
            id,
            name_fr,
            name_ar,
            slug
          )
        `)
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

  const handleOpenDialog = (subcategory?: ServiceSubcategory) => {
    if (subcategory) {
      setFormData({
        id: subcategory.id,
        category_id: subcategory.category_id,
        slug: subcategory.slug,
        name_fr: subcategory.name_fr,
        name_ar: subcategory.name_ar,
        is_active: subcategory.is_active,
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
    // Validate required fields
    if (!formData.category_id || !formData.slug || !formData.name_fr || !formData.name_ar) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('admin_upsert_service_subcategory', {
        p_id: formData.id || null,
        p_category_id: formData.category_id,
        p_slug: formData.slug,
        p_name_fr: formData.name_fr,
        p_name_ar: formData.name_ar,
        p_is_active: formData.is_active,
      });

      if (error) throw error;

      const result = data[0];
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      // Log admin action
      await logAdminAction({
        action: formData.id ? 'update' : 'create',
        entity_type: 'service_subcategory',
        entity_id: result.subcategory_id,
        metadata: { slug: formData.slug, name_fr: formData.name_fr },
      });

      toast.success(result.message);
      handleCloseDialog();
      await fetchData();
    } catch (error) {
      console.error('Error saving subcategory:', error);
      toast.error('Failed to save subcategory');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (subcategoryId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    try {
      const { error } = await supabase
        .from('service_subcategories')
        .update({ is_active: newStatus })
        .eq('id', subcategoryId);

      if (error) throw error;

      // Log admin action
      await logAdminAction({
        action: 'update',
        entity_type: 'service_subcategory',
        entity_id: subcategoryId,
        metadata: { is_active: newStatus },
      });

      toast.success('Subcategory status updated');
      await fetchData();
    } catch (error) {
      console.error('Error toggling subcategory:', error);
      toast.error('Failed to update subcategory status');
    }
  };

  return (
    <AdminLayout>
      <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isRTL ? 'الفئات الفرعية للخدمات' : 'Service Subcategories'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isRTL
                ? 'إدارة الفئات الفرعية للخدمات'
                : 'Manage service subcategories'}
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            {isRTL ? 'إضافة فئة فرعية' : 'Add Subcategory'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{isRTL ? 'جميع الفئات الفرعية' : 'All Subcategories'}</CardTitle>
                <CardDescription>
                  {isRTL
                    ? `إجمالي ${filteredSubcategories.length} فئة فرعية`
                    : `Total ${filteredSubcategories.length} subcategories`}
                </CardDescription>
              </div>
              <div className="w-64">
                <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? 'تصفية حسب الفئة' : 'Filter by category'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {isRTL ? 'جميع الفئات' : 'All Categories'}
                    </SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {isRTL ? category.name_ar : category.name_fr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredSubcategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {isRTL ? 'لا توجد فئات فرعية' : 'No subcategories found'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRTL ? 'الفئة الرئيسية' : 'Category'}</TableHead>
                      <TableHead>{isRTL ? 'الاسم (فرنسي)' : 'Name (FR)'}</TableHead>
                      <TableHead>{isRTL ? 'الاسم (عربي)' : 'Name (AR)'}</TableHead>
                      <TableHead>{isRTL ? 'Slug' : 'Slug'}</TableHead>
                      <TableHead>{isRTL ? 'نشط' : 'Active'}</TableHead>
                      <TableHead>{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubcategories.map((subcategory) => (
                      <TableRow key={subcategory.id}>
                        <TableCell>
                          {isRTL
                            ? subcategory.service_categories?.name_ar
                            : subcategory.service_categories?.name_fr}
                        </TableCell>
                        <TableCell className="font-medium">{subcategory.name_fr}</TableCell>
                        <TableCell>{subcategory.name_ar}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {subcategory.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={subcategory.is_active}
                            onCheckedChange={() => handleToggleActive(subcategory.id, subcategory.is_active)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(subcategory)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {formData.id
                  ? isRTL ? 'تعديل الفئة الفرعية' : 'Edit Subcategory'
                  : isRTL ? 'إضافة فئة فرعية جديدة' : 'Add New Subcategory'}
              </DialogTitle>
              <DialogDescription>
                {isRTL
                  ? 'املأ جميع الحقول المطلوبة لحفظ الفئة الفرعية'
                  : 'Fill in all required fields to save the subcategory'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category_id">
                  {isRTL ? 'الفئة الرئيسية' : 'Category'}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? 'اختر فئة' : 'Select category'} />
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

              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="leak-repair"
                  disabled={!!formData.id}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name_fr">
                    {isRTL ? 'الاسم (فرنسي)' : 'Name (French)'}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name_fr"
                    value={formData.name_fr}
                    onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                    placeholder="Réparation de fuite"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name_ar">
                    {isRTL ? 'الاسم (عربي)' : 'Name (Arabic)'}{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name_ar"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="إصلاح التسريب"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">{isRTL ? 'نشط' : 'Active'}</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog} disabled={saving}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isRTL ? 'حفظ' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
