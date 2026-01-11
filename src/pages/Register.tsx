import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Mail, Lock, User, Phone, Loader2, CheckCircle, Home, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Register() {
  const { t, isRTL, language } = useLanguage();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [accountType, setAccountType] = useState<'real_estate' | 'commercial'>('real_estate');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    companyName: '',
  });

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'commercial') {
      setAccountType('commercial');
    }
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const userRole = accountType === 'commercial' ? 'commercial_advertiser' : 'real_estate_advertiser';
    
    const { error: signUpError } = await signUp(
      formData.email,
      formData.password,
      formData.fullName,
      formData.phone,
      userRole,
      accountType === 'commercial' ? formData.companyName : undefined
    );

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center px-4 max-w-md">
            <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
              <Mail className="h-10 w-10 text-secondary" />
            </div>
            <h1 className="font-display text-3xl font-semibold text-foreground mb-4">
              {isRTL ? 'تحقق من بريدك الإلكتروني' : 'Vérifiez votre email'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {isRTL 
                ? 'لقد أرسلنا رابط تأكيد إلى بريدك الإلكتروني. يرجى النقر على الرابط لتفعيل حسابك.'
                : 'Nous avons envoyé un lien de confirmation à votre adresse email. Veuillez cliquer sur le lien pour activer votre compte.'}
            </p>
            <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <p className="mb-2">
                {isRTL ? '💡 نصيحة:' : '💡 Conseil:'}
              </p>
              <p>
                {isRTL 
                  ? 'تحقق من مجلد البريد العشوائي إذا لم تجد الرسالة في صندوق الوارد.'
                  : 'Vérifiez votre dossier spam si vous ne trouvez pas l\'email dans votre boîte de réception.'}
              </p>
            </div>
            <Button asChild className="mt-6">
              <Link to="/login">
                {isRTL ? 'الذهاب إلى تسجيل الدخول' : 'Aller à la connexion'}
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
                {t('auth.register')}
              </h1>
            </div>

            {/* Account Type Selection */}
            <div className="mb-6">
              <Label className="mb-3 block">
                {language === 'ar' ? 'نوع الحساب' : 'Type de compte'}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType('real_estate')}
                  className={cn(
                    "p-4 rounded-xl border-2 text-center transition-all",
                    accountType === 'real_estate'
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <Home className={cn(
                    "h-6 w-6 mx-auto mb-2",
                    accountType === 'real_estate' ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    accountType === 'real_estate' ? "text-primary" : "text-foreground"
                  )}>
                    {language === 'ar' ? 'عقارات' : 'Immobilier'}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ar' ? 'نشر عقارات مجاناً' : 'Publier des annonces gratuites'}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('commercial')}
                  className={cn(
                    "p-4 rounded-xl border-2 text-center transition-all",
                    accountType === 'commercial'
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <Megaphone className={cn(
                    "h-6 w-6 mx-auto mb-2",
                    accountType === 'commercial' ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    accountType === 'commercial' ? "text-primary" : "text-foreground"
                  )}>
                    {language === 'ar' ? 'إعلانات تجارية' : 'Publicité'}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'ar' ? 'بانرات إعلانية' : 'Bannières publicitaires'}
                  </p>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                  {error}
                </div>
              )}

              {accountType === 'commercial' && (
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    {language === 'ar' ? 'اسم الشركة *' : 'Nom de l\'entreprise *'}
                  </Label>
                  <div className="relative">
                    <Building2 className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                    <Input
                      id="companyName"
                      name="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={handleChange}
                      className={`${isRTL ? 'pr-10' : 'pl-10'} h-12`}
                      required={accountType === 'commercial'}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">{t('auth.fullName')}</Label>
                <div className="relative">
                  <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`${isRTL ? 'pr-10' : 'pl-10'} h-12`}
                    required
                  />
                </div>
              </div>

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
                    className={`${isRTL ? 'pr-10' : 'pl-10'} h-12`}
                    placeholder="email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('auth.phone')}</Label>
                <div className="relative">
                  <Phone className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`${isRTL ? 'pr-10' : 'pl-10'} h-12`}
                    placeholder="+212 6XX XXX XXX"
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
                    className={`${isRTL ? 'pr-10' : 'pl-10'} h-12`}
                    placeholder="••••••••"
                    required
                  />
                </div>
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
