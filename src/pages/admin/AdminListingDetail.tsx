import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/auditLog';
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
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor_number: number | null;
  total_floors: number | null;
  year_built: number | null;
  
  // Contact information
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  
  // Advertiser info
  advertiser_type: string | null;
  rejection_reason: string | null;
  
  // Features
  features: any;
  amenities: any;
  
  images: string[];
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
  published_at: string | null;
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
      .maybeSingle();

    if (error) {
      console.error('[AdminListingDetail] Error loading listing:', error);
      toast.error(isRTL ? 'خطأ في تحميل الإعلان' : 'Error loading listing');
      navigate('/admin/listings');
    } else if (!data) {
      console.warn('[Admin] Record not found', { id });
      toast.error(isRTL ? 'الإعلان غير موجود' : 'Listing not found');
      navigate('/admin/listings');
    } else {
      // ✅ Debug log (for image display issue diagnosis - Issue #2)
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

    // ===== STEP A: Confirm onClick is triggered =====
    console.group('🔍 [STEP A] Approve/Reject onClick Triggered');
    console.log('Function: handleStatusChange (AdminListingDetail)');
    console.log('Timestamp:', new Date().toISOString());
    console.log('New Status:', newStatus);
    console.log('Property ID:', property.id);
    console.log('Property Title:', property.title_fr);
    console.groupEnd();

    setActionLoading(true);
    
    try {
      // Get current user for approved_by field
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Current User ID:', user?.id);
      console.log('Current User Email:', user?.email);
      
      // Prepare update data
      const updateData: any = { status: newStatus };
      
      // If approving, set approval fields
      if (newStatus === 'approved') {
        const now = new Date().toISOString();
        updateData.approved_at = now;
        updateData.approved_by = user?.id || null;
        updateData.published_at = now;
      } else if (newStatus === 'rejected') {
        const now = new Date().toISOString();
        updateData.rejected_at = now;
        updateData.rejected_by = user?.id || null;
        // rejection_reason should be set separately via the UI
      }
      
      // ===== STEP B: Confirm network request is sent =====
      console.group('🔍 [STEP B] Sending Supabase Update Request');
      console.log('Table:', 'properties');
      console.log('Property ID:', property.id);
      console.log('Update Data:', JSON.stringify(updateData, null, 2));
      console.log('Request Time:', new Date().toISOString());
      console.groupEnd();
      
      // Update the listing
      const { data, error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', property.id)
        .select()
        .maybeSingle();

      // ===== STEP C: Confirm Supabase response and errors =====
      console.group('🔍 [STEP C] Supabase Response');
      console.log('Response Time:', new Date().toISOString());
      if (error) {
        console.error('❌ Error Object:', error);
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('Error Details:', error.details);
        console.error('Error Hint:', error.hint);
        console.groupEnd();
        
        toast.error(isRTL ? 'خطأ في تحديث الحالة' : 'Error updating status');
        setActionLoading(false);
        return;
      }
      
      if (!data) {
        console.warn('[Admin] Record not found', { id: property.id });
        console.groupEnd();
        toast.error(isRTL ? 'الإعلان غير موجود' : 'Listing not found');
        setActionLoading(false);
        navigate('/admin/listings');
        return;
      }
      
      console.log('✅ Success - No Error');
      console.log('Response Data:', data);
      console.groupEnd();
      
      // ===== STEP D: Confirm DB update happens =====
      console.group('🔍 [STEP D] Verifying DB Update');
      const { data: verifyData, error: verifyError } = await supabase
        .from('properties')
        .select('id, status, approved_at, approved_by, published_at, rejected_at, rejected_by')
        .eq('id', property.id)
        .maybeSingle();
      
      if (verifyError) {
        console.error('❌ Verification Query Error:', verifyError);
      } else {
        console.log('✅ Current DB State:', verifyData);
        console.log('Status Match:', verifyData?.status === newStatus ? '✅ YES' : '❌ NO');
        if (newStatus === 'approved') {
          console.log('Approved At Set:', verifyData?.approved_at ? '✅ YES' : '❌ NO');
          console.log('Approved By Set:', verifyData?.approved_by ? '✅ YES' : '❌ NO');
          console.log('Published At Set:', verifyData?.published_at ? '✅ YES' : '❌ NO');
        } else if (newStatus === 'rejected') {
          console.log('Rejected At Set:', verifyData?.rejected_at ? '✅ YES' : '❌ NO');
          console.log('Rejected By Set:', verifyData?.rejected_by ? '✅ YES' : '❌ NO');
        }
      }
      console.groupEnd();

      // If approved, log audit action
      if (newStatus === 'approved') {
        // Log audit action (wrapped in try/catch to not break flow)
        try {
          await logAdminAction({
            action: 'approve',
            entity_type: 'property',
            entity_id: property.id,
            metadata: { title: property.title_fr },
          });
        } catch (auditError) {
          console.warn('Failed to log audit action, continuing anyway:', auditError);
        }

        // Facebook webhook removed from client-side approval flow
        // Use manual retry button below or configure Supabase Database Webhooks
        toast.success(
          isRTL 
            ? 'تم اعتماد الإعلان' 
            : 'Listing approved'
        );
      } else if (newStatus === 'rejected') {
        // Log audit action for rejection (wrapped in try/catch to not break flow)
        try {
          await logAdminAction({
            action: 'reject',
            entity_type: 'property',
            entity_id: property.id,
            metadata: { title: property.title_fr, reason: property.rejection_reason },
          });
        } catch (auditError) {
          console.warn('Failed to log audit action, continuing anyway:', auditError);
        }

        toast.success(
          isRTL ? 'تم رفض الإعلان' : 'Listing rejected'
        );
      } else {
        toast.success(
          isRTL
            ? `تم ${newStatus === 'approved' ? 'اعتماد' : 'رفض'} الإعلان`
            : `Listing ${newStatus === 'approved' ? 'approved' : 'rejected'}`
        );
      }

      
    } catch (error) {
      console.error('Status change error:', error);
      toast.error(isRTL ? 'خطأ في تحديث الحالة' : 'Error updating status');
    } finally {
      // Always refresh property data and clear loading state
      try {
        await fetchPropertyDetail();
      } catch (fetchError) {
        console.error('Error refreshing property data:', fetchError);
      }
      setActionLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(price);
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
        setActionLoading(false);
        return;
      }

      // Log audit action
      await logAdminAction({
        action: 'delete',
        entity_type: 'property',
        entity_id: property.id,
        metadata: { title: property.title_fr },
      });

      toast.success(isRTL ? 'تم حذف الإعلان بنجاح' : 'Listing deleted successfully');
      navigate('/admin/listings');
    } catch (error: any) {
      console.error('[AdminListingDetail] Unexpected delete error:', error);
      toast.error(
        isRTL 
          ? 'وقع خطأ غير متوقع فالحذف' 
          : 'Unexpected error deleting listing'
      );
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
                      // ✅ Debug log (for image display issue diagnosis - Issue #2)
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
                {property.area && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>{isRTL ? 'المساحة:' : 'Area:'}</strong> {property.area} m²
                    </span>
                  </div>
                )}
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
                {property.floor_number !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      <strong>{isRTL ? 'الطابق:' : 'Floor:'}</strong> {property.floor_number}
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

            {/* Features & Amenities */}
            {((property.features && Array.isArray(property.features) && property.features.length > 0) ||
              (property.amenities && Array.isArray(property.amenities) && property.amenities.length > 0)) && (
              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? 'المميزات' : 'Features'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {property.features && Array.isArray(property.features) && property.features.map((feature: string, idx: number) => (
                      <Badge key={`feature-${idx}`} variant="secondary">{feature}</Badge>
                    ))}
                    {property.amenities && Array.isArray(property.amenities) && property.amenities.map((amenity: string, idx: number) => (
                      <Badge key={`amenity-${idx}`} variant="secondary">{amenity}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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

            {/* Contact Information (from property) */}
            {(property.contact_phone || property.contact_whatsapp || property.contact_email) && (
              <Card>
                <CardHeader>
                  <CardTitle>{isRTL ? 'معلومات الاتصال' : 'Contact Information'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {property.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">{isRTL ? 'الهاتف' : 'Phone'}</p>
                        <p className="text-sm font-medium">{property.contact_phone}</p>
                      </div>
                    </div>
                  )}
                  {property.contact_whatsapp && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">{isRTL ? 'واتساب' : 'WhatsApp'}</p>
                        <p className="text-sm font-medium">{property.contact_whatsapp}</p>
                      </div>
                    </div>
                  )}
                  {property.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">{isRTL ? 'البريد الإلكتروني' : 'Email'}</p>
                        <p className="text-sm font-medium break-all">{property.contact_email}</p>
                      </div>
                    </div>
                  )}
                  {property.advertiser_type && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">{isRTL ? 'نوع المعلن' : 'Advertiser Type'}</p>
                        <Badge className="mt-1" variant="secondary">
                          {property.advertiser_type === 'owner' && (isRTL ? 'مالك' : 'Owner')}
                          {property.advertiser_type === 'broker' && (isRTL ? 'سمسار' : 'Broker')}
                          {property.advertiser_type === 'agency' && (isRTL ? 'وكالة' : 'Agency')}
                        </Badge>
                      </div>
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
                {property.status === 'rejected' && property.rejection_reason && (
                  <div>
                    <p className="text-muted-foreground">{isRTL ? 'سبب الرفض' : 'Rejection Reason'}</p>
                    <p className="text-red-600 font-medium">{property.rejection_reason}</p>
                  </div>
                )}
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
