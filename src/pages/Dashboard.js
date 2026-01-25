import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Home, Building, Landmark, Trees, Store, Loader2, AlertTriangle, } from 'lucide-react';
import { cn } from '@/lib/utils';
const propertyIcons = {
    apartment: Building,
    house: Home,
    villa: Landmark,
    commercial: Store,
    land: Trees,
};
const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    inactive: 'bg-gray-100 text-gray-800',
};
export default function Dashboard() {
    const { t, language, isRTL } = useLanguage();
    const { user, profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login', { state: { from: '/dashboard' } });
        }
        // Redirect commercial advertisers to their dedicated dashboard
        if (!authLoading && profile && profile.user_role === 'commercial_advertiser') {
            navigate('/commercial-dashboard');
        }
    }, [user, authLoading, navigate, profile]);
    useEffect(() => {
        if (user) {
            fetchProperties();
        }
    }, [user]);
    const fetchProperties = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('properties')
            .select(`
        id,
        transaction_type,
        property_type,
        title_fr,
        title_ar,
        price,
        status,
        images,
        created_at,
        city:cities(name_fr, name_ar)
      `)
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });
        if (!error && data) {
            setProperties(data);
        }
        setLoading(false);
    };
    const handleDelete = async () => {
        if (!deleteId)
            return;
        setDeleting(true);
        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', deleteId);
        if (!error) {
            setProperties((prev) => prev.filter((p) => p.id !== deleteId));
        }
        setDeleteId(null);
        setDeleting(false);
    };
    const getStatusLabel = (status) => {
        const labels = {
            pending: t('dashboard.pending'),
            approved: t('dashboard.approved'),
            rejected: t('dashboard.rejected'),
            inactive: t('dashboard.inactive'),
        };
        return labels[status] || status;
    };
    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-MA', {
            style: 'decimal',
            maximumFractionDigits: 0,
        }).format(price);
    };
    if (authLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: _jsx(Loader2, { className: "h-10 w-10 animate-spin text-primary" }) }));
    }
    return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 pt-24 pb-16", children: _jsxs("div", { className: "container max-w-5xl", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-display text-3xl font-semibold text-foreground", children: t('dashboard.title') }), profile && (_jsxs("p", { className: "text-muted-foreground mt-1", children: [isRTL ? 'مرحباً' : 'Bienvenue', ", ", profile.full_name || profile.email] }))] }), _jsx(Button, { asChild: true, children: _jsxs(Link, { to: "/add-listing", children: [_jsx(Plus, { className: "h-4 w-4" }), t('dashboard.addNew')] }) })] }), loading ? (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx(Loader2, { className: "h-10 w-10 animate-spin text-primary" }) })) : properties.length === 0 ? (_jsxs("div", { className: "bg-white rounded-2xl border p-12 text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4", children: _jsx(Home, { className: "h-8 w-8 text-muted-foreground" }) }), _jsx("h2", { className: "font-display text-xl font-semibold text-foreground mb-2", children: t('dashboard.noListings') }), _jsx("p", { className: "text-muted-foreground mb-6", children: t('dashboard.createFirst') }), _jsx(Button, { asChild: true, children: _jsxs(Link, { to: "/add-listing", children: [_jsx(Plus, { className: "h-4 w-4" }), t('dashboard.addNew')] }) })] })) : (_jsx("div", { className: "space-y-4", children: properties.map((property) => {
                                const Icon = propertyIcons[property.property_type] || Building;
                                const title = language === 'ar' ? property.title_ar : property.title_fr;
                                const cityName = language === 'ar' ? property.city?.name_ar : property.city?.name_fr;
                                return (_jsxs("div", { className: "bg-white rounded-xl border p-4 sm:p-6 flex flex-col sm:flex-row gap-4", children: [_jsx("div", { className: "w-full sm:w-40 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0", children: property.images?.[0] ? (_jsx("img", { src: property.images[0], alt: title, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center", children: _jsx(Icon, { className: "h-10 w-10 text-muted-foreground" }) })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-2", children: [_jsx(Badge, { variant: "secondary", className: cn('font-normal', statusColors[property.status]), children: getStatusLabel(property.status) }), _jsx(Badge, { variant: "outline", className: "font-normal", children: property.transaction_type === 'sale'
                                                                ? t('property.forSale')
                                                                : t('property.forRent') })] }), _jsx("h3", { className: "font-display text-lg font-semibold text-foreground truncate", children: title }), _jsx("p", { className: "text-sm text-muted-foreground mb-2", children: cityName }), _jsxs("p", { className: "font-mono-price text-lg font-semibold text-primary", children: [formatPrice(property.price), " MAD", property.transaction_type === 'rent' && (_jsx("span", { className: "text-sm font-normal text-muted-foreground", children: t('property.perMonth') }))] })] }), _jsxs("div", { className: "flex sm:flex-col gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", asChild: true, className: "flex-1 sm:flex-none", children: _jsxs(Link, { to: `/edit-listing/${property.id}`, children: [_jsx(Edit, { className: "h-4 w-4" }), _jsx("span", { className: "sm:hidden", children: t('dashboard.edit') })] }) }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => setDeleteId(property.id), className: "flex-1 sm:flex-none text-destructive hover:text-destructive hover:bg-destructive/10", children: [_jsx(Trash2, { className: "h-4 w-4" }), _jsx("span", { className: "sm:hidden", children: t('dashboard.delete') })] })] })] }, property.id));
                            }) }))] }) }), _jsx(AlertDialog, { open: !!deleteId, onOpenChange: () => setDeleteId(null), children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsxs(AlertDialogTitle, { className: "flex items-center gap-2", children: [_jsx(AlertTriangle, { className: "h-5 w-5 text-destructive" }), t('common.confirm')] }), _jsx(AlertDialogDescription, { children: isRTL
                                        ? 'هل أنت متأكد أنك تريد حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.'
                                        : 'Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.' })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: t('common.cancel') }), _jsx(AlertDialogAction, { onClick: handleDelete, className: "bg-destructive hover:bg-destructive/90", disabled: deleting, children: deleting ? _jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : t('dashboard.delete') })] })] }) }), _jsx(Footer, {})] }));
}
