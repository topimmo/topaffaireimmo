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
import { Loader2, Plus, Edit, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface ServiceCategory {
  id: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  description_fr?: string;
  description_ar?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CategoryFormData {
  id?: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  description_fr: string;
  description_ar: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: CategoryFormData = {
  slug: '',
  name_fr: '',
  name_ar: '',
  description_fr: '',
  description_ar: '',
  icon: '',
  sort_order: 0,
  is_active: true,
};

export default function AdminServiceCategories() {
  const { isRTL } = useLanguage();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>(emptyForm);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category?: ServiceCategory) => {
    if (category) {
      setFormData({
        id: category.id,
        slug: category.slug,
        name_fr: category.name_fr,
        name_ar: category.name_ar,
        description_fr: category.description_fr || '',
        description_ar: category.description_ar || '',
        icon: category.icon || '',
        sort_order: category.sort_order,
        is_active: category.is_active,
      });
    } else {
      const maxOrder = Math.max(...categories.map(c => c.sort_order), 0);
      setFormData({ ...emptyForm, sort_order: maxOrder + 1 });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData(emptyForm);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.slug || !formData.name_fr || !formData.name_ar) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('admin_upsert_service_category', {
        p_id: formData.id || null,
        p_slug: formData.slug,
        p_name_fr: formData.name_fr,
        p_name_ar: formData.name_ar,
        p_description_fr: formData.description_fr || null,
        p_description_ar: formData.description_ar || null,
        p_icon: formData.icon || null,
        p_sort_order: formData.sort_order,
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
        entity_type: 'service_category',
        entity_id: result.category_id,
        metadata: { slug: formData.slug, name_fr: formData.name_fr },
      });

      toast.success(result.message);
      handleCloseDialog();
      await fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (categoryId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    try {
      const { data, error } = await supabase.rpc('admin_toggle_service_category', {
        p_category_id: categoryId,
        p_is_active: newStatus,
      });

      if (error) throw error;

      const result = data[0];
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      // Log admin action
      await logAdminAction({
        action: 'update',
        entity_type: 'service_category',
        entity_id: categoryId,
        metadata: { is_active: newStatus },
      });

      toast.success(result.message);
      await fetchCategories();
    } catch (error) {
      console.error('Error toggling category:', error);
      toast.error('Failed to update category status');
    }
  };

  return (
    <AdminLayout>
      <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isRTL ? 'فئات الخدمات' : 'Service Categories'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isRTL
                ? 'إدارة فئات الخدمات المنزلية والمهنية'
                : 'Manage home and professional service categories'}
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            {isRTL ? 'إضافة فئة' : 'Add Category'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isRTL ? 'جميع الفئات' : 'All Categories'}</CardTitle>
            <CardDescription>
              {isRTL
                ? `إجمالي ${categories.length} فئة`
                : `Total ${categories.length} categories`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {isRTL ? 'لا توجد فئات' : 'No categories found'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>{isRTL ? 'الترتيب' : 'Order'}</TableHead>
                      <TableHead>{isRTL ? 'الاسم (فرنسي)' : 'Name (FR)'}</TableHead>
                      <TableHead>{isRTL ? 'الاسم (عربي)' : 'Name (AR)'}</TableHead>
                      <TableHead>{isRTL ? 'Slug' : 'Slug'}</TableHead>
                      <TableHead>{isRTL ? 'نشط' : 'Active'}</TableHead>
                      <TableHead>{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        </TableCell>
                        <TableCell>{category.sort_order}</TableCell>
                        <TableCell className="font-medium">{category.name_fr}</TableCell>
                        <TableCell>{category.name_ar}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {category.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={category.is_active}
                            onCheckedChange={() => handleToggleActive(category.id, category.is_active)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(category)}
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {formData.id
                  ? isRTL ? 'تعديل الفئة' : 'Edit Category'
                  : isRTL ? 'إضافة فئة جديدة' : 'Add New Category'}
              </DialogTitle>
              <DialogDescription>
                {isRTL
                  ? 'املأ جميع الحقول المطلوبة لحفظ الفئة'
                  : 'Fill in all required fields to save the category'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">
                    Slug <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="plomberie"
                    disabled={!!formData.id}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="wrench"
                  />
                </div>
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
                    placeholder="Plomberie"
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
                    placeholder="السباكة"
                    dir="rtl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_fr">{isRTL ? 'الوصف (فرنسي)' : 'Description (French)'}</Label>
                <Input
                  id="description_fr"
                  value={formData.description_fr}
                  onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
                  placeholder="Installation et réparation plomberie"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_ar">{isRTL ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
                <Input
                  id="description_ar"
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  placeholder="التركيب والصيانة في السباكة"
                  dir="rtl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sort_order">{isRTL ? 'الترتيب' : 'Sort Order'}</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">{isRTL ? 'نشط' : 'Active'}</Label>
                </div>
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
