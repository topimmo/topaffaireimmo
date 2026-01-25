import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
export default function ResetPassword() {
    const { t, isRTL } = useLanguage();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [validSession, setValidSession] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    useEffect(() => {
        // Check if user has a valid password reset session
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setValidSession(!!session);
            setCheckingSession(false);
        };
        checkSession();
        // Listen for auth state changes (happens when user clicks email link)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setValidSession(true);
            }
        });
        return () => subscription.unsubscribe();
    }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError(isRTL ? 'كلمات المرور غير متطابقة' : 'Les mots de passe ne correspondent pas');
            return;
        }
        if (password.length < 6) {
            setError(isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Le mot de passe doit contenir au moins 6 caractères');
            return;
        }
        setLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({
            password: password,
        });
        setLoading(false);
        if (updateError) {
            setError(updateError.message);
            return;
        }
        setSuccess(true);
        setTimeout(() => {
            navigate('/dashboard');
        }, 3000);
    };
    if (checkingSession) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: _jsx(Loader2, { className: "h-10 w-10 animate-spin text-primary" }) }));
    }
    if (!validSession) {
        return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 flex items-center justify-center pt-20 pb-16 px-4", children: _jsxs("div", { className: "w-full max-w-md text-center", children: [_jsx("div", { className: "w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6", children: _jsx(AlertCircle, { className: "h-10 w-10 text-destructive" }) }), _jsx("h1", { className: "font-display text-2xl font-semibold text-foreground mb-4", children: isRTL ? 'رابط غير صالح' : 'Lien invalide' }), _jsx("p", { className: "text-muted-foreground mb-6", children: isRTL
                                    ? 'هذا الرابط غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.'
                                    : 'Ce lien est invalide ou a expiré. Veuillez demander un nouveau lien.' }), _jsx(Button, { asChild: true, children: _jsx(Link, { to: "/login", children: isRTL ? 'العودة لتسجيل الدخول' : 'Retour à la connexion' }) })] }) }), _jsx(Footer, {})] }));
    }
    if (success) {
        return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 flex items-center justify-center pt-20 pb-16 px-4", children: _jsxs("div", { className: "w-full max-w-md text-center", children: [_jsx("div", { className: "w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6", children: _jsx(CheckCircle, { className: "h-10 w-10 text-green-600" }) }), _jsx("h1", { className: "font-display text-2xl font-semibold text-foreground mb-4", children: isRTL ? 'تم تغيير كلمة المرور' : 'Mot de passe modifié' }), _jsx("p", { className: "text-muted-foreground", children: isRTL
                                    ? 'تم تغيير كلمة المرور بنجاح. جاري إعادة التوجيه...'
                                    : 'Votre mot de passe a été modifié avec succès. Redirection en cours...' })] }) }), _jsx(Footer, {})] }));
    }
    return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 flex items-center justify-center pt-20 pb-16 px-4", children: _jsx("div", { className: "w-full max-w-md", children: _jsxs("div", { className: "bg-white rounded-2xl border p-8 shadow-sm", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsxs(Link, { to: "/", className: "inline-flex items-center gap-2 mb-6", children: [_jsx(Building2, { className: "h-8 w-8 text-primary" }), _jsxs("span", { className: "font-display text-xl font-semibold", children: ["TopAffaire", _jsx("span", { className: "text-primary", children: "Immo" })] })] }), _jsx("h1", { className: "font-display text-2xl font-semibold text-foreground", children: isRTL ? 'كلمة مرور جديدة' : 'Nouveau mot de passe' }), _jsx("p", { className: "text-muted-foreground text-sm mt-2", children: isRTL ? 'أدخل كلمة المرور الجديدة' : 'Entrez votre nouveau mot de passe' })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [error && (_jsx("div", { className: "p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center", children: error })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: isRTL ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe' }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: `absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground` }), _jsx(Input, { id: "password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: `${isRTL ? 'pr-10' : 'pl-10'} h-12`, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true, minLength: 6 })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "confirmPassword", children: isRTL ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe' }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: `absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground` }), _jsx(Input, { id: "confirmPassword", type: "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), className: `${isRTL ? 'pr-10' : 'pl-10'} h-12`, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true, minLength: 6 })] })] }), _jsx(Button, { type: "submit", className: "w-full h-12", disabled: loading, children: loading ? (_jsx(Loader2, { className: "h-5 w-5 animate-spin" })) : (isRTL ? 'تغيير كلمة المرور' : 'Changer le mot de passe') })] }), _jsx("div", { className: "mt-6 text-center text-sm text-muted-foreground", children: _jsx(Link, { to: "/login", className: "text-primary hover:underline font-medium", children: isRTL ? 'العودة لتسجيل الدخول' : 'Retour à la connexion' }) })] }) }) }), _jsx(Footer, {})] }));
}
