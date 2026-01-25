import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, Clock, Users, ArrowRight } from 'lucide-react';
export default function AdminDashboard() {
    const { isRTL } = useLanguage();
    const [stats, setStats] = useState({
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
        // Fetch total users
        const { count: usersCount } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true });
        setStats({
            pendingListings: pendingCount || 0,
            approvedListings: approvedCount || 0,
            rejectedListings: rejectedCount || 0,
            totalUsers: usersCount || 0,
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
            title: isRTL ? 'إجمالي المستخدمين' : 'Total Users',
            value: stats.totalUsers,
            icon: Users,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
            link: '/admin/users',
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
    return (_jsx(AdminLayout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-foreground", children: isRTL ? 'لوحة التحكم' : 'Dashboard' }), _jsx("p", { className: "mt-2 text-muted-foreground", children: isRTL
                                ? 'نظرة عامة على منصتك'
                                : 'Overview of your platform' })] }), _jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: statCards.map((stat) => {
                        const Icon = stat.icon;
                        return (_jsx(Link, { to: stat.link, children: _jsxs(Card, { className: "hover:shadow-md transition-shadow cursor-pointer", children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: stat.title }), _jsx("div", { className: `${stat.bgColor} p-2 rounded-lg`, children: _jsx(Icon, { className: `h-4 w-4 ${stat.color}` }) })] }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-bold", children: loading ? '...' : stat.value }) })] }) }, stat.title));
                    }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: isRTL ? 'إجراءات سريعة' : 'Quick Actions' }), _jsx("div", { className: "grid gap-4 md:grid-cols-3", children: quickActions.map((action) => (_jsxs(Card, { className: "hover:shadow-md transition-shadow", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: action.title }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: action.description }), _jsx(Link, { to: action.link, children: _jsxs(Button, { variant: "outline", className: "w-full", children: [isRTL ? 'انتقل' : 'Go', _jsx(ArrowRight, { className: `h-4 w-4 ${isRTL ? 'mr-2' : 'ml-2'}` })] }) })] })] }, action.title))) })] })] }) }));
}
