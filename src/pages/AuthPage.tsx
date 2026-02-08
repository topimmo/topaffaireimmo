/**
 * Unified Authentication Page
 * 
 * Provides tabbed interface for:
 * - Phone (SMS OTP) authentication - auto handles signup + login
 * - Email authentication - classic signup/login with password
 * 
 * Features:
 * - Bilingual support (FR/AR) with RTL layout
 * - Responsive design (mobile/tablet/desktop)
 * - Integration with Supabase auth
 * - Phone normalization using libphonenumber-js
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { translateAuthError } from '@/lib/authErrors';
import { supabase } from '@/lib/supabase';
import { normalizePhone, isValidPhone } from '@/lib/phoneUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Mail, Lock, Loader2, Phone, CheckCircle, ArrowLeft } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface AuthPageProps {
  mode?: 'login' | 'register';
}

// Constants
const PASSWORD_MIN_LENGTH = 8;

export default function AuthPage({ mode = 'login' }: AuthPageProps) {
  const { t, isRTL } = useLanguage();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from || '/';

  // Tab state
  const [activeTab, setActiveTab] = useState<'phone' | 'email'>('phone');

  // Phone OTP state
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'verify'>('phone');
  const [requestId, setRequestId] = useState(''); // Store Vonage Verify requestId
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [phoneMessage, setPhoneMessage] = useState('');

  // Email state
  const [emailMode, setEmailMode] = useState<'login' | 'signup'>(mode === 'register' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Phone OTP handlers
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    setPhoneMessage('');

    // Validate phone number
    if (!isValidPhone(phone)) {
      setPhoneError(
        isRTL
          ? 'رقم الهاتف غير صالح. استخدم التنسيق الصحيح'
          : 'Numéro de téléphone invalide. Utilisez le bon format'
      );
      return;
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      setPhoneError(
        isRTL
          ? 'تعذر تنسيق رقم الهاتف'
          : 'Impossible de formater le numéro de téléphone'
      );
      return;
    }

    setPhoneLoading(true);

    try {
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

      // Store the requestId from Vonage Verify
      setRequestId(data.requestId);
      setPhoneMessage(t('auth.codeSent'));
      setOtpStep('verify');
      setPhone(normalizedPhone); // Store normalized phone
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to send OTP';
      setPhoneError(translateAuthError(new Error(errorMsg), isRTL));
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    setPhoneMessage('');

    if (otpCode.length !== 6) {
      setPhoneError(
        isRTL
          ? 'أدخل رمز مكون من 6 أرقام'
          : 'Entrez un code à 6 chiffres'
      );
      return;
    }

    setPhoneLoading(true);

    try {
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
      // The backend should have created/updated the user and created a Supabase session
      // Refresh the session to get the current user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error after OTP verification:', sessionError);
        throw new Error('Failed to establish session');
      }

      // Note: If no session exists after OTP verification, the backend may be using
      // a different auth strategy (e.g., custom JWT tokens). In that case, the redirect
      // will proceed and the AuthContext will handle authentication state.

      console.log('✅ OTP verification successful, redirecting to:', from);
      
      // Scroll to top on navigation
      window.scrollTo(0, 0);
      navigate(from, { replace: true });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : t('auth.invalidCode');
      setPhoneError(translateAuthError(new Error(errorMsg), isRTL));
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setPhoneError('');
    setPhoneMessage('');
    setPhoneLoading(true);

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
      setRequestId(data.requestId);
      setPhoneMessage(t('auth.codeSent'));
      setOtpCode(''); // Clear the OTP input
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to resend OTP';
      setPhoneError(translateAuthError(new Error(errorMsg), isRTL));
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setOtpStep('phone');
    setOtpCode('');
    setRequestId('');
    setPhoneError('');
    setPhoneMessage('');
  };

  // Email handlers
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError('');

    try {
      if (emailMode === 'signup') {
        // Validate passwords match
        if (password !== confirmPassword) {
          setEmailError(isRTL ? 'كلمات المرور غير متطابقة' : 'Les mots de passe ne correspondent pas');
          setEmailLoading(false);
          return;
        }

        // Validate password length
        if (password.length < PASSWORD_MIN_LENGTH) {
          setEmailError(
            isRTL
              ? `كلمة المرور يجب أن تكون ${PASSWORD_MIN_LENGTH} أحرف على الأقل`
              : `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères`
          );
          setEmailLoading(false);
          return;
        }

        const { error: signUpError } = await signUp(email, password);

        if (signUpError) {
          setEmailError(translateAuthError(signUpError, isRTL));
          setEmailLoading(false);
          return;
        }

        setEmailSuccess(true);
        setEmailLoading(false);
      } else {
        // Login
        const { error: signInError } = await signIn(email, password);

        if (signInError) {
          setEmailError(translateAuthError(signInError, isRTL));
          setEmailLoading(false);
          return;
        }

        console.log('✅ Email login successful, redirecting to:', from);
        
        // Scroll to top on navigation
        window.scrollTo(0, 0);
        navigate(from, { replace: true });
      }
    } catch (err) {
      setEmailError(translateAuthError(err as Error, isRTL));
      setEmailLoading(false);
    }
  };

  const toggleEmailMode = () => {
    setEmailMode(emailMode === 'login' ? 'signup' : 'login');
    setEmailError('');
    setConfirmPassword('');
  };

  return (
    <div className={`flex items-center justify-center py-12 px-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="w-full max-w-md">
        {emailSuccess ? (
          // Email signup success screen
          <div className="bg-white rounded-2xl border p-8 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
              {t('auth.accountCreated')}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t('auth.checkEmail')}
            </p>
            <Button onClick={() => navigate('/login')} className="w-full">
              {isRTL ? 'الذهاب لتسجيل الدخول' : 'Aller à la connexion'}
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border p-6 sm:p-8 shadow-sm">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <Link to="/" className="inline-flex items-center gap-2 mb-4 sm:mb-6">
                <Building2 className="h-8 w-8 text-primary" />
                <span className="font-display text-xl font-semibold">
                  TopAffaire<span className="text-primary">Immo</span>
                </span>
              </Link>
              <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
                {mode === 'register' ? t('auth.register') : t('auth.login')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? mode === 'register'
                    ? 'أنشئ حسابك للوصول إلى المنصة'
                    : 'سجل الدخول إلى حسابك'
                  : mode === 'register'
                  ? 'Créez votre compte pour accéder à la plateforme'
                  : 'Connectez-vous à votre compte'}
              </p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'phone' | 'email')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="phone">{t('auth.phoneTab')}</TabsTrigger>
                <TabsTrigger value="email">{t('auth.emailTab')}</TabsTrigger>
              </TabsList>

              {/* Phone OTP Tab */}
              <TabsContent value="phone" className="space-y-4">
                {otpStep === 'phone' ? (
                  <form onSubmit={handleRequestOTP} className="space-y-4">
                    {phoneError && (
                      <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                        {phoneError}
                      </div>
                    )}

                    {phoneMessage && (
                      <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm text-center">
                        {phoneMessage}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('auth.phoneNumber')}</Label>
                      <div className="relative">
                        <Phone
                          className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`}
                        />
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={`${isRTL ? 'pr-10' : 'pl-10'} h-12`}
                          placeholder={t('auth.phonePlaceholder')}
                          required
                          disabled={phoneLoading}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{t('auth.phoneHint')}</p>
                    </div>

                    <Button type="submit" className="w-full h-12" disabled={phoneLoading}>
                      {phoneLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          {t('auth.sendingCode')}
                        </>
                      ) : (
                        t('auth.sendCode')
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    {phoneError && (
                      <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                        {phoneError}
                      </div>
                    )}

                    {phoneMessage && (
                      <div className="p-3 rounded-lg bg-green-50 text-green-600 text-sm text-center">
                        {phoneMessage}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="otp">{t('auth.otpCode')}</Label>
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={otpCode}
                          onChange={setOtpCode}
                          disabled={phoneLoading}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">{t('auth.otpHint')}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBackToPhone}
                        disabled={phoneLoading}
                        className="flex-1"
                      >
                        <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180 ml-2' : 'mr-2'}`} />
                        {t('auth.backToPhone')}
                      </Button>
                      <Button type="submit" disabled={phoneLoading || otpCode.length !== 6} className="flex-1">
                        {phoneLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            {t('auth.verifying')}
                          </>
                        ) : (
                          t('auth.verifyCode')
                        )}
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="link"
                      onClick={handleResendOTP}
                      disabled={phoneLoading}
                      className="w-full text-sm"
                    >
                      {t('auth.resendCode')}
                    </Button>
                  </form>
                )}
              </TabsContent>

              {/* Email Tab */}
              <TabsContent value="email" className="space-y-4">
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  {emailError && (
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                      {emailError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">{t('auth.email')}</Label>
                    <div className="relative">
                      <Mail
                        className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`}
                      />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`${isRTL ? 'pr-10' : 'pl-10'} h-12`}
                        placeholder="email@example.com"
                        required
                        disabled={emailLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Lock
                        className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`}
                      />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${isRTL ? 'pr-10' : 'pl-10'} h-12`}
                        placeholder="••••••••"
                        required
                        disabled={emailLoading}
                      />
                    </div>
                    {emailMode === 'signup' && (
                      <p className="text-xs text-muted-foreground">
                        {isRTL ? `${PASSWORD_MIN_LENGTH} أحرف على الأقل` : `Au moins ${PASSWORD_MIN_LENGTH} caractères`}
                      </p>
                    )}
                  </div>

                  {emailMode === 'signup' && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                      <div className="relative">
                        <Lock
                          className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`}
                        />
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`${isRTL ? 'pr-10' : 'pl-10'} h-12`}
                          placeholder="••••••••"
                          required
                          disabled={emailLoading}
                        />
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full h-12" disabled={emailLoading}>
                    {emailLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : emailMode === 'signup' ? (
                      t('auth.registerButton')
                    ) : (
                      t('auth.loginButton')
                    )}
                  </Button>

                  {/* Toggle login/signup */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={toggleEmailMode}
                      className="text-sm text-primary hover:underline"
                    >
                      {emailMode === 'login'
                        ? isRTL
                          ? 'ليس لديك حساب؟ إنشاء حساب'
                          : 'Pas de compte ? Créer un compte'
                        : isRTL
                        ? 'لديك حساب؟ تسجيل الدخول'
                        : 'Déjà un compte ? Se connecter'}
                    </button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>

            {/* Footer - only show for login mode */}
            {mode === 'login' && (
              <div className="mt-6 text-center text-sm text-muted-foreground">
                {t('auth.noAccount')}{' '}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  {t('auth.register')}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
