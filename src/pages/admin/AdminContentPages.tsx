import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileText, Loader2, Plus, Eye, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface SitePage {
  id: string;
  slug: string;
  title_fr: string;
  title_ar: string;
  is_published: boolean;
  updated_at: string;
  updated_by: string | null;
}

export default function AdminContentPages() {
  const { language, isRTL } = useLanguage();
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('site_pages')
        .select('*')
        .order('slug');

      if (error) {
        console.error('Error fetching pages:', error);
        toast.error(isRTL ? 'خطأ في جلب الصفحات' : 'Error fetching pages');
        return;
      }

      setPages(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error(isRTL ? 'خطأ غير متوقع' : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-MA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isRTL ? 'صفحات الموقع' : 'Site Pages'}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {isRTL
                ? 'إدارة محتوى الصفحات الثابتة'
                : 'Manage static page content'}
            </p>
          </div>

          <Link to="/admin/content/pages/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {isRTL ? 'إضافة صفحة' : 'Add Page'}
            </Button>
          </Link>
        </div>

        {/* Pages Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isRTL ? 'قائمة الصفحات' : 'Pages List'} ({pages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pages.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  {isRTL ? 'لا توجد صفحات' : 'No pages found'}
                </p>
                <Link to="/admin/content/pages/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    {isRTL ? 'إضافة أول صفحة' : 'Add first page'}
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRTL ? 'Slug' : 'Slug'}</TableHead>
                    <TableHead>{isRTL ? 'العنوان (FR)' : 'Title (FR)'}</TableHead>
                    <TableHead>{isRTL ? 'العنوان (AR)' : 'Title (AR)'}</TableHead>
                    <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead>{isRTL ? 'آخر تحديث' : 'Last Updated'}</TableHead>
                    <TableHead className="text-right">{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {page.slug}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">{page.title_fr}</TableCell>
                      <TableCell>{page.title_ar}</TableCell>
                      <TableCell>
                        {page.is_published ? (
                          <Badge className="bg-green-100 text-green-800">
                            {isRTL ? 'منشور' : 'Published'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {isRTL ? 'مسودة' : 'Draft'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(page.updated_at)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Link to={`/${page.slug}`} target="_blank">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link to={`/admin/content/pages/${page.id}`}>
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
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
    </AdminLayout>
  );
}
