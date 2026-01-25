import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { translateAuthError } from '@/lib/authErrors';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Mail, Lock, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
export default function Login() {
    const { t, isRTL } = useLanguage();
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const from = location.state?.from || '/dashboard';
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        if (!resetEmail)
            return;
        setLoading(true);
        setError('');
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        setLoading(false);
        if (resetError) {
            setError(resetError.message);
            return;
        }
        setResetEmailSent(true);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        console.log('🔐 Login attempt for:', email);
        try {
            const { error: signInError } = await signIn(email, password);
            if (signInError) {
                console.error('❌ Login error:', signInError);
                // Use centralized error translation
                setError(translateAuthError(signInError, isRTL));
                setLoading(false);
                return;
            }
            console.log('✅ Login successful, redirecting to:', from);
            navigate(from, { replace: true });
        }
        catch (err) {
            console.error('❌ Unexpected error during login:', err);
            setError(translateAuthError(err, isRTL));
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 flex items-center justify-center pt-20 pb-16 px-4", children: _jsx("div", { className: "w-full max-w-md", children: _jsxs("div", { className: "bg-white rounded-2xl border p-8 shadow-sm", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 mb-6", children: [_jsx(Building2, { className: "h-8 w-8 text-primary" }), _jsxs("span", { className: "font-display text-xl font-semibold", children: ["TopAffaire", _jsx("span", { className: "text-primary", children: "Immo" })] })] }), _jsx("h1", { className: "font-display text-2xl font-semibold text-foreground", children: t('auth.login') })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [error && (_jsx("div", { className: "p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center", children: error })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: t('auth.email') }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: `absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground` }), _jsx(Input, { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: `${isRTL ? 'pr-10' : 'pl-10'} h-12`, placeholder: "email@example.com", required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: t('auth.password') }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: `absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground` }), _jsx(Input, { id: "password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: `${isRTL ? 'pr-10' : 'pl-10'} h-12`, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true })] })] }), _jsx(Button, { type: "submit", className: "w-full h-12", disabled: loading, children: loading ? (_jsx(Loader2, { className: "h-5 w-5 animate-spin" })) : (t('auth.loginButton')) }), _jsx("div", { className: "text-center", children: _jsx("button", { type: "button", onClick: () => setShowForgotPassword(true), className: "text-sm text-primary hover:underline", children: isRTL ? 'نسيت كلمة المرور؟' : 'Mot de passe oublié ?' }) })] }), _jsxs("div", { className: "mt-6 text-center text-sm text-muted-foreground", children: [t('auth.noAccount'), ' ', _jsx(Link, { to: "/register", className: "text-primary hover:underline font-medium", children: t('auth.register') })] })] }) }) }), showForgotPassword && (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", children: _jsx("div", { className: "bg-white rounded-2xl p-6 max-w-md w-full", children: resetEmailSent ? (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4", children: _jsx(CheckCircle, { className: "h-8 w-8 text-green-600" }) }), _jsx("h2", { className: "font-display text-xl font-semibold mb-2", children: isRTL ? 'تم إرسال البريد الإلكتروني' : 'Email envoyé' }), _jsx("p", { className: "text-muted-foreground text-sm mb-4", children: isRTL
                                    ? 'تحقق من بريدك الإلكتروني للحصول على رابط إعادة تعيين كلمة المرور'
                                    : 'Vérifiez votre email pour le lien de réinitialisation du mot de passe' }), _jsx(Button, { onClick: () => { setShowForgotPassword(false); setResetEmailSent(false); }, children: isRTL ? 'إغلاق' : 'Fermer' })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("button", { onClick: () => setShowForgotPassword(false), children: _jsx(ArrowLeft, { className: `h-5 w-5 ${isRTL ? 'rotate-180' : ''}` }) }), _jsx("h2", { className: "font-display text-xl font-semibold", children: isRTL ? 'إعادة تعيين كلمة المرور' : 'Réinitialiser le mot de passe' })] }), _jsx("p", { className: "text-muted-foreground text-sm mb-4", children: isRTL
                                    ? 'أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور'
                                    : 'Entrez votre email et nous vous enverrons un lien de réinitialisation' }), _jsxs("form", { onSubmit: handleForgotPassword, className: "space-y-4", children: [error && (_jsx("div", { className: "p-3 rounded-lg bg-destructive/10 text-destructive text-sm", children: error })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "resetEmail", children: t('auth.email') }), _jsx(Input, { id: "resetEmail", type: "email", value: resetEmail, onChange: (e) => setResetEmail(e.target.value), placeholder: "email@example.com", required: true })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setShowForgotPassword(false), children: isRTL ? 'إلغاء' : 'Annuler' }), _jsx(Button, { type: "submit", className: "flex-1", disabled: loading, children: loading ? (_jsx(Loader2, { className: "h-5 w-5 animate-spin" })) : (isRTL ? 'إرسال الرابط' : 'Envoyer le lien') })] })] })] })) }) })), _jsx(Footer, {})] }));
}
