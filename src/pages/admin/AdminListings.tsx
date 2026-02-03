import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/auditLog';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, CheckCircle, XCircle, Loader2, Trash2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { ImageModal } from '@/components/admin/ImageModal';
import { Textarea } from '@/components/ui/textarea';

type ProfileInfo = {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
} | null;

interface Property {
  id: string;
  title_fr: string;
  title_ar: string;
  price: number;
  status: string;
  transaction_type: string;
  property_type: string;
  created_at: string;

  owner_id?: string | null;
  images?: string[] | null;
  owner_profile?: ProfileInfo;

  // Contact information
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_email?: string | null;

  // Advertiser info
  advertiser_type?: string | null;
  rejection_reason?: string | null;

  // Additional fields
  area?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  featured?: boolean | null;

  city: { name_fr: string; name_ar: string } | null;
  neighborhood: { name_fr: string; name_ar: string } | null;
}

// ===== Helpers =====
const isUrl = (s: string) => /^https?:\/\//i.test(s);

// Supabase Storage public url from path
const getPublicImageUrlFromPath = (path: string) => {
  const { data } = supabase.storage.from('property-images').getPublicUrl(path);
  return data.publicUrl;
};

// if url keep it, if path build public url
const getDisplayImageUrl = (img: string) => (isUrl(img) ? img : getPublicImageUrlFromPath(img));

const getFirstImage = (images?: string[] | null) => {
  if (!images || images.length === 0) return null;
  return images[0];
};

// Delete storage images (only paths; URLs are ignored)
const deleteStorageImages = async (images?: string[] | null) => {
  if (!images || images.length === 0) return;

  // Keep only paths (not URLs)
  const paths = images
    .filter((p) => typeof p === 'string' && p.trim().length > 0)
    .filter((p) => !isUrl(p));

  if (paths.length === 0) return;

  const { error } = await supabase.storage.from('property-images').remove(paths);
  if (error) console.warn('Storage remove error:', error);
};

