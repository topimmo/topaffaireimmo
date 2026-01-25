import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { CheckCircle, XCircle, Loader2, ArrowLeft, MapPin, Home, Ruler, Bed, Bath, Calendar, User, Mail, Phone, Share2, RefreshCw, } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
export default function AdminListingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { language, isRTL } = useLanguage();
    const [property, setProperty] = useState(null);
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
            toast.error(isRTL ? 'خطأ في تحميل الإعلان' : 'Error loading listing');
            navigate('/admin/listings');
        }
        else if (data) {
            setProperty(data);
        }
        setLoading(false);
    };
    const handleStatusChange = async (newStatus) => {
        if (!property)
            return;
        setActionLoading(true);
        try {
            // Get current user for approved_by field
            const { data: { user } } = await supabase.auth.getUser();
            // Prepare update data
            const updateData = { status: newStatus };
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
                        toast.info(isRTL
                            ? 'تم نشر الإعلان على فيسبوك مسبقاً'
                            : 'Already posted to Facebook');
                    }
                    else if (webhookResult.skipped) {
                        toast.warning(isRTL
                            ? 'لم يتم تكوين رابط الويب هوك'
                            : 'Webhook URL not configured');
                    }
                    else if (webhookResult.success) {
                        toast.success(isRTL
                            ? 'تم اعتماد الإعلان ونشره على فيسبوك'
                            : 'Listing approved and posted to Facebook');
                    }
                }
                catch (webhookError) {
                    console.error('Webhook error:', webhookError);
                    toast.warning(isRTL
                        ? 'تم اعتماد الإعلان لكن فشل النشر على فيسبوك'
                        : 'Listing approved but Facebook posting failed');
                }
            }
            else {
                toast.success(isRTL
                    ? `تم ${newStatus === 'approved' ? 'اعتماد' : 'رفض'} الإعلان`
                    : `Listing ${newStatus === 'approved' ? 'approved' : 'rejected'}`);
            }
            // Refresh the property data
            await fetchPropertyDetail();
        }
        catch (error) {
            console.error('Status change error:', error);
            toast.error(isRTL ? 'خطأ في تحديث الحالة' : 'Error updating status');
        }
        setActionLoading(false);
    };
    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-MA', {
            style: 'decimal',
            maximumFractionDigits: 0,
        }).format(price);
    };
    const handleRetryFacebookPost = async () => {
        if (!property)
            return;
        setActionLoading(true);
        try {
            const result = await retryFacebookPost(property.id);
            if (result.success) {
                toast.success(isRTL
                    ? 'تم نشر الإعلان على فيسبوك بنجاح'
                    : 'Successfully posted to Facebook');
            }
            else {
                toast.error(isRTL
                    ? 'فشل النشر على فيسبوك'
                    : 'Failed to post to Facebook');
            }
            // Refresh the property data
            await fetchPropertyDetail();
        }
        catch (error) {
            console.error('Retry error:', error);
            toast.error(isRTL
                ? 'خطأ في إعادة المحاولة'
                : 'Error retrying Facebook post');
        }
        setActionLoading(false);
    };
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-MA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };
    const getStatusBadge = (status) => {
        const variants = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };
        const labels = {
            pending: { fr: 'En attente', ar: 'قيد الانتظار' },
            approved: { fr: 'Approuvé', ar: 'معتمد' },
            rejected: { fr: 'Rejeté', ar: 'مرفوض' },
        };
        const label = language === 'ar' ? labels[status]?.ar : labels[status]?.fr;
        return (_jsx(Badge, { className: cn('font-medium', variants[status] || ''), children: label || status }));
    };
    if (loading) {
        return (_jsx(AdminLayout, { children: _jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) }) }));
    }
    if (!property) {
        return (_jsx(AdminLayout, { children: _jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-muted-foreground", children: isRTL ? 'الإعلان غير موجود' : 'Listing not found' }) }) }));
    }
    const title = language === 'ar' ? property.title_ar : property.title_fr;
    const description = language === 'ar' ? property.description_ar : property.description_fr;
    const cityName = property.city ? (language === 'ar' ? property.city.name_ar : property.city.name_fr) : '-';
    const neighborhoodName = property.neighborhood ? (language === 'ar' ? property.neighborhood.name_ar : property.neighborhood.name_fr) : '-';
    return (_jsx(AdminLayout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => navigate('/admin/listings'), children: _jsx(ArrowLeft, { className: cn('h-5 w-5', isRTL && 'rotate-180') }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h1", { className: "text-3xl font-bold text-foreground", children: title }), _jsx("p", { className: "mt-2 text-muted-foreground", children: isRTL ? 'تفاصيل الإعلان' : 'Listing Details' })] }), _jsx("div", { children: getStatusBadge(property.status) })] }), property.status === 'pending' && (_jsxs("div", { className: "flex gap-3", children: [_jsxs(Button, { onClick: () => handleStatusChange('approved'), disabled: actionLoading, className: "bg-green-600 hover:bg-green-700", children: [actionLoading ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin mr-2" })) : (_jsx(CheckCircle, { className: "h-4 w-4 mr-2" })), isRTL ? 'اعتماد' : 'Approve'] }), _jsxs(Button, { onClick: () => handleStatusChange('rejected'), disabled: actionLoading, variant: "destructive", children: [actionLoading ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin mr-2" })) : (_jsx(XCircle, { className: "h-4 w-4 mr-2" })), isRTL ? 'رفض' : 'Reject'] })] })), property.status === 'approved' && (_jsx(Card, { className: "border-blue-200 bg-blue-50", children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-semibold text-blue-900", children: isRTL ? 'حالة النشر على فيسبوك' : 'Facebook Posting Status' }), property.facebook_posted ? (_jsxs("p", { className: "text-sm text-blue-700 mt-1", children: [isRTL
                                                    ? `تم النشر بنجاح في ${property.facebook_posted_at ? formatDate(property.facebook_posted_at) : '-'}`
                                                    : `Posted successfully on ${property.facebook_posted_at ? formatDate(property.facebook_posted_at) : '-'}`, property.facebook_post_id && (_jsxs("span", { className: "block text-xs text-blue-600 mt-1", children: ["Post ID: ", property.facebook_post_id] }))] })) : (_jsxs("div", { children: [_jsx("p", { className: "text-sm text-orange-700 mt-1", children: isRTL ? 'لم يتم النشر بعد' : 'Not posted yet' }), property.facebook_post_error && (_jsxs("p", { className: "text-xs text-red-600 mt-1", children: [isRTL ? 'خطأ: ' : 'Error: ', property.facebook_post_error] }))] }))] }), !property.facebook_posted && (_jsxs(Button, { onClick: handleRetryFacebookPost, disabled: actionLoading, size: "sm", variant: "outline", className: "border-blue-300 text-blue-700 hover:bg-blue-100", children: [actionLoading ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin mr-2" })) : (_jsx(RefreshCw, { className: "h-4 w-4 mr-2" })), isRTL ? 'إعادة المحاولة' : 'Retry Post'] }))] }) }) })), _jsxs("div", { className: "grid gap-6 md:grid-cols-3", children: [_jsxs("div", { className: "md:col-span-2 space-y-6", children: [property.images && property.images.length > 0 && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: isRTL ? 'الصور' : 'Images' }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-2 gap-4", children: property.images.map((image, index) => (_jsx("img", { src: image, alt: `${title} - ${index + 1}`, className: "w-full h-48 object-cover rounded-lg" }, index))) }) })] })), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: isRTL ? 'الوصف' : 'Description' }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-muted-foreground whitespace-pre-wrap", children: description }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: isRTL ? 'تفاصيل العقار' : 'Property Details' }) }), _jsxs(CardContent, { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Home, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("span", { className: "text-sm", children: [_jsx("strong", { children: isRTL ? 'النوع:' : 'Type:' }), " ", property.property_type] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Ruler, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("span", { className: "text-sm", children: [_jsx("strong", { children: isRTL ? 'المساحة:' : 'Area:' }), " ", property.area_sqm, " m\u00B2"] })] }), property.bedrooms !== null && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Bed, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("span", { className: "text-sm", children: [_jsx("strong", { children: isRTL ? 'غرف النوم:' : 'Bedrooms:' }), " ", property.bedrooms] })] })), property.bathrooms !== null && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Bath, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("span", { className: "text-sm", children: [_jsx("strong", { children: isRTL ? 'الحمامات:' : 'Bathrooms:' }), " ", property.bathrooms] })] })), property.floor !== null && (_jsx("div", { className: "flex items-center gap-2", children: _jsxs("span", { className: "text-sm", children: [_jsx("strong", { children: isRTL ? 'الطابق:' : 'Floor:' }), " ", property.floor, property.total_floors && ` / ${property.total_floors}`] }) })), property.year_built !== null && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("span", { className: "text-sm", children: [_jsx("strong", { children: isRTL ? 'سنة البناء:' : 'Year Built:' }), " ", property.year_built] })] }))] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: isRTL ? 'المميزات' : 'Features' }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3", children: [property.furnished && (_jsx(Badge, { variant: "secondary", children: isRTL ? 'مفروش' : 'Furnished' })), property.parking && (_jsx(Badge, { variant: "secondary", children: isRTL ? 'موقف سيارات' : 'Parking' })), property.elevator && (_jsx(Badge, { variant: "secondary", children: isRTL ? 'مصعد' : 'Elevator' })), property.balcony && (_jsx(Badge, { variant: "secondary", children: isRTL ? 'شرفة' : 'Balcony' })), property.garden && (_jsx(Badge, { variant: "secondary", children: isRTL ? 'حديقة' : 'Garden' })), property.pool && (_jsx(Badge, { variant: "secondary", children: isRTL ? 'مسبح' : 'Pool' })), property.security && (_jsx(Badge, { variant: "secondary", children: isRTL ? 'حراسة' : 'Security' }))] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Share2, { className: "h-5 w-5" }), isRTL ? 'مشاركة' : 'Share'] }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-sm text-muted-foreground", children: isRTL
                                                    ? '(قريبًا) نسخ نص فيسبوك/تيك توك + تنزيل الصور'
                                                    : '(Coming next) Copy Facebook/TikTok text + Download images' }) })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: isRTL ? 'السعر والموقع' : 'Price & Location' }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-muted-foreground", children: isRTL ? 'السعر' : 'Price' }), _jsxs("p", { className: "text-2xl font-bold text-primary", children: [formatPrice(property.price), " DH"] }), _jsx("p", { className: "text-xs text-muted-foreground mt-1", children: property.transaction_type === 'sale'
                                                                ? (isRTL ? 'للبيع' : 'For Sale')
                                                                : (isRTL ? 'للإيجار' : 'For Rent') })] }), _jsx(Separator, {}), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(MapPin, { className: "h-4 w-4 text-muted-foreground" }), _jsx("p", { className: "text-sm font-medium", children: isRTL ? 'الموقع' : 'Location' })] }), _jsx("p", { className: "text-sm", children: cityName }), neighborhoodName !== '-' && (_jsx("p", { className: "text-sm text-muted-foreground", children: neighborhoodName }))] })] })] }), property.owner && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: isRTL ? 'معلومات المالك' : 'Owner Information' }) }), _jsxs(CardContent, { className: "space-y-3", children: [property.owner.full_name && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(User, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-sm", children: property.owner.full_name })] })), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Mail, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-sm break-all", children: property.owner.email })] }), property.owner.phone && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Phone, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-sm", children: property.owner.phone })] }))] })] })), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: isRTL ? 'معلومات إضافية' : 'Metadata' }) }), _jsxs(CardContent, { className: "space-y-2 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: isRTL ? 'تاريخ النشر' : 'Created' }), _jsx("p", { children: formatDate(property.created_at) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: isRTL ? 'آخر تحديث' : 'Updated' }), _jsx("p", { children: formatDate(property.updated_at) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-muted-foreground", children: isRTL ? 'معرف الإعلان' : 'Listing ID' }), _jsx("p", { className: "font-mono text-xs break-all", children: property.id })] })] })] })] })] })] }) }));
}
