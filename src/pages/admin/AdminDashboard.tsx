import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Clock, Users, ArrowRight } from 'lucide-react';

interface Stats {
  pendingListings: number;
  approvedListings: number;
  rejectedListings: number;
  totalUsers: number;
}

export default function AdminDashboard() {
  const { isRTL } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    pendingListings: 0,
    approvedListings: 0,
    rejectedListings: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    // Fetch listings by status
    const { count: pendingCount } = await supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: approvedCount } = await supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved');

    const { count: rejectedCount } = await supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'rejected');

    // Fetch total users - count from auth schema is not accessible from frontend
    // Instead, we'll show listing count or remove this stat
    const { count: allListingsCount } = await supabase
      .from('properties')
      .select('id', { count: 'exact', head: true });

    setStats({
      pendingListings: pendingCount || 0,
      approvedListings: approvedCount || 0,
      rejectedListings: rejectedCount || 0,
      totalUsers: allListingsCount || 0, // Show total listings instead of users
    });

    setLoading(false);
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
      title: isRTL ? 'الإعلانات المرفوضة' : 'Rejected Listings',
      value: stats.rejectedListings,
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      link: '/admin/listings?status=rejected',
    },
    {
      title: isRTL ? 'إجمالي الإعلانات' : 'Total Listings',
      value: stats.totalUsers, // Reusing totalUsers field for total listings count
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/admin/listings?status=all',
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      </div>
    </AdminLayout>
  );
}
