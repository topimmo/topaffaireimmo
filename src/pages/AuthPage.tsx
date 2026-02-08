/**
 * Unified Authentication Page - Avito-style Phone Auth
 * 
 * Features:
 * - 2-step flow: Phone input → OTP verification
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

      // Refresh Supabase session
      await supabase.auth.getSession();
      
      // Optionally refresh the auth context
      if (refreshSession) {
        await refreshSession();
      }

      console.log('✅ OTP verification successful, redirecting to:', from);
      
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
