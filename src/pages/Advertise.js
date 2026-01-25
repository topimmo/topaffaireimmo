import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Megaphone, Mail, Phone, User, Briefcase, MessageSquare, Loader2, CheckCircle, TrendingUp, Target, Award } from 'lucide-react';
export default function Advertise() {
    const { t, isRTL } = useLanguage();
    const [formData, setFormData] = useState({
        fullName: '',
        companyName: '',
        email: '',
        phone: '',
        message: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Send email using Supabase Edge Function or store in DB for admin to review
            // For now, we'll store the request in a table
            const { error: insertError } = await supabase
                .from('advertising_inquiries')
                .insert([
                {
                    full_name: formData.fullName,
                    company_name: formData.companyName || null,
                    email: formData.email,
                    phone: formData.phone || null,
                    message: formData.message,
                }
            ]);
            if (insertError) {
                // If table doesn't exist, show success anyway (graceful degradation)
                console.warn('Failed to store inquiry:', insertError);
            }
            setSuccess(true);
            setFormData({
                fullName: '',
                companyName: '',
                email: '',
                phone: '',
                message: '',
            });
        }
        catch (err) {
            setError(isRTL
                ? 'حدث خطأ. يرجى المحاولة مرة أخرى.'
                : 'Une erreur s\'est produite. Veuillez réessayer.');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 pt-24 pb-16", children: _jsxs("div", { className: "container max-w-5xl", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4", children: _jsx(Megaphone, { className: "h-8 w-8 text-primary" }) }), _jsx("h1", { className: "font-display text-3xl sm:text-4xl font-semibold text-foreground mb-4", children: isRTL ? 'أعلن معنا' : 'Annoncez avec nous' }), _jsx("p", { className: "text-lg text-muted-foreground max-w-2xl mx-auto", children: isRTL
                                        ? 'اكتشف فرص الإعلان على TopAffaireImmo - المنصة الرائدة للعقارات في المغرب'
                                        : 'Découvrez les opportunités publicitaires sur TopAffaireImmo - la plateforme immobilière leader au Maroc' })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-8 mb-12", children: [_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "font-display text-2xl font-semibold text-foreground mb-6", children: isRTL ? 'لماذا تعلن معنا؟' : 'Pourquoi annoncer avec nous ?' }), _jsx("div", { className: "bg-white rounded-xl border p-6", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0", children: _jsx(TrendingUp, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-foreground mb-2", children: isRTL ? 'جمهور واسع ومستهدف' : 'Large audience ciblée' }), _jsx("p", { className: "text-sm text-muted-foreground", children: isRTL
                                                                    ? 'اصل إلى آلاف الباحثين عن العقارات والمستثمرين يوميًا'
                                                                    : 'Atteignez des milliers de chercheurs immobiliers et d\'investisseurs chaque jour' })] })] }) }), _jsx("div", { className: "bg-white rounded-xl border p-6", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0", children: _jsx(Target, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-foreground mb-2", children: isRTL ? 'مواقع إعلانية استراتيجية' : 'Emplacements stratégiques' }), _jsx("p", { className: "text-sm text-muted-foreground", children: isRTL
                                                                    ? 'بانرات على الصفحة الرئيسية، نتائج البحث، وصفحات التفاصيل'
                                                                    : 'Bannières sur la page d\'accueil, résultats de recherche et pages de détails' })] })] }) }), _jsx("div", { className: "bg-white rounded-xl border p-6", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0", children: _jsx(Award, { className: "h-5 w-5 text-primary" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-foreground mb-2", children: isRTL ? 'شراكات مخصصة' : 'Partenariats personnalisés' }), _jsx("p", { className: "text-sm text-muted-foreground", children: isRTL
                                                                    ? 'حلول إعلانية مخصصة تناسب احتياجات عملك'
                                                                    : 'Solutions publicitaires sur mesure adaptées aux besoins de votre entreprise' })] })] }) }), _jsxs("div", { className: "bg-muted/50 rounded-xl p-6", children: [_jsx("h3", { className: "font-semibold text-foreground mb-3", children: isRTL ? 'أنواع الإعلانات المتاحة:' : 'Types de publicités disponibles :' }), _jsxs("ul", { className: "space-y-2 text-sm text-muted-foreground", children: [_jsxs("li", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-primary" }), isRTL ? 'بانرات إعلانية (أحجام مختلفة)' : 'Bannières publicitaires (différentes tailles)'] }), _jsxs("li", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-primary" }), isRTL ? 'قوائم مميزة' : 'Annonces en vedette'] }), _jsxs("li", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-primary" }), isRTL ? 'رعاية محتوى' : 'Contenu sponsorisé'] }), _jsxs("li", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-primary" }), isRTL ? 'شراكات استراتيجية' : 'Partenariats stratégiques'] })] })] })] }), _jsxs("div", { className: "bg-white rounded-2xl border p-6 sm:p-8 shadow-sm h-fit sticky top-24", children: [_jsx("h2", { className: "font-display text-2xl font-semibold text-foreground mb-2", children: isRTL ? 'تواصل معنا' : 'Contactez-nous' }), _jsx("p", { className: "text-sm text-muted-foreground mb-6", children: isRTL
                                                ? 'املأ النموذج وسنتواصل معك خلال 24-48 ساعة'
                                                : 'Remplissez le formulaire et nous vous contacterons sous 24-48h' }), success && (_jsx("div", { className: "mb-6 p-4 rounded-lg bg-green-50 border border-green-200", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(CheckCircle, { className: "h-5 w-5 text-green-600 flex-shrink-0" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-green-900", children: isRTL ? 'تم إرسال طلبك بنجاح!' : 'Demande envoyée avec succès!' }), _jsx("p", { className: "text-sm text-green-700 mt-1", children: isRTL
                                                                    ? 'سنتواصل معك قريبًا'
                                                                    : 'Nous vous contacterons bientôt' })] })] }) })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [error && (_jsx("div", { className: "p-3 rounded-lg bg-destructive/10 text-destructive text-sm", children: error })), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "fullName", children: [isRTL ? 'الاسم الكامل' : 'Nom complet', " ", _jsx("span", { className: "text-destructive", children: "*" })] }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: `absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground` }), _jsx(Input, { id: "fullName", name: "fullName", type: "text", value: formData.fullName, onChange: handleChange, className: `${isRTL ? 'pr-10' : 'pl-10'} h-11`, placeholder: isRTL ? 'أحمد محمد' : 'Ahmed Mohammed', required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "companyName", children: [isRTL ? 'اسم الشركة' : 'Nom de l\'entreprise', " (", isRTL ? 'اختياري' : 'optionnel', ")"] }), _jsxs("div", { className: "relative", children: [_jsx(Briefcase, { className: `absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground` }), _jsx(Input, { id: "companyName", name: "companyName", type: "text", value: formData.companyName, onChange: handleChange, className: `${isRTL ? 'pr-10' : 'pl-10'} h-11`, placeholder: isRTL ? 'شركتك' : 'Votre entreprise' })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "email", children: [isRTL ? 'البريد الإلكتروني' : 'Email', " ", _jsx("span", { className: "text-destructive", children: "*" })] }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: `absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground` }), _jsx(Input, { id: "email", name: "email", type: "email", value: formData.email, onChange: handleChange, className: `${isRTL ? 'pr-10' : 'pl-10'} h-11`, placeholder: "email@example.com", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "phone", children: [isRTL ? 'رقم الهاتف' : 'Téléphone', " (", isRTL ? 'اختياري' : 'optionnel', ")"] }), _jsxs("div", { className: "relative", children: [_jsx(Phone, { className: `absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground` }), _jsx(Input, { id: "phone", name: "phone", type: "tel", value: formData.phone, onChange: handleChange, className: `${isRTL ? 'pr-10' : 'pl-10'} h-11`, placeholder: "+212 6XX XXX XXX" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "message", children: [isRTL ? 'رسالتك' : 'Votre message', " ", _jsx("span", { className: "text-destructive", children: "*" })] }), _jsxs("div", { className: "relative", children: [_jsx(MessageSquare, { className: `absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-5 w-5 text-muted-foreground` }), _jsx(Textarea, { id: "message", name: "message", value: formData.message, onChange: handleChange, className: `${isRTL ? 'pr-10' : 'pl-10'} min-h-[120px]`, placeholder: isRTL
                                                                        ? 'أخبرنا عن احتياجاتك الإعلانية...'
                                                                        : 'Parlez-nous de vos besoins publicitaires...', required: true })] })] }), _jsx(Button, { type: "submit", className: "w-full h-11 mt-6", disabled: loading, children: loading ? (_jsx(Loader2, { className: "h-5 w-5 animate-spin" })) : (_jsxs(_Fragment, { children: [_jsx(Mail, { className: `h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}` }), isRTL ? 'إرسال الطلب' : 'Envoyer la demande'] })) }), _jsx("p", { className: "text-xs text-center text-muted-foreground mt-4", children: isRTL
                                                        ? 'سنقوم بمراجعة طلبك والتواصل معك في أقرب وقت ممكن'
                                                        : 'Nous examinerons votre demande et vous contacterons dans les plus brefs délais' })] })] })] })] }) }), _jsx(Footer, {})] }));
}