export default function AdminListings() {
  const { language, isRTL } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'pending';

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<string>('');
  const pageSize = 50;

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingPropertyId, setRejectingPropertyId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Image modal state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  const fetchProperties = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('properties')
        .select(
          `
            id,
            title_fr,
            title_ar,
            price,
            status,
            transaction_type,
            property_type,
            created_at,
            owner_id,
            images,
            contact_phone,
            contact_whatsapp,
            contact_email,
            advertiser_type,
            rejection_reason,
            area,
            bedrooms,
            bathrooms,
            featured,
            city:cities(name_fr, name_ar),
            neighborhood:neighborhoods(name_fr, name_ar)
          `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (statusFilter !== 'all') query = query.eq('status', statusFilter);

      const { data, count, error } = await query;

      if (error) {
        console.error('FETCH ERROR (admin listings):', error);
        toast.error(isRTL ? `خطأ فـ جلب الإعلانات: ${error.message}` : `Error fetching listings: ${error.message}`);
        setProperties([]);
        setTotalCount(0);
        return;
      }

      const base = (data ?? []) as unknown as Property[];

      // Fetch owners profiles once
      const ownerIds = Array.from(new Set(base.map((p) => p.owner_id).filter(Boolean))) as string[];

      const profilesMap = new Map<string, ProfileInfo>();

      if (ownerIds.length > 0) {
        const { data: profs, error: profErr } = await supabase
          .from('profiles')
          .select('id, full_name, phone, email')
          .in('id', ownerIds);

        if (profErr) {
          console.warn('Could not fetch profiles:', profErr);
        } else {
          (profs ?? []).forEach((pr: any) => profilesMap.set(pr.id, pr));
        }
      }

      const merged = base.map((p) => ({
        ...p,
        owner_profile: p.owner_id ? profilesMap.get(p.owner_id) ?? null : null,
      }));

      // ✅ Debug صغير باش نعرفو شنو داخل images
      console.log('IMAGES SAMPLE:', merged[0]?.images);

      // 🔍 DIAGNOSTIC LOGGING - Verify contact fields are being fetched
      console.group('📊 Admin Listings - Data Diagnostic');
      console.log('Total properties fetched:', merged.length);
      console.log('Sample property data:', merged[0]);
      if (merged.length > 0) {
        console.log('Contact fields check:');
        console.log('  - contact_phone:', merged[0]?.contact_phone);
        console.log('  - contact_whatsapp:', merged[0]?.contact_whatsapp);
        console.log('  - contact_email:', merged[0]?.contact_email);
        console.log('  - advertiser_type:', merged[0]?.advertiser_type);
      }
      console.log('Data fetched at:', new Date().toISOString());
      console.log('Environment:', import.meta.env.MODE);
      console.groupEnd();

      setProperties(merged);
      if (count !== null) setTotalCount(count);
      setLastFetchTime(new Date().toISOString());
    } catch (e: any) {
      console.error('UNEXPECTED FETCH ERROR:', e);
      toast.error(isRTL ? 'وقع خطأ غير متوقع فـ جلب الإعلانات' : 'Unexpected error while fetching listings');
      setProperties([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (propertyId: string, newStatus: string) => {
    // For reject, show confirmation dialog
    if (newStatus === 'rejected') {
      setRejectingPropertyId(propertyId);
      setRejectDialogOpen(true);
      return;
    }

    // For approve, proceed directly
    await performStatusChange(propertyId, newStatus);
  };

  const performStatusChange = async (propertyId: string, newStatus: string, reason?: string) => {
    // ===== STEP A: Confirm onClick is triggered =====
    console.group('🔍 [STEP A] Approve/Reject onClick Triggered');
    console.log('Function: performStatusChange (AdminListings)');
    console.log('Timestamp:', new Date().toISOString());
    console.log('New Status:', newStatus);
    console.log('Property ID:', propertyId);
    if (reason) console.log('Rejection Reason:', reason);
    const property = properties.find(p => p.id === propertyId);
    console.log('Property Title:', property?.title_fr || 'Unknown');
    console.groupEnd();

    setActionLoading(propertyId);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      console.log('Current User ID:', user?.id);
      console.log('Current User Email:', user?.email);

      const updateData: any = { status: newStatus };

      if (newStatus === 'approved') {
        const now = new Date().toISOString();
        // When admin approves, set status to 'published' to make it publicly visible
        updateData.status = 'published';
        updateData.approved_at = now;
        updateData.approved_by = user?.id || null;
        updateData.published_at = now;
      } else if (newStatus === 'rejected') {
        const now = new Date().toISOString();
        updateData.rejected_at = now;
        updateData.rejected_by = user?.id || null;
        if (reason) {
          updateData.rejection_reason = reason;
        }
      }

      // ===== STEP B: Confirm network request is sent =====
      console.group('🔍 [STEP B] Sending Supabase Update Request');
      console.log('Table:', 'properties');
      console.log('Property ID:', propertyId);
      console.log('Update Data:', JSON.stringify(updateData, null, 2));
      console.log('Request Time:', new Date().toISOString());
      console.groupEnd();

      const { data, error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', propertyId)
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
        return;
      }
      
      if (!data) {
        console.warn('[Admin] Record not found', { id: propertyId });
        console.groupEnd();
        toast.error(isRTL ? 'لم يتم العثور على الإعلان' : 'Property not found');
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
        .eq('id', propertyId)
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
      
      // Log audit action (wrapped in try/catch to not break flow)
      const property = properties.find(p => p.id === propertyId);
      if (newStatus === 'approved') {
        try {
          await logAdminAction({
            action: 'approve',
            entity_type: 'property',
            entity_id: propertyId,
            metadata: { title: property?.title_fr || '' },
          });
        } catch (auditError) {
          console.warn('Failed to log audit action, continuing anyway:', auditError);
        }

        toast.success(isRTL ? 'تم اعتماد الإعلان' : 'Listing approved');
      } else if (newStatus === 'rejected') {
        try {
          await logAdminAction({
            action: 'reject',
            entity_type: 'property',
            entity_id: propertyId,
            metadata: { 
              title: property?.title_fr || '',
              reason: reason || '',
            },
          });
        } catch (auditError) {
          console.warn('Failed to log audit action, continuing anyway:', auditError);
        }

        toast.success(isRTL ? 'تم رفض الإعلان' : 'Listing rejected');
      } else {
        toast.success(
          isRTL ? 'تم تحديث الإعلان' : 'Listing updated'
        );
      }

      // Update UI: if current filter is 'pending', remove the row; otherwise update status
      if (statusFilter === 'pending') {
        // Remove from list since it's no longer pending
        setProperties(prev => prev.filter(p => p.id !== propertyId));
        setTotalCount(prev => Math.max(0, prev - 1));
      } else {
        // Update the row status in place
        setProperties(prev => prev.map(p => 
          p.id === propertyId 
            ? { ...p, status: newStatus, ...updateData }
            : p
        ));
      }
    } catch (error) {
      console.error('Status change error:', error);
      toast.error(isRTL ? 'خطأ في تحديث الحالة' : 'Error updating status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingPropertyId) return;
    
    setRejectDialogOpen(false);
    await performStatusChange(rejectingPropertyId, 'rejected', rejectionReason);
    
    // Reset state
    setRejectingPropertyId(null);
    setRejectionReason('');
  };

  const handleRejectCancel = () => {
    setRejectDialogOpen(false);
    setRejectingPropertyId(null);
    setRejectionReason('');
  };

  const handleImageClick = (images: string[] | null | undefined) => {
    if (!images || images.length === 0) return;
    
    const displayUrls = images.map(img => getDisplayImageUrl(img));
    setModalImages(displayUrls);
    setModalInitialIndex(0);
    setImageModalOpen(true);
  };

  const handleDelete = async (property: Property) => {
    const ok = window.confirm(
      isRTL ? 'واش متأكد بغيت تحذف هاد الإعلان نهائياً؟' : 'Are you sure you want to permanently delete this listing?'
    );
    if (!ok) return;

    setActionLoading(property.id);

    try {
      // 1) delete storage images (paths only)
      await deleteStorageImages(property.images);

      // 2) delete DB row
      const { error } = await supabase.from('properties').delete().eq('id', property.id);

      if (error) {
        console.error('Delete error:', error);
        toast.error(isRTL ? `فشل حذف الإعلان: ${error.message}` : `Failed to delete: ${error.message}`);
        return;
      }

      // Log audit action
      await logAdminAction({
        action: 'delete',
        entity_type: 'property',
        entity_id: property.id,
        metadata: { title: property.title_fr },
      });

      toast.success(isRTL ? 'تم حذف الإعلان' : 'Listing deleted');
      await fetchProperties();
    } catch (e: any) {
      console.error(e);
      toast.error(isRTL ? 'وقع خطأ غير متوقع فالحذف' : 'Unexpected delete error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCSV = () => {
    try {
      // Prepare CSV headers
      const headers = [
        'ID',
        'Title (FR)',
        'Title (AR)',
        'Price',
        'Status',
        'Type',
        'Transaction',
        'City',
        'Neighborhood',
        'Contact Phone',
        'Contact WhatsApp',
        'Contact Email',
        'Advertiser Type',
        'Created At',
      ];

      // Prepare CSV rows
      const rows = properties.map((property) => [
        property.id,
        `"${property.title_fr?.replace(/"/g, '""') || ''}"`,
        `"${property.title_ar?.replace(/"/g, '""') || ''}"`,
        property.price,
        property.status,
        property.property_type,
        property.transaction_type,
        getCityName(property.city),
        getNeighborhoodName(property.neighborhood),
        property.contact_phone || '',
        property.contact_whatsapp || '',
        property.contact_email || '',
        property.advertiser_type || '',
        formatDate(property.created_at),
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n');

      // Create a Blob and download
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `listings_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isRTL ? 'تم تصدير البيانات بنجاح' : 'Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(isRTL ? 'خطأ في التصدير' : 'Export error');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      published: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      sold: 'bg-blue-100 text-blue-800',
      rented: 'bg-purple-100 text-purple-800',
    };

    const labels: Record<string, { fr: string; ar: string }> = {
      pending: { fr: 'En attente', ar: 'قيد الانتظار' },
      approved: { fr: 'Approuvé', ar: 'معتمد' },
      published: { fr: 'Approuvé', ar: 'معتمد' },
      rejected: { fr: 'Rejeté', ar: 'مرفوض' },
      sold: { fr: 'Vendu', ar: 'مباع' },
      rented: { fr: 'Loué', ar: 'مؤجر' },
    };

    const label = language === 'ar' ? labels[status]?.ar : labels[status]?.fr;

    return (
      <Badge className={cn('font-medium', variants[status] || '')}>
        {label || status}
      </Badge>
    );
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-MA', { style: 'decimal', maximumFractionDigits: 0 }).format(price);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-MA');

  const getTitle = (property: Property) => (language === 'ar' ? property.title_ar : property.title_fr);

  const getCityName = (city: Property['city']) => {
    if (!city) return '-';
    return language === 'ar' ? city.name_ar : city.name_fr;
  };

  const getNeighborhoodName = (neighborhood: Property['neighborhood']) => {
    if (!neighborhood) return '-';
    return language === 'ar' ? neighborhood.name_ar : neighborhood.name_fr;
  };

  const getOwnerLabel = (p: Property) => {
    const prof = p.owner_profile;
    if (!prof) return '-';
    return prof.full_name || prof.phone || prof.email || (isRTL ? 'مستخدم' : 'User');
  };

  const getAdvertiserTypeBadge = (advertiserType?: string | null) => {
    if (!advertiserType) return null;

    const variants: Record<string, string> = {
      owner: 'bg-blue-100 text-blue-800',
      broker: 'bg-purple-100 text-purple-800',
      agency: 'bg-orange-100 text-orange-800',
    };

    const labels: Record<string, { fr: string; ar: string }> = {
      owner: { fr: 'Propriétaire', ar: 'مالك' },
      broker: { fr: 'Courtier', ar: 'سمسار' },
      agency: { fr: 'Agence', ar: 'وكالة' },
    };

    const label = language === 'ar' ? labels[advertiserType]?.ar : labels[advertiserType]?.fr;

    return (
      <Badge className={cn('font-medium text-xs', variants[advertiserType] || '')}>
        {label || advertiserType}
      </Badge>
    );
  };

  const getContactPhone = (p: Property) => {
    // Prefer contact_phone from property, fallback to owner profile phone
    return p.contact_phone || p.owner_profile?.phone || '-';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isRTL ? 'إدارة الإعلانات' : 'Manage Listings'}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {isRTL ? 'مراجعة والموافقة على إعلانات العقارات' : 'Review and approve property listings'}
            </p>
            {lastFetchTime && (
              <p className="mt-1 text-xs text-muted-foreground">
                {isRTL ? 'آخر تحديث: ' : 'Last updated: '}
                {new Date(lastFetchTime).toLocaleString(language === 'ar' ? 'ar-MA' : 'fr-MA')}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={(value) => setSearchParams({ status: value })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={isRTL ? 'اختر الحالة' : 'Select status'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
                <SelectItem value="pending">{isRTL ? 'قيد الانتظار' : 'Pending'}</SelectItem>
                <SelectItem value="approved">{isRTL ? 'معتمد' : 'Approved'}</SelectItem>
                <SelectItem value="rejected">{isRTL ? 'مرفوض' : 'Rejected'}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={properties.length === 0}
            >
              <Download className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              {isRTL ? 'تصدير CSV' : 'Export CSV'}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{isRTL ? 'لا توجد إعلانات' : 'No listings found'}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">{isRTL ? 'صورة' : 'Image'}</TableHead>
                    <TableHead>{isRTL ? 'العنوان' : 'Title'}</TableHead>
                    <TableHead>{isRTL ? 'صاحب الإعلان' : 'Owner'}</TableHead>
                    <TableHead>{isRTL ? 'نوع المعلن' : 'Advertiser'}</TableHead>
                    <TableHead>{isRTL ? 'الهاتف' : 'Phone'}</TableHead>
                    <TableHead>{isRTL ? 'المدينة' : 'City'}</TableHead>
                    <TableHead>{isRTL ? 'الحي' : 'Neighborhood'}</TableHead>
                    <TableHead>{isRTL ? 'السعر' : 'Price'}</TableHead>
                    <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                    <TableHead className="text-right">{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {properties.map((property) => {
                    const firstImg = getFirstImage(property.images);
                    const imgUrl = firstImg ? getDisplayImageUrl(firstImg) : null;
                    const imageCount = property.images?.length || 0;

                    return (
                      <TableRow key={property.id}>
                        <TableCell>
                          {imgUrl ? (
                            <div className="relative">
                              <img
                                src={imgUrl}
                                alt="property"
                                className="h-14 w-24 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                loading="lazy"
                                onClick={() => handleImageClick(property.images)}
                                onError={(e) => {
                                  // helpful debug
                                  console.warn('IMAGE LOAD ERROR:', imgUrl);
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              {imageCount > 1 && (
                                <div 
                                  className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded cursor-pointer"
                                  onClick={() => handleImageClick(property.images)}
                                >
                                  +{imageCount - 1}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-14 w-24 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              {isRTL ? 'بدون صورة' : 'No image'}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="font-medium max-w-xs truncate">{getTitle(property)}</TableCell>
                        <TableCell className="max-w-[220px] truncate">{getOwnerLabel(property)}</TableCell>
                        <TableCell>{getAdvertiserTypeBadge(property.advertiser_type)}</TableCell>
                        <TableCell className="max-w-[140px] truncate">{getContactPhone(property)}</TableCell>
                        <TableCell>{getCityName(property.city)}</TableCell>
                        <TableCell>{getNeighborhoodName(property.neighborhood)}</TableCell>
                        <TableCell>{formatPrice(property.price)} DH</TableCell>
                        <TableCell>{getStatusBadge(property.status)}</TableCell>
                        <TableCell>{formatDate(property.created_at)}</TableCell>

                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/admin/listings/${property.id}`}>
                              <Button variant="ghost" size="sm" title={isRTL ? 'عرض' : 'View'}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>

                            {property.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStatusChange(property.id, 'approved')}
                                  disabled={actionLoading === property.id}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title={isRTL ? 'قبول' : 'Approve'}
                                >
                                  {actionLoading === property.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4" />
                                  )}
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStatusChange(property.id, 'rejected')}
                                  disabled={actionLoading === property.id}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title={isRTL ? 'رفض' : 'Reject'}
                                >
                                  {actionLoading === property.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle className="h-4 w-4" />
                                  )}
                                </Button>
                              </>
                            )}

                            {/* ✅ Delete always visible */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(property)}
                              disabled={actionLoading === property.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title={isRTL ? 'حذف' : 'Delete'}
                            >
                              {actionLoading === property.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {totalCount > pageSize && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <div className="text-sm text-muted-foreground">
                    {isRTL
                      ? `عرض ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalCount)} من ${totalCount}`
                      : `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalCount)} of ${totalCount}`}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      {isRTL ? 'السابق' : 'Previous'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * pageSize >= totalCount}
                    >
                      {isRTL ? 'التالي' : 'Next'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reject Confirmation Dialog */}
      <ConfirmDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleRejectConfirm}
        title={isRTL ? 'رفض الإعلان' : 'Reject Listing'}
        description={isRTL ? 'واش متأكد بغيت ترفض هاد الإعلان؟' : 'Are you sure you want to reject this listing?'}
        confirmText={isRTL ? 'رفض' : 'Reject'}
        cancelText={isRTL ? 'إلغاء' : 'Cancel'}
        destructive={true}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {isRTL ? 'سبب الرفض (اختياري)' : 'Rejection Reason (optional)'}
          </label>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder={isRTL ? 'أدخل سبب رفض الإعلان...' : 'Enter reason for rejection...'}
            rows={3}
          />
        </div>
      </ConfirmDialog>

      {/* Image Modal */}
      <ImageModal
        images={modalImages}
        open={imageModalOpen}
        onOpenChange={setImageModalOpen}
        initialIndex={modalInitialIndex}
      />
    </AdminLayout>
  );
}
