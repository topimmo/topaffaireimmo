import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { translateAuthError } from '@/lib/authErrors';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Mail, Lock, User, Phone, Briefcase, Loader2, CheckCircle } from 'lucide-react';
export default function Register() {
    const { t, isRTL } = useLanguage();
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: '',
        companyName: '',
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
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 REGISTER FORM SUBMITTED');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Form data:');
        console.log('  - Email:', formData.email);
        console.log('  - Full Name:', formData.fullName);
        console.log('  - Phone:', formData.phone || '(not provided)');
        console.log('  - Company Name:', formData.companyName || '(not provided)');
        // Validation: Check passwords match
        if (formData.password !== formData.confirmPassword) {
            console.error('❌ Validation failed: Passwords do not match');
            setError(isRTL ? 'كلمات المرور غير متطابقة' : 'Les mots de passe ne correspondent pas');
            setLoading(false);
            return;
        }
        // Validation: Check password length
        if (formData.password.length < 6) {
            console.error('❌ Validation failed: Password too short');
            setError(isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Le mot de passe doit contenir au moins 6 caractères');
            setLoading(false);
            return;
        }
        console.log('✅ Form validation passed');
        console.log('Calling AuthContext.signUp()...');
        try {
            const { error: signUpError } = await signUp(formData.email, formData.password, formData.fullName, formData.phone, 'real_estate_advertiser', formData.companyName);
            if (signUpError) {
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.error('❌ REGISTER PAGE: Signup returned error');
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.error('Error object:', signUpError);
                console.error('Error message:', signUpError.message);
                // Use centralized error translation
                const translatedError = translateAuthError(signUpError, isRTL);
                console.error('Translated error:', translatedError);
                setError(translatedError);
                setLoading(false);
                return;
            }
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ REGISTER PAGE: Signup completed successfully');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Showing success screen to user');
            console.log('User should check email for confirmation link');
            setSuccess(true);
            setLoading(false);
        }
        catch (err) {
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('❌ UNEXPECTED ERROR during registration');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('Exception:', err);
            console.error('Exception type:', typeof err);
            console.error('Exception details:', JSON.stringify(err, null, 2));
            setError(translateAuthError(err, isRTL));
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 flex items-center justify-center pt-20 pb-16 px-4", children: _jsx("div", { className: "w-full max-w-md", children: success ? (_jsxs("div", { className: "bg-white rounded-2xl border p-8 shadow-sm text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4", children: _jsx(CheckCircle, { className: "h-8 w-8 text-green-600" }) }), _jsx("h1", { className: "font-display text-2xl font-semibold text-foreground mb-2", children: isRTL ? 'تم إنشاء الحساب بنجاح!' : 'Compte créé avec succès!' }), _jsx("p", { className: "text-muted-foreground mb-6", children: isRTL
                                    ? 'تحقق من بريدك الإلكتروني للحصول على رابط التأكيد'
                                    : 'Vérifiez votre email pour le lien de confirmation' }), _jsx(Button, { onClick: () => navigate('/login'), className: "w-full", children: isRTL ? 'الذهاب لتسجيل الدخول' : 'Aller à la connexion' })] })) : (_jsxs("div", { className: "bg-white rounded-2xl border p-6 sm:p-8 shadow-sm", children: [_jsxs("div", { className: "text-center mb-6 sm:mb-8", children: [_jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 mb-4 sm:mb-6", children: [_jsx(Building2, { className: "h-8 w-8 text-primary" }), _jsxs("span", { className: "font-display text-xl font-semibold", children: ["TopAffaire", _jsx("span", { className: "text-primary", children: "Immo" })] })] }), _jsx("h1", { className: "font-display text-2xl font-semibold text-foreground mb-2", children: t('auth.register') }), _jsx("p", { className: "text-sm text-muted-foreground", children: isRTL
                                            ? 'أنشئ حسابك لنشر إعلانات عقارية مجانية'
                                            : 'Créez votre compte pour publier des annonces immobilières gratuites' })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4 sm:space-y-5", children: [error && (_jsx("div", { className: "p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center", children: error })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "fullName", children: t('auth.fullName') }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: `absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground` }), _jsx(Input, { id: "fullName", name: "fullName", type: "text", value: formData.fullName, onChange: handleChange, className: `${isRTL ? 'pr-10' : 'pl-10'} h-11 sm:h-12`, placeholder: isRTL ? 'الاسم الكامل' : 'Nom complet', required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: t('auth.email') }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: `absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground` }), _jsx(Input, { id: "email", name: "email", type: "email", value: formData.email, onChange: handleChange, className: `${isRTL ? 'pr-10' : 'pl-10'} h-11 sm:h-12`, placeholder: "email@example.com", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "phone", children: [t('auth.phone'), " (", isRTL ? 'اختياري' : 'optionnel', ")"] }), _jsxs("div", { className: "relative", children: [_jsx(Phone, { className: `absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground` }), _jsx(Input, { id: "phone", name: "phone", type: "tel", value: formData.phone, onChange: handleChange, className: `${isRTL ? 'pr-10' : 'pl-10'} h-11 sm:h-12`, placeholder: "+212 6XX XXX XXX" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "companyName", children: [isRTL ? 'اسم الشركة / الوكالة' : 'Nom de l\'entreprise / agence', " (", isRTL ? 'اختياري' : 'optionnel', ")"] }), _jsxs("div", { className: "relative", children: [_jsx(Briefcase, { className: `absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground` }), _jsx(Input, { id: "companyName", name: "companyName", type: "text", value: formData.companyName, onChange: handleChange, className: `${isRTL ? 'pr-10' : 'pl-10'} h-11 sm:h-12`, placeholder: isRTL ? 'اسم الوكالة' : 'Nom de l\'agence' })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: t('auth.password') }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: `absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground` }), _jsx(Input, { id: "password", name: "password", type: "password", value: formData.password, onChange: handleChange, className: `${isRTL ? 'pr-10' : 'pl-10'} h-11 sm:h-12`, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true })] }), _jsx("p", { className: "text-xs text-muted-foreground", children: isRTL ? '6 أحرف على الأقل' : 'Au moins 6 caractères' })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "confirmPassword", children: t('auth.confirmPassword') }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: `absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground` }), _jsx(Input, { id: "confirmPassword", name: "confirmPassword", type: "password", value: formData.confirmPassword, onChange: handleChange, className: `${isRTL ? 'pr-10' : 'pl-10'} h-11 sm:h-12`, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true })] })] }), _jsx(Button, { type: "submit", className: "w-full h-11 sm:h-12 mt-6", disabled: loading, children: loading ? (_jsx(Loader2, { className: "h-5 w-5 animate-spin" })) : (t('auth.registerButton')) })] }), _jsxs("div", { className: "mt-6 text-center text-sm text-muted-foreground", children: [t('auth.haveAccount'), ' ', _jsx(Link, { to: "/login", className: "text-primary hover:underline font-medium", children: t('auth.login') })] })] })) }) }), _jsx(Footer, {})] }));
}
