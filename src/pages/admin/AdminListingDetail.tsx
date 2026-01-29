import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { sendFacebookWebhook, retryFacebookPost } from '@/lib/facebookWebhook';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  MapPin,
  Home,
  Ruler,
  Bed,
  Bath,
  Calendar,
  User,
  Mail,
  Phone,
  Share2,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ✅ Helper to check if string is URL
const isUrl = (s: string) => /^https?:\/\//i.test(s);

// ✅ Get public URL from storage path
const getPublicImageUrl = (pathOrUrl: string) => {
  if (isUrl(pathOrUrl)) return pathOrUrl;
  const { data } = supabase.storage.from('property-images').getPublicUrl(pathOrUrl);
  return data.publicUrl;
};

interface PropertyDetail {
  id: string;
  title_fr: string;
  title_ar: string;
  description_fr: string;
  description_ar: string;
  price: number;
  status: string;
  transaction_type: string;
  property_type: string;
  area_sqm: number;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  total_floors: number | null;
  year_built: number | null;
  furnished: boolean;
  parking: boolean;
  elevator: boolean;
  balcony: boolean;
  garden: boolean;
  pool: boolean;
  security: boolean;
  images: string[];
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
  published_at: string | null;
  facebook_posted: boolean;
  facebook_posted_at: string | null;
  facebook_post_id: string | null;
  facebook_post_error: string | null;
  city: { name_fr: string; name_ar: string } | null;
  neighborhood: { name_fr: string; name_ar: string } | null;
  owner: { 
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
  } | null;
}

