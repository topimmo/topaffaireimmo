import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { translateAuthError } from '@/lib/authErrors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Mail, Lock, Loader2, CheckCircle } from 'lucide-react';

export default function Register() {
  const { t, isRTL } = useLanguage();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  
  // Constants
  const RATE_LIMIT_COOLDOWN_SECONDS = 60;
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [rateLimitCooldownSeconds, setRateLimitCooldownSeconds] = useState(0);
  
  // Track last signup attempt to prevent duplicate requests
  const lastSignupAttempt = useRef<number>(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const cooldownInterval = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      if (cooldownInterval.current) {
        clearInterval(cooldownInterval.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Guard: Early return if already loading (prevents double submit)
    if (loading) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Signup already in progress, ignoring duplicate submission');
      }
      return;
    }
    
    // Guard: Check cooldown period
    if (rateLimitCooldownSeconds > 0) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Cooldown active, please wait before retrying');
      }
      return;
    }
    
    // Dev warning: Detect multiple requests within 2 seconds
    if (import.meta.env.DEV) {
      const now = Date.now();
      const timeSinceLastAttempt = now - lastSignupAttempt.current;
      if (timeSinceLastAttempt < 2000 && lastSignupAttempt.current > 0) {
        console.warn('⚠️ Multiple signup requests within 2 seconds detected!', {
          timeSinceLastAttempt: `${timeSinceLastAttempt}ms`,
          timestamp: new Date().toISOString()
        });
      }
      lastSignupAttempt.current = now;
    }
    
    // Clear any existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Set loading immediately for better UX feedback
    setLoading(true);
    
    // Debounce: Wait 600ms before making the actual request
    debounceTimer.current = setTimeout(async () => {
      setError('');

      // Validation: Check passwords match
      if (formData.password !== formData.confirmPassword) {
        setError(isRTL ? 'كلمات المرور غير متطابقة' : 'Les mots de passe ne correspondent pas');
        setLoading(false);
        return;
      }

      // Validation: Check password length
      if (formData.password.length < 6) {
        setError(isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Le mot de passe doit contenir au moins 6 caractères');
        setLoading(false);
        return;
      }

      try {
        const { error: signUpError } = await signUp(formData.email, formData.password);

        if (signUpError) {
          // Check if it's a 429 rate limit error
          const errorMessage = signUpError.message.toLowerCase();
          const errorStatus = (signUpError as any).status;
          // More specific detection: check status code first, then specific error patterns
          const is429Error = errorStatus === 429 || 
                            errorStatus === '429' ||
                            errorMessage.includes('429') || 
                            errorMessage.includes('rate limit exceeded') ||
                            errorMessage.includes('too many requests');
          
          if (is429Error) {
            // Clear any existing cooldown interval
            if (cooldownInterval.current) {
              clearInterval(cooldownInterval.current);
            }
            
            // Start cooldown for rate limit errors
            setRateLimitCooldownSeconds(RATE_LIMIT_COOLDOWN_SECONDS);
            cooldownInterval.current = setInterval(() => {
              setRateLimitCooldownSeconds(prev => {
                if (prev <= 1) {
                  if (cooldownInterval.current) {
                    clearInterval(cooldownInterval.current);
                    cooldownInterval.current = null;
                  }
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
            
            setError(
              isRTL 
                ? `طلبات كثيرة جداً. يرجى الانتظار ${RATE_LIMIT_COOLDOWN_SECONDS} ثانية قبل المحاولة مرة أخرى.`
                : `Trop de demandes. Veuillez patienter ${RATE_LIMIT_COOLDOWN_SECONDS} secondes avant de réessayer.`
            );
          } else {
            const translatedError = translateAuthError(signUpError, isRTL);
            setError(translatedError);
          }
          setLoading(false);
          return;
        }

        setSuccess(true);
        setLoading(false);
      } catch (err) {
        setError(translateAuthError(err as Error, isRTL));
        setLoading(false);
      }
    }, 600); // 600ms debounce
  };

  return (
    <div className={`flex items-center justify-center py-12 px-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="w-full max-w-md">
          {success ? (
            <div className="bg-white rounded-2xl border p-8 shadow-sm text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="font-display text-2xl font-semibold text-foreground mb-2">
                {isRTL ? 'تم إنشاء الحساب بنجاح!' : 'Compte créé avec succès!'}
              </h1>
              <p className="text-muted-foreground mb-6">
                {isRTL 
                  ? 'تحقق من بريدك الإلكتروني للحصول على رابط التأكيد'
                  : 'Vérifiez votre email pour le lien de confirmation'}
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
                  {t('auth.register')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isRTL 
                    ? 'أنشئ حسابك للوصول إلى المنصة'
                    : 'Créez votre compte pour accéder à la plateforme'}
                </p>
                
                {/* Error message under title - soft alert style */}
                {error && (
                  <div 
                    className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm"
                    role="alert"
                    aria-live="polite"
                  >
                    {error}
                    {rateLimitCooldownSeconds > 0 && (
                      <div className="mt-2 font-semibold" role="status" aria-live="polite">
                        {isRTL 
                          ? `الانتظار: ${rateLimitCooldownSeconds} ثانية`
                          : `Veuillez attendre: ${rateLimitCooldownSeconds}s`}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`${isRTL ? 'pr-10' : 'pl-10'} h-11 sm:h-12`}
                      placeholder="email@example.com"
                      required
                      disabled={loading || rateLimitCooldownSeconds > 0}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`${isRTL ? 'pr-10' : 'pl-10'} h-11 sm:h-12`}
                      placeholder="••••••••"
                      required
                      disabled={loading || rateLimitCooldownSeconds > 0}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? '6 أحرف على الأقل' : 'Au moins 6 caractères'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                  <div className="relative">
                    <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`${isRTL ? 'pr-10' : 'pl-10'} h-11 sm:h-12`}
                      placeholder="••••••••"
                      required
                      disabled={loading || rateLimitCooldownSeconds > 0}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 sm:h-12 mt-6" disabled={loading || rateLimitCooldownSeconds > 0}>
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : rateLimitCooldownSeconds > 0 ? (
                    `${isRTL ? 'انتظر' : 'Attendre'} ${rateLimitCooldownSeconds}s`
                  ) : (
                    t('auth.registerButton')
                  )}
                </Button>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center text-sm text-muted-foreground">
                {t('auth.haveAccount')}{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  {t('auth.login')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
