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

  // Handle Google OAuth callback with token in URL hash
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const googleAuthSuccess = urlParams.get('google_auth_success');
    
    if (googleAuthSuccess === 'true') {
      // Extract tokens from hash
      const hash = window.location.hash.substring(1); // Remove leading #
      const hashParams = new URLSearchParams(hash);
      const token = hashParams.get('token');
      const idToken = hashParams.get('id_token');
      
      if (token) {
        // Store custom JWT token
        localStorage.setItem('auth_token', token);
        
        // If we have Google id_token, use it to create a Supabase session
        if (idToken) {
          supabase.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
          })
          .then(({ error }) => {
            if (error) {
              console.error('Failed to create Supabase session with id_token:', error);
              // Continue anyway - we have the custom JWT token
            } else {
              console.log('✅ Supabase session created successfully via id_token');
            }
            
            // Clear URL params and hash
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Redirect to original destination
            if (refreshSession) {
              refreshSession()
                .then(() => {
                  navigate(from, { replace: true });
                })
                .catch((err) => {
                  console.error('Session refresh failed:', err);
                  // Still redirect even if session refresh fails
                  navigate(from, { replace: true });
                });
            } else {
              navigate(from, { replace: true });
            }
          })
          .catch((err) => {
            console.error('Exception during Supabase sign in:', err);
            // Clear URL and redirect anyway
            window.history.replaceState({}, document.title, window.location.pathname);
            navigate(from, { replace: true });
          });
        } else {
          // No id_token, just use custom JWT
          // Clear URL params and hash
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Redirect to original destination
          if (refreshSession) {
            refreshSession()
              .then(() => {
                navigate(from, { replace: true });
              })
              .catch((err) => {
                console.error('Session refresh failed:', err);
                // Still redirect even if session refresh fails
                navigate(from, { replace: true });
              });
          } else {
            navigate(from, { replace: true });
          }
        }
      }
    }
    
    // Handle Google OAuth errors
    const authError = urlParams.get('auth_error');
    if (authError) {
      const errorMessages: Record<string, string> = {
        google_oauth_failed: isRTL ? 'فشلت عملية تسجيل الدخول عبر Google' : 'La connexion Google a échoué',
        missing_code: isRTL ? 'رمز التحقق مفقود' : 'Code de vérification manquant',
        missing_state: isRTL ? 'معلمة الحالة مفقودة' : 'Paramètre d\'état manquant',
        invalid_state: isRTL ? 'حالة غير صالحة أو منتهية الصلاحية' : 'État invalide ou expiré',
        token_exchange_failed: isRTL ? 'فشل تبادل الرمز' : 'Échec de l\'échange de code',
        userinfo_failed: isRTL ? 'فشل الحصول على معلومات المستخدم' : 'Échec de récupération des infos utilisateur',
        email_not_verified: isRTL ? 'البريد الإلكتروني غير محقق' : 'Email non vérifié',
        database_error: isRTL ? 'خطأ في قاعدة البيانات' : 'Erreur de base de données',
        user_creation_failed: isRTL ? 'فشل إنشاء المستخدم' : 'Échec de création d\'utilisateur',
        profile_creation_failed: isRTL ? 'فشل إنشاء الملف الشخصي' : 'Échec de création du profil',
        unexpected_error: isRTL ? 'حدث خطأ غير متوقع' : 'Erreur inattendue',
      };
      
      setError(errorMessages[authError] || errorMessages.unexpected_error);
      
      // Clear the error from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [from, navigate, refreshSession, isRTL]);

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
  const handleGoogleLogin = () => {
    // Navigate to Google OAuth start endpoint
    window.location.href = '/api/auth/google/start';
  };

  return (
    <div className={`flex items-center justify-center min-h-screen py-12 px-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="w-full max-w-[420px]">
        <div className="bg-white rounded-2xl border p-8 shadow-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="font-display text-xl font-semibold">
                TopAffaire<span className="text-primary">Immo</span>
              </span>
            </Link>
            <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
              {step === 'phone' ? t('auth.enterPhoneTitle') : t('auth.verifyPhoneTitle')}
            </h1>
            {step === 'verify' && phone && (
              <p className="text-sm text-muted-foreground">
                {t('auth.sentTo')} <span className="font-medium">{maskPhoneNumber(phone)}</span>
              </p>
            )}
          </div>

          {/* Step 1: Phone Input */}
          {step === 'phone' && (
            <form onSubmit={handleRequestOTP} className="space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm text-center">
                  {successMessage}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base">
                  {t('auth.phoneNumber')}
                </Label>
                <div className="relative">
                  <Phone
                    className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`}
                  />
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`${isRTL ? 'pr-12' : 'pl-12'} h-14 text-lg`}
                    placeholder={t('auth.phonePlaceholder')}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t('auth.phoneHint')}</p>
              </div>

              <Button type="submit" className="w-full h-14 text-lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    {t('auth.sendingCode')}
                  </>
                ) : (
                  t('auth.continue')
                )}
              </Button>

              {/* Separator */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-muted-foreground">{t('auth.or')}</span>
                </div>
              </div>

              {/* Google Login Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-14 text-lg border-2"
              >
                <svg className={`h-5 w-5 ${isRTL ? 'ml-3' : 'mr-3'}`} viewBox="0 0 24 24">
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
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 'verify' && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm text-center">
                  {successMessage}
                </div>
              )}

              <div className="space-y-4">
                <Label htmlFor="otp" className="text-base text-center block">
                  {t('auth.otpCode')}
                </Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpCode}
                    onChange={setOtpCode}
                    disabled={loading}
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot index={0} className="h-14 w-12 text-xl" />
                      <InputOTPSlot index={1} className="h-14 w-12 text-xl" />
                      <InputOTPSlot index={2} className="h-14 w-12 text-xl" />
                      <InputOTPSlot index={3} className="h-14 w-12 text-xl" />
                      <InputOTPSlot index={4} className="h-14 w-12 text-xl" />
                      <InputOTPSlot index={5} className="h-14 w-12 text-xl" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-xs text-muted-foreground text-center">{t('auth.otpHint')}</p>
              </div>

              <Button 
                type="submit" 
                disabled={loading || otpCode.length !== 6} 
                className="w-full h-14 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
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
                    {t('auth.resendIn')} {resendCooldown} {t('auth.seconds')}
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-sm"
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
                className="w-full"
              >
                <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180 ml-2' : 'mr-2'}`} />
                {t('auth.changePhone')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
