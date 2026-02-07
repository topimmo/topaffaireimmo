import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { parseHashParams, clearUrlHash, detectInAppBrowser, getOpenInBrowserInstructions, copyToClipboard } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Lock, Loader2, CheckCircle, AlertCircle, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';

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
 *    - In Supabase Dashboard → Authentication → Email Templates
 *    - The password reset email template should use {{ .ConfirmationURL }}
 *      (this is Supabase's Go template syntax, not JavaScript)
 *    - This will automatically redirect to: Site URL + /reset-password
 *    - Example: https://topaffaireimmo.com/reset-password?code=...
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
  
  // Log component mount for debugging (development only)
  if (import.meta.env.DEV) {
    console.log('🔐 [ResetPassword] Component mounted');
    console.log('  - Current URL:', window.location.href);
    console.log('  - Pathname:', window.location.pathname);
    console.log('  - Search params:', window.location.search);
    console.log('  - Hash:', window.location.hash);
  }
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [inAppBrowserWarning, setInAppBrowserWarning] = useState<{
    show: boolean;
    browserName: string;
  }>({ show: false, browserName: '' });

  useEffect(() => {
    // Handle password reset session establishment
    const establishSession = async () => {
      try {
        // Detect in-app browser early for logging and potential warnings
        const browserDetection = detectInAppBrowser();
        
        console.log('🔐 Reset password page loaded');
        console.log('  - Current URL:', window.location.href);
        console.log('  - Online status:', navigator.onLine);
        console.log('  - User agent:', navigator.userAgent);
        console.log('  - In-app browser:', browserDetection.isInApp ? browserDetection.browserName : 'No');

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
          console.error('  - In-app browser:', browserDetection.browserName);
          
          // Check network connectivity first
          if (!navigator.onLine) {
            const offlineMsg = isRTL 
              ? 'لا يوجد اتصال بالإنترنت. يرجى التحقق من اتصالك.'
              : 'Pas de connexion Internet. Veuillez vérifier votre connexion.';
            setError(offlineMsg);
            setCheckingSession(false);
            return;
          }
          
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

        // Check if we're in an in-app browser and missing tokens
        // This is a common scenario with Gmail in-app browser which may drop hash fragments
        if (browserDetection.isInApp && !code && !accessToken && !refreshToken) {
          console.warn('⚠️ In-app browser detected with no auth tokens');
          console.warn('  - Browser:', browserDetection.browserName);
          console.warn('  - This may indicate hash fragment was stripped from URL');
          console.warn('  - User should open link in system browser');
          
          // Show warning to user to open in external browser
          setInAppBrowserWarning({
            show: true,
            browserName: browserDetection.browserName
          });
          setCheckingSession(false);
          return;
        }

        // Early network check: If offline and we have a code/token to exchange,
        // show a helpful message instead of attempting the exchange
        if (!navigator.onLine && (code || (accessToken && refreshToken))) {
          console.warn('⚠️ User is offline, cannot verify reset link');
          const offlineMsg = isRTL 
            ? 'لا يوجد اتصال بالإنترنت. يرجى الاتصال بالإنترنت للمتابعة.'
            : 'Pas de connexion Internet. Veuillez vous connecter pour continuer.';
          setError(offlineMsg);
          setCheckingSession(false);
          return;
        }

        // PKCE flow: Exchange code for session
        if (code) {
          console.log('🔑 PKCE flow detected - exchanging code for session');
          
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('❌ Error exchanging code for session:');
            if (import.meta.env.DEV) {
              console.error('  - Error Object:', JSON.stringify(exchangeError, null, 2));
            }
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
            if (import.meta.env.DEV) {
              console.error('  - Error Object:', JSON.stringify(sessionError, null, 2));
            }
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
          if (import.meta.env.DEV) {
            console.error('  - Error Object:', JSON.stringify(getSessionError, null, 2));
          }
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

    if (password.length < 8) {
      setError(isRTL ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    // Additional password strength validation
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    
    if (!hasNumber || !hasLetter) {
      setError(isRTL 
        ? 'كلمة المرور يجب أن تحتوي على أحرف وأرقام' 
        : 'Le mot de passe doit contenir des lettres et des chiffres');
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
      if (import.meta.env.DEV) {
        console.error('  - Error Object:', JSON.stringify(updateError, null, 2));
      }
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
    
    // Sign out the recovery session for security
    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.warn('⚠️ Sign out after password reset failed:', signOutError);
      // Continue anyway - user will be redirected to login
    }
    
    setSuccess(true);
    toast.success(isRTL ? 'تم تغيير كلمة المرور بنجاح' : 'Mot de passe modifié avec succès');
    
    // Redirect to login page after success
    setTimeout(() => {
      navigate('/login');
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
    // Show in-app browser warning if detected
    if (inAppBrowserWarning.show) {
      const instructions = getOpenInBrowserInstructions(isRTL);
      
      const handleCopyLink = async () => {
        const success = await copyToClipboard(window.location.href);
        if (success) {
          toast.success(isRTL ? 'تم نسخ الرابط' : 'Lien copié');
        } else {
          toast.error(isRTL ? 'فشل نسخ الرابط' : 'Échec de la copie');
        }
      };

      return (
        <div className={`flex items-center justify-center py-12 px-4 ${isRTL ? 'rtl' : 'ltr'}`}>
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl border p-8 shadow-sm">
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
                  <ExternalLink className="h-10 w-10 text-amber-600" />
                </div>
                <h1 className="font-display text-2xl font-semibold text-foreground mb-4">
                  {instructions.title}
                </h1>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-amber-900 mb-2 font-medium">
                    {isRTL 
                      ? `تم اكتشاف ${inAppBrowserWarning.browserName}`
                      : `Détecté dans ${inAppBrowserWarning.browserName}`}
                  </p>
                  <p className="text-sm text-amber-800">
                    {isRTL 
                      ? 'قد لا تعمل روابط إعادة تعيين كلمة المرور بشكل صحيح في هذا المتصفح. افتح الرابط في متصفحك الافتراضي.'
                      : 'Les liens de réinitialisation peuvent ne pas fonctionner correctement dans ce navigateur. Ouvrez le lien dans votre navigateur par défaut.'}
                  </p>
                </div>
              </div>

              <div className={`space-y-4 mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                <h2 className="font-semibold text-foreground mb-3">
                  {isRTL ? 'الخطوات:' : 'Étapes:'}
                </h2>
                <ol className={`list-decimal ${isRTL ? 'list-inside pr-4' : 'list-inside pl-4'} space-y-2 text-sm text-muted-foreground`}>
                  {instructions.instructions.map((instruction, index) => (
                    <li key={index} className="leading-relaxed">{instruction}</li>
                  ))}
                </ol>
              </div>

              <div className="space-y-3">
                <Button onClick={handleCopyLink} className="w-full" size="lg">
                  <Copy className={`h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {instructions.actionText}
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/login">
                    {isRTL ? 'العودة لتسجيل الدخول' : 'Retour à la connexion'}
                  </Link>
                </Button>
              </div>

              <div className="mt-6 p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  {isRTL 
                    ? 'بعد فتح الرابط في متصفحك، ستتمكن من إعادة تعيين كلمة المرور.'
                    : 'Après avoir ouvert le lien dans votre navigateur, vous pourrez réinitialiser votre mot de passe.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Standard invalid link error
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
              {error || (isRTL 
                ? 'هذا الرابط غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.'
                : 'Ce lien est invalide ou a expiré. Veuillez demander un nouveau lien.')}
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/login">
                  {isRTL ? 'طلب رابط جديد' : 'Demander un nouveau lien'}
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">
                  {isRTL ? 'العودة لتسجيل الدخول' : 'Retour à la connexion'}
                </Link>
              </Button>
            </div>
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
                    minLength={8}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isRTL 
                    ? 'الحد الأدنى 8 أحرف (يجب أن تحتوي على أحرف وأرقام)' 
                    : 'Minimum 8 caractères (doit contenir lettres et chiffres)'}
                </p>
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
                    minLength={8}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isRTL 
                    ? 'يجب أن تتطابق كلمة المرور أعلاه' 
                    : 'Doit correspondre au mot de passe ci-dessus'}
                </p>
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
