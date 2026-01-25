import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { uploadPropertyImages, validateFiles, BUCKET_CONFIG } from '@/lib/storage';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Home, Building, Landmark, Trees, Store, Upload, X, CheckCircle, Loader2, LogIn, } from 'lucide-react';
import { cn } from '@/lib/utils';
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
function getErrorMessage(error, isRTL, isDev) {
    let message = isRTL
        ? 'حدث خطأ أثناء إنشاء الإعلان.'
        : 'Une erreur s\'est produite lors de la création de l\'annonce.';
    if (error.message?.includes('permission') || error.code === '42501') {
        message = isRTL
            ? 'ليس لديك صلاحية لإنشاء إعلان. تأكد من تسجيل الدخول كمعلن عقاري.'
            : 'Vous n\'avez pas la permission de créer une annonce. Assurez-vous d\'être connecté en tant qu\'annonceur immobilier.';
    }
    else if (error.message?.includes('violates') || error.code === '23503') {
        message = isRTL
            ? 'بيانات غير صالحة. يرجى التحقق من جميع الحقول.'
            : 'Données invalides. Veuillez vérifier tous les champs.';
    }
    else if (error.message?.includes('duplicate') || error.code === '23505') {
        message = isRTL
            ? 'هذا الإعلان موجود بالفعل.'
            : 'Cette annonce existe déjà.';
    }
    else if (error.message?.includes('not null') || error.code === '23502') {
        message = isRTL
            ? 'حقول مطلوبة مفقودة. يرجى ملء جميع الحقول المطلوبة.'
            : 'Champs requis manquants. Veuillez remplir tous les champs obligatoires.';
    }
    // Only show technical details in development mode
    if (isDev) {
        message += '\n\nDétails: ' + (error.message || error.code || 'Unknown error');
    }
    return message;
}
export default function AddListing() {
    const { t, language, isRTL } = useLanguage();
    const { user, profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    // Redirect commercial advertisers - they cannot add property listings
    useEffect(() => {
        if (!authLoading && profile && profile.user_role === 'commercial_advertiser') {
            navigate('/commercial-dashboard');
        }
    }, [authLoading, profile, navigate]);
    const [cities, setCities] = useState([]);
    const [neighborhoods, setNeighborhoods] = useState([]);
    const [filteredNeighborhoods, setFilteredNeighborhoods] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [imageUploadStatus, setImageUploadStatus] = useState([]);
    const [uploadProgress, setUploadProgress] = useState('');
    const [showCustomNeighborhood, setShowCustomNeighborhood] = useState(false);
    const [formData, setFormData] = useState({
        transactionType: 'sale',
        propertyType: '',
        advertiserType: 'owner',
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
    });
    useEffect(() => {
        fetchCities();
        fetchNeighborhoods();
    }, []);
    useEffect(() => {
        if (formData.cityId) {
            const filtered = neighborhoods.filter((n) => n.city_id === parseInt(formData.cityId));
            setFilteredNeighborhoods(filtered);
            setFormData((prev) => ({ ...prev, neighborhoodId: '', customNeighborhood: '' }));
            setShowCustomNeighborhood(false);
        }
        else {
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
            // Fallback cities
            setCities([
                { id: 1, name_fr: 'Casablanca', name_ar: 'الدار البيضاء' },
                { id: 2, name_fr: 'Rabat', name_ar: 'الرباط' },
                { id: 3, name_fr: 'Marrakech', name_ar: 'مراكش' },
            ]);
            return;
        }
        if (data && data.length > 0) {
            setCities(data);
        }
        else {
            // Fallback if empty
            setCities([
                { id: 1, name_fr: 'Casablanca', name_ar: 'الدار البيضاء' },
                { id: 2, name_fr: 'Rabat', name_ar: 'الرباط' },
            ]);
        }
    };
    const fetchNeighborhoods = async () => {
        const { data } = await supabase.from('neighborhoods').select('*');
        if (data)
            setNeighborhoods(data);
    };
    const getCityName = (city) => {
        if (language === 'ar')
            return city.name_ar;
        return city.name_fr;
    };
    const getNeighborhoodName = (neighborhood) => {
        if (language === 'ar')
            return neighborhood.name_ar;
        return neighborhood.name_fr;
    };
    const getPropertyTypeLabel = (value) => {
        return t(`property.${value}`);
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const handleSelectChange = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const handleNeighborhoodChange = (value) => {
        if (value === 'custom') {
            setShowCustomNeighborhood(true);
            setFormData((prev) => ({ ...prev, neighborhoodId: '' }));
        }
        else {
            setShowCustomNeighborhood(false);
            setFormData((prev) => ({ ...prev, neighborhoodId: value, customNeighborhood: '' }));
        }
    };
    const handleImageUpload = (e) => {
        const files = e.target.files;
        if (!files)
            return;
        // Validate user profile before allowing upload
        if (!user || !profile) {
            alert(isRTL
                ? 'يرجى تسجيل الدخول أولاً'
                : 'Veuillez vous connecter d\'abord');
            e.target.value = '';
            return;
        }
        // Check if user has the correct role for uploading property images
        if (profile.user_role !== 'real_estate_advertiser' && profile.user_role !== 'admin') {
            alert(isRTL
                ? 'ليس لديك صلاحية لتحميل الصور. يجب أن تكون معلن عقاري.'
                : 'Vous n\'avez pas la permission de télécharger des images. Vous devez être un annonceur immobilier.');
            e.target.value = '';
            return;
        }
        const filesArray = Array.from(files);
        const maxImages = 6;
        const remainingSlots = maxImages - uploadedImages.length;
        // Check if we've reached the limit
        if (remainingSlots === 0) {
            alert(isRTL
                ? 'الحد الأقصى 6 صور مسموح به'
                : 'Maximum 6 images autorisées');
            // Reset input
            e.target.value = '';
            return;
        }
        // Check if too many files selected
        if (filesArray.length > remainingSlots) {
            alert(isRTL
                ? `يمكنك تحميل ${remainingSlots} صورة إضافية فقط`
                : `Vous ne pouvez ajouter que ${remainingSlots} image(s) supplémentaire(s)`);
            // Reset input
            e.target.value = '';
            return;
        }
        // Validate files using the enhanced validation
        const bucketConfig = BUCKET_CONFIG['property-images'];
        const validation = validateFiles(filesArray, {
            ...bucketConfig,
            maxCount: remainingSlots,
        });
        // Show errors if validation failed
        if (!validation.valid) {
            const errorMessage = validation.errors.join('\n');
            alert(isRTL
                ? `خطأ في الملفات المحددة:\n\n${errorMessage}`
                : `Erreur dans les fichiers sélectionnés:\n\n${errorMessage}`);
            // Reset input
            e.target.value = '';
            return;
        }
        // All files are valid - store them and create preview URLs
        const newPreviews = validation.validFiles.map((file) => URL.createObjectURL(file));
        const newStatuses = validation.validFiles.map(() => 'pending');
        setImageFiles((prev) => [...prev, ...validation.validFiles]);
        setUploadedImages((prev) => [...prev, ...newPreviews]);
        setImageUploadStatus((prev) => [...prev, ...newStatuses]);
        // Reset input to allow selecting the same file again if needed
        e.target.value = '';
    };
    const removeImage = (index) => {
        // Revoke blob URL to prevent memory leak
        URL.revokeObjectURL(uploadedImages[index]);
        setUploadedImages((prev) => prev.filter((_, i) => i !== index));
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
        setImageUploadStatus((prev) => prev.filter((_, i) => i !== index));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user)
            return;
        // Validate user profile exists and has correct role
        if (!profile) {
            alert(isRTL
                ? 'ملفك الشخصي غير محمل. يرجى تحديث الصفحة وإعادة المحاولة.'
                : 'Votre profil n\'est pas chargé. Veuillez actualiser la page et réessayer.');
            return;
        }
        if (profile.user_role !== 'real_estate_advertiser' && profile.user_role !== 'admin') {
            alert(isRTL
                ? 'ليس لديك صلاحية لإنشاء إعلان عقاري. يجب أن يكون لديك حساب معلن عقاري.'
                : 'Vous n\'avez pas la permission de créer une annonce immobilière. Vous devez avoir un compte d\'annonceur immobilier.');
            return;
        }
        // Enhanced validation
        if (!formData.propertyType) {
            alert(isRTL ? 'يرجى اختيار نوع العقار' : 'Veuillez sélectionner un type de bien');
            return;
        }
        if (!formData.cityId) {
            alert(isRTL ? 'يرجى اختيار المدينة' : 'Veuillez sélectionner une ville');
            return;
        }
        // Validate phone number if provided
        if (formData.phone && formData.phone.trim()) {
            // Moroccan phone format: mobile (06/07) or landline (05)
            const phoneRegex = /^(\+212|0)[5-7]\d{8}$/;
            if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
                alert(isRTL
                    ? 'رقم الهاتف غير صالح. يجب أن يكون بالشكل: +212 6XX XX XX XX أو 06XX XX XX XX'
                    : 'Numéro de téléphone invalide. Format attendu: +212 6XX XX XX XX ou 06XX XX XX XX');
                return;
            }
        }
        // Validate numeric fields
        if (formData.price && parseFloat(formData.price) <= 0) {
            alert(isRTL ? 'السعر يجب أن يكون أكبر من الصفر' : 'Le prix doit être supérieur à zéro');
            return;
        }
        if (formData.area && parseFloat(formData.area) <= 0) {
            alert(isRTL ? 'المساحة يجب أن تكون أكبر من الصفر' : 'La surface doit être supérieure à zéro');
            return;
        }
        setIsSubmitting(true);
        setUploadProgress('');
        try {
            // Step 1: Upload images to Supabase Storage with progress tracking
            let imageUrls = [];
            if (imageFiles.length > 0) {
                setUploadProgress(isRTL
                    ? `جاري تحميل الصور... (0/${imageFiles.length})`
                    : `Téléchargement des images... (0/${imageFiles.length})`);
                console.log(`[AddListing] Starting upload of ${imageFiles.length} images...`);
                // Upload images one by one with progress tracking
                const uploadResults = [];
                for (let i = 0; i < imageFiles.length; i++) {
                    const file = imageFiles[i];
                    setImageUploadStatus((prev) => {
                        const updated = [...prev];
                        updated[i] = 'uploading';
                        return updated;
                    });
                    setUploadProgress(isRTL
                        ? `جاري تحميل الصور... (${i + 1}/${imageFiles.length})`
                        : `Téléchargement des images... (${i + 1}/${imageFiles.length})`);
                    const result = await uploadPropertyImages([file], user.id);
                    uploadResults.push(result[0]);
                    if (result[0].error) {
                        console.error(`[AddListing] Failed to upload image ${i + 1}:`, result[0].error);
                        setImageUploadStatus((prev) => {
                            const updated = [...prev];
                            updated[i] = 'error';
                            return updated;
                        });
                    }
                    else {
                        console.log(`[AddListing] Successfully uploaded image ${i + 1}`);
                        setImageUploadStatus((prev) => {
                            const updated = [...prev];
                            updated[i] = 'success';
                            return updated;
                        });
                    }
                }
                // Check for upload errors
                const failedUploads = uploadResults.filter(r => r.error);
                if (failedUploads.length > 0) {
                    console.error('[AddListing] Image upload errors:', failedUploads);
                    // Show specific error messages for failed uploads
                    const errorDetails = failedUploads.map((r, idx) => `${idx + 1}. ${r.fileName}: ${r.error}`).join('\n');
                    console.log('[AddListing] Error details:', errorDetails);
                    // Allow user to decide whether to continue or retry
                    const message = isRTL
                        ? `فشل تحميل ${failedUploads.length} صورة من ${imageFiles.length}.\n\nالأخطاء:\n${errorDetails}\n\nهل تريد المتابعة بالصور المتبقية؟\n\n(اختر "إلغاء" للعودة وإعادة المحاولة)`
                        : `Échec du téléchargement de ${failedUploads.length} image(s) sur ${imageFiles.length}.\n\nErreurs:\n${errorDetails}\n\nVoulez-vous continuer avec les images restantes?\n\n(Cliquez sur "Annuler" pour revenir et réessayer)`;
                    const continueAnyway = window.confirm(message);
                    if (!continueAnyway) {
                        // User wants to retry - reset submitting state
                        setIsSubmitting(false);
                        setUploadProgress('');
                        return;
                    }
                }
                // Use only successful uploads
                imageUrls = uploadResults.filter(r => !r.error).map(r => r.url);
                console.log(`[AddListing] ${imageUrls.length} images uploaded successfully out of ${imageFiles.length}`);
            }
            // Step 2: Create property listing
            setUploadProgress(isRTL ? 'جاري حفظ الإعلان...' : 'Enregistrement de l\'annonce...');
            // Build insert data - only include fields that exist in the database
            const insertData = {
                owner_id: user.id,
                transaction_type: formData.transactionType || 'sale',
                property_type: formData.propertyType,
                advertiser_type: formData.advertiserType || 'owner',
                city_id: parseInt(formData.cityId),
                neighborhood_id: formData.neighborhoodId ? parseInt(formData.neighborhoodId) : null,
                custom_neighborhood: formData.customNeighborhood || null,
                address: formData.address || null,
                price: formData.price ? parseFloat(formData.price) : 0,
                area: formData.area ? parseFloat(formData.area) : null,
                bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
                bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
                title_en: formData.titleFr || 'New property',
                title_fr: formData.titleFr || 'Nouveau bien',
                title_ar: formData.titleAr || 'عقار جديد',
                description_en: formData.descriptionFr || null,
                description_fr: formData.descriptionFr || null,
                description_ar: formData.descriptionAr || null,
                images: imageUrls, // Use uploaded image URLs
                phone: formData.phone || null,
                contact_phone: formData.phone || null,
                status: 'pending',
            };
            console.log('Submitting property:', insertData);
            const { data, error } = await supabase.from('properties').insert(insertData).select();
            if (error) {
                console.error('Error creating property:', error);
                if (import.meta.env.DEV) {
                    console.error('Error details:', JSON.stringify(error, null, 2));
                    console.error('Insert data sent:', JSON.stringify(insertData, null, 2));
                }
                const errorMessage = getErrorMessage(error, isRTL, import.meta.env.DEV);
                throw new Error(errorMessage);
            }
            if (import.meta.env.DEV) {
                console.log('Property created successfully:', data);
            }
            // Cleanup blob URLs
            uploadedImages.forEach(url => URL.revokeObjectURL(url));
            setIsSuccess(true);
            setTimeout(() => {
                navigate('/dashboard');
            }, 3000);
        }
        catch (err) {
            console.error('Error during submission:', err);
            const message = err instanceof Error ? err.message : (isRTL
                ? 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
                : 'Une erreur inattendue s\'est produite. Veuillez réessayer.');
            alert(message);
            setIsSubmitting(false);
            setUploadProgress('');
        }
    };
    if (authLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: _jsx(Loader2, { className: "h-10 w-10 animate-spin text-primary" }) }));
    }
    if (!user) {
        return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 flex items-center justify-center pt-20 px-4", children: _jsxs("div", { className: "text-center max-w-md", children: [_jsx("div", { className: "w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6", children: _jsx(LogIn, { className: "h-10 w-10 text-muted-foreground" }) }), _jsx("h1", { className: "font-display text-2xl font-semibold text-foreground mb-4", children: t('addListing.loginRequired') }), _jsx("p", { className: "text-muted-foreground mb-6", children: isRTL
                                    ? 'يجب تسجيل الدخول للوصول إلى هذه الصفحة'
                                    : 'Vous devez être connecté pour accéder à cette page' }), _jsxs("div", { className: "flex gap-4 justify-center", children: [_jsx(Button, { asChild: true, children: _jsx(Link, { to: "/login", state: { from: '/add-listing' }, children: t('nav.login') }) }), _jsx(Button, { variant: "outline", asChild: true, children: _jsx(Link, { to: "/register", children: t('nav.register') }) })] })] }) }), _jsx(Footer, {})] }));
    }
    if (isSuccess) {
        return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 flex items-center justify-center pt-20", children: _jsxs("div", { className: "text-center px-4", children: [_jsx("div", { className: "w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6", children: _jsx(CheckCircle, { className: "h-10 w-10 text-secondary" }) }), _jsx("h1", { className: "font-display text-3xl font-semibold text-foreground mb-4", children: t('addListing.success') }), _jsx("p", { className: "text-muted-foreground max-w-md mx-auto", children: t('addListing.successMessage') })] }) }), _jsx(Footer, {})] }));
    }
    return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 pt-24 pb-16", children: _jsxs("div", { className: "container max-w-3xl", children: [_jsxs("div", { className: "text-center mb-10", children: [_jsx("h1", { className: "font-display text-3xl md:text-4xl font-semibold text-foreground mb-4", children: t('addListing.title') }), _jsx("p", { className: "text-muted-foreground max-w-xl mx-auto", children: t('addListing.subtitle') })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-8", children: [_jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-4", children: t('addListing.transactionType') }), _jsxs("div", { className: "flex gap-4", children: [_jsx("button", { type: "button", onClick: () => handleSelectChange('transactionType', 'sale'), className: cn('flex-1 py-4 px-6 rounded-lg border-2 transition-all', formData.transactionType === 'sale'
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-muted hover:border-primary/30'), children: _jsx("p", { className: "font-semibold", children: t('hero.forSale') }) }), _jsx("button", { type: "button", onClick: () => handleSelectChange('transactionType', 'rent'), className: cn('flex-1 py-4 px-6 rounded-lg border-2 transition-all', formData.transactionType === 'rent'
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-muted hover:border-primary/30'), children: _jsx("p", { className: "font-semibold", children: t('hero.forRent') }) })] })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-4", children: t('addListing.propertyType') }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-3", children: propertyTypes.map((type) => (_jsxs("button", { type: "button", onClick: () => handleSelectChange('propertyType', type.value), className: cn('p-4 rounded-lg border-2 transition-all text-center', formData.propertyType === type.value
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-muted hover:border-primary/30'), children: [_jsx(type.icon, { className: "h-6 w-6 mx-auto mb-2" }), _jsx("p", { className: "text-sm font-medium", children: getPropertyTypeLabel(type.value) })] }, type.value))) })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-4", children: isRTL ? 'نوع المعلن' : 'Type d\'annonceur' }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsxs("button", { type: "button", onClick: () => handleSelectChange('advertiserType', 'owner'), className: cn('p-4 rounded-lg border-2 transition-all text-center', formData.advertiserType === 'owner'
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-muted hover:border-primary/30'), children: [_jsx(Home, { className: "h-6 w-6 mx-auto mb-2" }), _jsx("p", { className: "text-sm font-medium", children: isRTL ? 'مالك' : 'Propriétaire' })] }), _jsxs("button", { type: "button", onClick: () => handleSelectChange('advertiserType', 'broker'), className: cn('p-4 rounded-lg border-2 transition-all text-center', formData.advertiserType === 'broker'
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-muted hover:border-primary/30'), children: [_jsx(Building, { className: "h-6 w-6 mx-auto mb-2" }), _jsx("p", { className: "text-sm font-medium", children: isRTL ? 'سمسار' : 'Courtier' })] }), _jsxs("button", { type: "button", onClick: () => handleSelectChange('advertiserType', 'agency'), className: cn('p-4 rounded-lg border-2 transition-all text-center', formData.advertiserType === 'agency'
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-muted hover:border-primary/30'), children: [_jsx(Store, { className: "h-6 w-6 mx-auto mb-2" }), _jsx("p", { className: "text-sm font-medium", children: isRTL ? 'وكالة' : 'Agence' })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsxs("h2", { className: "font-display text-xl font-semibold mb-4", children: [t('addListing.city'), " & ", t('addListing.neighborhood')] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "city", children: [t('addListing.city'), " *"] }), _jsxs(Select, { value: formData.cityId, onValueChange: (value) => handleSelectChange('cityId', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: t('hero.selectCity') }) }), _jsx(SelectContent, { children: cities.map((city) => (_jsx(SelectItem, { value: city.id.toString(), children: getCityName(city) }, city.id))) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "neighborhood", children: t('addListing.neighborhood') }), _jsxs(Select, { value: formData.neighborhoodId, onValueChange: handleNeighborhoodChange, disabled: !formData.cityId, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: t('addListing.selectNeighborhood') }) }), _jsxs(SelectContent, { children: [filteredNeighborhoods.map((n) => (_jsx(SelectItem, { value: n.id.toString(), children: getNeighborhoodName(n) }, n.id))), _jsxs(SelectItem, { value: "custom", className: "text-primary font-medium", children: ["+ ", isRTL ? 'إضافة حي جديد' : 'Ajouter un quartier'] })] })] })] }), showCustomNeighborhood && (_jsxs("div", { className: "space-y-2 md:col-span-2", children: [_jsx(Label, { htmlFor: "customNeighborhood", children: t('addListing.customNeighborhood') }), _jsx(Input, { id: "customNeighborhood", name: "customNeighborhood", value: formData.customNeighborhood, onChange: handleInputChange, placeholder: isRTL ? 'اسم الحي' : 'Nom du quartier' })] })), _jsxs("div", { className: "space-y-2 md:col-span-2", children: [_jsx(Label, { htmlFor: "address", children: t('addListing.address') }), _jsx(Input, { id: "address", name: "address", placeholder: isRTL ? 'العنوان التفصيلي' : 'Adresse détaillée', value: formData.address, onChange: handleInputChange })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-4", children: isRTL ? 'تفاصيل العقار' : 'Détails du bien' }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "price", children: [t('addListing.price'), ' ', formData.transactionType === 'rent' && t('property.perMonth')] }), _jsx(Input, { id: "price", name: "price", type: "number", placeholder: "1500000", value: formData.price, onChange: handleInputChange })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "area", children: t('addListing.area') }), _jsx(Input, { id: "area", name: "area", type: "number", placeholder: "120", value: formData.area, onChange: handleInputChange })] }), formData.propertyType !== 'land' &&
                                                    formData.propertyType !== 'commercial' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "bedrooms", children: t('addListing.bedrooms') }), _jsx(Input, { id: "bedrooms", name: "bedrooms", type: "number", placeholder: "3", value: formData.bedrooms, onChange: handleInputChange })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "bathrooms", children: t('addListing.bathrooms') }), _jsx(Input, { id: "bathrooms", name: "bathrooms", type: "number", placeholder: "2", value: formData.bathrooms, onChange: handleInputChange })] })] }))] })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-4", children: isRTL ? 'العنوان والوصف' : 'Titre et Description' }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "titleFr", children: t('addListing.title_fr') }), _jsx(Input, { id: "titleFr", name: "titleFr", value: formData.titleFr, onChange: handleInputChange, placeholder: "Appartement moderne \u00E0 Maarif" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "titleAr", children: t('addListing.title_ar') }), _jsx(Input, { id: "titleAr", name: "titleAr", value: formData.titleAr, onChange: handleInputChange, placeholder: "\u0634\u0642\u0629 \u0639\u0635\u0631\u064A\u0629 \u0641\u064A \u0627\u0644\u0645\u0639\u0627\u0631\u064A\u0641", dir: "rtl" })] })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "descriptionFr", children: t('addListing.description_fr') }), _jsx(Textarea, { id: "descriptionFr", name: "descriptionFr", value: formData.descriptionFr, onChange: handleInputChange, placeholder: "D\u00E9crivez votre bien...", rows: 4 })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "descriptionAr", children: t('addListing.description_ar') }), _jsx(Textarea, { id: "descriptionAr", name: "descriptionAr", value: formData.descriptionAr, onChange: handleInputChange, placeholder: "\u0635\u0641 \u0639\u0642\u0627\u0631\u0643...", rows: 4, dir: "rtl" })] })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-4", children: t('addListing.images') }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: isRTL
                                                ? 'يمكنك تحميل حتى 6 صور (بحد أقصى 5 ميجابايت لكل صورة، JPEG/PNG/WebP)'
                                                : 'Vous pouvez télécharger jusqu\'à 6 images (max 5 Mo par image, JPEG/PNG/WebP)' }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4", children: [uploadedImages.map((image, index) => (_jsxs("div", { className: "relative aspect-video rounded-lg overflow-hidden bg-muted", children: [_jsx("img", { src: image, alt: `Upload ${index + 1}`, className: cn("w-full h-full object-cover", imageUploadStatus[index] === 'error' && "opacity-50") }), imageUploadStatus[index] === 'uploading' && (_jsx("div", { className: "absolute inset-0 bg-black/50 flex items-center justify-center", children: _jsx(Loader2, { className: "h-8 w-8 text-white animate-spin" }) })), imageUploadStatus[index] === 'error' && (_jsx("div", { className: "absolute inset-0 bg-red-500/20 flex items-center justify-center", children: _jsx("div", { className: "bg-red-500 text-white px-2 py-1 rounded text-xs font-medium", children: isRTL ? 'فشل' : 'Échec' }) })), imageUploadStatus[index] === 'success' && (_jsx("div", { className: "absolute top-2 left-2", children: _jsx("div", { className: "bg-green-500 text-white p-1 rounded-full", children: _jsx(CheckCircle, { className: "h-4 w-4" }) }) })), _jsx("button", { type: "button", onClick: () => removeImage(index), disabled: imageUploadStatus[index] === 'uploading', className: `absolute top-2 ${isRTL ? 'left-2' : 'right-2'} p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed`, children: _jsx(X, { className: "h-4 w-4" }) })] }, index))), uploadedImages.length < 6 && (_jsxs("label", { className: "aspect-video rounded-lg border-2 border-dashed border-muted hover:border-primary/30 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2", children: [_jsx(Upload, { className: "h-8 w-8 text-muted-foreground" }), _jsx("span", { className: "text-sm text-muted-foreground", children: t('addListing.uploadImages') }), _jsx("input", { type: "file", accept: "image/jpeg,image/png,image/webp", multiple: true, className: "hidden", onChange: handleImageUpload })] }))] })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-4", children: t('addListing.phone') }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "phone", children: t('addListing.phone') }), _jsx(Input, { id: "phone", name: "phone", type: "tel", placeholder: "+212 6XX XX XX XX", value: formData.phone, onChange: handleInputChange })] })] }), _jsx(Button, { type: "submit", size: "lg", className: "w-full text-base", disabled: isSubmitting, children: isSubmitting ? (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx(Loader2, { className: "h-5 w-5 animate-spin" }), uploadProgress || (isRTL ? 'جاري المعالجة...' : 'Traitement...')] })) : (t('addListing.submit')) }), uploadProgress && (_jsx("p", { className: "text-sm text-muted-foreground text-center animate-pulse", children: uploadProgress })), _jsx("p", { className: "text-sm text-muted-foreground text-center", children: isRTL ? (_jsxs(_Fragment, { children: ["\u0628\u0625\u0631\u0633\u0627\u0644 \u0647\u0630\u0627 \u0627\u0644\u0646\u0645\u0648\u0630\u062C\u060C \u0641\u0625\u0646\u0643 \u062A\u0648\u0627\u0641\u0642 \u0639\u0644\u0649", ' ', _jsx(Link, { to: "/terms", className: "text-primary hover:underline", children: "\u0627\u0644\u0634\u0631\u0648\u0637 \u0648\u0627\u0644\u0623\u062D\u0643\u0627\u0645" }), ' ', "\u0648", ' ', _jsx(Link, { to: "/privacy", className: "text-primary hover:underline", children: "\u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u062E\u0635\u0648\u0635\u064A\u0629" })] })) : (_jsxs(_Fragment, { children: ["En soumettant, vous acceptez nos", ' ', _jsx(Link, { to: "/terms", className: "text-primary hover:underline", children: "Conditions g\u00E9n\u00E9rales" }), ' ', "et", ' ', _jsx(Link, { to: "/privacy", className: "text-primary hover:underline", children: "Politique de confidentialit\u00E9" })] })) })] })] }) }), _jsx(Footer, {})] }));
}