export default function AdminListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPropertyDetail();
    }
  }, [id]);

  const fetchPropertyDetail = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        city:cities(name_fr, name_ar),
        neighborhood:neighborhoods(name_fr, name_ar),
        owner:profiles(id, email, full_name, phone)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('[AdminListingDetail] Error loading listing:', error);
      toast.error(isRTL ? 'خطأ في تحميل الإعلان' : 'Error loading listing');
      navigate('/admin/listings');
    } else if (data) {
      console.log('[AdminListingDetail] Property loaded:', {
        id: data.id,
        images: data.images,
        imagesCount: data.images?.length || 0,
      });
      setProperty(data as unknown as PropertyDetail);
    }

    setLoading(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!property) return;

    setActionLoading(true);
    
    try {
      // Get current user for approved_by field
      const { data: { user } } = await supabase.auth.getUser();
      
      // Prepare update data
      const updateData: any = { status: newStatus };
      
      // If approving, set approval fields
      if (newStatus === 'approved') {
        const now = new Date().toISOString();
        updateData.approved_at = now;
        updateData.approved_by = user?.id || null;
        updateData.published_at = now;
      }
      
      // Update the listing
      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', property.id);

      if (error) {
        toast.error(isRTL ? 'خطأ في تحديث الحالة' : 'Error updating status');
        setActionLoading(false);
        return;
      }

      // If approved, send Facebook webhook
      if (newStatus === 'approved') {
        try {
          const webhookResult = await sendFacebookWebhook(property.id);
          
          if (webhookResult.already_posted) {
            toast.info(
              isRTL 
                ? 'تم نشر الإعلان على فيسبوك مسبقاً' 
                : 'Already posted to Facebook'
            );
          } else if (webhookResult.skipped) {
            toast.warning(
              isRTL 
                ? 'لم يتم تكوين رابط الويب هوك' 
                : 'Webhook URL not configured'
            );
          } else if (webhookResult.success) {
            toast.success(
              isRTL 
                ? 'تم اعتماد الإعلان ونشره على فيسبوك' 
                : 'Listing approved and posted to Facebook'
            );
          }
        } catch (webhookError) {
          console.error('Webhook error:', webhookError);
          toast.warning(
            isRTL 
              ? 'تم اعتماد الإعلان لكن فشل النشر على فيسبوك' 
              : 'Listing approved but Facebook posting failed'
          );
        }
      } else {
        toast.success(
          isRTL
            ? `تم ${newStatus === 'approved' ? 'اعتماد' : 'رفض'} الإعلان`
            : `Listing ${newStatus === 'approved' ? 'approved' : 'rejected'}`
        );
      }

      // Refresh the property data
      await fetchPropertyDetail();
      
    } catch (error) {
      console.error('Status change error:', error);
      toast.error(isRTL ? 'خطأ في تحديث الحالة' : 'Error updating status');
    }

    setActionLoading(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleRetryFacebookPost = async () => {
    if (!property) return;

    setActionLoading(true);
    
    try {
      const result = await retryFacebookPost(property.id);
      
      if (result.success) {
        toast.success(
          isRTL 
            ? 'تم نشر الإعلان على فيسبوك بنجاح' 
            : 'Successfully posted to Facebook'
        );
      } else {
        toast.error(
          isRTL 
            ? 'فشل النشر على فيسبوك' 
            : 'Failed to post to Facebook'
        );
      }
      
      // Refresh the property data
      await fetchPropertyDetail();
      
    } catch (error) {
      console.error('Retry error:', error);
      toast.error(
        isRTL 
          ? 'خطأ في إعادة المحاولة' 
          : 'Error retrying Facebook post'
      );
    }

    setActionLoading(false);
  };

  // ✅ Delete property handler
  const handleDelete = async () => {
    if (!property) return;

    const confirmed = window.confirm(
      isRTL 
        ? 'واش متأكد بغيت تحذف هاد الإعلان نهائياً؟ غادي يتحذف من قاعدة البيانات و التخزين.'
        : 'Are you sure you want to permanently delete this listing? It will be removed from the database and storage.'
    );

    if (!confirmed) return;

    setActionLoading(true);

    try {
      // 1) Delete images from storage (only paths, not URLs)
      if (property.images && property.images.length > 0) {
        const paths = property.images.filter((img) => !isUrl(img));
        if (paths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('property-images')
            .remove(paths);
          if (storageError) {
            console.warn('[AdminListingDetail] Storage deletion warning:', storageError);
          }
        }
      }

      // 2) Delete property from database
      const { error: dbError } = await supabase
        .from('properties')
        .delete()
        .eq('id', property.id);

      if (dbError) {
        console.error('[AdminListingDetail] Delete error:', dbError);
        toast.error(
          isRTL 
            ? `فشل الحذف: ${dbError.message}` 
            : `Failed to delete: ${dbError.message}`
        );
        return;
      }

      toast.success(isRTL ? 'تم حذف الإعلان بنجاح' : 'Listing deleted successfully');
      navigate('/admin/listings');
    } catch (error: any) {
      console.error('[AdminListingDetail] Unexpected delete error:', error);
      toast.error(
        isRTL 
          ? 'وقع خطأ غير متوقع فالحذف' 
          : 'Unexpected error deleting listing'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-MA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    const labels: Record<string, { fr: string; ar: string }> = {
      pending: { fr: 'En attente', ar: 'قيد الانتظار' },
      approved: { fr: 'Approuvé', ar: 'معتمد' },
      rejected: { fr: 'Rejeté', ar: 'مرفوض' },
    };

    const label = language === 'ar' ? labels[status]?.ar : labels[status]?.fr;

    return (
      <Badge className={cn('font-medium', variants[status] || '')}>
        {label || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!property) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {isRTL ? 'الإعلان غير موجود' : 'Listing not found'}
          </p>
        </div>
      </AdminLayout>
    );
  }

  const title = language === 'ar' ? property.title_ar : property.title_fr;
  const description = language === 'ar' ? property.description_ar : property.description_fr;
  const cityName = property.city ? (language === 'ar' ? property.city.name_ar : property.city.name_fr) : '-';
  const neighborhoodName = property.neighborhood ? (language === 'ar' ? property.neighborhood.name_ar : property.neighborhood.name_fr) : '-';

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/listings')}>
            <ArrowLeft className={cn('h-5 w-5', isRTL && 'rotate-180')} />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            <p className="mt-2 text-muted-foreground">
              {isRTL ? 'تفاصيل الإعلان' : 'Listing Details'}
            </p>
          </div>
          <div>{getStatusBadge(property.status)}</div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {property.status === 'pending' && (
            <>
              <Button
                onClick={() => handleStatusChange('approved')}
                disabled={actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {isRTL ? 'اعتماد' : 'Approve'}
              </Button>
              <Button
                onClick={() => handleStatusChange('rejected')}
                disabled={actionLoading}
                variant="destructive"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                {isRTL ? 'رفض' : 'Reject'}
              </Button>
            </>
          )}

          {/* ✅ Delete button for all statuses */}
          <Button
            onClick={handleDelete}
            disabled={actionLoading}
            variant="destructive"
            className="ml-auto"
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            {isRTL ? 'حذف' : 'Delete'}
          </Button>
        </div>

        {/* Facebook Posting Status & Retry */}
        {property.status === 'approved' && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">
                    {isRTL ? 'حالة النشر على فيسبوك' : 'Facebook Posting Status'}
                  </h3>
                  {property.facebook_posted ? (
                    <p className="text-sm text-blue-700 mt-1">
                      {isRTL 
                        ? `تم النشر بنجاح في ${property.facebook_posted_at ? formatDate(property.facebook_posted_at) : '-'}`
                        : `Posted successfully on ${property.facebook_posted_at ? formatDate(property.facebook_posted_at) : '-'}`
                      }
                      {property.facebook_post_id && (
                        <span className="block text-xs text-blue-600 mt-1">
                          Post ID: {property.facebook_post_id}
                        </span>
                      )}
                    </p>
                  ) : (
                    <div>
                      <p className="text-sm text-orange-700 mt-1">
                        {isRTL ? 'لم يتم النشر بعد' : 'Not posted yet'}
                      </p>
                      {property.facebook_post_error && (
                        <p className="text-xs text-red-600 mt-1">
                          {isRTL ? 'خطأ: ' : 'Error: '}{property.facebook_post_error}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {!property.facebook_posted && (
                  <Button
                    onClick={handleRetryFacebookPost}
                    disabled={actionLoading}
                    size="sm"
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {isRTL ? 'إعادة المحاولة' : 'Retry Post'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content - 2/3 width */}
          <div className="md:col-span-2 space-y-6">
            {/* Images */}
            {property.images && property.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? 'الصور' : 'Images'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {property.images.map((image, index) => {
                      const imageUrl = getPublicImageUrl(image);
                      console.log('[AdminListingDetail] Rendering image:', { index, original: image, url: imageUrl });
                      
                      return (
                        <img
                          key={index}
                          src={imageUrl}
                          alt={`${title} - ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg border"
                          onError={(e) => {
                            console.error('[AdminListingDetail] Image load error:', imageUrl);
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'الوصف' : 'Description'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{description}</p>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'تفاصيل العقار' : 'Property Details'}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{isRTL ? 'النوع:' : 'Type:'}</strong> {property.property_type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>{isRTL ? 'المساحة:' : 'Area:'}</strong> {property.area_sqm} m²
                  </span>
                </div>
                {property.bedrooms !== null && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>{isRTL ? 'غرف النوم:' : 'Bedrooms:'}</strong> {property.bedrooms}
                    </span>
                  </div>
                )}
                {property.bathrooms !== null && (
                  <div className="flex items-center gap-2">
                    <Bath className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>{isRTL ? 'الحمامات:' : 'Bathrooms:'}</strong> {property.bathrooms}
                    </span>
                  </div>
                )}
                {property.floor !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      <strong>{isRTL ? 'الطابق:' : 'Floor:'}</strong> {property.floor}
                      {property.total_floors && ` / ${property.total_floors}`}
                    </span>
                  </div>
                )}
                {property.year_built !== null && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>{isRTL ? 'سنة البناء:' : 'Year Built:'}</strong> {property.year_built}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'المميزات' : 'Features'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.furnished && (
                    <Badge variant="secondary">{isRTL ? 'مفروش' : 'Furnished'}</Badge>
                  )}
                  {property.parking && (
                    <Badge variant="secondary">{isRTL ? 'موقف سيارات' : 'Parking'}</Badge>
                  )}
                  {property.elevator && (
                    <Badge variant="secondary">{isRTL ? 'مصعد' : 'Elevator'}</Badge>
                  )}
                  {property.balcony && (
                    <Badge variant="secondary">{isRTL ? 'شرفة' : 'Balcony'}</Badge>
                  )}
                  {property.garden && (
                    <Badge variant="secondary">{isRTL ? 'حديقة' : 'Garden'}</Badge>
                  )}
                  {property.pool && (
                    <Badge variant="secondary">{isRTL ? 'مسبح' : 'Pool'}</Badge>
                  )}
                  {property.security && (
                    <Badge variant="secondary">{isRTL ? 'حراسة' : 'Security'}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Share Listing Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  {isRTL ? 'مشاركة' : 'Share'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {isRTL
                    ? '(قريبًا) نسخ نص فيسبوك/تيك توك + تنزيل الصور'
                    : '(Coming next) Copy Facebook/TikTok text + Download images'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Price & Location */}
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'السعر والموقع' : 'Price & Location'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'السعر' : 'Price'}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(property.price)} DH
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {property.transaction_type === 'sale' 
                      ? (isRTL ? 'للبيع' : 'For Sale')
                      : (isRTL ? 'للإيجار' : 'For Rent')}
                  </p>
                </div>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{isRTL ? 'الموقع' : 'Location'}</p>
                  </div>
                  <p className="text-sm">{cityName}</p>
                  {neighborhoodName !== '-' && (
                    <p className="text-sm text-muted-foreground">{neighborhoodName}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Owner Information */}
            {property.owner && (
              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? 'معلومات المالك' : 'Owner Information'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {property.owner.full_name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{property.owner.full_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm break-all">{property.owner.email}</span>
                  </div>
                  {property.owner.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{property.owner.phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'معلومات إضافية' : 'Metadata'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">{isRTL ? 'تاريخ النشر' : 'Created'}</p>
                  <p>{formatDate(property.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{isRTL ? 'آخر تحديث' : 'Updated'}</p>
                  <p>{formatDate(property.updated_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{isRTL ? 'معرف الإعلان' : 'Listing ID'}</p>
                  <p className="font-mono text-xs break-all">{property.id}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
