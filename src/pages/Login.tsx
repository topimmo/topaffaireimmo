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

  const from = (location.state as { from?: string })?.from || '/dashboard';

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    
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

  const handleSubmit = async (e: React.FormEvent) => {
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

      // Fetch user profile to determine role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_role')
          .eq('id', user.id)
          .single();

        // Redirect based on user role
        let redirectTo = from;
        if (profile?.user_role === 'admin') {
          redirectTo = '/admin';
        } else if (from === '/dashboard' || from === '/login') {
          // Default redirect for non-admin users
          if (profile?.user_role === 'commercial_advertiser') {
            redirectTo = '/commercial-dashboard';
          } else {
            redirectTo = '/dashboard';
          }
        }

        console.log('✅ Login successful, redirecting to:', redirectTo);
        
        // Scroll to top on navigation
        window.scrollTo(0, 0);
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      console.error('❌ Unexpected error during login:', err);
      setError(translateAuthError(err as Error, isRTL));
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      <Header />
      
      <main className="flex-1 flex items-center justify-center pt-20 pb-16 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border p-8 shadow-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center gap-2 mb-6">
                <Building2 className="h-8 w-8 text-primary" />
                <span className="font-display text-xl font-semibold">
                  TopAffaire<span className="text-primary">Immo</span>
                </span>
              </Link>
              <h1 className="font-display text-2xl font-semibold text-foreground">
                {t('auth.login')}
              </h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${isRTL ? 'pr-10' : 'pl-10'} h-12`}
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${isRTL ? 'pr-10' : 'pl-10'} h-12`}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  t('auth.loginButton')
                )}
              </Button>

              {/* Forgot Password Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:underline"
                >
                  {isRTL ? 'نسيت كلمة المرور؟' : 'Mot de passe oublié ?'}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                {t('auth.register')}
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            {resetEmailSent ? (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="font-display text-xl font-semibold mb-2">
                  {isRTL ? 'تم إرسال البريد الإلكتروني' : 'Email envoyé'}
                </h2>
                <p className="text-muted-foreground text-sm mb-4">
                  {isRTL 
                    ? 'تحقق من بريدك الإلكتروني للحصول على رابط إعادة تعيين كلمة المرور'
                    : 'Vérifiez votre email pour le lien de réinitialisation du mot de passe'}
                </p>
                <Button onClick={() => { setShowForgotPassword(false); setResetEmailSent(false); }}>
                  {isRTL ? 'إغلاق' : 'Fermer'}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => setShowForgotPassword(false)}>
                    <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
                  </button>
                  <h2 className="font-display text-xl font-semibold">
                    {isRTL ? 'إعادة تعيين كلمة المرور' : 'Réinitialiser le mot de passe'}
                  </h2>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  {isRTL 
                    ? 'أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور'
                    : 'Entrez votre email et nous vous enverrons un lien de réinitialisation'}
                </p>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="resetEmail">{t('auth.email')}</Label>
                    <Input
                      id="resetEmail"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)}>
                      {isRTL ? 'إلغاء' : 'Annuler'}
                    </Button>
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        isRTL ? 'إرسال الرابط' : 'Envoyer le lien'
                      )}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
