import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Plus,
  Image as ImageIcon,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Eye,
  Upload,
  CreditCard,
  Building,
  Calendar,
  DollarSign,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BannerSlot {
  id: number;
  code: string;
  name_fr: string;
  name_ar: string;
  page: string;
  position: string;
  size: string;
  price_per_day: number;
  price_per_week: number | null;
  price_per_month: number | null;
  is_active: boolean;
}

interface BannerRequest {
  id: string;
  slot_id: number;
  slot: BannerSlot;
  company_name: string;
  contact_email: string;
  contact_phone: string | null;
  duration_days: number;
  price: number;
  banner_image_url: string;
  target_url: string;
  alt_text_fr: string | null;
  alt_text_ar: string | null;
  payment_proof_url: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  status: string;
  admin_notes: string | null;
  start_date: string | null;
  end_date: string | null;
  impressions: number;
  clicks: number;
  created_at: string;
}

const content = {
  fr: {
    title: 'Mon Espace Publicitaire',
    subtitle: 'Gérez vos campagnes publicitaires',
    createNew: 'Nouvelle Campagne',
    myRequests: 'Mes Demandes',
    pending: 'En Attente',
    approved: 'Approuvées',
    active: 'Actives',
    rejected: 'Refusées',
    expired: 'Expirées',
    all: 'Toutes',
    noRequests: 'Aucune demande',
    noRequestsDesc: 'Créez votre première campagne publicitaire',
    bannerSlot: 'Emplacement',
    duration: 'Durée',
    price: 'Prix',
    status: 'Statut',
    impressions: 'Impressions',
    clicks: 'Clics',
    days: 'jours',
    viewBanner: 'Voir la bannière',
    viewPayment: 'Voir le reçu',
    createCampaign: 'Créer une campagne',
    selectSlot: 'Choisir un emplacement',
    selectDuration: 'Choisir la durée',
    companyName: 'Nom de l\'entreprise *',
    contactEmail: 'Email de contact *',
    contactPhone: 'Téléphone',
    bannerImage: 'Image de la bannière *',
    targetUrl: 'URL de destination *',
    uploadImage: 'Télécharger l\'image',
    paymentInfo: 'Informations de paiement',
    bankDetails: 'Coordonnées bancaires',
    bankName: 'Banque: Attijariwafa Bank',
    rib: 'RIB: 007 640 0000000000000000 00',
    accountName: 'Titulaire: TopAffaireImmo SARL',
    uploadReceipt: 'Télécharger le reçu de paiement',
    paymentMethod: 'Méthode de paiement',
    paymentReference: 'Référence du paiement',
    submit: 'Soumettre la demande',
    submitting: 'Soumission...',
    successTitle: 'Demande soumise !',
    successDesc: 'Votre demande sera examinée par notre équipe. Vous serez notifié par email.',
    pricing: 'Tarification',
    perDay: '/jour',
    perWeek: '/semaine',
    perMonth: '/mois',
    slot7days: '7 jours',
    slot15days: '15 jours',
    slot30days: '30 jours',
    selectImage: 'Sélectionner une image',
    imageRequirements: 'Format: JPG, PNG ou GIF. Taille max: 2MB.',
    notCommercialAdvertiser: 'Ce tableau de bord est réservé aux annonceurs commerciaux.',
    registerAsCommercial: 'S\'inscrire comme annonceur commercial',
  },
  ar: {
    title: 'مساحتي الإعلانية',
    subtitle: 'إدارة حملاتك الإعلانية',
    createNew: 'حملة جديدة',
    myRequests: 'طلباتي',
    pending: 'قيد الانتظار',
    approved: 'موافق عليها',
    active: 'نشطة',
    rejected: 'مرفوضة',
    expired: 'منتهية',
    all: 'الكل',
    noRequests: 'لا توجد طلبات',
    noRequestsDesc: 'أنشئ حملتك الإعلانية الأولى',
    bannerSlot: 'الموقع',
    duration: 'المدة',
    price: 'السعر',
    status: 'الحالة',
    impressions: 'المشاهدات',
    clicks: 'النقرات',
    days: 'يوم',
    viewBanner: 'عرض البانر',
    viewPayment: 'عرض الإيصال',
    createCampaign: 'إنشاء حملة',
    selectSlot: 'اختر موقع الإعلان',
    selectDuration: 'اختر المدة',
    companyName: 'اسم الشركة *',
    contactEmail: 'البريد الإلكتروني *',
    contactPhone: 'الهاتف',
    bannerImage: 'صورة البانر *',
    targetUrl: 'رابط الوجهة *',
    uploadImage: 'تحميل الصورة',
    paymentInfo: 'معلومات الدفع',
    bankDetails: 'تفاصيل الحساب البنكي',
    bankName: 'البنك: التجاري وفا بنك',
    rib: 'RIB: 007 640 0000000000000000 00',
    accountName: 'صاحب الحساب: TopAffaireImmo SARL',
    uploadReceipt: 'تحميل إيصال الدفع',
    paymentMethod: 'طريقة الدفع',
    paymentReference: 'مرجع الدفع',
    submit: 'إرسال الطلب',
    submitting: 'جاري الإرسال...',
    successTitle: 'تم إرسال الطلب!',
    successDesc: 'سيتم مراجعة طلبك من قبل فريقنا. ستتلقى إشعاراً بالبريد الإلكتروني.',
    pricing: 'التسعير',
    perDay: '/يوم',
    perWeek: '/أسبوع',
    perMonth: '/شهر',
    slot7days: '7 أيام',
    slot15days: '15 يوم',
    slot30days: '30 يوم',
    selectImage: 'اختر صورة',
    imageRequirements: 'الصيغة: JPG أو PNG أو GIF. الحجم الأقصى: 2 ميغابايت.',
    notCommercialAdvertiser: 'لوحة التحكم هذه مخصصة للمعلنين التجاريين.',
    registerAsCommercial: 'التسجيل كمعلن تجاري',
  },
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  approved: CheckCircle,
  active: CheckCircle,
  rejected: XCircle,
  expired: AlertCircle,
  cancelled: XCircle,
};

