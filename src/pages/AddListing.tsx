import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { uploadPropertyImages, validateFiles, BUCKET_CONFIG } from '@/lib/storage';
import { normalizePhone, isValidPhone, getPhoneError } from '@/lib/phoneValidation';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Home,
  Building,
  Landmark,
  Trees,
  Store,
  Upload,
  X,
  CheckCircle,
  Loader2,
  LogIn,
  AlertCircle,
} from 'lucide-react';
import { cn, mapTransactionType } from '@/lib/utils';

interface City {
  id: number;
  name_fr: string;
  name_ar: string;
  is_active?: boolean;
}

interface Neighborhood {
  id: number;
  city_id: number;
  name_fr: string;
  name_ar: string;
}

const propertyTypes = [
  { value: 'apartment', icon: Building },
  { value: 'house', icon: Home },
  { value: 'villa', icon: Landmark },
  { value: 'commercial', icon: Store },
  { value: 'land', icon: Trees },
];

/**
 * Formats a database error into a user-friendly message
 */
function getErrorMessage(error: any, isRTL: boolean, isDev: boolean): string {
  let message = isRTL
    ? 'حدث خطأ أثناء إنشاء الإعلان.'
    : "Une erreur s'est produite lors de la création de l'annonce.";

  // Check for column doesn't exist error (42703)
  if (error.code === '42703' || (error.message?.includes('column') && error.message?.includes('does not exist'))) {
    message = isRTL
      ? 'خطأ في البيانات: حقل غير موجود في قاعدة البيانات.'
      : 'Erreur de données: colonne inexistante dans la base de données.';
  } else if (error.message?.includes('permission') || error.code === '42501') {
    message = isRTL
      ? 'ليس لديك صلاحية لإنشاء إعلان. تأكد من تسجيل الدخول كمعلن عقاري.'
      : "Vous n'avez pas la permission de créer une annonce. Assurez-vous d'être connecté en tant qu'annonceur immobilier.";
  } else if (error.message?.includes('violates') || error.code === '23503') {
    message = isRTL
      ? 'بيانات غير صالحة. يرجى التحقق من جميع الحقول.'
      : 'Données invalides. Veuillez vérifier tous les champs.';
  } else if (error.message?.includes('duplicate') || error.code === '23505') {
    message = isRTL ? 'هذا الإعلان موجود بالفعل.' : 'Cette annonce existe déjà.';
  } else if (error.message?.includes('not null') || error.code === '23502') {
    message = isRTL
      ? 'حقول مطلوبة مفقودة. يرجى ملء جميع الحقول المطلوبة.'
      : 'Champs requis manquants. Veuillez remplir tous les champs obligatoires.';
  }

  // Show comprehensive technical details in development mode
  if (isDev) {
    const details = [
      error.code && `Code: ${error.code}`,
      error.message && `Message: ${error.message}`,
      error.details && `Details: ${error.details}`,
      error.hint && `Hint: ${error.hint}`,
    ].filter(Boolean).join('\n');
    
    message += '\n\n[DEV MODE - Full Error Details]\n' + details;
  }

  return message;
}

// Toast duration for important error messages (in milliseconds)
const TOAST_ERROR_DURATION = 5000;

