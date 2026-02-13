/**
 * Unified Authentication Page - Phone OTP + Google OAuth
 * 
 * Features:
 * - 2-step phone flow: Phone input → OTP verification
 * - Google OAuth login
 * - No login/signup tabs - automatic detection
 * - Bilingual support (FR/AR) with RTL layout
 * - Responsive design with mobile-first approach
 * - Resend code with 30s cooldown timer
 * - Phone number masking for privacy
 * - localStorage persistence for refresh safety
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { translateAuthError } from '@/lib/authErrors';
import { supabase } from '@/lib/supabase';
import { getSiteUrl } from '@/lib/utils';
import { normalizePhone, isValidPhone, maskPhoneNumber } from '@/lib/phoneUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2, Phone, ArrowLeft } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

// Constants
const OTP_RESEND_COOLDOWN_SECONDS = 30;
const LOCALSTORAGE_KEY_REQUESTID = 'auth_otp_requestid';
const LOCALSTORAGE_KEY_PHONE = 'auth_otp_phone';

export default function AuthPage() {
  const { t, isRTL } = useLanguage();
  const { refreshSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from || '/';

  // State machine: 'phone' | 'verify'
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  
  // Form data
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [requestId, setRequestId] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Resend timer
  const [resendCooldown, setResendCooldown] = useState(0);

  // Restore state from localStorage on mount (for refresh safety)
  useEffect(() => {
    const savedRequestId = localStorage.getItem(LOCALSTORAGE_KEY_REQUESTID);
    const savedPhone = localStorage.getItem(LOCALSTORAGE_KEY_PHONE);
    
    if (savedRequestId && savedPhone) {
      setRequestId(savedRequestId);
      setPhone(savedPhone);
      setStep('verify');
    }
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Clear localStorage when returning to phone step
  const clearStoredData = () => {
    localStorage.removeItem(LOCALSTORAGE_KEY_REQUESTID);
    localStorage.removeItem(LOCALSTORAGE_KEY_PHONE);
  };

  /**
   * Step 1: Request OTP
   * Calls /api/auth/otp/start
   */
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Validate phone number
    if (!isValidPhone(phone)) {
      setError(
        isRTL
          ? 'رقم الهاتف غير صالح. استخدم التنسيق الصحيح'
          : 'Numéro de téléphone invalide. Utilisez le bon format'
      );
      return;
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      setError(
        isRTL
          ? 'تعذر تنسيق رقم الهاتف'
          : 'Impossible de formater le numéro de téléphone'
      );
      return;
    }

    setLoading(true);

    try {
      // Call backend to start OTP verification
      const response = await fetch('/api/auth/otp/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: normalizedPhone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      // Store the requestId from backend
      const newRequestId = data.requestId;
      setRequestId(newRequestId);
      setPhone(normalizedPhone); // Store normalized phone
      
      // Persist to localStorage for refresh safety
      localStorage.setItem(LOCALSTORAGE_KEY_REQUESTID, newRequestId);
      localStorage.setItem(LOCALSTORAGE_KEY_PHONE, normalizedPhone);
      
      setSuccessMessage(t('auth.codeSent'));
      setStep('verify');
      setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(translateAuthError(new Error(errorMsg), isRTL));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Verify OTP
   * Calls /api/auth/otp/check
   */
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (otpCode.length !== 6) {
      setError(
        isRTL
          ? 'أدخل رمز مكون من 6 أرقام'
          : 'Entrez un code à 6 chiffres'
      );
      return;
    }

    setLoading(true);

    try {
      // Call backend to verify OTP
      const response = await fetch('/api/auth/otp/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, code: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('auth.invalidCode'));
      }

      // OTP verified successfully
      // Store token if provided by backend
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }

      // Clear OTP session data
      clearStoredData();

      // Refresh Supabase session to sync authentication state
      // Intentionally not checking result - session may not exist if using custom JWT auth
      await supabase.auth.getSession();
      
      // Optionally refresh the auth context
      if (refreshSession) {
        await refreshSession();
      }

      if (import.meta.env.DEV) {
        console.log('✅ OTP verification successful, redirecting to:', from);
      }
      
      // Scroll to top and redirect
      window.scrollTo(0, 0);
      navigate(from, { replace: true });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('auth.invalidCode');
      setError(translateAuthError(new Error(errorMsg), isRTL));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend OTP code
   */
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return; // Prevent spam
    
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/otp/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP');
      }

      // Update the requestId
      const newRequestId = data.requestId;
      setRequestId(newRequestId);
      localStorage.setItem(LOCALSTORAGE_KEY_REQUESTID, newRequestId);
      
      setSuccessMessage(t('auth.codeSent'));
      setOtpCode(''); // Clear the OTP input
      setResendCooldown(OTP_RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to resend OTP';
      setError(translateAuthError(new Error(errorMsg), isRTL));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Change phone number - go back to step 1
   */
  const handleBackToPhone = () => {
    setStep('phone');
    setOtpCode('');
    setRequestId('');
    setError('');
    setSuccessMessage('');
    clearStoredData();
  };

  /**
   * Handle Google OAuth login
   */
  const handleGoogleLogin = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'server';
    const redirectTo = `${getSiteUrl()}/auth/callback`;

    console.log('🔐 Starting Google OAuth login', {
      origin,
      redirectTo,
      provider: 'google'
    });

    try {
      // Preserve the intended destination for post-auth redirect
      localStorage.setItem('post_auth_redirect', from);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('❌ Failed to start Google OAuth', error);
        setError(isRTL ? 'فشل بدء تسجيل الدخول عبر Google' : 'Échec du démarrage de la connexion Google');
        return;
      }

      console.log('➡️ Redirecting to Google OAuth', {
        authUrl: data?.url,
      });
    } catch (err) {
      console.error('❌ Exception during Google OAuth start', err);
      setError(isRTL ? 'حدث خطأ أثناء بدء Google OAuth' : 'Une erreur est survenue lors du démarrage de Google OAuth');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 mb-6 group">
            <Building2 className="h-10 w-10 text-primary transition-transform group-hover:scale-110" />
            <span className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              TopAffaire
            </span>
          </Link>
          <h1 className="text-3xl font-bold mb-3">
            {t('auth.title')}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t('auth.subtitle')}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-card border border-border/60 rounded-2xl shadow-2xl p-8 md:p-10 backdrop-blur-sm">
          {/* Step 1: Phone Input */}
          {step === 'phone' && (
            <form onSubmit={handleRequestOTP} className="space-y-7">
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm font-medium border border-destructive/20">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm font-medium border border-green-200">
                  {successMessage}
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="phone" className="text-base font-semibold">
                  {t('auth.phoneNumber')}
                </Label>
                <div className="relative">
                  <Phone className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`${isRTL ? 'pr-11' : 'pl-11'} h-14 text-lg border-2 focus:ring-2 focus:ring-primary/20`}
                    placeholder={t('auth.phonePlaceholder')}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {isRTL ? 'مثال: +212612345678' : 'Exemple: +212612345678'}
                </p>
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    {t('auth.sendingCode')}
                  </>
                ) : (
                  t('auth.continue')
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground font-medium">
                    {isRTL ? 'أو' : 'ou'}
                  </span>
                </div>
              </div>

              {/* Google Login Button - Premium */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-14 text-base font-semibold border-2 hover:bg-muted/50 transition-all"
              >
                <svg className={`h-6 w-6 ${isRTL ? 'ml-3' : 'mr-3'}`} viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t('auth.googleLogin')}
              </Button>

              {/* Security microcopy */}
              <p className="text-xs text-center text-muted-foreground mt-6">
                {isRTL ? '🔒 اتصال آمن ومشفر' : '🔒 Connexion sécurisée et cryptée'}
              </p>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'verify' && (
            <form onSubmit={handleVerifyOTP} className="space-y-7">
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm font-medium border border-destructive/20">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm font-medium border border-green-200">
                  {successMessage}
                </div>
              )}

              <div className="space-y-5">
                <Label htmlFor="otp" className="text-base font-semibold text-center block">
                  {t('auth.otpCode')}
                </Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={setOtpCode}
                    disabled={loading}
                  >
                    <InputOTPGroup className="gap-3">
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-sm text-muted-foreground text-center font-medium">
                  {isRTL ? `تم الإرسال إلى ${maskPhoneNumber(phone)}` : `Envoyé à ${maskPhoneNumber(phone)}`}
                </p>
                <p className="text-sm text-muted-foreground text-center font-medium">{t('auth.otpHint')}</p>
              </div>

              <Button 
                type="submit" 
                disabled={loading || otpCode.length !== 6} 
                className="w-full h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    {t('auth.verifying')}
                  </>
                ) : (
                  t('auth.continue')
                )}
              </Button>

              {/* Resend Code */}
              <div className="text-center">
                {resendCooldown > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {isRTL 
                      ? `يمكنك إعادة الإرسال خلال ${resendCooldown} ثانية` 
                      : `Renvoyer le code dans ${resendCooldown}s`
                    }
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-primary font-semibold hover:underline"
                  >
                    {t('auth.resendCode')}
                  </Button>
                )}
              </div>

              {/* Change Phone */}
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToPhone}
                disabled={loading}
                className="w-full h-12 border-2"
              >
                <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180 ml-2' : 'mr-2'}`} />
                {t('auth.changePhone')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
