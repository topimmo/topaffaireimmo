import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/auditLog';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FolderTree, Loader2, Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  description_fr: string | null;
  description_ar: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export default function AdminContentCategories() {
  const { language, isRTL } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    slug: '',
    name_fr: '',
    name_ar: '',
    description_fr: '',
    description_ar: '',
    icon: '',
    sort_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('site_categories')
        .select('*')
        .order('sort_order');

      if (error) {
        console.error('Error fetching categories:', error);
        toast.error(isRTL ? 'خطأ في جلب الفئات' : 'Error fetching categories');
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error(isRTL ? 'خطأ غير متوقع' : 'Unexpected error');
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

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
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
      setEditingCategory(null);
      setFormData({
        slug: '',
        name_fr: '',
        name_ar: '',
        description_fr: '',
        description_ar: '',
        icon: '',
        sort_order: categories.length,
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.slug || !formData.name_fr || !formData.name_ar) {
      toast.error(
        isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields'
      );
      return;
    }

    try {
      const dataToSave = {
        slug: formData.slug,
        name_fr: formData.name_fr,
        name_ar: formData.name_ar,
        description_fr: formData.description_fr || null,
        description_ar: formData.description_ar || null,
        icon: formData.icon || null,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      };

      let result;
      if (editingCategory) {
        result = await supabase
          .from('site_categories')
          .update(dataToSave)
          .eq('id', editingCategory.id);

        if (!result.error) {
          await logAdminAction({
            action: 'update',
            entity_type: 'category',
            entity_id: editingCategory.id,
            metadata: { slug: formData.slug, name: formData.name_fr },
          });
        }
      } else {
        result = await supabase.from('site_categories').insert(dataToSave).select();

        if (!result.error && result.data?.[0]) {
          await logAdminAction({
            action: 'create',
            entity_type: 'category',
            entity_id: result.data[0].id,
            metadata: { slug: formData.slug, name: formData.name_fr },
          });
        }
      }

      if (result.error) {
        console.error('Save error:', result.error);
        toast.error(isRTL ? 'خطأ في الحفظ' : 'Error saving category');
        return;
      }

      toast.success(
        isRTL
          ? editingCategory
            ? 'تم التحديث بنجاح'
            : 'تمت الإضافة بنجاح'
          : editingCategory
          ? 'Updated successfully'
          : 'Added successfully'
      );

      setDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(isRTL ? 'خطأ في الحفظ' : 'Error saving category');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      isRTL ? 'هل تريد حذف هذه الفئة؟' : 'Are you sure you want to delete this category?'
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase.from('site_categories').delete().eq('id', id);

      if (error) {
        console.error('Delete error:', error);
        toast.error(isRTL ? 'خطأ في الحذف' : 'Error deleting category');
        return;
      }

      await logAdminAction({
        action: 'delete',
        entity_type: 'category',
        entity_id: id,
      });

      toast.success(isRTL ? 'تم الحذف بنجاح' : 'Deleted successfully');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(isRTL ? 'خطأ في الحذف' : 'Error deleting category');
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      const { error } = await supabase
        .from('site_categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id);

      if (error) {
        console.error('Toggle error:', error);
        toast.error(isRTL ? 'خطأ في التحديث' : 'Error updating category');
        return;
      }

      await logAdminAction({
        action: 'update',
        entity_type: 'category',
        entity_id: category.id,
        metadata: { is_active: !category.is_active },
      });

      toast.success(isRTL ? 'تم التحديث بنجاح' : 'Updated successfully');
      fetchCategories();
    } catch (error) {
      console.error('Error toggling category:', error);
      toast.error(isRTL ? 'خطأ في التحديث' : 'Error updating category');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isRTL ? 'الفئات' : 'Categories'}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {isRTL ? 'إدارة فئات الموقع' : 'Manage site categories'}
            </p>
          </div>

          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            {isRTL ? 'إضافة فئة' : 'Add Category'}
          </Button>
        </div>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isRTL ? 'قائمة الفئات' : 'Categories List'} ({categories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12">
                <FolderTree className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  {isRTL ? 'لا توجد فئات' : 'No categories found'}
                </p>
                <Button className="mt-4" variant="outline" onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  {isRTL ? 'إضافة أول فئة' : 'Add first category'}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>{isRTL ? 'Slug' : 'Slug'}</TableHead>
                    <TableHead>{isRTL ? 'الاسم (FR)' : 'Name (FR)'}</TableHead>
                    <TableHead>{isRTL ? 'الاسم (AR)' : 'Name (AR)'}</TableHead>
                    <TableHead>{isRTL ? 'الأيقونة' : 'Icon'}</TableHead>
                    <TableHead>{isRTL ? 'الترتيب' : 'Order'}</TableHead>
                    <TableHead>{isRTL ? 'نشط' : 'Active'}</TableHead>
                    <TableHead className="text-right">{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {category.slug}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">{category.name_fr}</TableCell>
                      <TableCell>{category.name_ar}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {category.icon || '-'}
                        </span>
                      </TableCell>
                      <TableCell>{category.sort_order}</TableCell>
                      <TableCell>
                        <Switch
                          checked={category.is_active}
                          onCheckedChange={() => handleToggleActive(category)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
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
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory
                ? isRTL
                  ? 'تعديل الفئة'
                  : 'Edit Category'
                : isRTL
                ? 'إضافة فئة'
                : 'Add Category'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: generateSlug(e.target.value) })
                }
                placeholder="appartement"
              />
            </div>

            <Tabs defaultValue="fr" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fr">Français</TabsTrigger>
                <TabsTrigger value="ar">العربية</TabsTrigger>
              </TabsList>

              <TabsContent value="fr" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name_fr">
                    {isRTL ? 'الاسم' : 'Name'} (FR) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name_fr"
                    value={formData.name_fr}
                    onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                    placeholder="Appartement"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description_fr">{isRTL ? 'الوصف' : 'Description'}</Label>
                  <Textarea
                    id="description_fr"
                    value={formData.description_fr}
                    onChange={(e) =>
                      setFormData({ ...formData, description_fr: e.target.value })
                    }
                    placeholder="Description en français..."
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="ar" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name_ar">
                    {isRTL ? 'الاسم' : 'Name'} (AR) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name_ar"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="شقة"
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description_ar">{isRTL ? 'الوصف' : 'Description'}</Label>
                  <Textarea
                    id="description_ar"
                    value={formData.description_ar}
                    onChange={(e) =>
                      setFormData({ ...formData, description_ar: e.target.value })
                    }
                    placeholder="الوصف بالعربية..."
                    rows={3}
                    dir="rtl"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">{isRTL ? 'الأيقونة' : 'Icon'}</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="Building"
                />
                <p className="text-xs text-muted-foreground">
                  {isRTL ? 'اسم أيقونة Lucide React' : 'Lucide React icon name'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort_order">{isRTL ? 'الترتيب' : 'Sort Order'}</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is_active">{isRTL ? 'نشط' : 'Active'}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleSave}>{isRTL ? 'حفظ' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
