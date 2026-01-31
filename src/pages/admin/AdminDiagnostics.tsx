import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

interface DiagnosticCheck {
  name: string;
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: string;
}

export default function AdminDiagnostics() {
  const { isRTL } = useLanguage();
  const [checks, setChecks] = useState<DiagnosticCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    const diagnostics: DiagnosticCheck[] = [];

    // 1. Runtime Environment
    const mode = import.meta.env.MODE;
    diagnostics.push({
      name: isRTL ? 'بيئة التشغيل' : 'Runtime Environment',
      status: 'info',
      message: `Mode: ${mode}`,
      details: mode === 'production' ? 'Running in production mode' : 'Running in development mode',
    });

    // 2. Supabase URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const maskedUrl = supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'Not configured';
    diagnostics.push({
      name: isRTL ? 'عنوان Supabase' : 'Supabase URL',
      status: supabaseUrl ? 'success' : 'error',
      message: maskedUrl,
      details: supabaseUrl ? 'Supabase URL is configured' : 'Supabase URL is missing',
    });

    // 3. Check required columns in properties table
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('contact_phone, contact_whatsapp, contact_email')
        .limit(1);

      if (error) {
        diagnostics.push({
          name: isRTL ? 'أعمدة معلومات الاتصال' : 'Contact Columns',
          status: 'error',
          message: isRTL ? 'خطأ في التحقق' : 'Error checking columns',
          details: error.message,
        });
      } else {
        const hasColumns = data && data.length > 0;
        diagnostics.push({
          name: isRTL ? 'أعمدة معلومات الاتصال' : 'Contact Columns',
          status: hasColumns ? 'success' : 'warning',
          message: hasColumns
            ? isRTL
              ? 'جميع الأعمدة موجودة'
              : 'All columns exist'
            : isRTL
            ? 'لا توجد بيانات للتحقق'
            : 'No data to verify',
          details: 'contact_phone, contact_whatsapp, contact_email',
        });
      }
    } catch (err) {
      diagnostics.push({
        name: isRTL ? 'أعمدة معلومات الاتصال' : 'Contact Columns',
        status: 'error',
        message: isRTL ? 'فشل التحقق' : 'Check failed',
        details: String(err),
      });
    }

    // 4. Check storage bucket access
    try {
      const { data, error } = await supabase.storage
        .from('property-images')
        .list('', { limit: 1 });

      if (error) {
        diagnostics.push({
          name: isRTL ? 'الوصول إلى التخزين' : 'Storage Access',
          status: 'warning',
          message: isRTL ? 'مشكلة في الوصول' : 'Access issue',
          details: error.message,
        });
      } else {
        diagnostics.push({
          name: isRTL ? 'الوصول إلى التخزين' : 'Storage Access',
          status: 'success',
          message: isRTL ? 'يعمل بشكل صحيح' : 'Working correctly',
          details: 'property-images bucket is accessible',
        });
      }
    } catch (err) {
      diagnostics.push({
        name: isRTL ? 'الوصول إلى التخزين' : 'Storage Access',
        status: 'error',
        message: isRTL ? 'فشل الاتصال' : 'Connection failed',
        details: String(err),
      });
    }

    // 5. Check public URL generation
    try {
      const testPath = 'test-path.jpg';
      const { data } = supabase.storage.from('property-images').getPublicUrl(testPath);

      if (data && data.publicUrl) {
        diagnostics.push({
          name: isRTL ? 'توليد الروابط العامة' : 'Public URL Generation',
          status: 'success',
          message: isRTL ? 'يعمل بشكل صحيح' : 'Working correctly',
          details: `Sample: ${data.publicUrl.substring(0, 50)}...`,
        });
      } else {
        diagnostics.push({
          name: isRTL ? 'توليد الروابط العامة' : 'Public URL Generation',
          status: 'warning',
          message: isRTL ? 'غير قادر على التوليد' : 'Unable to generate',
        });
      }
    } catch (err) {
      diagnostics.push({
        name: isRTL ? 'توليد الروابط العامة' : 'Public URL Generation',
        status: 'error',
        message: isRTL ? 'فشل' : 'Failed',
        details: String(err),
      });
    }

    // 6. Check RLS on properties table
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id')
        .limit(1);

      if (error) {
        if (error.message.includes('RLS') || error.message.includes('policy')) {
          diagnostics.push({
            name: isRTL ? 'سياسات RLS' : 'RLS Policies',
            status: 'warning',
            message: isRTL ? 'قد تمنع الوصول للمسؤول' : 'May block admin access',
            details: error.message,
          });
        } else {
          diagnostics.push({
            name: isRTL ? 'سياسات RLS' : 'RLS Policies',
            status: 'error',
            message: isRTL ? 'خطأ في التحقق' : 'Check error',
            details: error.message,
          });
        }
      } else {
        diagnostics.push({
          name: isRTL ? 'سياسات RLS' : 'RLS Policies',
          status: 'success',
          message: isRTL ? 'يعمل بشكل صحيح' : 'Working correctly',
          details: 'Admin can access properties table',
        });
      }
    } catch (err) {
      diagnostics.push({
        name: isRTL ? 'سياسات RLS' : 'RLS Policies',
        status: 'error',
        message: isRTL ? 'فشل التحقق' : 'Check failed',
        details: String(err),
      });
    }

    // 7. Check admin table
    try {
      const { count, error } = await supabase
        .from('admins')
        .select('*', { count: 'exact', head: true });

      if (error) {
        diagnostics.push({
          name: isRTL ? 'جدول المسؤولين' : 'Admins Table',
          status: 'error',
          message: isRTL ? 'خطأ في الوصول' : 'Access error',
          details: error.message,
        });
      } else {
        diagnostics.push({
          name: isRTL ? 'جدول المسؤولين' : 'Admins Table',
          status: 'success',
          message: `${count || 0} ${isRTL ? 'مسؤول' : 'admin(s)'}`,
          details: 'Admins table is accessible',
        });
      }
    } catch (err) {
      diagnostics.push({
        name: isRTL ? 'جدول المسؤولين' : 'Admins Table',
        status: 'error',
        message: isRTL ? 'فشل التحقق' : 'Check failed',
        details: String(err),
      });
    }

    // 8. Check new tables (audit logs, notifications, CMS)
    const tablesToCheck = [
      { name: 'admin_audit_logs', label: isRTL ? 'سجلات التدقيق' : 'Audit Logs' },
      { name: 'admin_notifications', label: isRTL ? 'الإشعارات' : 'Notifications' },
      { name: 'site_pages', label: isRTL ? 'صفحات CMS' : 'CMS Pages' },
      { name: 'site_categories', label: isRTL ? 'فئات CMS' : 'CMS Categories' },
    ];

    for (const table of tablesToCheck) {
      try {
        const { count, error } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });

        if (error) {
          diagnostics.push({
            name: table.label,
            status: 'warning',
            message: isRTL ? 'غير متوفر' : 'Not available',
            details: error.message,
          });
        } else {
          diagnostics.push({
            name: table.label,
            status: 'success',
            message: `${count || 0} ${isRTL ? 'صف' : 'row(s)'}`,
            details: `Table ${table.name} exists and is accessible`,
          });
        }
      } catch (err) {
        diagnostics.push({
          name: table.label,
          status: 'error',
          message: isRTL ? 'فشل التحقق' : 'Check failed',
          details: String(err),
        });
      }
    }

    setChecks(diagnostics);
    setLoading(false);
  };

  const getStatusIcon = (status: DiagnosticCheck['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: DiagnosticCheck['status']) => {
    const variants = {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
    };

    const labels = {
      success: isRTL ? 'نجح' : 'OK',
      warning: isRTL ? 'تحذير' : 'Warning',
      error: isRTL ? 'خطأ' : 'Error',
      info: isRTL ? 'معلومات' : 'Info',
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const successCount = checks.filter((c) => c.status === 'success').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;
  const errorCount = checks.filter((c) => c.status === 'error').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isRTL ? 'التشخيص' : 'Diagnostics'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isRTL ? 'فحص حالة النظام والتكوينات' : 'System health and configuration checks'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {isRTL ? 'الفحوصات الناجحة' : 'Successful Checks'}
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{successCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {isRTL ? 'التحذيرات' : 'Warnings'}
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{warningCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {isRTL ? 'الأخطاء' : 'Errors'}
                  </CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{errorCount}</div>
                </CardContent>
              </Card>
            </div>

            {/* Diagnostic Checks */}
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'نتائج الفحص' : 'Check Results'}</CardTitle>
                <CardDescription>
                  {isRTL
                    ? 'نتائج مفصلة لفحوصات النظام'
                    : 'Detailed results of system checks'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {checks.map((check, index) => (
                    <Alert key={index}>
                      <div className="flex items-start gap-3">
                        {getStatusIcon(check.status)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <AlertTitle className="mb-0">{check.name}</AlertTitle>
                            {getStatusBadge(check.status)}
                          </div>
                          <AlertDescription>
                            <p className="font-medium">{check.message}</p>
                            {check.details && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {check.details}
                              </p>
                            )}
                          </AlertDescription>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
