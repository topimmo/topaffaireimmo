import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Clock, Users, ArrowRight, Globe } from 'lucide-react';

interface Stats {
  pendingListings: number;
  approvedListings: number;
  publishedListings: number; // Added for public listings count
  rejectedListings: number;
  totalListings: number;
  totalUsers: number;
  totalAgencies: number;
}

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  metadata: any;
}

export default function AdminDashboard() {
  const { language, isRTL } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    pendingListings: 0,
    approvedListings: 0,
    publishedListings: 0,
    rejectedListings: 0,
    totalListings: 0,
    totalUsers: 0,
    totalAgencies: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    try {
      // Fetch all property counts in parallel using Promise.all
      const [
        pendingResult,
        approvedResult,
        publishedResult,
        rejectedResult,
        allListingsResult,
        usersResult,
        agenciesResult,
        activityResult
      ] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('properties').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
        supabase.from('properties').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('user_role', 'merchant'),
        supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(10)
      ]);

    setStats({
      pendingListings: pendingResult.count || 0,
      approvedListings: approvedResult.count || 0,
      publishedListings: publishedResult.count || 0,
      rejectedListings: rejectedResult.count || 0,
      totalListings: allListingsResult.count || 0,
      totalUsers: usersResult.count || 0,
      totalAgencies: agenciesResult.count || 0,
    });

    if (activityResult.data) {
      setRecentActivity(activityResult.data);
    }

    setLoading(false);
    } catch (error) {
      // Silently handle errors in production
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: isRTL ? 'الإعلانات المعلقة' : 'Pending Listings',
      value: stats.pendingListings,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      link: '/admin/listings?status=pending',
    },
    {
      title: isRTL ? 'الإعلانات المعتمدة' : 'Approved Listings',
      value: stats.approvedListings,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/admin/listings?status=approved',
    },
    {
      title: isRTL ? 'الإعلانات المنشورة' : 'Published Listings',
      value: stats.publishedListings,
      icon: Globe,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/admin/listings?status=published',
    },
    {
      title: isRTL ? 'الإعلانات المرفوضة' : 'Rejected Listings',
      value: stats.rejectedListings,
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      link: '/admin/listings?status=rejected',
    },
    {
      title: isRTL ? 'إجمالي الإعلانات' : 'Total Listings',
      value: stats.totalListings,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/admin/listings?status=all',
    },
    {
      title: isRTL ? 'المستخدمون' : 'Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      link: '/admin/users',
    },
    {
      title: isRTL ? 'الوكالات' : 'Agencies',
      value: stats.totalAgencies,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      link: '/admin/agencies',
    },
  ];

  const quickActions = [
    {
      title: isRTL ? 'مراجعة الإعلانات المعلقة' : 'Review Pending Listings',
      description: isRTL
        ? 'عرض والموافقة على الإعلانات المعلقة'
        : 'View and approve pending listings',
      link: '/admin/listings?status=pending',
    },
    {
      title: isRTL ? 'جميع الإعلانات' : 'All Listings',
      description: isRTL
        ? 'إدارة جميع الإعلانات في النظام'
        : 'Manage all listings in the system',
      link: '/admin/listings',
    },
    {
      title: isRTL ? 'إدارة المستخدمين' : 'Manage Users',
      description: isRTL
        ? 'عرض وإدارة حسابات المستخدمين'
        : 'View and manage user accounts',
      link: '/admin/users',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isRTL ? 'لوحة التحكم' : 'Dashboard'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isRTL
              ? 'نظرة عامة على منصتك'
              : 'Overview of your platform'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.title} to={stat.link}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <div className={`${stat.bgColor} p-2 rounded-lg`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {loading ? '...' : stat.value}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {isRTL ? 'إجراءات سريعة' : 'Quick Actions'}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => (
              <Card key={action.title} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">{action.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                  <Link to={action.link}>
                    <Button variant="outline" className="w-full">
                      {isRTL ? 'انتقل' : 'Go'}
                      <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2' : 'ml-2'}`} />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? 'النشاط الأخير' : 'Recent Activity'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => {
                  const actionLabels: Record<string, { fr: string; ar: string }> = {
                    approve: { fr: 'Approuvé', ar: 'تمت الموافقة' },
                    reject: { fr: 'Rejeté', ar: 'تم الرفض' },
                    delete: { fr: 'Supprimé', ar: 'تم الحذف' },
                    feature: { fr: 'Mis en avant', ar: 'تم التمييز' },
                    unfeature: { fr: 'Retiré de la mise en avant', ar: 'تمت إزالة التمييز' },
                    update: { fr: 'Mis à jour', ar: 'تم التحديث' },
                    create: { fr: 'Créé', ar: 'تم الإنشاء' },
                  };

                  const entityLabels: Record<string, { fr: string; ar: string }> = {
                    property: { fr: 'Annonce', ar: 'إعلان' },
                    user: { fr: 'Utilisateur', ar: 'مستخدم' },
                    page: { fr: 'Page', ar: 'صفحة' },
                    category: { fr: 'Catégorie', ar: 'فئة' },
                    settings: { fr: 'Paramètres', ar: 'إعدادات' },
                  };

                  const action = actionLabels[activity.action]?.[language] || activity.action;
                  const entity = entityLabels[activity.entity_type]?.[language] || activity.entity_type;

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start justify-between py-2 border-b last:border-b-0"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {action} {entity}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.created_at).toLocaleString(
                            language === 'ar' ? 'ar-MA' : 'fr-MA'
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
