import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface PageData {
  slug: string;
  title_fr: string;
  title_ar: string;
  content_fr: string;
  content_ar: string;
  meta_description_fr: string;
  meta_description_ar: string;
  is_published: boolean;
}

export default function AdminContentPageEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageData, setPageData] = useState<PageData>({
    slug: '',
    title_fr: '',
    title_ar: '',
    content_fr: '',
    content_ar: '',
    meta_description_fr: '',
    meta_description_ar: '',
    is_published: true,
  });

  const isNew = id === 'new';

  useEffect(() => {
    if (!isNew) {
      fetchPage();
    } else {
      setLoading(false);
    }
  }, [id]);

  const fetchPage = async () => {
    if (!id) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('site_pages')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching page:', error);
        toast.error(isRTL ? 'خطأ في جلب الصفحة' : 'Error fetching page');
        navigate('/admin/content/pages');
        return;
      }

      if (!data) {
        console.warn('Page not found:', id);
        toast.error(isRTL ? 'الصفحة غير موجودة' : 'Page not found');
        navigate('/admin/content/pages');
        return;
      }

      setPageData({
        slug: data.slug,
        title_fr: data.title_fr,
        title_ar: data.title_ar,
        content_fr: data.content_fr,
        content_ar: data.content_ar,
        meta_description_fr: data.meta_description_fr || '',
        meta_description_ar: data.meta_description_ar || '',
        is_published: data.is_published,
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error(isRTL ? 'خطأ غير متوقع' : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate
    if (!pageData.slug || !pageData.title_fr || !pageData.title_ar) {
      toast.error(
        isRTL
          ? 'يرجى ملء جميع الحقول المطلوبة'
          : 'Please fill in all required fields'
      );
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const dataToSave = {
        ...pageData,
        updated_by: user?.id || null,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (isNew) {
        result = await supabase.from('site_pages').insert(dataToSave).select();
        
        if (!result.error) {
          await logAdminAction({
            action: 'create',
            entity_type: 'page',
            entity_id: result.data?.[0]?.id,
            metadata: { slug: pageData.slug, title: pageData.title_fr },
          });
        }
      } else {
        result = await supabase
          .from('site_pages')
          .update(dataToSave)
          .eq('id', id)
          .select();
        
        if (!result.error) {
          await logAdminAction({
            action: 'update',
            entity_type: 'page',
            entity_id: id,
            metadata: { slug: pageData.slug, title: pageData.title_fr },
          });
        }
      }

      if (result.error) {
        console.error('Save error:', result.error);
        toast.error(isRTL ? 'خطأ في الحفظ' : 'Error saving page');
        return;
      }

      toast.success(
        isRTL
          ? isNew
            ? 'تمت إضافة الصفحة بنجاح'
            : 'تم تحديث الصفحة بنجاح'
          : isNew
          ? 'Page created successfully'
          : 'Page updated successfully'
      );

      if (isNew && result.data?.[0]?.id) {
        navigate(`/admin/content/pages/${result.data[0].id}`);
      }
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error(isRTL ? 'خطأ في الحفظ' : 'Error saving page');
    } finally {
      setSaving(false);
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/content/pages')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {isNew
                  ? isRTL
                    ? 'صفحة جديدة'
                    : 'New Page'
                  : isRTL
                  ? 'تعديل الصفحة'
                  : 'Edit Page'}
              </h1>
              {!isNew && pageData.slug && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Slug: <code className="bg-muted px-2 py-1 rounded">{pageData.slug}</code>
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="is_published" className="text-sm">
                {isRTL ? 'نشر' : 'Published'}
              </Label>
              <Switch
                id="is_published"
                checked={pageData.is_published}
                onCheckedChange={(checked) =>
                  setPageData({ ...pageData, is_published: checked })
                }
              />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isRTL ? 'حفظ' : 'Save'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'معلومات أساسية' : 'Basic Information'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">
                    Slug <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="slug"
                    value={pageData.slug}
                    onChange={(e) =>
                      setPageData({ ...pageData, slug: generateSlug(e.target.value) })
                    }
                    placeholder="about-us"
                    disabled={!isNew}
                  />
                  <p className="text-xs text-muted-foreground">
                    {isRTL
                      ? 'معرف فريد للصفحة (لا يمكن تغييره بعد الإنشاء)'
                      : 'Unique identifier for the page (cannot be changed after creation)'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Content Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'المحتوى' : 'Content'}</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="fr" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="fr">Français</TabsTrigger>
                    <TabsTrigger value="ar">العربية</TabsTrigger>
                  </TabsList>

                  <TabsContent value="fr" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title_fr">
                        {isRTL ? 'العنوان' : 'Title'} (FR){' '}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title_fr"
                        value={pageData.title_fr}
                        onChange={(e) =>
                          setPageData({ ...pageData, title_fr: e.target.value })
                        }
                        placeholder="À Propos"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meta_description_fr">
                        {isRTL ? 'وصف SEO' : 'SEO Description'}
                      </Label>
                      <Textarea
                        id="meta_description_fr"
                        value={pageData.meta_description_fr}
                        onChange={(e) =>
                          setPageData({ ...pageData, meta_description_fr: e.target.value })
                        }
                        placeholder="Description pour les moteurs de recherche..."
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content_fr">
                        {isRTL ? 'المحتوى' : 'Content'} <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="content_fr"
                        value={pageData.content_fr}
                        onChange={(e) =>
                          setPageData({ ...pageData, content_fr: e.target.value })
                        }
                        placeholder="Contenu de la page en français..."
                        rows={15}
                        className="font-mono text-sm"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="ar" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title_ar">
                        {isRTL ? 'العنوان' : 'Title'} (AR){' '}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title_ar"
                        value={pageData.title_ar}
                        onChange={(e) =>
                          setPageData({ ...pageData, title_ar: e.target.value })
                        }
                        placeholder="معلومات عنا"
                        dir="rtl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meta_description_ar">
                        {isRTL ? 'وصف SEO' : 'SEO Description'}
                      </Label>
                      <Textarea
                        id="meta_description_ar"
                        value={pageData.meta_description_ar}
                        onChange={(e) =>
                          setPageData({ ...pageData, meta_description_ar: e.target.value })
                        }
                        placeholder="وصف لمحركات البحث..."
                        rows={2}
                        dir="rtl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content_ar">
                        {isRTL ? 'المحتوى' : 'Content'} <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="content_ar"
                        value={pageData.content_ar}
                        onChange={(e) =>
                          setPageData({ ...pageData, content_ar: e.target.value })
                        }
                        placeholder="محتوى الصفحة بالعربية..."
                        rows={15}
                        className="font-mono text-sm"
                        dir="rtl"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