export default function AddListing() {
  const { t, language, isRTL } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [cities, setCities] = useState<City[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState<Neighborhood[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUploadStatus, setImageUploadStatus] = useState<
    ('pending' | 'uploading' | 'success' | 'error')[]
  >([]);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [showCustomNeighborhood, setShowCustomNeighborhood] = useState(false);
  const [submitAction, setSubmitAction] = useState<'draft' | 'pending'>('draft');
  
  // Field-level error states for inline validation
  const [fieldErrors, setFieldErrors] = useState<{
    phone?: string;
    whatsapp?: string;
    propertyType?: string;
    city?: string;
    price?: string;
    area?: string;
  }>({});

  const [formData, setFormData] = useState({
    transactionType: 'sale',
    propertyType: '',
    announcerType: 'proprietaire',
    cityId: '',
    neighborhoodId: '',
    customNeighborhood: '',
    address: '',
    price: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    titleFr: '',
    titleAr: '',
    descriptionFr: '',
    descriptionAr: '',
    phone: '',
    whatsapp: '',
    email: '',
    showPhonePublic: false,
    showWhatsappPublic: true,
    showEmailPublic: true,
    whatsappSameAsPhone: false,
  });

  useEffect(() => {
    fetchCities();
    fetchNeighborhoods();
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[AddListing] useEffect cityId changed:', { 
        cityId: formData.cityId, 
        neighborhoodsCount: neighborhoods.length 
      });
    }
    if (formData.cityId) {
      const filtered = neighborhoods.filter((n) => n.city_id === parseInt(formData.cityId));
      if (import.meta.env.DEV) {
        console.log('[AddListing] Filtered neighborhoods:', { 
          cityId: formData.cityId,
          filteredCount: filtered.length 
        });
      }
      setFilteredNeighborhoods(filtered);
      setFormData((prev) => ({ ...prev, neighborhoodId: '', customNeighborhood: '' }));
      setShowCustomNeighborhood(false);
    } else {
      setFilteredNeighborhoods([]);
    }
  }, [formData.cityId, neighborhoods]);

  const fetchCities = async () => {
    // Use fallback cities if Supabase is not configured
    if (!isSupabaseConfigured) {
      setCities([
        { id: 1, name_fr: 'Casablanca', name_ar: 'الدار البيضاء' },
        { id: 2, name_fr: 'Rabat', name_ar: 'الرباط' },
        { id: 3, name_fr: 'Marrakech', name_ar: 'مراكش' },
        { id: 4, name_fr: 'Tanger', name_ar: 'طنجة' },
        { id: 5, name_fr: 'Fès', name_ar: 'فاس' },
        { id: 6, name_fr: 'Agadir', name_ar: 'أكادير' },
        { id: 7, name_fr: 'Laâyoune', name_ar: 'العيون' },
        { id: 8, name_fr: 'Dakhla', name_ar: 'الداخلة' },
      ]);
      return;
    }

    const { data, error } = await supabase
      .from('cities')
      .select('id, name_fr, name_ar, is_active')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('Error fetching cities:', error);
      setCities([
        { id: 1, name_fr: 'Casablanca', name_ar: 'الدار البيضاء' },
        { id: 2, name_fr: 'Rabat', name_ar: 'الرباط' },
        { id: 3, name_fr: 'Marrakech', name_ar: 'مراكش' },
      ]);
      return;
    }

    if (data && data.length > 0) {
      setCities(data);
    } else {
      setCities([
        { id: 1, name_fr: 'Casablanca', name_ar: 'الدار البيضاء' },
        { id: 2, name_fr: 'Rabat', name_ar: 'الرباط' },
      ]);
    }
  };

  const fetchNeighborhoods = async () => {
    const { data } = await supabase.from('neighborhoods').select('*');
    if (data) setNeighborhoods(data);
  };

  const getCityName = (city: City) => {
    if (language === 'ar') return city.name_ar;
    return city.name_fr;
  };

  const getNeighborhoodName = (neighborhood: Neighborhood) => {
    if (language === 'ar') return neighborhood.name_ar;
    return neighborhood.name_fr;
  };

  const getPropertyTypeLabel = (value: string) => {
    return t(`property.${value}`);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user starts typing
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    
    // Special handling for phone field when "WhatsApp same as phone" is checked
    if (name === 'phone' && formData.whatsappSameAsPhone) {
      setFormData((prev) => ({ ...prev, phone: value, whatsapp: value }));
      // Also clear WhatsApp error if phone changes
      if (fieldErrors.whatsapp) {
        setFieldErrors((prev) => ({ ...prev, whatsapp: undefined }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Validate phone field on blur
  const handlePhoneBlur = () => {
    if (formData.phone && formData.phone.trim()) {
      if (!isValidPhone(formData.phone)) {
        const error = getPhoneError(formData.phone, isRTL);
        setFieldErrors((prev) => ({ ...prev, phone: error }));
      }
    }
  };

  // Validate WhatsApp field on blur
  const handleWhatsAppBlur = () => {
    if (formData.whatsapp && formData.whatsapp.trim()) {
      if (!isValidPhone(formData.whatsapp)) {
        const error = getPhoneError(formData.whatsapp, isRTL);
        setFieldErrors((prev) => ({ ...prev, whatsapp: error }));
      }
    }
  };

  // Handle WhatsApp same as phone checkbox
  const handleWhatsappSameAsPhone = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      whatsappSameAsPhone: checked,
      whatsapp: checked ? prev.phone : prev.whatsapp,
    }));
    // Clear WhatsApp error when syncing with phone
    if (checked && fieldErrors.whatsapp) {
      setFieldErrors((prev) => ({ ...prev, whatsapp: undefined }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (import.meta.env.DEV) {
      console.log('[AddListing] handleSelectChange:', { name, value, type: typeof value });
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNeighborhoodChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomNeighborhood(true);
      setFormData((prev) => ({ ...prev, neighborhoodId: '' }));
    } else {
      setShowCustomNeighborhood(false);
      setFormData((prev) => ({ ...prev, neighborhoodId: value, customNeighborhood: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (!user) {
      alert(isRTL ? 'يجب تسجيل الدخول لتحميل الصور' : 'Vous devez être connecté pour télécharger des images');
      e.target.value = '';
      return;
    }

    const filesArray = Array.from(files);
    const maxImages = 6;
    const remainingSlots = maxImages - uploadedImages.length;

    if (remainingSlots === 0) {
      alert(isRTL ? 'الحد الأقصى 6 صور مسموح به' : 'Maximum 6 images autorisées');
      e.target.value = '';
      return;
    }

    if (filesArray.length > remainingSlots) {
      alert(
        isRTL
          ? `يمكنك تحميل ${remainingSlots} صورة إضافية فقط`
          : `Vous ne pouvez ajouter que ${remainingSlots} image(s) supplémentaire(s)`
      );
      e.target.value = '';
      return;
    }

    const bucketConfig = BUCKET_CONFIG['property-images'];
    const validation = validateFiles(filesArray, {
      ...bucketConfig,
      maxCount: remainingSlots,
    });

    if (!validation.valid) {
      const errorMessage = validation.errors.join('\n');
      alert(
        isRTL
          ? `خطأ في الملفات المحددة:\n\n${errorMessage}`
          : `Erreur dans les fichiers sélectionnés:\n\n${errorMessage}`
      );
      e.target.value = '';
      return;
    }

    const newPreviews = validation.validFiles.map((file) => URL.createObjectURL(file));
    const newStatuses = validation.validFiles.map(() => 'pending' as const);

    setImageFiles((prev) => [...prev, ...validation.validFiles]);
    setUploadedImages((prev) => [...prev, ...newPreviews]);
    setImageUploadStatus((prev) => [...prev, ...newStatuses]);

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(uploadedImages[index]);
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImageUploadStatus((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // CRITICAL: Verify user authentication before allowing property creation
    // This prevents "user logged out" state during property creation
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      toast.error(
        isRTL 
          ? 'يجب تسجيل الدخول لإنشاء إعلان. يرجى تسجيل الدخول والمحاولة مرة أخرى.'
          : 'Vous devez être connecté pour créer une annonce. Veuillez vous connecter et réessayer.',
        { duration: TOAST_ERROR_DURATION }
      );
      // Redirect to login page
      navigate('/login');
      return;
    }

    // CRITICAL: Verify profile exists before allowing property creation
    // This prevents "user_id = null" errors in database queries
    // This is a defensive check in case AuthContext profile creation failed silently
    // or the user was created before this fix was deployed
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_role, advertiser_type, email, full_name')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (profileError) {
      const isRlsBlocked = profileError.code === '42501' || profileError.message?.toLowerCase().includes('permission');
      console.error('[AddListing] Error fetching user profile:', profileError);
      if (isRlsBlocked) {
        toast.error(
          isRTL
            ? 'سياسة الأمان منعت الوصول إلى ملفك الشخصي (RLS). يرجى الاتصال بالدعم.'
            : 'RLS/policy blocked profiles. Please contact support.',
          { duration: TOAST_ERROR_DURATION }
        );
        return;
      }
      toast.error(
        isRTL
          ? 'خطأ في تحميل ملفك الشخصي. يرجى المحاولة مرة أخرى.'
          : 'Erreur lors du chargement de votre profil. Veuillez réessayer.',
        { duration: TOAST_ERROR_DURATION }
      );
      return;
    }

    let profileRecord = userProfile;

    if (!profileRecord) {
      console.warn('[AddListing] ❌ CRITICAL: User authenticated but profile missing, attempting auto-create...', {
        userId: currentUser.id,
        email: currentUser.email,
        provider: currentUser.app_metadata?.provider,
      });
      
      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: currentUser.id,
          email: currentUser.email || '',
          full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || '',
          user_role: 'user', // Default role - permissions will be checked separately
          google_id: currentUser.user_metadata?.google_id || null,
        })
        .select('id, user_role, advertiser_type, email, full_name')
        .single();

      if (createError) {
        const isRlsBlocked = createError.code === '42501' || createError.message?.toLowerCase().includes('permission');
        console.error('[AddListing] Failed to auto-create profile', createError);
        toast.error(
          isRlsBlocked
            ? (isRTL ? 'سياسة الأمان منعت إنشاء ملفك الشخصي (RLS).' : 'RLS/policy blocked profiles. Please contact support.')
            : (isRTL ? 'تعذر إنشاء ملفك الشخصي تلقائياً. يرجى إعادة المحاولة.' : 'Unable to auto-create your profile. Please try again.'),
          { duration: TOAST_ERROR_DURATION }
        );
        return;
      }

      profileRecord = createdProfile;
      console.info('[AddListing] Auto-created missing profile', { userId: currentUser.id });
    }

    console.log('[AddListing] ✅ User and profile verified:', {
      userId: currentUser.id,
      userRole: profileRecord.user_role,
      advertiserType: profileRecord.advertiser_type,
    });

    // Log the entire form state for debugging
    if (import.meta.env.DEV) {
      console.log('[AddListing] Form submission started:', {
        formData: {
          ...formData,
          phone: formData.phone ? '[REDACTED]' : null
        }
        // User ID intentionally omitted for privacy
      });
    }

    // Reset field errors
    const errors: typeof fieldErrors = {};

    // Validate property type
    if (!formData.propertyType) {
      errors.propertyType = isRTL ? 'يرجى اختيار نوع العقار' : 'Veuillez sélectionner un type de bien';
    }

    // Strict validation for cityId - ensure it's not empty and is a valid integer
    if (!formData.cityId || isNaN(parseInt(formData.cityId))) {
      if (import.meta.env.DEV) {
        console.error('[AddListing] Validation failed: cityId is invalid', { 
          cityId: formData.cityId,
          parsedCityId: parseInt(formData.cityId)
        });
      }
      errors.city = isRTL ? 'يرجى اختيار المدينة' : 'Veuillez sélectionner une ville';
    }

    // Validate phone number with improved validation
    if (formData.phone && formData.phone.trim()) {
      if (!isValidPhone(formData.phone)) {
        errors.phone = getPhoneError(formData.phone, isRTL);
        if (!errors.phone) {
          errors.phone = isRTL 
            ? 'رقم الهاتف غير صالح. استخدم التنسيق: +212..., 06..., 07..., أو التنسيق الدولي'
            : 'Numéro invalide. Utilisez le format: +212..., 06..., 07..., ou format international';
        }
      }
    }

    // Validate WhatsApp number with improved validation
    if (formData.whatsapp && formData.whatsapp.trim()) {
      if (!isValidPhone(formData.whatsapp)) {
        errors.whatsapp = getPhoneError(formData.whatsapp, isRTL);
        if (!errors.whatsapp) {
          errors.whatsapp = isRTL 
            ? 'رقم واتساب غير صالح. استخدم التنسيق: +212..., 06..., 07..., أو التنسيق الدولي'
            : 'Numéro WhatsApp invalide. Utilisez le format: +212..., 06..., 07..., ou format international';
        }
      }
    }

    // Price validation: must be provided and > 0 (price is NOT NULL in DB)
    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.price = isRTL ? 'السعر مطلوب ويجب أن يكون أكبر من الصفر' : 'Le prix est requis et doit être supérieur à zéro';
    }

    // Area validation
    if (formData.area && parseFloat(formData.area) <= 0) {
      errors.area = isRTL ? 'المساحة يجب أن تكون أكبر من الصفر' : 'La surface doit être supérieure à zéro';
    }

    // If there are any validation errors, show them and stop submission
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      
      // Format error messages for toast
      const errorMessages = Object.values(errors).map(msg => msg.trim());
      const formattedErrors = errorMessages.join(' • '); // Use bullet separator
      
      // Show toast notification
      toast.error(
        isRTL 
          ? 'يرجى تصحيح الأخطاء المميزة في النموذج'
          : 'Veuillez corriger les erreurs surlignées dans le formulaire',
        {
          description: formattedErrors,
          duration: 5000,
        }
      );
      
      // Scroll to first error field - map error keys to actual input IDs
      const fieldIdMap: Record<string, string> = {
        phone: 'phone',
        whatsapp: 'whatsapp',
        propertyType: 'propertyType',
        city: 'cityId',
        price: 'price',
        area: 'area',
      };
      
      const firstErrorField = Object.keys(errors)[0];
      const inputId = fieldIdMap[firstErrorField];
      const errorElement = inputId ? document.getElementById(inputId) : null;
      
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Small delay before focusing to ensure scroll completes
        setTimeout(() => errorElement.focus(), 300);
      }
      
      return;
    }

    setIsSubmitting(true);
    setUploadProgress('');

    try {
      // TRANSACTIONAL APPROACH: Create listing first, then upload images
      // Step 1: Create property record with status='pending' (no images yet)
      setUploadProgress(isRTL ? 'جاري حفظ الإعلان...' : "Enregistrement de l'annonce...");

      // Parse cityId (validated above)
      const parsedCityId = parseInt(formData.cityId);

      // Map announcer type from French to English values for database
      const mapAnnouncerType = (type: string): string => {
        const mapping: Record<string, string> = {
          'proprietaire': 'owner',
          'courtier': 'broker',
          'agence': 'agency',
        };
        
        const mapped = mapping[type];
        if (!mapped && import.meta.env.DEV) {
          console.warn(`[AddListing] Unknown announcer type "${type}", defaulting to "owner"`);
        }
        
        return mapped || 'owner';
      };

      // Strict normalization: ensure neighborhood fields are properly typed and mutually exclusive
      const normalizedNeighborhoodId = formData.neighborhoodId && formData.neighborhoodId.trim() !== '' 
        ? parseInt(formData.neighborhoodId, 10) 
        : null;
      const normalizedCustomNeighborhood = formData.customNeighborhood && formData.customNeighborhood.trim() !== '' 
        ? formData.customNeighborhood.trim() 
        : null;

      // Ensure only ONE of neighborhood_id or custom_neighborhood is set
      const finalNeighborhoodId = normalizedCustomNeighborhood ? null : normalizedNeighborhoodId;
      const finalCustomNeighborhood = finalNeighborhoodId ? null : normalizedCustomNeighborhood;

      // Validate that finalNeighborhoodId is a valid number (not NaN) or null
      if (finalNeighborhoodId !== null && isNaN(finalNeighborhoodId)) {
        throw new Error(`Invalid neighborhood_id: '${formData.neighborhoodId}' is not a valid integer`);
      }

      // DEV logs for debugging
      if (import.meta.env.DEV) {
        console.log('[AddListing] Normalized neighborhood data:', {
          city_id: parsedCityId,
          neighborhood_id: finalNeighborhoodId,
          custom_neighborhood: finalCustomNeighborhood,
        });
      }

      const insertData: Record<string, unknown> = {
        owner_id: currentUser.id,
        created_by: currentUser.id, // Track original creator
        transaction_type: mapTransactionType(formData.transactionType || 'sale'),
        property_type: formData.propertyType,
        advertiser_type: mapAnnouncerType(formData.announcerType),
        city_id: parsedCityId,
        neighborhood_id: finalNeighborhoodId,
        custom_neighborhood: finalCustomNeighborhood,
        address: formData.address || null,
        price: parseFloat(formData.price), // Already validated above, must exist
        area: formData.area ? parseFloat(formData.area) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        // Only FR and AR titles/descriptions exist in schema (NO title_en or description_en)
        title_fr: formData.titleFr || 'Nouveau bien',
        title_ar: formData.titleAr || 'عقار جديد',
        description_fr: formData.descriptionFr || null,
        description_ar: formData.descriptionAr || null,
        images: [],
        // Contact fields with E.164 normalization using libphonenumber-js
        contact_phone: formData.phone ? normalizePhone(formData.phone) : null,
        contact_whatsapp: formData.whatsapp ? normalizePhone(formData.whatsapp) : null,
        contact_email: formData.email ? formData.email.trim() : null,
        // Visibility flags
        show_phone_public: formData.showPhonePublic,
        show_whatsapp_public: formData.showWhatsappPublic,
        show_email_public: formData.showEmailPublic,
        // Set status based on submit action: 'draft' or 'pending'
        status: submitAction,
      };

      // Log payload for debugging schema alignment issues
      console.log('[AddListing] 🔍 Pre-insert validation:');
      console.log('[AddListing] Payload keys:', Object.keys(insertData));
      console.log('[AddListing] Payload preview:', {
        owner_id: insertData.owner_id ? String(insertData.owner_id).substring(0, 8) + '...' : 'null',
        city_id: insertData.city_id,
        neighborhood_id: insertData.neighborhood_id,
        custom_neighborhood: insertData.custom_neighborhood,
        advertiser_type: insertData.advertiser_type,
        transaction_type: insertData.transaction_type,
        property_type: insertData.property_type,
      });

      // Log payload before insert - show full details in DEV mode
      if (import.meta.env.DEV) {
        console.log('[AddListing] Creating listing with full payload:', insertData);
        console.log('[AddListing] Payload field types:', {
          owner_id: typeof insertData.owner_id,
          transaction_type: typeof insertData.transaction_type,
          property_type: typeof insertData.property_type,
          advertiser_type: typeof insertData.advertiser_type,
          city_id: typeof insertData.city_id,
          neighborhood_id: typeof insertData.neighborhood_id,
          price: typeof insertData.price,
          area: typeof insertData.area,
          bedrooms: typeof insertData.bedrooms,
          bathrooms: typeof insertData.bathrooms,
        });
      } else {
        console.log('[AddListing] Creating listing with payload:', {
          ...insertData,
          owner_id: insertData.owner_id ? insertData.owner_id.toString().substring(0, 8) + '...' : 'null',
        });
      }

      const { data: insertedProperty, error: insertError } = await supabase
        .from('properties')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('[AddListing] ❌ SUPABASE INSERT FAILED:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        });
        
        // In DEV mode, show the full error object
        if (import.meta.env.DEV) {
          console.error('[AddListing] Full Supabase error object:', insertError);
          console.error('[AddListing] Payload that caused the error:', insertData);
          
          // Try to identify the problematic field
          if (insertError.message) {
            const msg = insertError.message.toLowerCase();
            if (msg.includes('column')) {
              const match = insertError.message.match(/column "([^"]+)"/i);
              if (match) {
                console.error(`[AddListing] ⚠️  Problematic column: "${match[1]}"`);
                console.error(`[AddListing] Value being sent: ${insertData[match[1]]}`);
              }
            }
          }
        }
        
        const errorMessage = getErrorMessage(insertError, isRTL, import.meta.env.DEV);
        throw new Error(errorMessage);
      }
      
      if (!insertedProperty) {
        console.error('[AddListing] ❌ No data returned after insert');
        throw new Error(isRTL ? 'خطأ في إنشاء الإعلان' : 'Error creating listing');
      }

      console.log('[AddListing] Listing created successfully:', {
        id: insertedProperty.id,
        status: insertedProperty.status,
      });

      // Step 2: Upload images to listings/{listingId}/ folder
      let imageUrls: string[] = [];

      if (imageFiles.length > 0) {
        setUploadProgress(
          isRTL
            ? `جاري تحميل الصور... (0/${imageFiles.length})`
            : `Téléchargement des images... (0/${imageFiles.length})`
        );

        const uploadResults: any[] = [];

        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];

          setImageUploadStatus((prev) => {
            const updated = [...prev];
            updated[i] = 'uploading';
            return updated;
          });

          setUploadProgress(
            isRTL
              ? `جاري تحميل الصور... (${i + 1}/${imageFiles.length})`
              : `Téléchargement des images... (${i + 1}/${imageFiles.length})`
          );

          console.log(`[AddListing] Uploading image ${i + 1}/${imageFiles.length}:`, {
            fileName: file.name,
            size: `${(file.size / 1024).toFixed(2)} KB`,
            listingId: insertedProperty.id,
          });

          const result = await uploadPropertyImages([file], currentUser.id, insertedProperty.id);
          uploadResults.push(result[0]);

          if (result[0].error) {
            console.error(`[AddListing] Failed to upload image ${i + 1}:`, {
              fileName: result[0].fileName,
              error: result[0].error,
            });
            setImageUploadStatus((prev) => {
              const updated = [...prev];
              updated[i] = 'error';
              return updated;
            });
          } else {
            console.log(`[AddListing] Image ${i + 1} uploaded successfully:`, {
              fileName: result[0].fileName,
              url: result[0].url && result[0].url.length > 50 
                ? result[0].url.substring(0, 50) + '...' 
                : result[0].url,
            });
            setImageUploadStatus((prev) => {
              const updated = [...prev];
              updated[i] = 'success';
              return updated;
            });
          }
        }

        const failedUploads = uploadResults.filter((r) => r.error);
        if (failedUploads.length > 0) {
          console.warn('[AddListing] Some images failed to upload:', {
            total: imageFiles.length,
            failed: failedUploads.length,
            succeeded: imageFiles.length - failedUploads.length,
          });

          const errorDetails = failedUploads
            .map((r, idx) => `${idx + 1}. ${r.fileName}: ${r.error}`)
            .join('\n');

          const message = isRTL
            ? `فشل تحميل ${failedUploads.length} صورة من ${imageFiles.length}.\n\nالأخطاء:\n${errorDetails}\n\nهل تريد المتابعة بالصور المتبقية؟`
            : `Échec du téléchargement de ${failedUploads.length} image(s) sur ${imageFiles.length}.\n\nErreurs:\n${errorDetails}\n\nVoulez-vous continuer avec les images restantes?`;

          const continueAnyway = window.confirm(message);
          if (!continueAnyway) {
            setIsSubmitting(false);
            setUploadProgress('');
            return;
          }
        }

        imageUrls = uploadResults.filter((r) => !r.error).map((r) => r.url);

        // Step 3: Update property with image URLs
        if (imageUrls.length > 0) {
          setUploadProgress(
            isRTL ? 'جاري تحديث الصور...' : 'Mise à jour des images...'
          );

          console.log('[AddListing] Updating listing with images:', {
            listingId: insertedProperty.id,
            imageCount: imageUrls.length,
          });

          const { error: updateError } = await supabase
            .from('properties')
            .update({ images: imageUrls })
            .eq('id', insertedProperty.id);

          if (updateError) {
            console.error('[AddListing] Failed to update listing with images:', {
              code: updateError.code,
              message: updateError.message,
            });
            // Don't throw - listing is created, just missing images
            alert(
              isRTL
                ? 'تم إنشاء الإعلان ولكن فشل تحديث الصور. يمكنك تعديل الإعلان لاحقاً لإضافة الصور.'
                : "L'annonce a été créée mais la mise à jour des images a échoué. Vous pouvez modifier l'annonce plus tard pour ajouter les images."
            );
          } else {
            console.log('[AddListing] Listing updated with images successfully');
          }
        }
      }

      uploadedImages.forEach((url) => URL.revokeObjectURL(url));

      console.log('[AddListing] Listing creation completed successfully:', {
        listingId: insertedProperty.id,
        imageCount: imageUrls.length,
      });

      setIsSuccess(true);
      
      // Show success toast
      toast.success(
        isRTL ? 'تم إنشاء الإعلان بنجاح!' : 'Annonce créée avec succès!',
        {
          description: isRTL 
            ? 'سيتم إعادة توجيهك إلى لوحة التحكم...'
            : 'Vous allez être redirigé vers le tableau de bord...',
          duration: 3000,
        }
      );
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err) {
      console.error('[AddListing] Error during submission:', err);
      const message =
        err instanceof Error
          ? err.message
          : isRTL
            ? 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
            : "Une erreur inattendue s'est produite. Veuillez réessayer.";
      
      // Show error toast instead of alert
      toast.error(
        isRTL ? 'فشل في إنشاء الإعلان' : 'Échec de la création de l\'annonce',
        {
          description: message,
          duration: 7000,
        }
      );
      
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  if (authLoading) {
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
              {t('addListing.loginRequired')}
            </h1>
            <p className="text-muted-foreground mb-6">
              {isRTL ? 'يجب تسجيل الدخول للوصول إلى هذه الصفحة' : 'Vous devez être connecté pour accéder à cette page'}
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link to="/login" state={{ from: '/add-listing' }}>
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
              {t('addListing.success')}
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t('addListing.successMessage')}
            </p>
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
        <div className="container max-w-3xl">
          <div className="text-center mb-10">
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
              {t('addListing.title')}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">{t('addListing.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-display text-xl font-semibold mb-4">{t('addListing.transactionType')}</h2>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => handleSelectChange('transactionType', 'sale')}
                  className={cn(
                    'flex-1 py-4 px-6 rounded-lg border-2 transition-all',
                    formData.transactionType === 'sale'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-muted hover:border-primary/30'
                  )}
                >
                  <p className="font-semibold">{t('hero.forSale')}</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectChange('transactionType', 'rent')}
                  className={cn(
                    'flex-1 py-4 px-6 rounded-lg border-2 transition-all',
                    formData.transactionType === 'rent'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-muted hover:border-primary/30'
                  )}
                >
                  <p className="font-semibold">{t('hero.forRent')}</p>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-display text-xl font-semibold mb-4">{t('addListing.propertyType')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {propertyTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleSelectChange('propertyType', type.value)}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-center',
                      formData.propertyType === type.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-muted hover:border-primary/30'
                    )}
                  >
                    <type.icon className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-sm font-medium">{getPropertyTypeLabel(type.value)}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-display text-xl font-semibold mb-4">
                {isRTL ? 'نوع المعلن' : "Type d'annonceur"}
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectChange('announcerType', 'proprietaire')}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all text-center',
                    formData.announcerType === 'proprietaire'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-muted hover:border-primary/30'
                  )}
                >
                  <Home className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">{isRTL ? 'مالك' : 'Propriétaire'}</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectChange('announcerType', 'courtier')}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all text-center',
                    formData.announcerType === 'courtier'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-muted hover:border-primary/30'
                  )}
                >
                  <Building className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">{isRTL ? 'سمسار' : 'Courtier'}</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectChange('announcerType', 'agence')}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all text-center',
                    formData.announcerType === 'agence'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-muted hover:border-primary/30'
                  )}
                >
                  <Store className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">{isRTL ? 'وكالة' : 'Agence'}</p>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-display text-xl font-semibold mb-4">
                {t('addListing.city')} & {t('addListing.neighborhood')}
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">{t('addListing.city')} *</Label>
                  <Select value={formData.cityId} onValueChange={(value) => handleSelectChange('cityId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('hero.selectCity')} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id.toString()}>
                          {getCityName(city)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neighborhood">{t('addListing.neighborhood')}</Label>
                  <Select
                    value={formData.neighborhoodId}
                    onValueChange={handleNeighborhoodChange}
                    disabled={!formData.cityId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('addListing.selectNeighborhood')} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredNeighborhoods.map((n) => (
                        <SelectItem key={n.id} value={n.id.toString()}>
                          {getNeighborhoodName(n)}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom" className="text-primary font-medium">
                        + {isRTL ? 'إضافة حي جديد' : 'Ajouter un quartier'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {showCustomNeighborhood && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="customNeighborhood">{t('addListing.customNeighborhood')}</Label>
                    <Input
                      id="customNeighborhood"
                      name="customNeighborhood"
                      value={formData.customNeighborhood}
                      onChange={handleInputChange}
                      placeholder={isRTL ? 'اسم الحي' : 'Nom du quartier'}
                    />
                  </div>
                )}

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">{t('addListing.address')}</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder={isRTL ? 'العنوان التفصيلي' : 'Adresse détaillée'}
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-display text-xl font-semibold mb-4">
                {isRTL ? 'تفاصيل العقار' : 'Détails du bien'}
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">
                    {t('addListing.price')} {formData.transactionType === 'rent' && t('property.perMonth')}
                  </Label>
                  <Input id="price" name="price" type="number" placeholder="1500000" value={formData.price} onChange={handleInputChange} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">{t('addListing.area')}</Label>
                  <Input id="area" name="area" type="number" placeholder="120" value={formData.area} onChange={handleInputChange} />
                </div>

                {formData.propertyType !== 'land' && formData.propertyType !== 'commercial' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="bedrooms">{t('addListing.bedrooms')}</Label>
                      <Input id="bedrooms" name="bedrooms" type="number" placeholder="3" value={formData.bedrooms} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bathrooms">{t('addListing.bathrooms')}</Label>
                      <Input id="bathrooms" name="bathrooms" type="number" placeholder="2" value={formData.bathrooms} onChange={handleInputChange} />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-display text-xl font-semibold mb-4">
                {isRTL ? 'العنوان والوصف' : 'Titre et Description'}
              </h2>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="titleFr">{t('addListing.title_fr')}</Label>
                    <Input id="titleFr" name="titleFr" value={formData.titleFr} onChange={handleInputChange} placeholder="Appartement moderne à Maarif" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titleAr">{t('addListing.title_ar')}</Label>
                    <Input id="titleAr" name="titleAr" value={formData.titleAr} onChange={handleInputChange} placeholder="شقة عصرية في المعاريف" dir="rtl" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="descriptionFr">{t('addListing.description_fr')}</Label>
                    <Textarea id="descriptionFr" name="descriptionFr" value={formData.descriptionFr} onChange={handleInputChange} placeholder="Décrivez votre bien..." rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descriptionAr">{t('addListing.description_ar')}</Label>
                    <Textarea id="descriptionAr" name="descriptionAr" value={formData.descriptionAr} onChange={handleInputChange} placeholder="صف عقارك..." rows={4} dir="rtl" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-display text-xl font-semibold mb-4">{t('addListing.images')}</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {isRTL
                  ? 'يمكنك تحميل حتى 6 صور (بحد أقصى 5 ميجابايت لكل صورة، JPEG/PNG/WebP)'
                  : "Vous pouvez télécharger jusqu'à 6 images (max 5 Mo par image, JPEG/PNG/WebP)"}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={image}
                      alt={`Upload ${index + 1}`}
                      className={cn('w-full h-full object-cover', imageUploadStatus[index] === 'error' && 'opacity-50')}
                    />

                    {imageUploadStatus[index] === 'uploading' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      </div>
                    )}

                    {imageUploadStatus[index] === 'error' && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                          {isRTL ? 'فشل' : 'Échec'}
                        </div>
                      </div>
                    )}

                    {imageUploadStatus[index] === 'success' && (
                      <div className="absolute top-2 left-2">
                        <div className="bg-green-500 text-white p-1 rounded-full">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={imageUploadStatus[index] === 'uploading'}
                      className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {uploadedImages.length < 6 && (
                  <label className="aspect-video rounded-lg border-2 border-dashed border-muted hover:border-primary/30 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{t('addListing.uploadImages')}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-display text-xl font-semibold mb-4">
                {isRTL ? 'معلومات الاتصال' : 'Informations de contact'}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {isRTL 
                  ? 'التنسيق الدولي (+212..., +33..., +44...) أو التنسيق المحلي المغربي (06..., 07...)'
                  : 'Format international (+212..., +33..., +44...) ou format local marocain (06..., 07...)'}
              </p>
              
              <div className="space-y-4">
                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone">{isRTL ? 'رقم الهاتف' : 'Numéro de téléphone'}</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    placeholder="06XX XX XX XX, +212 6XX XX XX XX, +33 6XX XX XX XX" 
                    value={formData.phone} 
                    onChange={handleInputChange}
                    onBlur={handlePhoneBlur}
                    className={cn(fieldErrors.phone && "border-red-500 focus-visible:ring-red-500")}
                  />
                  {fieldErrors.phone && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{fieldErrors.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Switch 
                      id="showPhonePublic"
                      checked={formData.showPhonePublic}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, showPhonePublic: checked }))}
                    />
                    <Label htmlFor="showPhonePublic" className="text-sm font-normal cursor-pointer">
                      {isRTL ? 'إظهار الهاتف' : 'Afficher le téléphone publiquement'}
                    </Label>
                  </div>
                </div>

                {/* WhatsApp Number */}
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">{isRTL ? 'رقم واتساب' : 'Numéro WhatsApp'}</Label>
                  <Input 
                    id="whatsapp" 
                    name="whatsapp" 
                    type="tel" 
                    placeholder="06XX XX XX XX, +212 6XX XX XX XX, +33 6XX XX XX XX" 
                    value={formData.whatsapp} 
                    onChange={handleInputChange}
                    onBlur={handleWhatsAppBlur}
                    disabled={formData.whatsappSameAsPhone}
                    className={cn(fieldErrors.whatsapp && "border-red-500 focus-visible:ring-red-500")}
                  />
                  {fieldErrors.whatsapp && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{fieldErrors.whatsapp}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Checkbox 
                        id="whatsappSameAsPhone"
                        checked={formData.whatsappSameAsPhone}
                        onCheckedChange={handleWhatsappSameAsPhone}
                      />
                      <Label htmlFor="whatsappSameAsPhone" className="text-sm font-normal cursor-pointer">
                        {isRTL ? 'واتساب نفس رقم الهاتف' : 'WhatsApp identique au téléphone'}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Switch 
                        id="showWhatsappPublic"
                        checked={formData.showWhatsappPublic}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, showWhatsappPublic: checked }))}
                      />
                      <Label htmlFor="showWhatsappPublic" className="text-sm font-normal cursor-pointer">
                        {isRTL ? 'إظهار واتساب' : 'Afficher WhatsApp publiquement'}
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="contact@example.com" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                  />
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Switch 
                      id="showEmailPublic"
                      checked={formData.showEmailPublic}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, showEmailPublic: checked }))}
                    />
                    <Label htmlFor="showEmailPublic" className="text-sm font-normal cursor-pointer">
                      {isRTL ? 'إظهار البريد الإلكتروني' : 'Afficher email publiquement'}
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="flex-1 text-base"
                disabled={isSubmitting}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  setSubmitAction('draft');
                  handleSubmit(e as unknown as React.FormEvent);
                }}
              >
                {isRTL ? 'حفظ كمسودة' : 'Enregistrer comme brouillon'}
              </Button>
              
              <Button
                type="submit"
                size="lg"
                className="flex-1 text-base"
                disabled={isSubmitting}
                onClick={() => setSubmitAction('pending')}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {uploadProgress || (isRTL ? 'جاري المعالجة...' : 'Traitement...')}
                  </span>
                ) : (
                  isRTL ? 'إرسال للمراجعة' : 'Soumettre pour révision'
                )}
              </Button>
            </div>

            {uploadProgress && (
              <p className="text-sm text-muted-foreground text-center animate-pulse">{uploadProgress}</p>
            )}

            <p className="text-sm text-muted-foreground text-center">
              {isRTL ? (
                <>
                  بإرسال هذا النموذج، فإنك توافق على{' '}
                  <Link to="/terms" className="text-primary hover:underline">
                    الشروط والأحكام
                  </Link>{' '}
                  و{' '}
                  <Link to="/privacy" className="text-primary hover:underline">
                    سياسة الخصوصية
                  </Link>
                </>
              ) : (
                <>
                  En soumettant, vous acceptez nos{' '}
                  <Link to="/terms" className="text-primary hover:underline">
                    Conditions générales
                  </Link>{' '}
                  et{' '}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Politique de confidentialité
                  </Link>
                </>
              )}
            </p>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
