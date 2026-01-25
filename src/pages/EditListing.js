import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadPropertyImages, validateFiles, BUCKET_CONFIG } from '@/lib/storage';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Home, Building, Landmark, Trees, Store, Upload, X, CheckCircle, Loader2, ArrowLeft, } from 'lucide-react';
import { cn } from '@/lib/utils';
const propertyTypes = [
    { value: 'apartment', icon: Building },
    { value: 'house', icon: Home },
    { value: 'villa', icon: Landmark },
    { value: 'commercial', icon: Store },
    { value: 'land', icon: Trees },
];
export default function EditListing() {
    const { id } = useParams();
    const { t, language, isRTL } = useLanguage();
    const { user, profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    // Redirect commercial advertisers - they cannot edit property listings
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
    const [loading, setLoading] = useState(true);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);
    const [imageUploadStatus, setImageUploadStatus] = useState([]);
    const [uploadProgress, setUploadProgress] = useState('');
    const [showCustomNeighborhood, setShowCustomNeighborhood] = useState(false);
    const [existingImagePaths, setExistingImagePaths] = useState([]);
    const [formData, setFormData] = useState({
        transactionType: 'sale',
        propertyType: '',
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
        if (user && id && cities.length > 0) {
            fetchProperty();
        }
    }, [user, id, cities]);
    useEffect(() => {
        if (formData.cityId && neighborhoods.length > 0) {
            const filtered = neighborhoods.filter((n) => n.city_id === parseInt(formData.cityId));
            setFilteredNeighborhoods(filtered);
        }
    }, [formData.cityId, neighborhoods]);
    const fetchCities = async () => {
        const { data, error } = await supabase
            .from('cities')
            .select('id, name_fr, name_ar, is_active')
            .eq('is_active', true)
            .order('display_order');
        if (!error && data)
            setCities(data);
    };
    const fetchNeighborhoods = async () => {
        const { data } = await supabase.from('neighborhoods').select('*');
        if (data)
            setNeighborhoods(data);
    };
    const fetchProperty = async () => {
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', id)
            .eq('owner_id', user.id)
            .single();
        if (error || !data) {
            navigate('/dashboard');
            return;
        }
        setFormData({
            transactionType: data.transaction_type,
            propertyType: data.property_type,
            cityId: data.city_id?.toString() || '',
            neighborhoodId: data.neighborhood_id?.toString() || '',
            customNeighborhood: data.custom_neighborhood || '',
            address: data.address || '',
            price: data.price?.toString() || '',
            area: data.area?.toString() || '',
            bedrooms: data.bedrooms?.toString() || '',
            bathrooms: data.bathrooms?.toString() || '',
            titleFr: data.title_fr || '',
            titleAr: data.title_ar || '',
            descriptionFr: data.description_fr || '',
            descriptionAr: data.description_ar || '',
            phone: data.phone || '',
        });
        setUploadedImages(data.images || []);
        if (data.custom_neighborhood) {
            setShowCustomNeighborhood(true);
        }
        setLoading(false);
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
        if (remainingSlots === 0) {
            alert(isRTL
                ? 'الحد الأقصى 6 صور مسموح به'
                : 'Maximum 6 images autorisées');
            e.target.value = '';
            return;
        }
        if (filesArray.length > remainingSlots) {
            alert(isRTL
                ? `يمكنك تحميل ${remainingSlots} صورة إضافية فقط`
                : `Vous ne pouvez ajouter que ${remainingSlots} image(s) supplémentaire(s)`);
            e.target.value = '';
            return;
        }
        // Validate files
        const bucketConfig = BUCKET_CONFIG['property-images'];
        const validation = validateFiles(filesArray, {
            ...bucketConfig,
            maxCount: remainingSlots,
        });
        if (!validation.valid) {
            const errorMessage = validation.errors.join('\n');
            alert(isRTL
                ? `خطأ في الملفات المحددة:\n\n${errorMessage}`
                : `Erreur dans les fichiers sélectionnés:\n\n${errorMessage}`);
            e.target.value = '';
            return;
        }
        // Store files and preview URLs
        const newPreviews = validation.validFiles.map((file) => URL.createObjectURL(file));
        const newStatuses = validation.validFiles.map(() => 'pending');
        setImageFiles((prev) => [...prev, ...validation.validFiles]);
        setUploadedImages((prev) => [...prev, ...newPreviews]);
        setImageUploadStatus((prev) => [...prev, ...newStatuses]);
        e.target.value = '';
    };
    const removeImage = (index) => {
        // Check if this is an existing image URL (not a blob)
        const imageUrl = uploadedImages[index];
        if (imageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(imageUrl);
        }
        setUploadedImages((prev) => prev.filter((_, i) => i !== index));
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
        setImageUploadStatus((prev) => prev.filter((_, i) => i !== index));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user || !id)
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
                ? 'ليس لديك صلاحية لتعديل الإعلانات العقارية. يجب أن يكون لديك حساب معلن عقاري.'
                : 'Vous n\'avez pas la permission de modifier des annonces immobilières. Vous devez avoir un compte d\'annonceur immobilier.');
            return;
        }
        setIsSubmitting(true);
        setUploadProgress('');
        try {
            // Step 1: Upload new images to Supabase Storage
            let finalImageUrls = [...uploadedImages.filter(url => !url.startsWith('blob:'))];
            if (imageFiles.length > 0) {
                setUploadProgress(isRTL
                    ? `جاري تحميل الصور... (0/${imageFiles.length})`
                    : `Téléchargement des images... (0/${imageFiles.length})`);
                console.log(`[EditListing] Uploading ${imageFiles.length} new images...`);
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
                    const result = await uploadPropertyImages([file], user.id, id);
                    uploadResults.push(result[0]);
                    if (result[0].error) {
                        console.error(`[EditListing] Failed to upload image ${i + 1}:`, result[0].error);
                        setImageUploadStatus((prev) => {
                            const updated = [...prev];
                            updated[i] = 'error';
                            return updated;
                        });
                    }
                    else {
                        console.log(`[EditListing] Successfully uploaded image ${i + 1}`);
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
                    console.error('[EditListing] Image upload errors:', failedUploads);
                    // Show specific error messages for failed uploads
                    const errorDetails = failedUploads.map((r, idx) => `${idx + 1}. ${r.fileName}: ${r.error}`).join('\n');
                    console.log('[EditListing] Error details:', errorDetails);
                    const message = isRTL
                        ? `فشل تحميل ${failedUploads.length} صورة من ${imageFiles.length}.\n\nالأخطاء:\n${errorDetails}\n\nهل تريد المتابعة بالصور المتبقية?`
                        : `Échec du téléchargement de ${failedUploads.length} image(s) sur ${imageFiles.length}.\n\nErreurs:\n${errorDetails}\n\nVoulez-vous continuer avec les images restantes?`;
                    const continueAnyway = window.confirm(message);
                    if (!continueAnyway) {
                        setIsSubmitting(false);
                        setUploadProgress('');
                        return;
                    }
                }
                // Add successful uploads to final image URLs
                const newUrls = uploadResults.filter(r => !r.error).map(r => r.url);
                finalImageUrls = [...finalImageUrls, ...newUrls];
                console.log(`[EditListing] Final image URLs: ${finalImageUrls.length} total`);
            }
            // Step 2: Update property listing
            setUploadProgress(isRTL ? 'جاري حفظ التغييرات...' : 'Enregistrement des modifications...');
            const { error } = await supabase
                .from('properties')
                .update({
                transaction_type: formData.transactionType,
                property_type: formData.propertyType,
                city_id: parseInt(formData.cityId),
                neighborhood_id: formData.neighborhoodId ? parseInt(formData.neighborhoodId) : null,
                custom_neighborhood: formData.customNeighborhood || null,
                address: formData.address,
                price: parseFloat(formData.price),
                area: formData.area ? parseFloat(formData.area) : null,
                bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
                bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
                title_en: formData.titleFr,
                title_fr: formData.titleFr,
                title_ar: formData.titleAr,
                description_en: formData.descriptionFr,
                description_fr: formData.descriptionFr,
                description_ar: formData.descriptionAr,
                images: finalImageUrls,
                phone: formData.phone,
                contact_phone: formData.phone,
                updated_at: new Date().toISOString(),
            })
                .eq('id', id)
                .eq('owner_id', user.id);
            if (error) {
                console.error('Error updating property:', error);
                throw error;
            }
            // Cleanup blob URLs
            uploadedImages.forEach(url => {
                if (url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
            setIsSuccess(true);
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        }
        catch (err) {
            console.error('Error during submission:', err);
            alert(isRTL
                ? 'حدث خطأ أثناء تحديث الإعلان. يرجى المحاولة مرة أخرى.'
                : 'Une erreur s\'est produite lors de la mise à jour de l\'annonce. Veuillez réessayer.');
        }
        finally {
            setIsSubmitting(false);
            setUploadProgress('');
        }
    };
    if (authLoading || loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: _jsx(Loader2, { className: "h-10 w-10 animate-spin text-primary" }) }));
    }
    if (!user) {
        navigate('/login');
        return null;
    }
    if (isSuccess) {
        return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 flex items-center justify-center pt-20", children: _jsxs("div", { className: "text-center px-4", children: [_jsx("div", { className: "w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6", children: _jsx(CheckCircle, { className: "h-10 w-10 text-secondary" }) }), _jsxs("h1", { className: "font-display text-3xl font-semibold text-foreground mb-4", children: [t('common.success'), "!"] }), _jsx("p", { className: "text-muted-foreground max-w-md mx-auto", children: isRTL ? 'تم تحديث إعلانك بنجاح' : 'Votre annonce a été mise à jour avec succès' })] }) }), _jsx(Footer, {})] }));
    }
    return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 pt-24 pb-16", children: _jsxs("div", { className: "container max-w-3xl", children: [_jsx("div", { className: "mb-6", children: _jsx(Button, { variant: "ghost", asChild: true, children: _jsxs(Link, { to: "/dashboard", children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), t('common.back')] }) }) }), _jsx("div", { className: "text-center mb-10", children: _jsxs("h1", { className: "font-display text-3xl md:text-4xl font-semibold text-foreground mb-4", children: [t('dashboard.edit'), " ", isRTL ? 'الإعلان' : 'l\'annonce'] }) }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-8", children: [_jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-4", children: t('addListing.transactionType') }), _jsxs("div", { className: "flex gap-4", children: [_jsx("button", { type: "button", onClick: () => handleSelectChange('transactionType', 'sale'), className: cn('flex-1 py-4 px-6 rounded-lg border-2 transition-all', formData.transactionType === 'sale'
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-muted hover:border-primary/30'), children: _jsx("p", { className: "font-semibold", children: t('hero.forSale') }) }), _jsx("button", { type: "button", onClick: () => handleSelectChange('transactionType', 'rent'), className: cn('flex-1 py-4 px-6 rounded-lg border-2 transition-all', formData.transactionType === 'rent'
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-muted hover:border-primary/30'), children: _jsx("p", { className: "font-semibold", children: t('hero.forRent') }) })] })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-4", children: t('addListing.propertyType') }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-3", children: propertyTypes.map((type) => (_jsxs("button", { type: "button", onClick: () => handleSelectChange('propertyType', type.value), className: cn('p-4 rounded-lg border-2 transition-all text-center', formData.propertyType === type.value
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-muted hover:border-primary/30'), children: [_jsx(type.icon, { className: "h-6 w-6 mx-auto mb-2" }), _jsx("p", { className: "text-sm font-medium", children: getPropertyTypeLabel(type.value) })] }, type.value))) })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsxs("h2", { className: "font-display text-xl font-semibold mb-4", children: [t('addListing.city'), " & ", t('addListing.neighborhood')] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "city", children: [t('addListing.city'), " *"] }), _jsxs(Select, { value: formData.cityId, onValueChange: (value) => handleSelectChange('cityId', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: t('hero.selectCity') }) }), _jsx(SelectContent, { children: cities.map((city) => (_jsx(SelectItem, { value: city.id.toString(), children: getCityName(city) }, city.id))) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "neighborhood", children: t('addListing.neighborhood') }), _jsxs(Select, { value: formData.neighborhoodId, onValueChange: handleNeighborhoodChange, disabled: !formData.cityId, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: t('addListing.selectNeighborhood') }) }), _jsxs(SelectContent, { children: [filteredNeighborhoods.map((n) => (_jsx(SelectItem, { value: n.id.toString(), children: getNeighborhoodName(n) }, n.id))), _jsxs(SelectItem, { value: "custom", className: "text-primary font-medium", children: ["+ ", isRTL ? 'إضافة حي جديد' : 'Ajouter un quartier'] })] })] })] }), showCustomNeighborhood && (_jsxs("div", { className: "space-y-2 md:col-span-2", children: [_jsx(Label, { htmlFor: "customNeighborhood", children: t('addListing.customNeighborhood') }), _jsx(Input, { id: "customNeighborhood", name: "customNeighborhood", value: formData.customNeighborhood, onChange: handleInputChange, placeholder: isRTL ? 'اسم الحي' : 'Nom du quartier' })] })), _jsxs("div", { className: "space-y-2 md:col-span-2", children: [_jsx(Label, { htmlFor: "address", children: t('addListing.address') }), _jsx(Input, { id: "address", name: "address", placeholder: isRTL ? 'العنوان التفصيلي' : 'Adresse détaillée', value: formData.address, onChange: handleInputChange })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-4", children: isRTL ? 'تفاصيل العقار' : 'Détails du bien' }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "price", children: [t('addListing.price'), " *", ' ', formData.transactionType === 'rent' && t('property.perMonth')] }), _jsx(Input, { id: "price", name: "price", type: "number", value: formData.price, onChange: handleInputChange, required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "area", children: [t('addListing.area'), " *"] }), _jsx(Input, { id: "area", name: "area", type: "number", value: formData.area, onChange: handleInputChange, required: true })] }), formData.propertyType !== 'land' &&
                                                    formData.propertyType !== 'commercial' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "bedrooms", children: t('addListing.bedrooms') }), _jsx(Input, { id: "bedrooms", name: "bedrooms", type: "number", value: formData.bedrooms, onChange: handleInputChange })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "bathrooms", children: t('addListing.bathrooms') }), _jsx(Input, { id: "bathrooms", name: "bathrooms", type: "number", value: formData.bathrooms, onChange: handleInputChange })] })] }))] })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-4", children: isRTL ? 'العنوان والوصف' : 'Titre et Description' }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "titleFr", children: [t('addListing.title_fr'), " *"] }), _jsx(Input, { id: "titleFr", name: "titleFr", value: formData.titleFr, onChange: handleInputChange, required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "titleAr", children: [t('addListing.title_ar'), " *"] }), _jsx(Input, { id: "titleAr", name: "titleAr", value: formData.titleAr, onChange: handleInputChange, dir: "rtl", required: true })] })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "descriptionFr", children: t('addListing.description_fr') }), _jsx(Textarea, { id: "descriptionFr", name: "descriptionFr", value: formData.descriptionFr, onChange: handleInputChange, rows: 4 })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "descriptionAr", children: t('addListing.description_ar') }), _jsx(Textarea, { id: "descriptionAr", name: "descriptionAr", value: formData.descriptionAr, onChange: handleInputChange, rows: 4, dir: "rtl" })] })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-4", children: t('addListing.images') }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4", children: [uploadedImages.map((image, index) => (_jsxs("div", { className: "relative aspect-video rounded-lg overflow-hidden bg-muted", children: [_jsx("img", { src: image, alt: `Upload ${index + 1}`, className: cn("w-full h-full object-cover", imageUploadStatus[index] === 'error' && "opacity-50") }), imageUploadStatus[index] === 'uploading' && (_jsx("div", { className: "absolute inset-0 bg-black/50 flex items-center justify-center", children: _jsx(Loader2, { className: "h-8 w-8 text-white animate-spin" }) })), imageUploadStatus[index] === 'error' && (_jsx("div", { className: "absolute inset-0 bg-red-500/20 flex items-center justify-center", children: _jsx("div", { className: "bg-red-500 text-white px-2 py-1 rounded text-xs font-medium", children: isRTL ? 'فشل' : 'Échec' }) })), imageUploadStatus[index] === 'success' && (_jsx("div", { className: "absolute top-2 left-2", children: _jsx("div", { className: "bg-green-500 text-white p-1 rounded-full", children: _jsx(CheckCircle, { className: "h-4 w-4" }) }) })), _jsx("button", { type: "button", onClick: () => removeImage(index), disabled: imageUploadStatus[index] === 'uploading', className: `absolute top-2 ${isRTL ? 'left-2' : 'right-2'} p-1.5 rounded-full bg-white/90 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed`, children: _jsx(X, { className: "h-4 w-4" }) })] }, index))), uploadedImages.length < 6 && (_jsxs("label", { className: "aspect-video rounded-lg border-2 border-dashed border-muted hover:border-primary/30 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2", children: [_jsx(Upload, { className: "h-8 w-8 text-muted-foreground" }), _jsx("span", { className: "text-sm text-muted-foreground", children: t('addListing.uploadImages') }), _jsx("input", { type: "file", accept: "image/jpeg,image/png,image/webp", multiple: true, className: "hidden", onChange: handleImageUpload })] }))] })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-4", children: t('addListing.phone') }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "phone", children: [t('addListing.phone'), " *"] }), _jsx(Input, { id: "phone", name: "phone", type: "tel", value: formData.phone, onChange: handleInputChange, required: true })] })] }), _jsx(Button, { type: "submit", size: "lg", className: "w-full text-base", disabled: isSubmitting, children: isSubmitting ? (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx(Loader2, { className: "h-5 w-5 animate-spin" }), uploadProgress || (isRTL ? 'جاري المعالجة...' : 'Traitement...')] })) : (t('common.save')) }), uploadProgress && (_jsx("p", { className: "text-sm text-muted-foreground text-center animate-pulse", children: uploadProgress }))] })] }) }), _jsx(Footer, {})] }));
}
