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
import { Tabs, TabsContent, TabsList, TabsTrigger, } from '@/components/ui/tabs';
import { Plus, Image as ImageIcon, Clock, CheckCircle, XCircle, AlertCircle, Loader2, LogIn, Megaphone, ExternalLink, } from 'lucide-react';
import { cn } from '@/lib/utils';
const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800',
};
const statusIcons = {
    pending: Clock,
    approved: CheckCircle,
    active: CheckCircle,
    rejected: XCircle,
    expired: AlertCircle,
};
const pricing = [
    { days: 7, price: 800 },
    { days: 15, price: 1400 },
    { days: 30, price: 2500 },
];
export default function Advertising() {
    const { t, language, isRTL } = useLanguage();
    const { user, profile, loading: authLoading, profileLoading } = useAuth();
    const navigate = useNavigate();
    const [slots, setSlots] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    // Redirect real estate advertisers away from commercial advertising
    useEffect(() => {
        if (!authLoading && !profileLoading && profile && profile.user_role === 'real_estate_advertiser') {
            navigate('/dashboard');
        }
    }, [authLoading, profileLoading, profile, navigate]);
    useEffect(() => {
        if (user) {
            fetchData();
        }
        else if (!authLoading && !profileLoading) {
            setLoading(false);
        }
    }, [user, authLoading, profileLoading]);
    const fetchData = async () => {
        setLoading(true);
        const [slotsRes, requestsRes] = await Promise.all([
            supabase.from('banner_slots').select('*').eq('is_active', true),
            supabase
                .from('banner_requests')
                .select(`
          *,
          slot:banner_slots(*)
        `)
                .eq('advertiser_id', user.id)
                .order('created_at', { ascending: false }),
        ]);
        if (slotsRes.data)
            setSlots(slotsRes.data);
        if (requestsRes.data)
            setRequests(requestsRes.data);
        setLoading(false);
    };
    const getSlotName = (slot) => {
        if (language === 'ar')
            return slot.name_ar;
        return slot.name_fr;
    };
    const getSlotDescription = (slot) => {
        if (language === 'ar')
            return slot.description_ar;
        return slot.description_fr;
    };
    const getStatusLabel = (status) => {
        return t(`advertising.${status}`);
    };
    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-MA', {
            style: 'decimal',
            maximumFractionDigits: 0,
        }).format(price);
    };
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-MA');
    };
    const getPageLabel = (page) => {
        const labels = {
            home: { fr: 'Page d\'accueil', ar: 'الصفحة الرئيسية' },
            search: { fr: 'Résultats de recherche', ar: 'نتائج البحث' },
            property_details: { fr: 'Détails du bien', ar: 'تفاصيل العقار' },
        };
        return labels[page]?.[language === 'ar' ? 'ar' : 'fr'] || page;
    };
    if (authLoading || profileLoading || loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: _jsx(Loader2, { className: "h-10 w-10 animate-spin text-primary" }) }));
    }
    // Show login message for non-authenticated users
    if (!user) {
        return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 flex items-center justify-center pt-20 px-4", children: _jsxs("div", { className: "text-center max-w-md", children: [_jsx("div", { className: "w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6", children: _jsx(LogIn, { className: "h-10 w-10 text-muted-foreground" }) }), _jsx("h1", { className: "font-display text-2xl font-semibold text-foreground mb-4", children: t('advertising.loginRequired') }), _jsx("p", { className: "text-muted-foreground mb-6", children: t('advertising.loginMessage') }), _jsxs("div", { className: "flex gap-4 justify-center", children: [_jsx(Button, { asChild: true, children: _jsx(Link, { to: "/login", state: { from: '/advertising' }, children: t('nav.login') }) }), _jsx(Button, { variant: "outline", asChild: true, children: _jsx(Link, { to: "/register", children: t('nav.register') }) })] })] }) }), _jsx(Footer, {})] }));
    }
    return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 pt-24 pb-16", children: _jsxs("div", { className: "container max-w-5xl", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-display text-3xl font-semibold text-foreground", children: t('advertising.dashboard') }), _jsx("p", { className: "text-muted-foreground mt-1", children: isRTL
                                                ? 'أعلن عن عملك على TopAffaireImmo'
                                                : 'Faites la promotion de votre entreprise sur TopAffaireImmo' })] }), _jsx(Button, { asChild: true, children: _jsxs(Link, { to: "/advertising/new", children: [_jsx(Plus, { className: "h-4 w-4" }), t('advertising.newRequest')] }) })] }), _jsxs(Tabs, { defaultValue: "ads", className: "space-y-6", children: [_jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "ads", children: t('advertising.myAds') }), _jsx(TabsTrigger, { value: "slots", children: t('advertising.availableSlots') }), _jsx(TabsTrigger, { value: "pricing", children: t('advertising.pricing') })] }), _jsx(TabsContent, { value: "ads", className: "space-y-4", children: requests.length === 0 ? (_jsxs("div", { className: "bg-white rounded-2xl border p-12 text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4", children: _jsx(Megaphone, { className: "h-8 w-8 text-muted-foreground" }) }), _jsx("h2", { className: "font-display text-xl font-semibold text-foreground mb-2", children: t('advertising.noAds') }), _jsx("p", { className: "text-muted-foreground mb-6", children: t('advertising.createFirst') }), _jsx(Button, { asChild: true, children: _jsxs(Link, { to: "/advertising/new", children: [_jsx(Plus, { className: "h-4 w-4" }), t('advertising.newRequest')] }) })] })) : (requests.map((request) => {
                                        const StatusIcon = statusIcons[request.status] || Clock;
                                        return (_jsxs("div", { className: "bg-white rounded-xl border p-4 sm:p-6 flex flex-col sm:flex-row gap-4", children: [_jsx("div", { className: "w-full sm:w-48 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0", children: request.banner_image_url ? (_jsx("img", { src: request.banner_image_url, alt: request.company_name, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center", children: _jsx(ImageIcon, { className: "h-10 w-10 text-muted-foreground" }) })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-2", children: [_jsxs(Badge, { variant: "secondary", className: cn('font-normal', statusColors[request.status]), children: [_jsx(StatusIcon, { className: "h-3 w-3 mr-1" }), getStatusLabel(request.status)] }), _jsxs(Badge, { variant: "outline", className: "font-normal", children: [request.duration_days, " ", t('advertising.days')] })] }), _jsx("h3", { className: "font-display text-lg font-semibold text-foreground", children: request.company_name }), _jsx("p", { className: "text-sm text-muted-foreground mb-2", children: getSlotName(request.slot) }), _jsxs("div", { className: "flex flex-wrap gap-4 text-sm text-muted-foreground", children: [_jsxs("span", { children: [t('advertising.price'), ": ", _jsxs("strong", { children: [formatPrice(request.price), " MAD"] })] }), request.start_date && (_jsxs("span", { children: [t('advertising.startDate'), ": ", formatDate(request.start_date)] })), request.end_date && (_jsxs("span", { children: [t('advertising.endDate'), ": ", formatDate(request.end_date)] }))] }), request.target_url && (_jsxs("a", { href: request.target_url, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2", children: [_jsx(ExternalLink, { className: "h-3 w-3" }), request.target_url] }))] })] }, request.id));
                                    })) }), _jsx(TabsContent, { value: "slots", className: "space-y-4", children: slots.map((slot) => (_jsx("div", { className: "bg-white rounded-xl border p-6", children: _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-display text-lg font-semibold text-foreground mb-1", children: getSlotName(slot) }), _jsx("p", { className: "text-sm text-muted-foreground mb-3", children: getSlotDescription(slot) }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs(Badge, { variant: "outline", children: [t('advertising.page'), ": ", getPageLabel(slot.page)] }), _jsxs(Badge, { variant: "outline", children: [t('advertising.size'), ": ", slot.size] })] })] }), _jsx(Button, { asChild: true, size: "sm", children: _jsx(Link, { to: `/advertising/new?slot=${slot.id}`, children: isRTL ? 'حجز هذا الموقع' : 'Réserver' }) })] }) }, slot.id))) }), _jsx(TabsContent, { value: "pricing", children: _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h3", { className: "font-display text-xl font-semibold text-foreground mb-6", children: t('advertising.pricing') }), _jsx("div", { className: "grid md:grid-cols-3 gap-4", children: pricing.map((tier) => (_jsxs("div", { className: "rounded-xl border-2 p-6 text-center hover:border-primary transition-colors", children: [_jsx("p", { className: "text-3xl font-display font-semibold text-primary mb-1", children: tier.days }), _jsx("p", { className: "text-muted-foreground mb-4", children: t('advertising.days') }), _jsxs("p", { className: "font-mono-price text-2xl font-bold text-foreground", children: [formatPrice(tier.price), " ", _jsx("span", { className: "text-sm font-normal", children: "MAD" })] })] }, tier.days))) }), _jsxs("div", { className: "mt-8 p-4 bg-muted/50 rounded-lg", children: [_jsx("h4", { className: "font-semibold mb-2", children: t('advertising.bankTransfer') }), _jsx("p", { className: "text-sm text-muted-foreground mb-2", children: isRTL
                                                            ? 'يرجى إجراء تحويل بنكي إلى الحساب التالي وإرفاق إثبات الدفع مع طلبك:'
                                                            : 'Veuillez effectuer un virement bancaire au compte suivant et joindre la preuve de paiement à votre demande:' }), _jsxs("div", { className: "bg-white rounded p-3 text-sm font-mono", children: [_jsx("p", { children: "IBAN: MA64 XXX XXXX XXXX XXXX XXXX XXX" }), _jsx("p", { children: "BIC: XXXXXXXX" }), _jsxs("p", { children: [isRTL ? 'المستفيد' : 'Bénéficiaire', ": TopAffaireImmo SARL"] })] })] })] }) })] })] }) }), _jsx(Footer, {})] }));
}
