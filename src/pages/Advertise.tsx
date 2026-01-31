import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Megaphone, 
  Mail, 
  Phone, 
  User, 
  Briefcase, 
  MessageSquare, 
  Loader2, 
  CheckCircle,
  TrendingUp,
  Target,
  Award
} from 'lucide-react';

export default function Advertise() {
  const { t, isRTL } = useLanguage();
  
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    message: '',
    advertiserType: 'agency', // Default to agency
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Validate full_name
    if (!formData.fullName || formData.fullName.trim() === '') {
      errors.fullName = isRTL 
        ? 'الاسم الكامل مطلوب'
        : 'Le nom complet est requis';
    }
    
    // Validate email
    if (!formData.email || formData.email.trim() === '') {
      errors.email = isRTL 
        ? 'البريد الإلكتروني مطلوب'
        : 'L\'email est requis';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = isRTL 
          ? 'البريد الإلكتروني غير صالح'
          : 'L\'email n\'est pas valide';
      }
    }
    
    // Validate phone
    if (!formData.phone || formData.phone.trim() === '') {
      errors.phone = isRTL 
        ? 'رقم الهاتف مطلوب'
        : 'Le téléphone est requis';
    }
    
    // Validate message
    if (!formData.message || formData.message.trim() === '') {
      errors.message = isRTL 
        ? 'الرسالة مطلوبة'
        : 'Le message est requis';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError('');
    setValidationErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      // Ensure all required fields are sent and never null/undefined
      const { error: insertError } = await supabase
        .from('advertising_inquiries')
        .insert([
          {
            full_name: formData.fullName.trim(),
            company_name: formData.companyName.trim() || null,
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            message: formData.message.trim(),
            advertiser_type: formData.advertiserType || 'agency', // Always send, default to 'agency'
          }
        ]);

      if (insertError) {
        console.error('Failed to store inquiry:', insertError);
        throw insertError;
      }

      // Show success message
      setSuccess(true);
      
      // Reset form after success
      setFormData({
        fullName: '',
        companyName: '',
        email: '',
        phone: '',
        message: '',
        advertiserType: 'agency',
      });
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setError(isRTL 
        ? 'حدث خطأ. يرجى المحاولة مرة أخرى.'
        : 'Une erreur s\'est produite. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-5xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Megaphone className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-4">
          {isRTL ? 'أعلن معنا' : 'Annoncez avec nous'}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {isRTL 
            ? 'اكتشف فرص الإعلان على TopAffaireImmo - المنصة الرائدة للعقارات في المغرب'
            : 'Découvrez les opportunités publicitaires sur TopAffaireImmo - la plateforme immobilière leader au Maroc'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Features */}
            <div className="space-y-6">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-6">
                {isRTL ? 'لماذا تعلن معنا؟' : 'Pourquoi annoncer avec nous ?'}
              </h2>
              
              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {isRTL ? 'جمهور واسع ومستهدف' : 'Large audience ciblée'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isRTL 
                        ? 'اصل إلى آلاف الباحثين عن العقارات والمستثمرين يوميًا'
                        : 'Atteignez des milliers de chercheurs immobiliers et d\'investisseurs chaque jour'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {isRTL ? 'مواقع إعلانية استراتيجية' : 'Emplacements stratégiques'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isRTL 
                        ? 'بانرات على الصفحة الرئيسية، نتائج البحث، وصفحات التفاصيل'
                        : 'Bannières sur la page d\'accueil, résultats de recherche et pages de détails'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {isRTL ? 'شراكات مخصصة' : 'Partenariats personnalisés'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isRTL 
                        ? 'حلول إعلانية مخصصة تناسب احتياجات عملك'
                        : 'Solutions publicitaires sur mesure adaptées aux besoins de votre entreprise'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-6">
                <h3 className="font-semibold text-foreground mb-3">
                  {isRTL ? 'أنواع الإعلانات المتاحة:' : 'Types de publicités disponibles :'}
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {isRTL ? 'بانرات إعلانية (أحجام مختلفة)' : 'Bannières publicitaires (différentes tailles)'}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {isRTL ? 'قوائم مميزة' : 'Annonces en vedette'}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {isRTL ? 'رعاية محتوى' : 'Contenu sponsorisé'}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {isRTL ? 'شراكات استراتيجية' : 'Partenariats stratégiques'}
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl border p-6 sm:p-8 shadow-sm h-fit sticky top-24">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
                {isRTL ? 'تواصل معنا' : 'Contactez-nous'}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {isRTL 
                  ? 'املأ النموذج وسنتواصل معك خلال 24-48 ساعة'
                  : 'Remplissez le formulaire et nous vous contacterons sous 24-48h'}
              </p>

              {success && (
                <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-900">
                        {isRTL ? 'تم إرسال طلبك بنجاح!' : 'Demande envoyée avec succès!'}
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        {isRTL 
                          ? 'سنتواصل معك قريبًا'
                          : 'Nous vous contacterons bientôt'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    {isRTL ? 'الاسم الكامل' : 'Nom complet'} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`${isRTL ? 'pr-10' : 'pl-10'} h-11 ${validationErrors.fullName ? 'border-destructive' : ''}`}
                      placeholder={isRTL ? 'أحمد محمد' : 'Ahmed Mohammed'}
                      required
                    />
                  </div>
                  {validationErrors.fullName && (
                    <p className="text-sm text-destructive">{validationErrors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    {isRTL ? 'اسم الشركة' : 'Nom de l\'entreprise'} ({isRTL ? 'اختياري' : 'optionnel'})
                  </Label>
                  <div className="relative">
                    <Briefcase className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                    <Input
                      id="companyName"
                      name="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={handleChange}
                      className={`${isRTL ? 'pr-10' : 'pl-10'} h-11`}
                      placeholder={isRTL ? 'شركتك' : 'Votre entreprise'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    {isRTL ? 'البريد الإلكتروني' : 'Email'} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`${isRTL ? 'pr-10' : 'pl-10'} h-11 ${validationErrors.email ? 'border-destructive' : ''}`}
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="text-sm text-destructive">{validationErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {isRTL ? 'رقم الهاتف' : 'Téléphone'} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`${isRTL ? 'pr-10' : 'pl-10'} h-11 ${validationErrors.phone ? 'border-destructive' : ''}`}
                      placeholder="+212 6XX XXX XXX"
                      required
                    />
                  </div>
                  {validationErrors.phone && (
                    <p className="text-sm text-destructive">{validationErrors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">
                    {isRTL ? 'رسالتك' : 'Votre message'} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <MessageSquare className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-5 w-5 text-muted-foreground`} />
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      className={`${isRTL ? 'pr-10' : 'pl-10'} min-h-[120px] ${validationErrors.message ? 'border-destructive' : ''}`}
                      placeholder={isRTL 
                        ? 'أخبرنا عن احتياجاتك الإعلانية...'
                        : 'Parlez-nous de vos besoins publicitaires...'}
                      required
                    />
                  </div>
                  {validationErrors.message && (
                    <p className="text-sm text-destructive">{validationErrors.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full h-11 mt-6" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Mail className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {isRTL ? 'إرسال الطلب' : 'Envoyer la demande'}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  {isRTL 
                    ? 'سنقوم بمراجعة طلبك والتواصل معك في أقرب وقت ممكن'
                    : 'Nous examinerons votre demande et vous contacterons dans les plus brefs délais'}
                </p>
              </form>
            </div>
      </div>
    </div>
  );
}
