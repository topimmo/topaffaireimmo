import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadPropertyImages, validateFiles, BUCKET_CONFIG, deleteFiles } from '@/lib/storage';
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
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function EditListing() {
  const { id } = useParams<{ id: string }>();
  const { t, language, isRTL } = useLanguage();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect commercial advertisers - they cannot edit property listings
  useEffect(() => {
    if (!authLoading && profile && profile.user_role === 'commercial_advertiser') {
      navigate('/commercial-dashboard');
    }
  }, [authLoading, profile, navigate]);

  const [cities, setCities] = useState<City[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [filteredNeighborhoods, setFilteredNeighborhoods] = useState<Neighborhood[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUploadStatus, setImageUploadStatus] = useState<('pending' | 'uploading' | 'success' | 'error')[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [showCustomNeighborhood, setShowCustomNeighborhood] = useState(false);
  const [existingImagePaths, setExistingImagePaths] = useState<string[]>([]);

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
      const filtered = neighborhoods.filter(
        (n) => n.city_id === parseInt(formData.cityId)
      );
      setFilteredNeighborhoods(filtered);
    }
  }, [formData.cityId, neighborhoods]);

  const fetchCities = async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('id, name_fr, name_ar, is_active')
      .eq('is_active', true)
      .order('display_order');
    if (!error && data) setCities(data);
  };

  const fetchNeighborhoods = async () => {
    const { data } = await supabase.from('neighborhoods').select('*');
    if (data) setNeighborhoods(data);
  };

  const fetchProperty = async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user!.id)
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
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

    const filesArray = Array.from(files);
    const maxImages = 6;
    const remainingSlots = maxImages - uploadedImages.length;
    
    if (remainingSlots === 0) {
      alert(isRTL 
        ? 'الحد الأقصى 6 صور مسموح به' 
        : 'Maximum 6 images autorisées'
      );
      e.target.value = '';
      return;
    }
    
    if (filesArray.length > remainingSlots) {
      alert(isRTL 
        ? `يمكنك تحميل ${remainingSlots} صورة إضافية فقط` 
        : `Vous ne pouvez ajouter que ${remainingSlots} image(s) supplémentaire(s)`
      );
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
        : `Erreur dans les fichiers sélectionnés:\n\n${errorMessage}`
      );
      e.target.value = '';
      return;
    }

    // Store files and preview URLs
    const newPreviews = validation.validFiles.map((file) => URL.createObjectURL(file));
    const newStatuses = validation.validFiles.map(() => 'pending' as const);
    
    setImageFiles((prev) => [...prev, ...validation.validFiles]);
    setUploadedImages((prev) => [...prev, ...newPreviews]);
    setImageUploadStatus((prev) => [...prev, ...newStatuses]);
    
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    // Check if this is an existing image URL (not a blob)
    const imageUrl = uploadedImages[index];
    if (imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
    
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImageUploadStatus((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    setIsSubmitting(true);
    setUploadProgress('');

    try {
      // Step 1: Upload new images to Supabase Storage
      let finalImageUrls: string[] = [...uploadedImages.filter(url => !url.startsWith('blob:'))];
      
      if (imageFiles.length > 0) {
        setUploadProgress(isRTL 
          ? `جاري تحميل الصور... (0/${imageFiles.length})` 
          : `Téléchargement des images... (0/${imageFiles.length})`
        );
        
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
            : `Téléchargement des images... (${i + 1}/${imageFiles.length})`
          );
          
          const result = await uploadPropertyImages([file], user.id, id);
          uploadResults.push(result[0]);
          
          if (result[0].error) {
            console.error(`[EditListing] Failed to upload image ${i + 1}:`, result[0].error);
            setImageUploadStatus((prev) => {
              const updated = [...prev];
              updated[i] = 'error';
              return updated;
            });
          } else {
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
          
          const continueAnyway = window.confirm(
            isRTL 
              ? `فشل تحميل ${failedUploads.length} صورة من ${imageFiles.length}.\n\nهل تريد المتابعة بالصور المتبقية?` 
              : `Échec du téléchargement de ${failedUploads.length} image(s) sur ${imageFiles.length}.\n\nVoulez-vous continuer avec les images restantes?`
          );
          
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
    } catch (err) {
      console.error('Error during submission:', err);
      alert(isRTL 
        ? 'حدث خطأ أثناء تحديث الإعلان. يرجى المحاولة مرة أخرى.' 
        : 'Une erreur s\'est produite lors de la mise à jour de l\'annonce. Veuillez réessayer.'
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress('');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
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
              {t('common.success')}!
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              {isRTL ? 'تم تحديث إعلانك بنجاح' : 'Votre annonce a été mise à jour avec succès'}
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
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                {t('common.back')}
              </Link>
            </Button>
          </div>

          <div className="text-center mb-10">
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
              {t('dashboard.edit')} {isRTL ? 'الإعلان' : 'l\'annonce'}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-display text-xl font-semibold mb-4">
                {t('addListing.transactionType')}
              </h2>
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
              <h2 className="font-display text-xl font-semibold mb-4">
                {t('addListing.propertyType')}
              </h2>
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
                {t('addListing.city')} & {t('addListing.neighborhood')}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">{t('addListing.city')} *</Label>
                  <Select
                    value={formData.cityId}
                    onValueChange={(value) => handleSelectChange('cityId', value)}
                  >
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
                    <Label htmlFor="customNeighborhood">
                      {t('addListing.customNeighborhood')}
                    </Label>
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
                    {t('addListing.price')} *{' '}
                    {formData.transactionType === 'rent' && t('property.perMonth')}
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">{t('addListing.area')} *</Label>
                  <Input
                    id="area"
                    name="area"
                    type="number"
                    value={formData.area}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                {formData.propertyType !== 'land' &&
                  formData.propertyType !== 'commercial' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="bedrooms">{t('addListing.bedrooms')}</Label>
                        <Input
                          id="bedrooms"
                          name="bedrooms"
                          type="number"
                          value={formData.bedrooms}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bathrooms">{t('addListing.bathrooms')}</Label>
                        <Input
                          id="bathrooms"
                          name="bathrooms"
                          type="number"
                          value={formData.bathrooms}
                          onChange={handleInputChange}
                        />
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
                    <Label htmlFor="titleFr">{t('addListing.title_fr')} *</Label>
                    <Input
                      id="titleFr"
                      name="titleFr"
                      value={formData.titleFr}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titleAr">{t('addListing.title_ar')} *</Label>
                    <Input
                      id="titleAr"
                      name="titleAr"
                      value={formData.titleAr}
                      onChange={handleInputChange}
                      dir="rtl"
                      required
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="descriptionFr">{t('addListing.description_fr')}</Label>
                    <Textarea
                      id="descriptionFr"
                      name="descriptionFr"
                      value={formData.descriptionFr}
                      onChange={handleInputChange}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descriptionAr">{t('addListing.description_ar')}</Label>
                    <Textarea
                      id="descriptionAr"
                      name="descriptionAr"
                      value={formData.descriptionAr}
                      onChange={handleInputChange}
                      rows={4}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-display text-xl font-semibold mb-4">
                {t('addListing.images')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-video rounded-lg overflow-hidden bg-muted"
                  >
                    <img
                      src={image}
                      alt={`Upload ${index + 1}`}
                      className={cn(
                        "w-full h-full object-cover",
                        imageUploadStatus[index] === 'error' && "opacity-50"
                      )}
                    />
                    {/* Upload status indicator */}
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
                    <span className="text-sm text-muted-foreground">
                      {t('addListing.uploadImages')}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-display text-xl font-semibold mb-4">
                {t('addListing.phone')}
              </h2>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('addListing.phone')} *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {uploadProgress || (isRTL ? 'جاري المعالجة...' : 'Traitement...')}
                </span>
              ) : (
                t('common.save')
              )}
            </Button>

            {uploadProgress && (
              <p className="text-sm text-muted-foreground text-center animate-pulse">
                {uploadProgress}
              </p>
            )}
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
