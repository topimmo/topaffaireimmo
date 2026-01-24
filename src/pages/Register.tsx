import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { translateAuthError } from '@/lib/authErrors';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Mail, Lock, User, Phone, Briefcase, Loader2, CheckCircle } from 'lucide-react';

export default function Register() {
  const { t, isRTL } = useLanguage();
  const { signUp } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    companyName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 REGISTER FORM SUBMITTED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Form data:')
    console.log('  - Email:', formData.email)
    console.log('  - Full Name:', formData.fullName)
    console.log('  - Phone:', formData.phone || '(not provided)')
    console.log('  - Company Name:', formData.companyName || '(not provided)')

    // Validation: Check passwords match
    if (formData.password !== formData.confirmPassword) {
      console.error('❌ Validation failed: Passwords do not match')
      setError(isRTL ? 'كلمات المرور غير متطابقة' : 'Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    // Validation: Check password length
    if (formData.password.length < 6) {
      console.error('❌ Validation failed: Password too short')
      setError(isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Le mot de passe doit contenir au moins 6 caractères');
      setLoading(false);
      return;
    }

    console.log('✅ Form validation passed')
    console.log('Calling AuthContext.signUp()...')

    try {
      const { error: signUpError } = await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phone,
        'real_estate_advertiser',
        formData.companyName
      );

      if (signUpError) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('❌ REGISTER PAGE: Signup returned error')
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('Error object:', signUpError)
        console.error('Error message:', signUpError.message)
        // Use centralized error translation
        const translatedError = translateAuthError(signUpError, isRTL)
        console.error('Translated error:', translatedError)
        setError(translatedError);
        setLoading(false);
        return;
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('✅ REGISTER PAGE: Signup completed successfully')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('Showing success screen to user')
      console.log('User should check email for confirmation link')
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ UNEXPECTED ERROR during registration')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('Exception:', err)
      console.error('Exception type:', typeof err)
      console.error('Exception details:', JSON.stringify(err, null, 2))
      setError(translateAuthError(err as Error, isRTL));
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      <Header />
      
      <main className="flex-1 flex items-center justify-center pt-20 pb-16 px-4">
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
                    ? 'أنشئ حسابك لنشر إعلانات عقارية مجانية'
                    : 'Créez votre compte pour publier des annonces immobilières gratuites'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                    {error}
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
                      className={`${isRTL ? 'pr-10' : 'pl-10'} h-11 sm:h-12`}
                      placeholder={isRTL ? 'الاسم الكامل' : 'Nom complet'}
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
                      className={`${isRTL ? 'pr-10' : 'pl-10'} h-11 sm:h-12`}
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('auth.phone')} ({isRTL ? 'اختياري' : 'optionnel'})</Label>
                  <div className="relative">
                    <Phone className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`${isRTL ? 'pr-10' : 'pl-10'} h-11 sm:h-12`}
                      placeholder="+212 6XX XXX XXX"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    {isRTL ? 'اسم الشركة / الوكالة' : 'Nom de l\'entreprise / agence'} ({isRTL ? 'اختياري' : 'optionnel'})
                  </Label>
                  <div className="relative">
                    <Briefcase className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                    <Input
                      id="companyName"
                      name="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={handleChange}
                      className={`${isRTL ? 'pr-10' : 'pl-10'} h-11 sm:h-12`}
                      placeholder={isRTL ? 'اسم الوكالة' : 'Nom de l\'agence'}
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
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11 sm:h-12 mt-6" disabled={loading}>
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
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
