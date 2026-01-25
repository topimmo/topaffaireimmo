import AdminLayout from '@/components/layout/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminUsers() {
  const { isRTL } = useLanguage();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isRTL ? 'إدارة المستخدمين' : 'User Management'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isRTL
              ? 'صفحة إدارة المستخدمين (قيد التطوير)'
              : 'User management page (under development)'}
          </p>
        </div>
        
        <div className="bg-white rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            {isRTL
              ? 'هذه الصفحة قيد التطوير. يمكنك استخدام الصفحة القديمة في /admin-panel للوصول إلى إدارة المستخدمين.'
              : 'This page is under development. You can use the legacy page at /admin-panel to access user management.'}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
