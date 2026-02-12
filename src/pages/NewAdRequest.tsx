import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Upload,
  X,
  CheckCircle,
  Loader2,
  LogIn,
  Image as ImageIcon,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BannerSlot {
  id: number;
  name_en: string;
  name_fr: string;
  name_ar: string;
  page: string;
  position: string;
  size: string;
  description_en: string;
  description_fr: string;
  description_ar: string;
}

const pricing: Record<number, number> = {
  7: 800,
  15: 1400,
  30: 2500,
};

export default function NewAdRequest() {
  const { t, language, isRTL } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSlot = searchParams.get('slot');

  const [slots, setSlots] = useState<BannerSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const [paymentPreview, setPaymentPreview] = useState<string>('');
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [formData, setFormData] = useState({
    slotId: preselectedSlot || '',
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    durationDays: '',
    targetUrl: '',
  });

  // Fetch user profile
  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfileLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          const isRlsBlocked = error.code === '42501' || error.message?.toLowerCase().includes('permission');
          console.error('Error fetching profile:', error);
          if (isRlsBlocked) {
            toast.error(isRTL ? 'سياسة الأمان منعت تحميل ملفك الشخصي (RLS).' : 'RLS/policy blocked profiles.');
          }
        } else if (data) {
          setProfile(data);
          setFormData(prev => ({
            ...prev,
            contactEmail: data.email || '',
            contactPhone: data.phone || '',
          }));
        } else {
          // Auto-create missing profile with safe defaults
          const { data: created, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
              user_role: 'user', // Default role - user must explicitly upgrade
              google_id: user.user_metadata?.google_id || null,
            })
            .select('*')
            .single();

          if (createError) {
            console.error('Error auto-creating profile:', createError);
            const isRlsBlocked = createError.code === '42501';
            if (isRlsBlocked) {
              toast.error(isRTL ? 'سياسة الأمان منعت إنشاء ملفك الشخصي (RLS).' : 'RLS/policy blocked profiles.');
            }
          } else if (created) {
            setProfile(created);
            setFormData(prev => ({
              ...prev,
              contactEmail: created.email || '',
              contactPhone: created.phone || '',
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setProfileLoading(false);
      }
    }
    
    fetchProfile();
  }, [user]);

  useEffect(() => {
    fetchSlots();
  }, []);

  // Redirect real estate advertisers away from commercial advertising
  useEffect(() => {
    if (!authLoading && !profileLoading && profile && profile.user_role === 'real_estate_advertiser') {
      navigate('/dashboard');
    }
  }, [authLoading, profileLoading, profile, navigate]);

  const fetchSlots = async () => {
    const { data } = await supabase
      .from('banner_slots')
      .select('*')
      .eq('is_active', true);
    if (data) setSlots(data);
  };

  const getSlotName = (slot: BannerSlot) => {
    if (language === 'ar') return slot.name_ar;
    return slot.name_fr;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handlePaymentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentPreview(URL.createObjectURL(file));
    }
  };

  const removeBanner = () => setBannerPreview('');
  const removePayment = () => setPaymentPreview('');

  const getPrice = () => {
    if (!formData.durationDays) return 0;
    return pricing[parseInt(formData.durationDays)] || 0;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.slotId || !formData.durationDays) return;

    setIsSubmitting(true);

    const { error } = await supabase.from('banner_requests').insert({
      advertiser_id: user.id,
      slot_id: parseInt(formData.slotId),
      company_name: formData.companyName,
      contact_email: formData.contactEmail,
      contact_phone: formData.contactPhone || null,
      duration_days: parseInt(formData.durationDays),
      price: getPrice(),
      banner_image_url: bannerPreview,
      target_url: formData.targetUrl || null, // URL is now optional
      payment_proof_url: paymentPreview || null,
      status: 'pending',
    });

    setIsSubmitting(false);

    if (!error) {
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/advertising');
      }, 3000);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="flex-1 flex items-center justify-center pt-20 px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <LogIn className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground mb-4">
              {t('advertising.loginRequired')}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t('advertising.loginMessage')}
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link to="/login" state={{ from: '/advertising/new' }}>
                  {t('nav.login')}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/register">{t('nav.register')}</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center px-4">
            <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-secondary" />
            </div>
            <h1 className="font-display text-3xl font-semibold text-foreground mb-4">
              {t('advertising.requestSubmitted')}
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t('advertising.requestMessage')}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const selectedSlot = slots.find(s => s.id.toString() === formData.slotId);

  return (
    <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-3xl">
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link to="/advertising">
                <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                {t('common.back')}
              </Link>
            </Button>
          </div>

          <div className="text-center mb-10">
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
              {t('advertising.newRequest')}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {isRTL 
                ? 'املأ النموذج أدناه لإرسال طلب إعلان جديد'
                : 'Remplissez le formulaire ci-dessous pour soumettre une nouvelle demande publicitaire'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Company Info */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-display text-xl font-semibold mb-4">
                {isRTL ? 'معلومات الشركة' : 'Informations de l\'entreprise'}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyName">{t('advertising.companyName')} *</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">{t('advertising.contactEmail')} *</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">{t('advertising.contactPhone')}</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Slot Selection */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-display text-xl font-semibold mb-4">
                {t('advertising.selectSlot')}
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="slot">{t('advertising.slot')} *</Label>
                  <Select
                    value={formData.slotId}
                    onValueChange={(value) => handleSelectChange('slotId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('advertising.selectSlot')} />
                    </SelectTrigger>
                    <SelectContent>
                      {slots.map((slot) => (
                        <SelectItem key={slot.id} value={slot.id.toString()}>
                          {getSlotName(slot)} ({slot.size})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedSlot && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? selectedSlot.description_ar : selectedSlot.description_fr}
                    </p>
                    <p className="text-sm font-medium mt-2">
                      {t('advertising.size')}: {selectedSlot.size}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Duration & Price */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-display text-xl font-semibold mb-4">
                {t('advertising.duration')} & {t('advertising.price')}
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(pricing).map(([days, price]) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => handleSelectChange('durationDays', days)}
                      className={cn(
                        'p-4 rounded-lg border-2 transition-all text-center',
                        formData.durationDays === days
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-primary/30'
                      )}
                    >
                      <p className="font-display text-2xl font-semibold text-primary">
                        {days}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('advertising.days')}
                      </p>
                      <p className="font-mono-price font-bold mt-2">
                        {formatPrice(price)} MAD
                      </p>
                    </button>
                  ))}
                </div>

                {formData.durationDays && (
                  <div className="p-4 bg-primary/5 rounded-lg flex justify-between items-center">
                    <span className="font-semibold">{t('advertising.price')}:</span>
                    <span className="font-mono-price text-2xl font-bold text-primary">
                      {formatPrice(getPrice())} MAD
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Banner Upload */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-display text-xl font-semibold mb-4">
                {t('advertising.bannerImage')}
              </h2>
              <div className="space-y-4">
                {bannerPreview ? (
                  <div className="relative aspect-[728/90] rounded-lg overflow-hidden bg-muted">
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeBanner}
                      className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="aspect-[728/90] rounded-lg border-2 border-dashed border-muted hover:border-primary/30 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2">
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {t('advertising.uploadBanner')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {selectedSlot ? `${selectedSlot.size} - JPG, PNG, WebP` : 'JPG, PNG, WebP'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBannerUpload}
                    />
                  </label>
                )}

                <div className="space-y-2">
                  <Label htmlFor="targetUrl">
                    {t('advertising.targetUrl')} 
                    <span className="text-xs text-muted-foreground ml-2">
                      ({isRTL ? 'اختياري' : 'Optionnel'})
                    </span>
                  </Label>
                  <Input
                    id="targetUrl"
                    name="targetUrl"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.targetUrl}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    {isRTL 
                      ? 'يمكنك ترك هذا الحقل فارغًا إذا كنت تريد فقط عرض الصورة بدون رابط'
                      : 'Vous pouvez laisser ce champ vide si vous souhaitez afficher uniquement l\'image sans lien'}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Proof */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-display text-xl font-semibold mb-4">
                {t('advertising.paymentProof')}
              </h2>
              
              <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">{t('advertising.bankDetails')}</h4>
                <div className="bg-white rounded p-3 text-sm font-mono">
                  <p>IBAN: MA64 XXX XXXX XXXX XXXX XXXX XXX</p>
                  <p>BIC: XXXXXXXX</p>
                  <p>{isRTL ? 'المستفيد' : 'Bénéficiaire'}: TopAffaireImmo SARL</p>
                </div>
              </div>

              {paymentPreview ? (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted max-w-sm">
                  <img
                    src={paymentPreview}
                    alt="Payment proof"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removePayment}
                    className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="aspect-video max-w-sm rounded-lg border-2 border-dashed border-muted hover:border-primary/30 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2">
                  <CreditCard className="h-10 w-10 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {t('advertising.uploadPayment')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    JPG, PNG, PDF
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handlePaymentUpload}
                  />
                </label>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full text-base"
              disabled={isSubmitting || !bannerPreview || !formData.slotId || !formData.durationDays}
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                t('advertising.submitRequest')
              )}
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
