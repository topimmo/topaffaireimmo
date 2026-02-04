import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { parseHashParams, clearUrlHash } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * PASSWORD RESET PAGE - SUPABASE CONFIGURATION REQUIREMENTS
 * 
 * This page handles Supabase password reset flow. For this to work correctly,
 * you MUST configure the following in your Supabase Dashboard:
 * 
 * 1. Navigate to: Authentication → URL Configuration
 * 
 * 2. Set Site URL:
 *    Production: https://topaffaireimmo.com
 *    (or https://www.topaffaireimmo.com if using www)
 * 
 * 3. Add Redirect URLs (one per line):
 *    Production:
 *      - https://topaffaireimmo.com/**
 *      - https://www.topaffaireimmo.com/**
 *      - https://topaffaireimmo.com/reset-password
 *      - https://www.topaffaireimmo.com/reset-password
 *    
 *    Development:
 *      - http://localhost:5173/**
 *      - http://localhost:5173/reset-password
 *      - http://127.0.0.1:5173/**
 *    
 *    Vercel Previews (if using Vercel):
 *      - https://*.vercel.app/**
 * 
 * 4. Email Template Configuration:
 *    - The password reset email should use {{ .ConfirmationURL }} which will
 *      automatically redirect to the configured Site URL + /reset-password
 * 
 * IMPORTANT NOTES:
 * - Without proper redirect URL configuration, you will see errors like:
 *   - "otp_expired" (even when clicked immediately)
 *   - "access_denied"
 *   - "Invalid redirect URL"
 * 
 * - This page supports both auth flows:
 *   - PKCE flow (modern): ?code=... in query params
 *   - Hash-based flow (legacy): #access_token=...&refresh_token=... in URL hash
 * 
 * - The Supabase client is configured with:
 *   - flowType: 'pkce' (see src/lib/supabase.ts)
 *   - detectSessionInUrl: true (automatically handles URL parameters)
 * 
 * For more details, see: /docs/SUPABASE_AUTH_REDIRECT_URLS.md
 */

// Wait time for Supabase's detectSessionInUrl to automatically process session from URL
const SESSION_WAIT_MS = 1000;
// Delay before redirecting after successful password update
const SUCCESS_REDIRECT_DELAY_MS = 2000;

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
    // Handle password reset session establishment
    const establishSession = async () => {
      try {
        console.log('🔐 Reset password page loaded');
        console.log('  - Current URL:', window.location.href);

        // Check for PKCE code in query params
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get('code');

        // Check for hash-based tokens
        const hashParams = parseHashParams();
        const accessToken = hashParams.access_token;
        const refreshToken = hashParams.refresh_token;
        const type = hashParams.type || queryParams.get('type');

        console.log('  - Auth parameters:', { 
          hasCode: !!code,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          type
        });

        // Check for errors in URL
        const errorParam = hashParams.error || queryParams.get('error');
        const errorDescription = hashParams.error_description || queryParams.get('error_description');
        const errorCode = hashParams.error_code || queryParams.get('error_code');

        if (errorParam) {
          console.error('❌ Error in reset password URL:');
          console.error('  - Error:', errorParam);
          console.error('  - Error Code:', errorCode);
          console.error('  - Description:', errorDescription);
          console.error('  - Full URL:', window.location.href);
          
          // Provide specific error messages based on error type
          let userMessage = errorDescription || errorParam;
          
          if (errorCode === 'otp_expired' || errorParam === 'otp_expired') {
            userMessage = isRTL 
              ? 'انتهت صلاحية رابط إعادة تعيين كلمة المرور. يرجى طلب رابط جديد من صفحة تسجيل الدخول.'
              : 'Le lien de réinitialisation du mot de passe a expiré. Veuillez demander un nouveau lien depuis la page de connexion.';
          } else if (errorParam === 'access_denied') {
            userMessage = isRTL 
              ? 'تم رفض الوصول. قد يكون الرابط قد استخدم بالفعل أو انتهت صلاحيته.'
              : 'Accès refusé. Le lien a peut-être déjà été utilisé ou a expiré.';
          }
          
          setError(userMessage);
          setCheckingSession(false);
          return;
        }

        // PKCE flow: Exchange code for session
        if (code) {
          console.log('🔑 PKCE flow detected - exchanging code for session');
          
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('❌ Error exchanging code for session:');
            console.error('  - Error Object:', JSON.stringify(exchangeError, null, 2));
            console.error('  - Error Message:', exchangeError.message);
            console.error('  - Error Name:', exchangeError.name);
            console.error('  - Error Status:', (exchangeError as any).status);
            
            // Provide specific error messages
            let userMessage = isRTL 
              ? 'فشل في التحقق من الرابط. يرجى طلب رابط جديد.'
              : 'Échec de la vérification du lien. Veuillez demander un nouveau lien.';
            
            // Check if error indicates OTP expiration
            if (exchangeError.message?.includes('expired') || exchangeError.message?.includes('invalid')) {
              userMessage = isRTL 
                ? 'انتهت صلاحية رابط إعادة تعيين كلمة المرور أو تم استخدامه. يرجى طلب رابط جديد.'
                : 'Le lien de réinitialisation a expiré ou a déjà été utilisé. Veuillez demander un nouveau lien.';
            }
            
            setError(userMessage);
            setCheckingSession(false);
            return;
          }
          
          if (data.session) {
            console.log('✅ Session established via PKCE code exchange');
            console.log('  - User ID:', data.session.user.id);
            console.log('  - User Email:', data.session.user.email);
            
            setValidSession(true);
            setCheckingSession(false);
            
            // Clear the code from URL for cleaner UX
            const cleanUrl = window.location.pathname;
            window.history.replaceState(null, '', cleanUrl);
          } else {
            console.error('❌ No session returned after code exchange');
            setError(isRTL 
              ? 'فشل في إنشاء الجلسة. يرجى تسجيل الدخول.'
              : 'Impossible de créer une session. Veuillez vous connecter.');
            setCheckingSession(false);
          }
          return;
        }

        // Hash-based flow: Tokens in URL hash
        if (accessToken && refreshToken && type === 'recovery') {
          console.log('🔑 Hash-based recovery flow detected - setting session');
          
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (sessionError) {
            console.error('❌ Error setting session:');
            console.error('  - Error Object:', JSON.stringify(sessionError, null, 2));
            console.error('  - Error Message:', sessionError.message);
            console.error('  - Error Name:', sessionError.name);
            console.error('  - Error Status:', (sessionError as any).status);
            
            let userMessage = isRTL 
              ? 'فشل في إنشاء الجلسة. يرجى طلب رابط جديد.'
              : 'Échec de création de session. Veuillez demander un nouveau lien.';
              
            // Check if error indicates token expiration
            if (sessionError.message?.includes('expired') || sessionError.message?.includes('invalid')) {
              userMessage = isRTL 
                ? 'انتهت صلاحية رابط إعادة تعيين كلمة المرور. يرجى طلب رابط جديد.'
                : 'Le lien de réinitialisation a expiré. Veuillez demander un nouveau lien.';
            }
            
            setError(userMessage);
            setCheckingSession(false);
            return;
          }
          
          if (data.session) {
            console.log('✅ Session established via hash tokens');
            console.log('  - User ID:', data.session.user.id);
            console.log('  - User Email:', data.session.user.email);
            
            setValidSession(true);
            setCheckingSession(false);
            
            // Clear hash from URL for cleaner UX
            clearUrlHash();
          } else {
            console.error('❌ No session returned after setting session');
            setError(isRTL 
              ? 'فشل في إنشاء الجلسة. يرجى تسجيل الدخول.'
              : 'Impossible de créer une session. Veuillez vous connecter.');
            setCheckingSession(false);
          }
          return;
        }

        // No code or tokens - check if user already has a valid session
        // (e.g., from detectSessionInUrl auto-processing)
        console.log('ℹ️ No explicit code or tokens, checking for existing session');
        
        // Wait a moment for Supabase detectSessionInUrl to process
        await new Promise(resolve => setTimeout(resolve, SESSION_WAIT_MS));
        
        const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
        
        if (getSessionError) {
          console.error('❌ Error getting session:');
          console.error('  - Error Object:', JSON.stringify(getSessionError, null, 2));
          console.error('  - Error Message:', getSessionError.message);
          setValidSession(false);
          setCheckingSession(false);
          return;
        }

        if (session) {
          console.log('✅ Valid session found');
          console.log('  - User ID:', session.user.id);
          console.log('  - User Email:', session.user.email);
          setValidSession(true);
        } else {
          console.log('⚠️ No valid session found');
          setValidSession(false);
        }
        
        setCheckingSession(false);
      } catch (err) {
        console.error('❌ Exception in session establishment:', err);
        setError(isRTL 
          ? 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
          : 'Une erreur inattendue s\'est produite. Veuillez réessayer.');
        setCheckingSession(false);
      }
    };

    establishSession();

    // Listen for auth state changes (PASSWORD_RECOVERY event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event);
      if (event === 'PASSWORD_RECOVERY') {
        console.log('✅ PASSWORD_RECOVERY event - session valid');
        setValidSession(true);
        setCheckingSession(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Run only once on mount

  const handleSubmit = async (e: React.FormEvent) => {
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

    console.log('🔐 Updating user password');

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (updateError) {
      console.error('❌ Password update error:');
      console.error('  - Error Object:', JSON.stringify(updateError, null, 2));
      console.error('  - Error Message:', updateError.message);
      console.error('  - Error Name:', updateError.name);
      
      // Provide user-friendly error message
      let userMessage = updateError.message;
      if (updateError.message?.includes('session')) {
        userMessage = isRTL 
          ? 'انتهت صلاحية الجلسة. يرجى طلب رابط جديد لإعادة تعيين كلمة المرور.'
          : 'La session a expiré. Veuillez demander un nouveau lien de réinitialisation.';
      }
      
      setError(userMessage);
      return;
    }

    console.log('✅ Password updated successfully');
    setSuccess(true);
    
    // Redirect to home page after success
    setTimeout(() => {
      navigate('/');
    }, SUCCESS_REDIRECT_DELAY_MS);
  };

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className={`flex items-center justify-center py-12 px-4 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="w-full max-w-md text-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground mb-4">
              {isRTL ? 'رابط غير صالح' : 'Lien invalide'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {isRTL 
                ? 'هذا الرابط غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.'
                : 'Ce lien est invalide ou a expiré. Veuillez demander un nouveau lien.'}
            </p>
            <Button asChild>
              <Link to="/login">
                {isRTL ? 'العودة لتسجيل الدخول' : 'Retour à la connexion'}
              </Link>
            </Button>
          </div>
        </div>
    );
  }

  if (success) {
    return (
      <div className={`flex items-center justify-center py-12 px-4 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="w-full max-w-md text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground mb-4">
              {isRTL ? 'تم تغيير كلمة المرور' : 'Mot de passe modifié'}
            </h1>
            <p className="text-muted-foreground">
              {isRTL 
                ? 'تم تغيير كلمة المرور بنجاح. جاري إعادة التوجيه...'
                : 'Votre mot de passe a été modifié avec succès. Redirection en cours...'}
            </p>
          </div>
        </div>
    );
  }

  return (
    <div className={`flex items-center justify-center py-12 px-4 ${isRTL ? 'rtl' : 'ltr'}`}>
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
                {isRTL ? 'كلمة مرور جديدة' : 'Nouveau mot de passe'}
              </h1>
              <p className="text-muted-foreground text-sm mt-2">
                {isRTL ? 'أدخل كلمة المرور الجديدة' : 'Entrez votre nouveau mot de passe'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">
                  {isRTL ? 'كلمة المرور الجديدة' : 'Nouveau mot de passe'}
                </Label>
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
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {isRTL ? 'تأكيد كلمة المرور' : 'Confirmer le mot de passe'}
                </Label>
                <div className="relative">
                  <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${isRTL ? 'pr-10' : 'pl-10'} h-12`}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  isRTL ? 'تغيير كلمة المرور' : 'Changer le mot de passe'
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline font-medium">
                {isRTL ? 'العودة لتسجيل الدخول' : 'Retour à la connexion'}
              </Link>
            </div>
          </div>
        </div>
      </div>
  );
}
