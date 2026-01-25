import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger, } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Loader2, ShieldAlert, Image as ImageIcon, ExternalLink, Eye, Home, Building, Users, FileText, Trash2, MapPin, DollarSign, } from 'lucide-react';
import { cn } from '@/lib/utils';
const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800',
};
const propertyStatusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    sold: 'bg-blue-100 text-blue-800',
    rented: 'bg-purple-100 text-purple-800',
};
export default function AdminPanel() {
    const { t, language, isRTL } = useLanguage();
    const { user, profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('properties');
    const [requests, setRequests] = useState([]);
    const [properties, setProperties] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userFilter, setUserFilter] = useState('all');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [propertyActionType, setPropertyActionType] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    useEffect(() => {
        if (!authLoading && profile) {
            if (!profile.is_admin) {
                navigate('/');
            }
            else {
                fetchRequests();
                fetchProperties();
            }
        }
        else if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, profile, authLoading, navigate]);
    const fetchRequests = async () => {
        const { data } = await supabase
            .from('banner_requests')
            .select(`
        *,
        advertiser:profiles(email, full_name),
        slot:banner_slots(name_fr, name_ar, page, size)
      `)
            .order('created_at', { ascending: false });
        if (data)
            setRequests(data);
    };
    const fetchProperties = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('properties')
            .select(`
        id,
        title_fr,
        title_ar,
        price,
        status,
        transaction_type,
        property_type,
        advertiser_type,
        created_at,
        images,
        city:cities(name_fr, name_ar),
        owner:profiles(email, full_name)
      `)
            .order('created_at', { ascending: false });
        if (data)
            setProperties(data);
        setLoading(false);
    };
    const fetchUsers = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (data)
            setUsers(data);
    };
    const toggleUserStatus = async (userId, currentStatus) => {
        const { error } = await supabase
            .from('profiles')
            .update({ is_active: !currentStatus })
            .eq('id', userId);
        if (!error)
            fetchUsers();
    };
    const changeUserRole = async (userId, newRole) => {
        const { error } = await supabase
            .from('profiles')
            .update({ user_role: newRole })
            .eq('id', userId);
        if (!error)
            fetchUsers();
    };
    const handleAction = async () => {
        if (!selectedRequest || !actionType)
            return;
        setProcessing(true);
        const updates = {
            admin_notes: adminNotes || null,
            updated_at: new Date().toISOString(),
        };
        if (actionType === 'approve') {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + selectedRequest.duration_days);
            updates.status = 'active';
            updates.approved_at = startDate.toISOString();
            updates.start_date = startDate.toISOString();
            updates.end_date = endDate.toISOString();
        }
        else {
            updates.status = 'rejected';
        }
        await supabase
            .from('banner_requests')
            .update(updates)
            .eq('id', selectedRequest.id);
        setProcessing(false);
        setSelectedRequest(null);
        setActionType(null);
        setAdminNotes('');
        fetchRequests();
    };
    const handlePropertyAction = async () => {
        if (!selectedProperty || !propertyActionType)
            return;
        setProcessing(true);
        if (propertyActionType === 'delete') {
            await supabase.from('properties').delete().eq('id', selectedProperty.id);
        }
        else {
            const status = propertyActionType === 'approve' ? 'approved' : 'rejected';
            await supabase.from('properties').update({ status }).eq('id', selectedProperty.id);
        }
        setProcessing(false);
        setSelectedProperty(null);
        setPropertyActionType(null);
        fetchProperties();
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
    const getSlotName = (slot) => {
        return language === 'ar' ? slot.name_ar : slot.name_fr;
    };
    const filterByStatus = (status) => {
        if (status === 'all')
            return requests;
        return requests.filter(r => r.status === status);
    };
    const filterPropertiesByStatus = (status) => {
        if (status === 'all')
            return properties;
        return properties.filter(p => p.status === status);
    };
    const getPropertyTitle = (property) => {
        return language === 'ar' ? property.title_ar : property.title_fr;
    };
    const getCityName = (city) => {
        if (!city)
            return '-';
        return language === 'ar' ? city.name_ar : city.name_fr;
    };
    const getAdvertiserTypeLabel = (type) => {
        const labels = {
            owner: { fr: 'Propriétaire', ar: 'مالك' },
            broker: { fr: 'Courtier', ar: 'سمسار' },
            agency: { fr: 'Agence', ar: 'وكالة' },
        };
        return labels[type]?.[language] || type;
    };
    const getPropertyTypeLabel = (type) => {
        const labels = {
            apartment: { fr: 'Appartement', ar: 'شقة' },
            house: { fr: 'Maison', ar: 'منزل' },
            villa: { fr: 'Villa', ar: 'فيلا' },
            land: { fr: 'Terrain', ar: 'أرض' },
            commercial: { fr: 'Commercial', ar: 'تجاري' },
        };
        return labels[type]?.[language] || type;
    };
    if (authLoading || loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: _jsx(Loader2, { className: "h-10 w-10 animate-spin text-primary" }) }));
    }
    if (!profile?.is_admin) {
        return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 flex items-center justify-center pt-20", children: _jsxs("div", { className: "text-center px-4", children: [_jsx("div", { className: "w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6", children: _jsx(ShieldAlert, { className: "h-10 w-10 text-destructive" }) }), _jsx("h1", { className: "font-display text-2xl font-semibold text-foreground mb-4", children: isRTL ? 'الوصول مرفوض' : 'Accès refusé' }), _jsx("p", { className: "text-muted-foreground", children: isRTL
                                    ? 'ليس لديك صلاحية للوصول إلى هذه الصفحة'
                                    : 'Vous n\'avez pas accès à cette page' })] }) }), _jsx(Footer, {})] }));
    }
    return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 pt-24 pb-16", children: _jsxs("div", { className: "container max-w-6xl", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "font-display text-3xl font-semibold text-foreground mb-4", children: t('admin.title') }), _jsx("p", { className: "text-muted-foreground", children: isRTL ? 'إدارة العقارات والإعلانات والمحتوى' : 'Gérer les propriétés, les annonces et le contenu' })] }), _jsxs("div", { className: "flex flex-wrap gap-2 mb-8", children: [_jsxs(Button, { variant: activeSection === 'properties' ? 'default' : 'outline', onClick: () => setActiveSection('properties'), children: [_jsx(Home, { className: "h-4 w-4 mr-2" }), isRTL ? 'العقارات' : 'Propriétés', _jsx(Badge, { variant: "secondary", className: "ml-2", children: properties.length })] }), _jsxs(Button, { variant: activeSection === 'ads' ? 'default' : 'outline', onClick: () => setActiveSection('ads'), children: [_jsx(ImageIcon, { className: "h-4 w-4 mr-2" }), isRTL ? 'الإعلانات' : 'Publicités', _jsx(Badge, { variant: "secondary", className: "ml-2", children: requests.length })] }), _jsxs(Button, { variant: activeSection === 'content' ? 'default' : 'outline', onClick: () => setActiveSection('content'), children: [_jsx(FileText, { className: "h-4 w-4 mr-2" }), isRTL ? 'المحتوى' : 'Contenu'] }), _jsxs(Button, { variant: activeSection === 'users' ? 'default' : 'outline', onClick: () => { setActiveSection('users'); fetchUsers(); }, children: [_jsx(Users, { className: "h-4 w-4 mr-2" }), isRTL ? 'المستخدمين' : 'Utilisateurs', _jsx(Badge, { variant: "secondary", className: "ml-2", children: users.length })] })] }), activeSection === 'properties' && (_jsxs(Tabs, { defaultValue: "pending", className: "space-y-6", children: [_jsxs(TabsList, { children: [_jsxs(TabsTrigger, { value: "pending", children: [isRTL ? 'قيد الانتظار' : 'En attente', " (", filterPropertiesByStatus('pending').length, ")"] }), _jsxs(TabsTrigger, { value: "approved", children: [isRTL ? 'موافق عليه' : 'Approuvé', " (", filterPropertiesByStatus('approved').length, ")"] }), _jsxs(TabsTrigger, { value: "all", children: [isRTL ? 'الكل' : 'Tous', " (", properties.length, ")"] })] }), ['pending', 'approved', 'all'].map((tab) => (_jsx(TabsContent, { value: tab, className: "space-y-4", children: filterPropertiesByStatus(tab).length === 0 ? (_jsx("div", { className: "bg-white rounded-xl border p-12 text-center", children: _jsx("p", { className: "text-muted-foreground", children: isRTL ? 'لا توجد عقارات' : 'Aucune propriété' }) })) : (filterPropertiesByStatus(tab).map((property) => (_jsx("div", { className: "bg-white rounded-xl border p-4", children: _jsxs("div", { className: "flex flex-col md:flex-row gap-4", children: [_jsx("div", { className: "w-full md:w-32 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0", children: property.images?.[0] ? (_jsx("img", { src: property.images[0], alt: getPropertyTitle(property), className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center", children: _jsx(Home, { className: "h-8 w-8 text-muted-foreground" }) })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-2", children: [_jsx(Badge, { className: propertyStatusColors[property.status], children: property.status === 'pending' ? (isRTL ? 'قيد الانتظار' : 'En attente') :
                                                                        property.status === 'approved' ? (isRTL ? 'موافق عليه' : 'Approuvé') :
                                                                            property.status === 'rejected' ? (isRTL ? 'مرفوض' : 'Rejeté') : property.status }), _jsx(Badge, { variant: "outline", children: property.transaction_type === 'sale' ? (isRTL ? 'للبيع' : 'Vente') : (isRTL ? 'للإيجار' : 'Location') }), _jsx(Badge, { variant: "outline", children: getPropertyTypeLabel(property.property_type) }), _jsx(Badge, { variant: "secondary", children: getAdvertiserTypeLabel(property.advertiser_type) })] }), _jsx("h3", { className: "font-semibold text-foreground truncate", children: getPropertyTitle(property) || (isRTL ? 'بدون عنوان' : 'Sans titre') }), _jsxs("div", { className: "flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(MapPin, { className: "h-3 w-3" }), getCityName(property.city)] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(DollarSign, { className: "h-3 w-3" }), new Intl.NumberFormat('fr-MA').format(property.price), " MAD"] }), _jsx("span", { children: property.owner?.full_name || property.owner?.email || '-' })] })] }), _jsxs("div", { className: "flex md:flex-col gap-2", children: [_jsx(Button, { size: "sm", variant: "outline", asChild: true, children: _jsx(Link, { to: `/property/${property.id}`, children: _jsx(Eye, { className: "h-4 w-4" }) }) }), property.status === 'pending' && (_jsxs(_Fragment, { children: [_jsx(Button, { size: "sm", onClick: () => {
                                                                        setSelectedProperty(property);
                                                                        setPropertyActionType('approve');
                                                                    }, children: _jsx(CheckCircle, { className: "h-4 w-4" }) }), _jsx(Button, { size: "sm", variant: "outline", className: "text-destructive", onClick: () => {
                                                                        setSelectedProperty(property);
                                                                        setPropertyActionType('reject');
                                                                    }, children: _jsx(XCircle, { className: "h-4 w-4" }) })] })), _jsx(Button, { size: "sm", variant: "outline", className: "text-destructive", onClick: () => {
                                                                setSelectedProperty(property);
                                                                setPropertyActionType('delete');
                                                            }, children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] }) }, property.id)))) }, tab)))] })), activeSection === 'ads' && (_jsxs(Tabs, { defaultValue: "pending", className: "space-y-6", children: [_jsxs(TabsList, { children: [_jsxs(TabsTrigger, { value: "pending", children: [t('advertising.pending'), " (", filterByStatus('pending').length, ")"] }), _jsxs(TabsTrigger, { value: "active", children: [t('advertising.active'), " (", filterByStatus('active').length, ")"] }), _jsxs(TabsTrigger, { value: "all", children: [isRTL ? 'الكل' : 'Tous', " (", requests.length, ")"] })] }), ['pending', 'active', 'all'].map((tab) => (_jsx(TabsContent, { value: tab, className: "space-y-4", children: filterByStatus(tab).length === 0 ? (_jsx("div", { className: "bg-white rounded-xl border p-12 text-center", children: _jsx("p", { className: "text-muted-foreground", children: isRTL ? 'لا توجد طلبات' : 'Aucune demande' }) })) : (filterByStatus(tab).map((request) => (_jsx("div", { className: "bg-white rounded-xl border p-6", children: _jsxs("div", { className: "flex flex-col lg:flex-row gap-6", children: [_jsx("div", { className: "w-full lg:w-64 flex-shrink-0", children: _jsx("div", { className: "aspect-[728/90] rounded-lg overflow-hidden bg-muted cursor-pointer", onClick: () => setPreviewUrl(request.banner_image_url), children: request.banner_image_url ? (_jsx("img", { src: request.banner_image_url, alt: request.company_name, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center", children: _jsx(ImageIcon, { className: "h-10 w-10 text-muted-foreground" }) })) }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-2", children: [_jsx(Badge, { variant: "secondary", className: cn('font-normal', statusColors[request.status]), children: getStatusLabel(request.status) }), _jsxs(Badge, { variant: "outline", children: [request.duration_days, " ", t('advertising.days')] }), _jsxs(Badge, { variant: "outline", children: [formatPrice(request.price), " MAD"] })] }), _jsx("h3", { className: "font-display text-lg font-semibold text-foreground mb-1", children: request.company_name }), _jsxs("p", { className: "text-sm text-muted-foreground mb-2", children: [getSlotName(request.slot), " (", request.slot.size, ")"] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm mb-4", children: [_jsxs("div", { children: [_jsxs("span", { className: "text-muted-foreground", children: [isRTL ? 'المعلن' : 'Annonceur', ":"] }), _jsx("p", { children: request.advertiser.full_name || request.advertiser.email })] }), _jsxs("div", { children: [_jsxs("span", { className: "text-muted-foreground", children: [t('advertising.contactEmail'), ":"] }), _jsx("p", { children: request.contact_email })] }), _jsxs("div", { children: [_jsxs("span", { className: "text-muted-foreground", children: [isRTL ? 'تاريخ الإنشاء' : 'Créé le', ":"] }), _jsx("p", { children: formatDate(request.created_at) })] }), request.start_date && (_jsxs("div", { children: [_jsxs("span", { className: "text-muted-foreground", children: [t('advertising.startDate'), ":"] }), _jsx("p", { children: formatDate(request.start_date) })] }))] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs("a", { href: request.target_url, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-1 text-sm text-primary hover:underline", children: [_jsx(ExternalLink, { className: "h-3 w-3" }), isRTL ? 'عرض الرابط' : 'Voir le lien'] }), request.payment_proof_url && (_jsxs("button", { onClick: () => setPreviewUrl(request.payment_proof_url), className: "inline-flex items-center gap-1 text-sm text-primary hover:underline", children: [_jsx(Eye, { className: "h-3 w-3" }), t('admin.viewPayment')] }))] })] }), request.status === 'pending' && (_jsxs("div", { className: "flex lg:flex-col gap-2", children: [_jsxs(Button, { size: "sm", onClick: () => {
                                                                setSelectedRequest(request);
                                                                setActionType('approve');
                                                            }, children: [_jsx(CheckCircle, { className: "h-4 w-4" }), t('admin.approve')] }), _jsxs(Button, { size: "sm", variant: "outline", className: "text-destructive hover:text-destructive", onClick: () => {
                                                                setSelectedRequest(request);
                                                                setActionType('reject');
                                                            }, children: [_jsx(XCircle, { className: "h-4 w-4" }), t('admin.reject')] })] }))] }) }, request.id)))) }, tab)))] })), activeSection === 'content' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: [_jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center", children: _jsx(FileText, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: isRTL ? 'سياسة الخصوصية' : 'Politique de confidentialité' }), _jsx("p", { className: "text-sm text-muted-foreground", children: isRTL ? 'FR / AR' : 'FR / AR' })] })] }), _jsx(Button, { variant: "outline", size: "sm", asChild: true, className: "w-full", children: _jsxs(Link, { to: "/privacy", children: [_jsx(Eye, { className: "h-4 w-4 mr-2" }), isRTL ? 'عرض' : 'Voir'] }) })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center", children: _jsx(FileText, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: isRTL ? 'الشروط والأحكام' : 'Conditions générales' }), _jsx("p", { className: "text-sm text-muted-foreground", children: isRTL ? 'FR / AR' : 'FR / AR' })] })] }), _jsx(Button, { variant: "outline", size: "sm", asChild: true, className: "w-full", children: _jsxs(Link, { to: "/terms", children: [_jsx(Eye, { className: "h-4 w-4 mr-2" }), isRTL ? 'عرض' : 'Voir'] }) })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center", children: _jsx(Building, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: isRTL ? 'من نحن' : 'À propos' }), _jsx("p", { className: "text-sm text-muted-foreground", children: isRTL ? 'FR / AR' : 'FR / AR' })] })] }), _jsx(Button, { variant: "outline", size: "sm", asChild: true, className: "w-full", children: _jsxs(Link, { to: "/about", children: [_jsx(Eye, { className: "h-4 w-4 mr-2" }), isRTL ? 'عرض' : 'Voir'] }) })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center", children: _jsx(Users, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: isRTL ? 'اتصل بنا' : 'Contact' }), _jsx("p", { className: "text-sm text-muted-foreground", children: isRTL ? 'FR / AR' : 'FR / AR' })] })] }), _jsx(Button, { variant: "outline", size: "sm", asChild: true, className: "w-full", children: _jsxs(Link, { to: "/contact", children: [_jsx(Eye, { className: "h-4 w-4 mr-2" }), isRTL ? 'عرض' : 'Voir'] }) })] })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h3", { className: "font-semibold mb-4", children: isRTL ? 'نظرة عامة على الإحصائيات' : 'Aperçu des statistiques' }), _jsxs("div", { className: "grid gap-4 md:grid-cols-4", children: [_jsxs("div", { className: "p-4 bg-muted/50 rounded-lg text-center", children: [_jsx("p", { className: "text-3xl font-bold text-primary", children: properties.length }), _jsx("p", { className: "text-sm text-muted-foreground", children: isRTL ? 'إجمالي العقارات' : 'Total propriétés' })] }), _jsxs("div", { className: "p-4 bg-muted/50 rounded-lg text-center", children: [_jsx("p", { className: "text-3xl font-bold text-yellow-600", children: filterPropertiesByStatus('pending').length }), _jsx("p", { className: "text-sm text-muted-foreground", children: isRTL ? 'قيد الانتظار' : 'En attente' })] }), _jsxs("div", { className: "p-4 bg-muted/50 rounded-lg text-center", children: [_jsx("p", { className: "text-3xl font-bold text-green-600", children: filterByStatus('active').length }), _jsx("p", { className: "text-sm text-muted-foreground", children: isRTL ? 'إعلانات نشطة' : 'Pubs actives' })] }), _jsxs("div", { className: "p-4 bg-muted/50 rounded-lg text-center", children: [_jsx("p", { className: "text-3xl font-bold text-blue-600", children: requests.length }), _jsx("p", { className: "text-sm text-muted-foreground", children: isRTL ? 'إجمالي الطلبات' : 'Total demandes' })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h3", { className: "font-semibold mb-4", children: isRTL ? 'معلومات Google AdSense' : 'Informations Google AdSense' }), _jsx("p", { className: "text-muted-foreground mb-4", children: isRTL
                                                ? 'يتم عرض إعلانات AdSense تلقائياً عند عدم وجود إعلانات مباشرة نشطة. تأكد من إضافة معرف AdSense الخاص بك في الإعدادات.'
                                                : 'Les annonces AdSense sont affichées automatiquement lorsqu\'il n\'y a pas de publicités directes actives. Assurez-vous d\'avoir ajouté votre ID AdSense dans les paramètres.' }), _jsx("div", { className: "p-4 bg-muted/50 rounded-lg", children: _jsx("p", { className: "text-sm font-mono", children: isRTL ? 'المواقع: الصفحة الرئيسية، البحث، صفحات العقارات' : 'Emplacements: Accueil, Recherche, Pages propriétés' }) })] })] })), activeSection === 'users' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs(Button, { variant: userFilter === 'all' ? 'default' : 'outline', size: "sm", onClick: () => setUserFilter('all'), children: [isRTL ? 'الكل' : 'Tous', " (", users.length, ")"] }), _jsxs(Button, { variant: userFilter === 'real_estate_advertiser' ? 'default' : 'outline', size: "sm", onClick: () => setUserFilter('real_estate_advertiser'), children: [isRTL ? 'معلنو العقارات' : 'Immobilier', " (", users.filter(u => u.user_role === 'real_estate_advertiser').length, ")"] }), _jsxs(Button, { variant: userFilter === 'commercial_advertiser' ? 'default' : 'outline', size: "sm", onClick: () => setUserFilter('commercial_advertiser'), children: [isRTL ? 'المعلنون التجاريون' : 'Publicités', " (", users.filter(u => u.user_role === 'commercial_advertiser').length, ")"] })] }), _jsxs("div", { className: "space-y-4", children: [users
                                            .filter(u => userFilter === 'all' || u.user_role === userFilter)
                                            .map((userItem) => (_jsx("div", { className: "bg-white rounded-xl border p-4", children: _jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-1", children: [_jsx("h3", { className: "font-semibold", children: userItem.full_name || userItem.email }), _jsx(Badge, { className: userItem.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800', children: userItem.is_active ? (isRTL ? 'نشط' : 'Actif') : (isRTL ? 'معطل' : 'Inactif') }), _jsx(Badge, { variant: "outline", children: userItem.user_role === 'admin' ? (isRTL ? 'مدير' : 'Admin') :
                                                                            userItem.user_role === 'commercial_advertiser' ? (isRTL ? 'إعلانات تجارية' : 'Publicités') :
                                                                                (isRTL ? 'عقارات' : 'Immobilier') })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: userItem.email }), _jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [isRTL ? 'انضم في:' : 'Inscrit le:', " ", formatDate(userItem.created_at), userItem.company_name && ` • ${userItem.company_name}`] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("select", { className: "border rounded px-2 py-1 text-sm", value: userItem.user_role, onChange: (e) => changeUserRole(userItem.id, e.target.value), children: [_jsx("option", { value: "real_estate_advertiser", children: isRTL ? 'عقارات' : 'Immobilier' }), _jsx("option", { value: "commercial_advertiser", children: isRTL ? 'إعلانات تجارية' : 'Publicités' }), _jsx("option", { value: "admin", children: isRTL ? 'مدير' : 'Admin' })] }), _jsx(Button, { variant: userItem.is_active ? 'destructive' : 'default', size: "sm", onClick: () => toggleUserStatus(userItem.id, userItem.is_active), children: userItem.is_active ? (isRTL ? 'تعطيل' : 'Désactiver') : (isRTL ? 'تفعيل' : 'Activer') })] })] }) }, userItem.id))), users.filter(u => userFilter === 'all' || u.user_role === userFilter).length === 0 && (_jsx("div", { className: "bg-white rounded-xl border p-12 text-center", children: _jsx("p", { className: "text-muted-foreground", children: isRTL ? 'لا يوجد مستخدمين' : 'Aucun utilisateur' }) }))] })] }))] }) }), _jsx(Dialog, { open: !!selectedRequest && !!actionType, onOpenChange: () => {
                    setSelectedRequest(null);
                    setActionType(null);
                    setAdminNotes('');
                }, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { children: [actionType === 'approve' ? t('admin.approve') : t('admin.reject'), " - ", selectedRequest?.company_name] }) }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: t('admin.notes') }), _jsx(Textarea, { value: adminNotes, onChange: (e) => setAdminNotes(e.target.value), placeholder: isRTL ? 'ملاحظات (اختياري)...' : 'Notes (optionnel)...' })] }), actionType === 'approve' && selectedRequest && (_jsx("div", { className: "p-4 bg-muted/50 rounded-lg text-sm", children: _jsx("p", { children: isRTL
                                            ? `سيبدأ الإعلان اليوم وينتهي بعد ${selectedRequest.duration_days} يوم`
                                            : `La publicité commencera aujourd'hui et se terminera dans ${selectedRequest.duration_days} jours` }) }))] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => {
                                        setSelectedRequest(null);
                                        setActionType(null);
                                        setAdminNotes('');
                                    }, children: t('common.cancel') }), _jsx(Button, { onClick: handleAction, disabled: processing, className: actionType === 'reject' ? 'bg-destructive hover:bg-destructive/90' : '', children: processing ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : actionType === 'approve' ? (t('admin.approve')) : (t('admin.reject')) })] })] }) }), _jsx(Dialog, { open: !!previewUrl, onOpenChange: () => setPreviewUrl(null), children: _jsxs(DialogContent, { className: "max-w-4xl", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: t('admin.viewBanner') }) }), previewUrl && (_jsx("img", { src: previewUrl, alt: "Preview", className: "w-full rounded-lg" }))] }) }), _jsx(Footer, {})] }));
}
