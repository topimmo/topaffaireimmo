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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PromoBanner {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  position: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

const POSITION_OPTIONS = [
  { value: 'home-top', label: 'Home - Top' },
  { value: 'home-middle', label: 'Home - Middle' },
  { value: 'listing-top', label: 'Buy/Rent Listings - Top' },
];

export default function AdminPromoBanners() {
  const { isRTL } = useLanguage();
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    position: 'home-middle',
    is_active: false,
    starts_at: '',
    ends_at: '',
  });

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    // Note: promo_banners table does not exist in the current schema
    // This page is kept for backward compatibility but the table is not available
    setBanners([]);
    setLoading(false);
  };

  const openCreateDialog = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      image_url: '',
      link_url: '',
      position: 'home-middle',
      is_active: false,
      starts_at: '',
      ends_at: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (banner: PromoBanner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      position: banner.position,
      is_active: banner.is_active,
      starts_at: banner.starts_at ? format(new Date(banner.starts_at), "yyyy-MM-dd'T'HH:mm") : '',
      ends_at: banner.ends_at ? format(new Date(banner.ends_at), "yyyy-MM-dd'T'HH:mm") : '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.image_url || !formData.position) {
      toast.error('Please fill in required fields');
      return;
    }

    setSaving(true);
    try {
      const bannerData = {
        title: formData.title,
        image_url: formData.image_url,
        link_url: formData.link_url || null,
        position: formData.position,
        is_active: formData.is_active,
        starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
        ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
      };

      if (editingBanner) {
        // Update existing banner
        const { error } = await supabase
          .from('promo_banners')
          .update(bannerData)
          .eq('id', editingBanner.id);

        if (error) throw error;

        await logAdminAction({
          action: 'update',
          entity_type: 'other',
          metadata: {
            banner_id: editingBanner.id,
            title: formData.title,
          },
        });

        toast.success('Banner updated successfully');
      } else {
        // Create new banner
        const { error } = await supabase
          .from('promo_banners')
          .insert([bannerData]);

        if (error) throw error;

        await logAdminAction({
          action: 'create',
          entity_type: 'other',
          metadata: {
            title: formData.title,
          },
        });

        toast.success('Banner created successfully');
      }

      setDialogOpen(false);
      loadBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error('Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (banner: PromoBanner) => {
    try {
      const { error } = await supabase
        .from('promo_banners')
        .update({ is_active: !banner.is_active })
        .eq('id', banner.id);

      if (error) throw error;

      await logAdminAction({
        action: 'update',
        entity_type: 'other',
        metadata: {
          banner_id: banner.id,
          is_active: !banner.is_active,
        },
      });

      toast.success(
        banner.is_active ? 'Banner deactivated' : 'Banner activated'
      );
      loadBanners();
    } catch (error) {
      console.error('Error toggling banner:', error);
      toast.error('Failed to update banner status');
    }
  };

  const deleteBanner = async (banner: PromoBanner) => {
    if (!confirm(`Are you sure you want to delete "${banner.title}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('promo_banners')
        .delete()
        .eq('id', banner.id);

      if (error) throw error;

      await logAdminAction({
        action: 'delete',
        entity_type: 'other',
        metadata: {
          banner_id: banner.id,
          title: banner.title,
        },
      });

      toast.success('Banner deleted successfully');
      loadBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  const getPositionLabel = (position: string) => {
    return POSITION_OPTIONS.find(opt => opt.value === position)?.label || position;
  };

  const isDateActive = (banner: PromoBanner) => {
    const now = new Date();
    const startsAt = banner.starts_at ? new Date(banner.starts_at) : null;
    const endsAt = banner.ends_at ? new Date(banner.ends_at) : null;

    if (startsAt && startsAt > now) return false;
    if (endsAt && endsAt < now) return false;
    return true;
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {isRTL ? 'اللافتات الترويجية' : 'Promotional Banners'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL
                ? 'إدارة اللافتات الترويجية المجانية (1-2 لافتات)'
                : 'Manage free promotional banners (1-2 banners)'}
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            {isRTL ? 'إضافة لافتة' : 'Add Banner'}
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground font-medium mb-2">
              {isRTL ? 'جدول اللافتات الترويجية غير متاح' : 'Promotional Banners table not available'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isRTL 
                ? 'هذه الميزة معطلة حاليًا. استخدم نظام الإعلانات بدلاً من ذلك.'
                : 'This feature is currently disabled. Use the advertising system instead.'}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? 'العنوان' : 'Title'}</TableHead>
                  <TableHead>{isRTL ? 'الموقع' : 'Position'}</TableHead>
                  <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead>{isRTL ? 'تاريخ البداية' : 'Start Date'}</TableHead>
                  <TableHead>{isRTL ? 'تاريخ الانتهاء' : 'End Date'}</TableHead>
                  <TableHead className="text-right">{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell className="font-medium">{banner.title}</TableCell>
                    <TableCell>{getPositionLabel(banner.position)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={banner.is_active ? 'default' : 'secondary'}>
                          {banner.is_active
                            ? isRTL ? 'نشط' : 'Active'
                            : isRTL ? 'غير نشط' : 'Inactive'}
                        </Badge>
                        {banner.is_active && !isDateActive(banner) && (
                          <Badge variant="outline" className="text-orange-600">
                            {isRTL ? 'خارج النطاق الزمني' : 'Out of date range'}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {banner.starts_at
                        ? format(new Date(banner.starts_at), 'MMM dd, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {banner.ends_at
                        ? format(new Date(banner.ends_at), 'MMM dd, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(banner)}
                          title={banner.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {banner.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(banner)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteBanner(banner)}
                          className="text-destructive hover:text-destructive"
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

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBanner
                  ? isRTL ? 'تعديل اللافتة' : 'Edit Banner'
                  : isRTL ? 'إضافة لافتة جديدة' : 'Add New Banner'}
              </DialogTitle>
              <DialogDescription>
                {isRTL
                  ? 'املأ التفاصيل أدناه لإنشاء أو تحديث لافتة ترويجية'
                  : 'Fill in the details below to create or update a promotional banner'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">{isRTL ? 'العنوان' : 'Title'} *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={isRTL ? 'أدخل عنوان اللافتة' : 'Enter banner title'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">{isRTL ? 'رابط الصورة' : 'Image URL'} *</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/banner.jpg"
                />
                {formData.image_url && (
                  <div className="mt-2 border rounded-lg p-2">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="max-h-32 mx-auto"
                      onError={(e) => {
                        e.currentTarget.src = '';
                        e.currentTarget.alt = 'Invalid image URL';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="link_url">{isRTL ? 'رابط الهدف' : 'Target Link'}</Label>
                <Input
                  id="link_url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://example.com/destination"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">{isRTL ? 'الموقع' : 'Position'} *</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="starts_at">{isRTL ? 'تاريخ البداية' : 'Start Date'}</Label>
                  <Input
                    id="starts_at"
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ends_at">{isRTL ? 'تاريخ الانتهاء' : 'End Date'}</Label>
                  <Input
                    id="ends_at"
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  {isRTL ? 'نشط' : 'Active'}
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingBanner
                  ? isRTL ? 'تحديث' : 'Update'
                  : isRTL ? 'إنشاء' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