export default function CommercialDashboard() {
  const { language, isRTL } = useLanguage();
  const c = content[language];
  const { user, profile, loading: authLoading, profileLoading } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<BannerRequest[]>([]);
  const [slots, setSlots] = useState<BannerSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    slot_id: '',
    duration_days: '7',
    company_name: '',
    contact_email: '',
    contact_phone: '',
    target_url: '',
    payment_method: 'bank_transfer',
    payment_reference: '',
  });
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !profileLoading && !user) {
      navigate('/login', { state: { from: '/commercial-dashboard' } });
    }
    // Redirect real estate advertisers to their dashboard
    if (!authLoading && !profileLoading && profile && profile.user_role === 'real_estate_advertiser') {
      navigate('/dashboard');
    }
  }, [user, authLoading, profileLoading, navigate, profile]);

  useEffect(() => {
    if (user && profile) {
      fetchData();
    }
  }, [user, profile]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch banner slots
    const { data: slotsData } = await supabase
      .from('banner_slots')
      .select('*')
      .eq('is_active', true)
      .order('id');
    
    if (slotsData) setSlots(slotsData);

    // Fetch user's banner requests
    const { data: requestsData } = await supabase
      .from('banner_requests')
      .select(`
        *,
        slot:banner_slots(*)
      `)
      .eq('advertiser_id', user!.id)
      .order('created_at', { ascending: false });

    if (requestsData) setRequests(requestsData as unknown as BannerRequest[]);
    
    setLoading(false);
  };

  const calculatePrice = () => {
    const slot = slots.find(s => s.id.toString() === formData.slot_id);
    if (!slot) return 0;

    const days = parseInt(formData.duration_days);
    if (days === 7) return slot.price_per_week || slot.price_per_day * 7;
    if (days === 30) return slot.price_per_month || slot.price_per_day * 30;
    return slot.price_per_day * days;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerImage || !user) return;

    setSubmitting(true);

    try {
      // Upload banner image
      const bannerExt = bannerImage.name.split('.').pop();
      const bannerPath = `${user.id}/${Date.now()}.${bannerExt}`;
      
      const { error: bannerError } = await supabase.storage
        .from('banner-images')
        .upload(bannerPath, bannerImage);

      if (bannerError) throw bannerError;

      const { data: bannerUrlData } = supabase.storage
        .from('banner-images')
        .getPublicUrl(bannerPath);

      // Upload payment receipt if provided
      let paymentReceiptUrl = null;
      if (paymentReceipt) {
        const receiptExt = paymentReceipt.name.split('.').pop();
        const receiptPath = `${user.id}/${Date.now()}_receipt.${receiptExt}`;
        
        const { error: receiptError } = await supabase.storage
          .from('payment-receipts')
          .upload(receiptPath, paymentReceipt);

        if (!receiptError) {
          const { data: receiptUrlData } = supabase.storage
            .from('payment-receipts')
            .getPublicUrl(receiptPath);
          paymentReceiptUrl = receiptUrlData.publicUrl;
        }
      }

      // Create banner request
      const { error: insertError } = await supabase
        .from('banner_requests')
        .insert({
          advertiser_id: user.id,
          slot_id: parseInt(formData.slot_id),
          company_name: formData.company_name,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone || null,
          duration_days: parseInt(formData.duration_days),
          price: calculatePrice(),
          banner_image_url: bannerUrlData.publicUrl,
          target_url: formData.target_url || null,
          payment_proof_url: paymentReceiptUrl,
          payment_method: formData.payment_method,
          payment_reference: formData.payment_reference || null,
          status: 'pending',
        });

      if (insertError) throw insertError;

      setSubmitSuccess(true);
      setTimeout(() => {
        setShowCreateModal(false);
        setSubmitSuccess(false);
        resetForm();
        fetchData();
      }, 2000);

    } catch (error) {
      console.error('Error submitting banner request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      slot_id: '',
      duration_days: '7',
      company_name: profile?.company_name || '',
      contact_email: profile?.email || '',
      contact_phone: '',
      target_url: '',
      payment_method: 'bank_transfer',
      payment_reference: '',
    });
    setBannerImage(null);
    setPaymentReceipt(null);
  };

  const filterByStatus = (status: string) => {
    if (status === 'all') return requests;
    return requests.filter(r => r.status === status);
  };

  const getSlotName = (slot: BannerSlot) => {
    return language === 'ar' ? slot.name_ar : slot.name_fr;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: c.pending,
      approved: c.approved,
      active: c.active,
      rejected: c.rejected,
      expired: c.expired,
      cancelled: c.rejected,
    };
    return labels[status] || status;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-MA');
  };

  // Check if user is a commercial advertiser
  const isCommercialAdvertiser = profile?.user_role === 'commercial_advertiser' || profile?.user_role === 'admin';

  if (authLoading || profileLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Show message if not a commercial advertiser
  if (!isCommercialAdvertiser) {
    return (
      <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="flex-1 pt-24 pb-16">
          <div className="container max-w-lg">
            <div className="bg-white rounded-2xl border p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="font-display text-xl font-semibold mb-2">
                {c.notCommercialAdvertiser}
              </h2>
              <p className="text-muted-foreground mb-6">
                {language === 'ar' 
                  ? 'للوصول إلى هذه الصفحة، يجب أن يكون لديك حساب معلن تجاري.'
                  : 'Pour accéder à cette page, vous devez avoir un compte annonceur commercial.'}
              </p>
              <Button asChild>
                <Link to="/register?type=commercial">
                  {c.registerAsCommercial}
                </Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-6xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-semibold text-foreground">
                {c.title}
              </h1>
              <p className="text-muted-foreground mt-1">{c.subtitle}</p>
            </div>
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4" />
                  {c.createNew}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                {submitSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-display text-2xl font-semibold mb-2">{c.successTitle}</h3>
                    <p className="text-muted-foreground">{c.successDesc}</p>
                  </div>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle>{c.createCampaign}</DialogTitle>
                      <DialogDescription>
                        {language === 'ar' 
                          ? 'اختر موقع الإعلان والمدة ثم قم بتحميل البانر'
                          : 'Choisissez l\'emplacement et la durée, puis téléchargez votre bannière'}
                      </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                      {/* Slot Selection */}
                      <div className="space-y-2">
                        <Label>{c.selectSlot}</Label>
                        <Select 
                          value={formData.slot_id} 
                          onValueChange={(v) => setFormData(prev => ({ ...prev, slot_id: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={c.selectSlot} />
                          </SelectTrigger>
                          <SelectContent>
                            {slots.map((slot) => (
                              <SelectItem key={slot.id} value={slot.id.toString()}>
                                <div className="flex justify-between items-center gap-4 w-full">
                                  <span>{getSlotName(slot)}</span>
                                  <span className="text-muted-foreground text-sm">({slot.size})</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Pricing Info for Selected Slot */}
                      {formData.slot_id && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            {c.pricing}
                          </h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">{c.slot7days}</p>
                              <p className="font-semibold">
                                {formatPrice(slots.find(s => s.id.toString() === formData.slot_id)?.price_per_week || 0)} MAD
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">{c.slot15days}</p>
                              <p className="font-semibold">
                                {formatPrice((slots.find(s => s.id.toString() === formData.slot_id)?.price_per_day || 0) * 15)} MAD
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">{c.slot30days}</p>
                              <p className="font-semibold">
                                {formatPrice(slots.find(s => s.id.toString() === formData.slot_id)?.price_per_month || 0)} MAD
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Duration Selection */}
                      <div className="space-y-2">
                        <Label>{c.selectDuration}</Label>
                        <Select 
                          value={formData.duration_days} 
                          onValueChange={(v) => setFormData(prev => ({ ...prev, duration_days: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">{c.slot7days}</SelectItem>
                            <SelectItem value="15">{c.slot15days}</SelectItem>
                            <SelectItem value="30">{c.slot30days}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Company Info */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="company_name">{c.companyName}</Label>
                          <Input
                            id="company_name"
                            value={formData.company_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact_email">{c.contactEmail}</Label>
                          <Input
                            id="contact_email"
                            type="email"
                            value={formData.contact_email}
                            onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contact_phone">{c.contactPhone}</Label>
                        <Input
                          id="contact_phone"
                          value={formData.contact_phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                          dir="ltr"
                        />
                      </div>

                      {/* Banner Image Upload */}
                      <div className="space-y-2">
                        <Label>{c.bannerImage}</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 text-center">
                          {bannerImage ? (
                            <div className="space-y-2">
                              <img 
                                src={URL.createObjectURL(bannerImage)} 
                                alt="Banner preview" 
                                className="max-h-32 mx-auto rounded"
                              />
                              <p className="text-sm text-muted-foreground">{bannerImage.name}</p>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => setBannerImage(null)}
                              >
                                {language === 'ar' ? 'تغيير' : 'Changer'}
                              </Button>
                            </div>
                          ) : (
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                className="hidden"
                                onChange={(e) => setBannerImage(e.target.files?.[0] || null)}
                              />
                              <div className="flex flex-col items-center gap-2 py-4">
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <span className="text-sm text-primary font-medium">{c.selectImage}</span>
                                <span className="text-xs text-muted-foreground">{c.imageRequirements}</span>
                              </div>
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Target URL */}
                      <div className="space-y-2">
                        <Label htmlFor="target_url">{c.targetUrl}</Label>
                        <Input
                          id="target_url"
                          type="url"
                          placeholder="https://example.com"
                          value={formData.target_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, target_url: e.target.value }))}
                          dir="ltr"
                          required
                        />
                      </div>

                      {/* Payment Info */}
                      <div className="bg-primary/5 rounded-lg p-4 space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          {c.paymentInfo}
                        </h4>
                        
                        <div className="bg-white rounded-lg p-4 text-sm space-y-1">
                          <p className="font-medium">{c.bankDetails}</p>
                          <p>{c.bankName}</p>
                          <p className="font-mono">{c.rib}</p>
                          <p>{c.accountName}</p>
                        </div>

                        <div className="text-center py-2">
                          <p className="text-lg font-semibold text-primary">
                            {language === 'ar' ? 'المبلغ المطلوب: ' : 'Montant à payer: '}
                            {formatPrice(calculatePrice())} MAD
                          </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>{c.paymentMethod}</Label>
                            <Select 
                              value={formData.payment_method}
                              onValueChange={(v) => setFormData(prev => ({ ...prev, payment_method: v }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bank_transfer">
                                  {language === 'ar' ? 'تحويل بنكي' : 'Virement bancaire'}
                                </SelectItem>
                                <SelectItem value="cash">
                                  {language === 'ar' ? 'نقداً' : 'Espèces'}
                                </SelectItem>
                                <SelectItem value="mobile_payment">
                                  {language === 'ar' ? 'الدفع بالهاتف' : 'Paiement mobile'}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="payment_reference">{c.paymentReference}</Label>
                            <Input
                              id="payment_reference"
                              value={formData.payment_reference}
                              onChange={(e) => setFormData(prev => ({ ...prev, payment_reference: e.target.value }))}
                            />
                          </div>
                        </div>

                        {/* Payment Receipt Upload */}
                        <div className="space-y-2">
                          <Label>{c.uploadReceipt}</Label>
                          <div className="border-2 border-dashed rounded-lg p-4 text-center">
                            {paymentReceipt ? (
                              <div className="space-y-2">
                                <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                                <p className="text-sm text-muted-foreground">{paymentReceipt.name}</p>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setPaymentReceipt(null)}
                                >
                                  {language === 'ar' ? 'تغيير' : 'Changer'}
                                </Button>
                              </div>
                            ) : (
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,application/pdf"
                                  className="hidden"
                                  onChange={(e) => setPaymentReceipt(e.target.files?.[0] || null)}
                                />
                                <div className="flex flex-col items-center gap-2 py-4">
                                  <Upload className="h-8 w-8 text-muted-foreground" />
                                  <span className="text-sm text-primary font-medium">{c.uploadReceipt}</span>
                                </div>
                              </label>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={submitting || !bannerImage || !formData.slot_id}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {c.submitting}
                          </>
                        ) : (
                          c.submit
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabs for filtering */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">{c.all} ({requests.length})</TabsTrigger>
              <TabsTrigger value="pending">{c.pending} ({filterByStatus('pending').length})</TabsTrigger>
              <TabsTrigger value="active">{c.active} ({filterByStatus('active').length})</TabsTrigger>
              <TabsTrigger value="rejected">{c.rejected} ({filterByStatus('rejected').length})</TabsTrigger>
            </TabsList>

            {['all', 'pending', 'active', 'rejected'].map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-4">
                {filterByStatus(tab).length === 0 ? (
                  <div className="bg-white rounded-2xl border p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h2 className="font-display text-xl font-semibold mb-2">{c.noRequests}</h2>
                    <p className="text-muted-foreground mb-6">{c.noRequestsDesc}</p>
                    <Button onClick={() => { resetForm(); setShowCreateModal(true); }}>
                      <Plus className="h-4 w-4" />
                      {c.createNew}
                    </Button>
                  </div>
                ) : (
                  filterByStatus(tab).map((request) => {
                    const StatusIcon = statusIcons[request.status] || Clock;
                    return (
                      <div key={request.id} className="bg-white rounded-xl border p-4 sm:p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Banner Preview */}
                          <div 
                            className="w-full md:w-48 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer"
                            onClick={() => setPreviewUrl(request.banner_image_url)}
                          >
                            {request.banner_image_url ? (
                              <img
                                src={request.banner_image_url}
                                alt={request.company_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge 
                                variant="secondary"
                                className={cn('font-normal', statusColors[request.status])}
                              >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {getStatusLabel(request.status)}
                              </Badge>
                              <Badge variant="outline">
                                {request.duration_days} {c.days}
                              </Badge>
                              <Badge variant="outline">
                                {formatPrice(request.price)} MAD
                              </Badge>
                            </div>

                            <h3 className="font-semibold text-lg mb-1">{request.company_name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {getSlotName(request.slot)} ({request.slot.size})
                            </p>

                            {request.status === 'active' && (
                              <div className="flex gap-4 text-sm">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-4 w-4" />
                                  {request.impressions} {c.impressions}
                                </span>
                                <span className="flex items-center gap-1">
                                  <ExternalLink className="h-4 w-4" />
                                  {request.clicks} {c.clicks}
                                </span>
                              </div>
                            )}

                            {request.start_date && request.end_date && (
                              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(request.start_date)} - {formatDate(request.end_date)}
                              </p>
                            )}

                            {request.admin_notes && request.status === 'rejected' && (
                              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                                <Info className="h-4 w-4" />
                                {request.admin_notes}
                              </p>
                            )}

                            <p className="text-sm text-muted-foreground mt-2">
                              {language === 'ar' ? 'تاريخ الإنشاء: ' : 'Créé le: '}
                              {formatDate(request.created_at)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex md:flex-col gap-2">
                            <a
                              href={request.target_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1 text-sm text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {language === 'ar' ? 'الرابط' : 'Lien'}
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>

      {/* Preview Modal */}
      {previewUrl && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="max-w-full max-h-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <Footer />
    </div>
  );
}
