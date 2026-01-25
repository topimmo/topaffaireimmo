import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { ArrowLeft, X, CheckCircle, Loader2, LogIn, Image as ImageIcon, CreditCard, } from 'lucide-react';
import { cn } from '@/lib/utils';
const pricing = {
    7: 800,
    15: 1400,
    30: 2500,
};
export default function NewAdRequest() {
    const { t, language, isRTL } = useLanguage();
    const { user, profile, loading: authLoading, profileLoading } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedSlot = searchParams.get('slot');
    const [slots, setSlots] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [bannerPreview, setBannerPreview] = useState('');
    const [paymentPreview, setPaymentPreview] = useState('');
    const [formData, setFormData] = useState({
        slotId: preselectedSlot || '',
        companyName: '',
        contactEmail: profile?.email || '',
        contactPhone: profile?.phone || '',
        durationDays: '',
        targetUrl: '',
    });
    useEffect(() => {
        fetchSlots();
    }, []);
    // Redirect real estate advertisers away from commercial advertising
    useEffect(() => {
        if (!authLoading && !profileLoading && profile && profile.user_role === 'real_estate_advertiser') {
            navigate('/dashboard');
        }
    }, [authLoading, profileLoading, profile, navigate]);
    useEffect(() => {
        if (profile) {
            setFormData(prev => ({
                ...prev,
                contactEmail: profile.email || '',
                contactPhone: profile.phone || '',
            }));
        }
    }, [profile]);
    const fetchSlots = async () => {
        const { data } = await supabase
            .from('banner_slots')
            .select('*')
            .eq('is_active', true);
        if (data)
            setSlots(data);
    };
    const getSlotName = (slot) => {
        if (language === 'ar')
            return slot.name_ar;
        return slot.name_fr;
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleBannerUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setBannerPreview(URL.createObjectURL(file));
        }
    };
    const handlePaymentUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setPaymentPreview(URL.createObjectURL(file));
        }
    };
    const removeBanner = () => setBannerPreview('');
    const removePayment = () => setPaymentPreview('');
    const getPrice = () => {
        if (!formData.durationDays)
            return 0;
        return pricing[parseInt(formData.durationDays)] || 0;
    };
    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-MA', {
            style: 'decimal',
            maximumFractionDigits: 0,
        }).format(price);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user || !formData.slotId || !formData.durationDays)
            return;
        setIsSubmitting(true);
        const { error } = await supabase.from('banner_requests').insert({
            advertiser_id: user.id,
            slot_id: parseInt(formData.slotId),
            company_name: formData.companyName,
            contact_email: formData.contactEmail,
            contact_phone: formData.contactPhone || null,
            duration_days: parseInt(formData.durationDays),
            price: getPrice(),
            banner_image_url: bannerPreview,
            target_url: formData.targetUrl || null, // URL is now optional
            payment_proof_url: paymentPreview || null,
            status: 'pending',
        });
        setIsSubmitting(false);
        if (!error) {
            setIsSuccess(true);
            setTimeout(() => {
                navigate('/advertising');
            }, 3000);
        }
    };
    if (authLoading || profileLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: _jsx(Loader2, { className: "h-10 w-10 animate-spin text-primary" }) }));
    }
    if (!user) {
        return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 flex items-center justify-center pt-20 px-4", children: _jsxs("div", { className: "text-center max-w-md", children: [_jsx("div", { className: "w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6", children: _jsx(LogIn, { className: "h-10 w-10 text-muted-foreground" }) }), _jsx("h1", { className: "font-display text-2xl font-semibold text-foreground mb-4", children: t('advertising.loginRequired') }), _jsx("p", { className: "text-muted-foreground mb-6", children: t('advertising.loginMessage') }), _jsxs("div", { className: "flex gap-4 justify-center", children: [_jsx(Button, { asChild: true, children: _jsx(Link, { to: "/login", state: { from: '/advertising/new' }, children: t('nav.login') }) }), _jsx(Button, { variant: "outline", asChild: true, children: _jsx(Link, { to: "/register", children: t('nav.register') }) })] })] }) }), _jsx(Footer, {})] }));
    }
    if (isSuccess) {
        return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 flex items-center justify-center pt-20", children: _jsxs("div", { className: "text-center px-4", children: [_jsx("div", { className: "w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6", children: _jsx(CheckCircle, { className: "h-10 w-10 text-secondary" }) }), _jsx("h1", { className: "font-display text-3xl font-semibold text-foreground mb-4", children: t('advertising.requestSubmitted') }), _jsx("p", { className: "text-muted-foreground max-w-md mx-auto", children: t('advertising.requestMessage') })] }) }), _jsx(Footer, {})] }));
    }
    const selectedSlot = slots.find(s => s.id.toString() === formData.slotId);
    return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 pt-24 pb-16", children: _jsxs("div", { className: "container max-w-3xl", children: [_jsx("div", { className: "mb-6", children: _jsx(Button, { variant: "ghost", asChild: true, children: _jsxs(Link, { to: "/advertising", children: [_jsx(ArrowLeft, { className: `h-4 w-4 ${isRTL ? 'rotate-180' : ''}` }), t('common.back')] }) }) }), _jsxs("div", { className: "text-center mb-10", children: [_jsx("h1", { className: "font-display text-3xl md:text-4xl font-semibold text-foreground mb-4", children: t('advertising.newRequest') }), _jsx("p", { className: "text-muted-foreground max-w-xl mx-auto", children: isRTL
                                        ? 'املأ النموذج أدناه لإرسال طلب إعلان جديد'
                                        : 'Remplissez le formulaire ci-dessous pour soumettre une nouvelle demande publicitaire' })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-8", children: [_jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-4", children: isRTL ? 'معلومات الشركة' : 'Informations de l\'entreprise' }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2 md:col-span-2", children: [_jsxs(Label, { htmlFor: "companyName", children: [t('advertising.companyName'), " *"] }), _jsx(Input, { id: "companyName", name: "companyName", value: formData.companyName, onChange: handleInputChange, required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "contactEmail", children: [t('advertising.contactEmail'), " *"] }), _jsx(Input, { id: "contactEmail", name: "contactEmail", type: "email", value: formData.contactEmail, onChange: handleInputChange, required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "contactPhone", children: t('advertising.contactPhone') }), _jsx(Input, { id: "contactPhone", name: "contactPhone", type: "tel", value: formData.contactPhone, onChange: handleInputChange })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-4", children: t('advertising.selectSlot') }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "slot", children: [t('advertising.slot'), " *"] }), _jsxs(Select, { value: formData.slotId, onValueChange: (value) => handleSelectChange('slotId', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: t('advertising.selectSlot') }) }), _jsx(SelectContent, { children: slots.map((slot) => (_jsxs(SelectItem, { value: slot.id.toString(), children: [getSlotName(slot), " (", slot.size, ")"] }, slot.id))) })] })] }), selectedSlot && (_jsxs("div", { className: "p-4 bg-muted/50 rounded-lg", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: language === 'ar' ? selectedSlot.description_ar : selectedSlot.description_fr }), _jsxs("p", { className: "text-sm font-medium mt-2", children: [t('advertising.size'), ": ", selectedSlot.size] })] }))] })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsxs("h2", { className: "font-display text-xl font-semibold mb-4", children: [t('advertising.duration'), " & ", t('advertising.price')] }), _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "grid grid-cols-3 gap-4", children: Object.entries(pricing).map(([days, price]) => (_jsxs("button", { type: "button", onClick: () => handleSelectChange('durationDays', days), className: cn('p-4 rounded-lg border-2 transition-all text-center', formData.durationDays === days
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-muted hover:border-primary/30'), children: [_jsx("p", { className: "font-display text-2xl font-semibold text-primary", children: days }), _jsx("p", { className: "text-sm text-muted-foreground", children: t('advertising.days') }), _jsxs("p", { className: "font-mono-price font-bold mt-2", children: [formatPrice(price), " MAD"] })] }, days))) }), formData.durationDays && (_jsxs("div", { className: "p-4 bg-primary/5 rounded-lg flex justify-between items-center", children: [_jsxs("span", { className: "font-semibold", children: [t('advertising.price'), ":"] }), _jsxs("span", { className: "font-mono-price text-2xl font-bold text-primary", children: [formatPrice(getPrice()), " MAD"] })] }))] })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-4", children: t('advertising.bannerImage') }), _jsxs("div", { className: "space-y-4", children: [bannerPreview ? (_jsxs("div", { className: "relative aspect-[728/90] rounded-lg overflow-hidden bg-muted", children: [_jsx("img", { src: bannerPreview, alt: "Banner preview", className: "w-full h-full object-cover" }), _jsx("button", { type: "button", onClick: removeBanner, className: `absolute top-2 ${isRTL ? 'left-2' : 'right-2'} p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors`, children: _jsx(X, { className: "h-4 w-4" }) })] })) : (_jsxs("label", { className: "aspect-[728/90] rounded-lg border-2 border-dashed border-muted hover:border-primary/30 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2", children: [_jsx(ImageIcon, { className: "h-10 w-10 text-muted-foreground" }), _jsx("span", { className: "text-sm text-muted-foreground", children: t('advertising.uploadBanner') }), _jsx("span", { className: "text-xs text-muted-foreground", children: selectedSlot ? `${selectedSlot.size} - JPG, PNG, WebP` : 'JPG, PNG, WebP' }), _jsx("input", { type: "file", accept: "image/*", className: "hidden", onChange: handleBannerUpload })] })), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "targetUrl", children: [t('advertising.targetUrl'), _jsxs("span", { className: "text-xs text-muted-foreground ml-2", children: ["(", isRTL ? 'اختياري' : 'Optionnel', ")"] })] }), _jsx(Input, { id: "targetUrl", name: "targetUrl", type: "url", placeholder: "https://example.com", value: formData.targetUrl, onChange: handleInputChange }), _jsx("p", { className: "text-xs text-muted-foreground", children: isRTL
                                                                ? 'يمكنك ترك هذا الحقل فارغًا إذا كنت تريد فقط عرض الصورة بدون رابط'
                                                                : 'Vous pouvez laisser ce champ vide si vous souhaitez afficher uniquement l\'image sans lien' })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-4", children: t('advertising.paymentProof') }), _jsxs("div", { className: "mb-4 p-4 bg-muted/50 rounded-lg", children: [_jsx("h4", { className: "font-semibold mb-2", children: t('advertising.bankDetails') }), _jsxs("div", { className: "bg-white rounded p-3 text-sm font-mono", children: [_jsx("p", { children: "IBAN: MA64 XXX XXXX XXXX XXXX XXXX XXX" }), _jsx("p", { children: "BIC: XXXXXXXX" }), _jsxs("p", { children: [isRTL ? 'المستفيد' : 'Bénéficiaire', ": TopAffaireImmo SARL"] })] })] }), paymentPreview ? (_jsxs("div", { className: "relative aspect-video rounded-lg overflow-hidden bg-muted max-w-sm", children: [_jsx("img", { src: paymentPreview, alt: "Payment proof", className: "w-full h-full object-cover" }), _jsx("button", { type: "button", onClick: removePayment, className: `absolute top-2 ${isRTL ? 'left-2' : 'right-2'} p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors`, children: _jsx(X, { className: "h-4 w-4" }) })] })) : (_jsxs("label", { className: "aspect-video max-w-sm rounded-lg border-2 border-dashed border-muted hover:border-primary/30 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2", children: [_jsx(CreditCard, { className: "h-10 w-10 text-muted-foreground" }), _jsx("span", { className: "text-sm text-muted-foreground", children: t('advertising.uploadPayment') }), _jsx("span", { className: "text-xs text-muted-foreground", children: "JPG, PNG, PDF" }), _jsx("input", { type: "file", accept: "image/*,.pdf", className: "hidden", onChange: handlePaymentUpload })] }))] }), _jsx(Button, { type: "submit", size: "lg", className: "w-full text-base", disabled: isSubmitting || !bannerPreview || !formData.slotId || !formData.durationDays, children: isSubmitting ? (_jsx(Loader2, { className: "h-5 w-5 animate-spin" })) : (t('advertising.submitRequest')) })] })] }) }), _jsx(Footer, {})] }));
}
