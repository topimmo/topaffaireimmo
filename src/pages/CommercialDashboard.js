import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger, } from '@/components/ui/tabs';
import { Plus, Image as ImageIcon, Loader2, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink, Eye, Upload, CreditCard, Calendar, DollarSign, Info, } from 'lucide-react';
import { cn } from '@/lib/utils';
const content = {
    fr: {
        title: 'Mon Espace Publicitaire',
        subtitle: 'Gérez vos campagnes publicitaires',
        createNew: 'Nouvelle Campagne',
        myRequests: 'Mes Demandes',
        pending: 'En Attente',
        approved: 'Approuvées',
        active: 'Actives',
        rejected: 'Refusées',
        expired: 'Expirées',
        all: 'Toutes',
        noRequests: 'Aucune demande',
        noRequestsDesc: 'Créez votre première campagne publicitaire',
        bannerSlot: 'Emplacement',
        duration: 'Durée',
        price: 'Prix',
        status: 'Statut',
        impressions: 'Impressions',
        clicks: 'Clics',
        days: 'jours',
        viewBanner: 'Voir la bannière',
        viewPayment: 'Voir le reçu',
        createCampaign: 'Créer une campagne',
        selectSlot: 'Choisir un emplacement',
        selectDuration: 'Choisir la durée',
        companyName: 'Nom de l\'entreprise *',
        contactEmail: 'Email de contact *',
        contactPhone: 'Téléphone',
        bannerImage: 'Image de la bannière *',
        targetUrl: 'URL de destination *',
        uploadImage: 'Télécharger l\'image',
        paymentInfo: 'Informations de paiement',
        bankDetails: 'Coordonnées bancaires',
        bankName: 'Banque: Attijariwafa Bank',
        rib: 'RIB: 007 640 0000000000000000 00',
        accountName: 'Titulaire: TopAffaireImmo SARL',
        uploadReceipt: 'Télécharger le reçu de paiement',
        paymentMethod: 'Méthode de paiement',
        paymentReference: 'Référence du paiement',
        submit: 'Soumettre la demande',
        submitting: 'Soumission...',
        successTitle: 'Demande soumise !',
        successDesc: 'Votre demande sera examinée par notre équipe. Vous serez notifié par email.',
        pricing: 'Tarification',
        perDay: '/jour',
        perWeek: '/semaine',
        perMonth: '/mois',
        slot7days: '7 jours',
        slot15days: '15 jours',
        slot30days: '30 jours',
        selectImage: 'Sélectionner une image',
        imageRequirements: 'Format: JPG, PNG ou GIF. Taille max: 2MB.',
        notCommercialAdvertiser: 'Ce tableau de bord est réservé aux annonceurs commerciaux.',
        registerAsCommercial: 'S\'inscrire comme annonceur commercial',
    },
    ar: {
        title: 'مساحتي الإعلانية',
        subtitle: 'إدارة حملاتك الإعلانية',
        createNew: 'حملة جديدة',
        myRequests: 'طلباتي',
        pending: 'قيد الانتظار',
        approved: 'موافق عليها',
        active: 'نشطة',
        rejected: 'مرفوضة',
        expired: 'منتهية',
        all: 'الكل',
        noRequests: 'لا توجد طلبات',
        noRequestsDesc: 'أنشئ حملتك الإعلانية الأولى',
        bannerSlot: 'الموقع',
        duration: 'المدة',
        price: 'السعر',
        status: 'الحالة',
        impressions: 'المشاهدات',
        clicks: 'النقرات',
        days: 'يوم',
        viewBanner: 'عرض البانر',
        viewPayment: 'عرض الإيصال',
        createCampaign: 'إنشاء حملة',
        selectSlot: 'اختر موقع الإعلان',
        selectDuration: 'اختر المدة',
        companyName: 'اسم الشركة *',
        contactEmail: 'البريد الإلكتروني *',
        contactPhone: 'الهاتف',
        bannerImage: 'صورة البانر *',
        targetUrl: 'رابط الوجهة *',
        uploadImage: 'تحميل الصورة',
        paymentInfo: 'معلومات الدفع',
        bankDetails: 'تفاصيل الحساب البنكي',
        bankName: 'البنك: التجاري وفا بنك',
        rib: 'RIB: 007 640 0000000000000000 00',
        accountName: 'صاحب الحساب: TopAffaireImmo SARL',
        uploadReceipt: 'تحميل إيصال الدفع',
        paymentMethod: 'طريقة الدفع',
        paymentReference: 'مرجع الدفع',
        submit: 'إرسال الطلب',
        submitting: 'جاري الإرسال...',
        successTitle: 'تم إرسال الطلب!',
        successDesc: 'سيتم مراجعة طلبك من قبل فريقنا. ستتلقى إشعاراً بالبريد الإلكتروني.',
        pricing: 'التسعير',
        perDay: '/يوم',
        perWeek: '/أسبوع',
        perMonth: '/شهر',
        slot7days: '7 أيام',
        slot15days: '15 يوم',
        slot30days: '30 يوم',
        selectImage: 'اختر صورة',
        imageRequirements: 'الصيغة: JPG أو PNG أو GIF. الحجم الأقصى: 2 ميغابايت.',
        notCommercialAdvertiser: 'لوحة التحكم هذه مخصصة للمعلنين التجاريين.',
        registerAsCommercial: 'التسجيل كمعلن تجاري',
    },
};
const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-gray-100 text-gray-800',
};
const statusIcons = {
    pending: Clock,
    approved: CheckCircle,
    active: CheckCircle,
    rejected: XCircle,
    expired: AlertCircle,
    cancelled: XCircle,
};
export default function CommercialDashboard() {
    const { language, isRTL } = useLanguage();
    const c = content[language];
    const { user, profile, loading: authLoading, profileLoading } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    // Form state
    const [formData, setFormData] = useState({
        slot_id: '',
        duration_days: '7',
        company_name: '',
        contact_email: '',
        contact_phone: '',
        target_url: '',
        payment_method: 'bank_transfer',
        payment_reference: '',
    });
    const [bannerImage, setBannerImage] = useState(null);
    const [paymentReceipt, setPaymentReceipt] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    useEffect(() => {
        if (!authLoading && !profileLoading && !user) {
            navigate('/login', { state: { from: '/commercial-dashboard' } });
        }
        // Redirect real estate advertisers to their dashboard
        if (!authLoading && !profileLoading && profile && profile.user_role === 'real_estate_advertiser') {
            navigate('/dashboard');
        }
    }, [user, authLoading, profileLoading, navigate, profile]);
    useEffect(() => {
        if (user && profile) {
            fetchData();
        }
    }, [user, profile]);
    const fetchData = async () => {
        setLoading(true);
        // Fetch banner slots
        const { data: slotsData } = await supabase
            .from('banner_slots')
            .select('*')
            .eq('is_active', true)
            .order('id');
        if (slotsData)
            setSlots(slotsData);
        // Fetch user's banner requests
        const { data: requestsData } = await supabase
            .from('banner_requests')
            .select(`
        *,
        slot:banner_slots(*)
      `)
            .eq('advertiser_id', user.id)
            .order('created_at', { ascending: false });
        if (requestsData)
            setRequests(requestsData);
        setLoading(false);
    };
    const calculatePrice = () => {
        const slot = slots.find(s => s.id.toString() === formData.slot_id);
        if (!slot)
            return 0;
        const days = parseInt(formData.duration_days);
        if (days === 7)
            return slot.price_per_week || slot.price_per_day * 7;
        if (days === 30)
            return slot.price_per_month || slot.price_per_day * 30;
        return slot.price_per_day * days;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!bannerImage || !user)
            return;
        setSubmitting(true);
        try {
            // Upload banner image
            const bannerExt = bannerImage.name.split('.').pop();
            const bannerPath = `${user.id}/${Date.now()}.${bannerExt}`;
            const { error: bannerError } = await supabase.storage
                .from('banner-images')
                .upload(bannerPath, bannerImage);
            if (bannerError)
                throw bannerError;
            const { data: bannerUrlData } = supabase.storage
                .from('banner-images')
                .getPublicUrl(bannerPath);
            // Upload payment receipt if provided
            let paymentReceiptUrl = null;
            if (paymentReceipt) {
                const receiptExt = paymentReceipt.name.split('.').pop();
                const receiptPath = `${user.id}/${Date.now()}_receipt.${receiptExt}`;
                const { error: receiptError } = await supabase.storage
                    .from('payment-receipts')
                    .upload(receiptPath, paymentReceipt);
                if (!receiptError) {
                    const { data: receiptUrlData } = supabase.storage
                        .from('payment-receipts')
                        .getPublicUrl(receiptPath);
                    paymentReceiptUrl = receiptUrlData.publicUrl;
                }
            }
            // Create banner request
            const { error: insertError } = await supabase
                .from('banner_requests')
                .insert({
                advertiser_id: user.id,
                slot_id: parseInt(formData.slot_id),
                company_name: formData.company_name,
                contact_email: formData.contact_email,
                contact_phone: formData.contact_phone || null,
                duration_days: parseInt(formData.duration_days),
                price: calculatePrice(),
                banner_image_url: bannerUrlData.publicUrl,
                target_url: formData.target_url || null,
                payment_proof_url: paymentReceiptUrl,
                payment_method: formData.payment_method,
                payment_reference: formData.payment_reference || null,
                status: 'pending',
            });
            if (insertError)
                throw insertError;
            setSubmitSuccess(true);
            setTimeout(() => {
                setShowCreateModal(false);
                setSubmitSuccess(false);
                resetForm();
                fetchData();
            }, 2000);
        }
        catch (error) {
            console.error('Error submitting banner request:', error);
        }
        finally {
            setSubmitting(false);
        }
    };
    const resetForm = () => {
        setFormData({
            slot_id: '',
            duration_days: '7',
            company_name: profile?.company_name || '',
            contact_email: profile?.email || '',
            contact_phone: '',
            target_url: '',
            payment_method: 'bank_transfer',
            payment_reference: '',
        });
        setBannerImage(null);
        setPaymentReceipt(null);
    };
    const filterByStatus = (status) => {
        if (status === 'all')
            return requests;
        return requests.filter(r => r.status === status);
    };
    const getSlotName = (slot) => {
        return language === 'ar' ? slot.name_ar : slot.name_fr;
    };
    const getStatusLabel = (status) => {
        const labels = {
            pending: c.pending,
            approved: c.approved,
            active: c.active,
            rejected: c.rejected,
            expired: c.expired,
            cancelled: c.rejected,
        };
        return labels[status] || status;
    };
    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(price);
    };
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-MA');
    };
    // Check if user is a commercial advertiser
    const isCommercialAdvertiser = profile?.user_role === 'commercial_advertiser' || profile?.user_role === 'admin';
    if (authLoading || profileLoading || loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: _jsx(Loader2, { className: "h-10 w-10 animate-spin text-primary" }) }));
    }
    // Show message if not a commercial advertiser
    if (!isCommercialAdvertiser) {
        return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 pt-24 pb-16", children: _jsx("div", { className: "container max-w-lg", children: _jsxs("div", { className: "bg-white rounded-2xl border p-12 text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4", children: _jsx(AlertCircle, { className: "h-8 w-8 text-primary" }) }), _jsx("h2", { className: "font-display text-xl font-semibold mb-2", children: c.notCommercialAdvertiser }), _jsx("p", { className: "text-muted-foreground mb-6", children: language === 'ar'
                                        ? 'للوصول إلى هذه الصفحة، يجب أن يكون لديك حساب معلن تجاري.'
                                        : 'Pour accéder à cette page, vous devez avoir un compte annonceur commercial.' }), _jsx(Button, { asChild: true, children: _jsx(Link, { to: "/register?type=commercial", children: c.registerAsCommercial }) })] }) }) }), _jsx(Footer, {})] }));
    }
    return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 pt-24 pb-16", children: _jsxs("div", { className: "container max-w-6xl", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-display text-3xl font-semibold text-foreground", children: c.title }), _jsx("p", { className: "text-muted-foreground mt-1", children: c.subtitle })] }), _jsxs(Dialog, { open: showCreateModal, onOpenChange: setShowCreateModal, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { onClick: () => resetForm(), children: [_jsx(Plus, { className: "h-4 w-4" }), c.createNew] }) }), _jsx(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: submitSuccess ? (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4", children: _jsx(CheckCircle, { className: "h-8 w-8 text-green-600" }) }), _jsx("h3", { className: "font-display text-2xl font-semibold mb-2", children: c.successTitle }), _jsx("p", { className: "text-muted-foreground", children: c.successDesc })] })) : (_jsxs(_Fragment, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: c.createCampaign }), _jsx(DialogDescription, { children: language === 'ar'
                                                                    ? 'اختر موقع الإعلان والمدة ثم قم بتحميل البانر'
                                                                    : 'Choisissez l\'emplacement et la durée, puis téléchargez votre bannière' })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6 mt-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: c.selectSlot }), _jsxs(Select, { value: formData.slot_id, onValueChange: (v) => setFormData(prev => ({ ...prev, slot_id: v })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: c.selectSlot }) }), _jsx(SelectContent, { children: slots.map((slot) => (_jsx(SelectItem, { value: slot.id.toString(), children: _jsxs("div", { className: "flex justify-between items-center gap-4 w-full", children: [_jsx("span", { children: getSlotName(slot) }), _jsxs("span", { className: "text-muted-foreground text-sm", children: ["(", slot.size, ")"] })] }) }, slot.id))) })] })] }), formData.slot_id && (_jsxs("div", { className: "bg-muted/50 rounded-lg p-4", children: [_jsxs("h4", { className: "font-medium mb-2 flex items-center gap-2", children: [_jsx(DollarSign, { className: "h-4 w-4" }), c.pricing] }), _jsxs("div", { className: "grid grid-cols-3 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: c.slot7days }), _jsxs("p", { className: "font-semibold", children: [formatPrice(slots.find(s => s.id.toString() === formData.slot_id)?.price_per_week || 0), " MAD"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: c.slot15days }), _jsxs("p", { className: "font-semibold", children: [formatPrice((slots.find(s => s.id.toString() === formData.slot_id)?.price_per_day || 0) * 15), " MAD"] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: c.slot30days }), _jsxs("p", { className: "font-semibold", children: [formatPrice(slots.find(s => s.id.toString() === formData.slot_id)?.price_per_month || 0), " MAD"] })] })] })] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: c.selectDuration }), _jsxs(Select, { value: formData.duration_days, onValueChange: (v) => setFormData(prev => ({ ...prev, duration_days: v })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "7", children: c.slot7days }), _jsx(SelectItem, { value: "15", children: c.slot15days }), _jsx(SelectItem, { value: "30", children: c.slot30days })] })] })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "company_name", children: c.companyName }), _jsx(Input, { id: "company_name", value: formData.company_name, onChange: (e) => setFormData(prev => ({ ...prev, company_name: e.target.value })), required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "contact_email", children: c.contactEmail }), _jsx(Input, { id: "contact_email", type: "email", value: formData.contact_email, onChange: (e) => setFormData(prev => ({ ...prev, contact_email: e.target.value })), required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "contact_phone", children: c.contactPhone }), _jsx(Input, { id: "contact_phone", value: formData.contact_phone, onChange: (e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value })), dir: "ltr" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: c.bannerImage }), _jsx("div", { className: "border-2 border-dashed rounded-lg p-4 text-center", children: bannerImage ? (_jsxs("div", { className: "space-y-2", children: [_jsx("img", { src: URL.createObjectURL(bannerImage), alt: "Banner preview", className: "max-h-32 mx-auto rounded" }), _jsx("p", { className: "text-sm text-muted-foreground", children: bannerImage.name }), _jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: () => setBannerImage(null), children: language === 'ar' ? 'تغيير' : 'Changer' })] })) : (_jsxs("label", { className: "cursor-pointer", children: [_jsx("input", { type: "file", accept: "image/jpeg,image/png,image/gif,image/webp", className: "hidden", onChange: (e) => setBannerImage(e.target.files?.[0] || null) }), _jsxs("div", { className: "flex flex-col items-center gap-2 py-4", children: [_jsx(Upload, { className: "h-8 w-8 text-muted-foreground" }), _jsx("span", { className: "text-sm text-primary font-medium", children: c.selectImage }), _jsx("span", { className: "text-xs text-muted-foreground", children: c.imageRequirements })] })] })) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "target_url", children: c.targetUrl }), _jsx(Input, { id: "target_url", type: "url", placeholder: "https://example.com", value: formData.target_url, onChange: (e) => setFormData(prev => ({ ...prev, target_url: e.target.value })), dir: "ltr", required: true })] }), _jsxs("div", { className: "bg-primary/5 rounded-lg p-4 space-y-4", children: [_jsxs("h4", { className: "font-medium flex items-center gap-2", children: [_jsx(CreditCard, { className: "h-4 w-4" }), c.paymentInfo] }), _jsxs("div", { className: "bg-white rounded-lg p-4 text-sm space-y-1", children: [_jsx("p", { className: "font-medium", children: c.bankDetails }), _jsx("p", { children: c.bankName }), _jsx("p", { className: "font-mono", children: c.rib }), _jsx("p", { children: c.accountName })] }), _jsx("div", { className: "text-center py-2", children: _jsxs("p", { className: "text-lg font-semibold text-primary", children: [language === 'ar' ? 'المبلغ المطلوب: ' : 'Montant à payer: ', formatPrice(calculatePrice()), " MAD"] }) }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: c.paymentMethod }), _jsxs(Select, { value: formData.payment_method, onValueChange: (v) => setFormData(prev => ({ ...prev, payment_method: v })), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "bank_transfer", children: language === 'ar' ? 'تحويل بنكي' : 'Virement bancaire' }), _jsx(SelectItem, { value: "cash", children: language === 'ar' ? 'نقداً' : 'Espèces' }), _jsx(SelectItem, { value: "mobile_payment", children: language === 'ar' ? 'الدفع بالهاتف' : 'Paiement mobile' })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "payment_reference", children: c.paymentReference }), _jsx(Input, { id: "payment_reference", value: formData.payment_reference, onChange: (e) => setFormData(prev => ({ ...prev, payment_reference: e.target.value })) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: c.uploadReceipt }), _jsx("div", { className: "border-2 border-dashed rounded-lg p-4 text-center", children: paymentReceipt ? (_jsxs("div", { className: "space-y-2", children: [_jsx(CheckCircle, { className: "h-8 w-8 text-green-600 mx-auto" }), _jsx("p", { className: "text-sm text-muted-foreground", children: paymentReceipt.name }), _jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: () => setPaymentReceipt(null), children: language === 'ar' ? 'تغيير' : 'Changer' })] })) : (_jsxs("label", { className: "cursor-pointer", children: [_jsx("input", { type: "file", accept: "image/jpeg,image/png,application/pdf", className: "hidden", onChange: (e) => setPaymentReceipt(e.target.files?.[0] || null) }), _jsxs("div", { className: "flex flex-col items-center gap-2 py-4", children: [_jsx(Upload, { className: "h-8 w-8 text-muted-foreground" }), _jsx("span", { className: "text-sm text-primary font-medium", children: c.uploadReceipt })] })] })) })] })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: submitting || !bannerImage || !formData.slot_id, children: submitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 animate-spin" }), c.submitting] })) : (c.submit) })] })] })) })] })] }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "space-y-6", children: [_jsxs(TabsList, { children: [_jsxs(TabsTrigger, { value: "all", children: [c.all, " (", requests.length, ")"] }), _jsxs(TabsTrigger, { value: "pending", children: [c.pending, " (", filterByStatus('pending').length, ")"] }), _jsxs(TabsTrigger, { value: "active", children: [c.active, " (", filterByStatus('active').length, ")"] }), _jsxs(TabsTrigger, { value: "rejected", children: [c.rejected, " (", filterByStatus('rejected').length, ")"] })] }), ['all', 'pending', 'active', 'rejected'].map((tab) => (_jsx(TabsContent, { value: tab, className: "space-y-4", children: filterByStatus(tab).length === 0 ? (_jsxs("div", { className: "bg-white rounded-2xl border p-12 text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4", children: _jsx(ImageIcon, { className: "h-8 w-8 text-muted-foreground" }) }), _jsx("h2", { className: "font-display text-xl font-semibold mb-2", children: c.noRequests }), _jsx("p", { className: "text-muted-foreground mb-6", children: c.noRequestsDesc }), _jsxs(Button, { onClick: () => { resetForm(); setShowCreateModal(true); }, children: [_jsx(Plus, { className: "h-4 w-4" }), c.createNew] })] })) : (filterByStatus(tab).map((request) => {
                                        const StatusIcon = statusIcons[request.status] || Clock;
                                        return (_jsx("div", { className: "bg-white rounded-xl border p-4 sm:p-6", children: _jsxs("div", { className: "flex flex-col md:flex-row gap-4", children: [_jsx("div", { className: "w-full md:w-48 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer", onClick: () => setPreviewUrl(request.banner_image_url), children: request.banner_image_url ? (_jsx("img", { src: request.banner_image_url, alt: request.company_name, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center", children: _jsx(ImageIcon, { className: "h-10 w-10 text-muted-foreground" }) })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-2", children: [_jsxs(Badge, { variant: "secondary", className: cn('font-normal', statusColors[request.status]), children: [_jsx(StatusIcon, { className: "h-3 w-3 mr-1" }), getStatusLabel(request.status)] }), _jsxs(Badge, { variant: "outline", children: [request.duration_days, " ", c.days] }), _jsxs(Badge, { variant: "outline", children: [formatPrice(request.price), " MAD"] })] }), _jsx("h3", { className: "font-semibold text-lg mb-1", children: request.company_name }), _jsxs("p", { className: "text-sm text-muted-foreground mb-2", children: [getSlotName(request.slot), " (", request.slot.size, ")"] }), request.status === 'active' && (_jsxs("div", { className: "flex gap-4 text-sm", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Eye, { className: "h-4 w-4" }), request.impressions, " ", c.impressions] }), _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(ExternalLink, { className: "h-4 w-4" }), request.clicks, " ", c.clicks] })] })), request.start_date && request.end_date && (_jsxs("p", { className: "text-sm text-muted-foreground mt-2 flex items-center gap-1", children: [_jsx(Calendar, { className: "h-4 w-4" }), formatDate(request.start_date), " - ", formatDate(request.end_date)] })), request.admin_notes && request.status === 'rejected' && (_jsxs("p", { className: "text-sm text-red-600 mt-2 flex items-center gap-1", children: [_jsx(Info, { className: "h-4 w-4" }), request.admin_notes] })), _jsxs("p", { className: "text-sm text-muted-foreground mt-2", children: [language === 'ar' ? 'تاريخ الإنشاء: ' : 'Créé le: ', formatDate(request.created_at)] })] }), _jsx("div", { className: "flex md:flex-col gap-2", children: _jsxs("a", { href: request.target_url, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center justify-center gap-1 text-sm text-primary hover:underline", children: [_jsx(ExternalLink, { className: "h-3 w-3" }), language === 'ar' ? 'الرابط' : 'Lien'] }) })] }) }, request.id));
                                    })) }, tab)))] })] }) }), previewUrl && (_jsx("div", { className: "fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4", onClick: () => setPreviewUrl(null), children: _jsx("img", { src: previewUrl, alt: "Preview", className: "max-w-full max-h-full rounded-lg", onClick: (e) => e.stopPropagation() }) })), _jsx(Footer, {})] }));
}
