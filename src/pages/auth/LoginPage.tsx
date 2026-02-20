import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Mail, Lock, Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/** Maximum failed attempts before a timed lockout. */
const MAX_ATTEMPTS = 5;
/** Number of failed attempts that triggers the captcha placeholder. */
const CAPTCHA_THRESHOLD = 3;
/** Lockout duration in milliseconds (10 minutes). */
const LOCKOUT_DURATION_MS = 10 * 60 * 1000;
/** sessionStorage key for persisting attempt data across page refreshes. */
const ATTEMPTS_STORAGE_KEY = 'login_attempts';

interface AttemptData {
  count: number;
  lockedUntil: number | null;
}

function readAttemptData(): AttemptData {
  try {
    const raw = sessionStorage.getItem(ATTEMPTS_STORAGE_KEY);
    if (!raw) return { count: 0, lockedUntil: null };
    return JSON.parse(raw) as AttemptData;
  } catch {
    return { count: 0, lockedUntil: null };
  }
}

function writeAttemptData(data: AttemptData) {
  try {
    sessionStorage.setItem(ATTEMPTS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage unavailable – degrade gracefully
  }
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [attemptData, setAttemptData] = useState<AttemptData>(readAttemptData);
  const [lockoutSecondsLeft, setLockoutSecondsLeft] = useState(0);
  
  const { signIn, signInWithOAuth, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Countdown timer for lockout
  useEffect(() => {
    if (!attemptData.lockedUntil) return;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((attemptData.lockedUntil! - Date.now()) / 1000));
      setLockoutSecondsLeft(remaining);
      if (remaining === 0) {
        const reset: AttemptData = { count: 0, lockedUntil: null };
        setAttemptData(reset);
        writeAttemptData(reset);
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [attemptData.lockedUntil]);

  const isLocked = !!attemptData.lockedUntil && Date.now() < attemptData.lockedUntil;
  const showCaptchaPlaceholder = attemptData.count >= CAPTCHA_THRESHOLD && !isLocked;

  const formatLockout = (seconds: number) =>
    `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

  const recordFailedAttempt = () => {
    setAttemptData(prev => {
      const newCount = prev.count + 1;
      const lockedUntil = newCount >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_DURATION_MS : null;
      const next: AttemptData = { count: newCount, lockedUntil };
      writeAttemptData(next);
      return next;
    });
  };

  const resetAttempts = () => {
    const reset: AttemptData = { count: 0, lockedUntil: null };
    setAttemptData(reset);
    writeAttemptData(reset);
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email invalide';
    if (!password) newErrors.password = 'Le mot de passe est requis';
    else if (password.length < 6) newErrors.password = '6 caractères minimum';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) return; // Should be prevented by disabled button, but guard anyway

    if (!validate()) return;
    
    setIsLoading(true);
    setErrors({});

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        recordFailedAttempt();
        // Use a generic message to avoid leaking whether the email exists
        setErrors({ general: 'Email ou mot de passe incorrect' });
        setIsLoading(false);
        return;
      }

      resetAttempts();

      // Get the redirect path from location state or default based on role
      const from = (location.state as any)?.from?.pathname;
      
      // Wait a bit for profile to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect based on role
      if (from && from !== '/login') {
        navigate(from);
      } else {
        // Default redirect based on role will be handled in useEffect below
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      recordFailedAttempt();
      setErrors({ general: 'Une erreur est survenue. Veuillez réessayer.' });
      setIsLoading(false);
    }
  };

  // Handle OAuth login (Google, Facebook)
  const handleOAuthLogin = async (provider: 'google' | 'facebook') => {
    setIsOAuthLoading(true);
    setErrors({});

    try {
      const { error } = await signInWithOAuth(provider);
      
      if (error) {
        console.error(`[LoginPage] ${provider} OAuth error:`, error);
        toast.error(`Échec de la connexion avec ${provider === 'google' ? 'Google' : 'Facebook'}`);
        setIsOAuthLoading(false);
        return;
      }

      // Note: User will be redirected to OAuth provider
      // No need to navigate here - the browser will redirect
    } catch (error) {
      console.error(`[LoginPage] ${provider} OAuth exception:`, error);
      toast.error('Une erreur est survenue. Veuillez réessayer.');
      setIsOAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1F2E] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 noise-texture" />
      <div className="absolute top-20 left-10 w-96 h-96 bg-[#0FC2C0] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#0FC2C0] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0FC2C0] to-[#0A9D9B] flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="font-bold text-2xl text-white">
              TopAffaire<span className="text-[#0FC2C0]">Immo</span>
            </span>
          </Link>
        </div>

        <Card className="bg-[#1B2F3C] border-[#2A3F4C] shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Bienvenue</h1>
              <p className="text-gray-400">Connectez-vous à votre compte</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Lockout Banner */}
              {isLocked && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start space-x-3">
                  <ShieldAlert className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-400">Compte temporairement verrouillé</p>
                    <p className="text-xs text-red-400/80 mt-1">
                      Trop de tentatives échouées. Réessayez dans {formatLockout(lockoutSecondsLeft)}.
                    </p>
                  </div>
                </div>
              )}

              {/* General Error */}
              {errors.general && !isLocked && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-400">{errors.general}</p>
                    {attemptData.count >= CAPTCHA_THRESHOLD && (
                      <p className="text-xs text-amber-400 mt-1">
                        {MAX_ATTEMPTS - attemptData.count} tentative(s) restante(s) avant verrouillage.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 text-sm">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
                    placeholder="votre@email.com"
                    disabled={isLocked}
                    className={cn(
                      'pl-10 bg-[#0A1F2E] border-[#2A3F4C] text-white placeholder:text-gray-500 focus:border-[#0FC2C0] focus:ring-[#0FC2C0]',
                      errors.email && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    )}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-300 text-sm">Mot de passe</Label>
                  <Link to="/forgot-password" className="text-xs text-[#0FC2C0] hover:underline">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(p => ({ ...p, password: undefined })); }}
                    placeholder="••••••••"
                    disabled={isLocked}
                    className={cn(
                      'pl-10 pr-10 bg-[#0A1F2E] border-[#2A3F4C] text-white placeholder:text-gray-500 focus:border-[#0FC2C0] focus:ring-[#0FC2C0]',
                      errors.password && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
              </div>

              {/* Captcha placeholder – shown after CAPTCHA_THRESHOLD failures */}
              {showCaptchaPlaceholder && (
                <div className="border border-amber-500/30 bg-amber-500/10 rounded-lg p-3 flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5 text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-400">
                    Vérification de sécurité requise. Un captcha sera affiché ici en production.
                  </p>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isLoading || isLocked}
                className="w-full bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white font-semibold h-11 shadow-lg hover:shadow-xl transition-all disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connexion...
                  </>
                ) : isLocked ? (
                  `Verrouillé (${formatLockout(lockoutSecondsLeft)})`
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#2A3F4C]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#1B2F3C] px-3 text-gray-400">ou continuer avec</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                type="button"
                onClick={() => handleOAuthLogin('google')}
                disabled={isOAuthLoading || isLoading || isLocked}
                variant="outline" 
                className="border-[#2A3F4C] text-gray-300 hover:bg-[#0A1F2E] hover:text-white h-11"
              >
                {isOAuthLoading ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Google
              </Button>
              <Button 
                type="button"
                onClick={() => handleOAuthLogin('facebook')}
                disabled={isOAuthLoading || isLoading || isLocked}
                variant="outline" 
                className="border-[#2A3F4C] text-gray-300 hover:bg-[#0A1F2E] hover:text-white h-11"
              >
                {isOAuthLoading ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                )}
                Facebook
              </Button>
            </div>

            {/* Register Link */}
            <p className="text-center text-sm text-gray-400 mt-6">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-[#0FC2C0] font-medium hover:underline">
                Créer un compte
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
