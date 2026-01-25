import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { sendFacebookWebhook } from '@/lib/facebookWebhook';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Eye, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
export default function AdminListings() {
    const { language, isRTL } = useLanguage();
    const [searchParams, setSearchParams] = useSearchParams();
    const statusFilter = searchParams.get('status') || 'pending';
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 50;
    useEffect(() => {
        setPage(1); // Reset to first page when filter changes
    }, [statusFilter]);
    useEffect(() => {
        fetchProperties();
    }, [statusFilter, page]);
    const fetchProperties = async () => {
        setLoading(true);
        let query = supabase
            .from('properties')
            .select(`
        id,
        title_fr,
        title_ar,
        price,
        status,
        transaction_type,
        property_type,
        created_at,
        city:cities(name_fr, name_ar),
        neighborhood:neighborhoods(name_fr, name_ar)
      `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);
        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }
        const { data, count } = await query;
        if (data)
            setProperties(data);
        if (count !== null)
            setTotalCount(count);
        setLoading(false);
    };
    const handleStatusChange = async (propertyId, newStatus) => {
        setActionLoading(propertyId);
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
                .eq('id', propertyId);
            if (error) {
                toast.error(isRTL ? 'خطأ في تحديث الحالة' : 'Error updating status');
            }
            else {
                // If approved, send Facebook webhook
                if (newStatus === 'approved') {
                    try {
                        await sendFacebookWebhook(propertyId);
                        toast.success(isRTL
                            ? 'تم اعتماد الإعلان ونشره على فيسبوك'
                            : 'Listing approved and posted to Facebook');
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
                        ? `تم ${newStatus === 'rejected' ? 'رفض' : 'تحديث'} الإعلان`
                        : `Listing ${newStatus === 'rejected' ? 'rejected' : 'updated'}`);
                }
                await fetchProperties();
            }
        }
        catch (error) {
            console.error('Status change error:', error);
            toast.error(isRTL ? 'خطأ في تحديث الحالة' : 'Error updating status');
        }
        setActionLoading(null);
    };
    const getStatusBadge = (status) => {
        const variants = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            sold: 'bg-blue-100 text-blue-800',
            rented: 'bg-purple-100 text-purple-800',
        };
        const labels = {
            pending: { fr: 'En attente', ar: 'قيد الانتظار' },
            approved: { fr: 'Approuvé', ar: 'معتمد' },
            rejected: { fr: 'Rejeté', ar: 'مرفوض' },
            sold: { fr: 'Vendu', ar: 'مباع' },
            rented: { fr: 'Loué', ar: 'مؤجر' },
        };
        const label = language === 'ar' ? labels[status]?.ar : labels[status]?.fr;
        return (_jsx(Badge, { className: cn('font-medium', variants[status] || ''), children: label || status }));
    };
    const formatPrice = (price) => {
        return new Intl.NumberFormat('fr-MA', {
            style: 'decimal',
            maximumFractionDigits: 0,
        }).format(price);
    };
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-MA');
    };
    const getTitle = (property) => {
        return language === 'ar' ? property.title_ar : property.title_fr;
    };
    const getCityName = (city) => {
        if (!city)
            return '-';
        return language === 'ar' ? city.name_ar : city.name_fr;
    };
    const getNeighborhoodName = (neighborhood) => {
        if (!neighborhood)
            return '-';
        return language === 'ar' ? neighborhood.name_ar : neighborhood.name_fr;
    };
    return (_jsx(AdminLayout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-foreground", children: isRTL ? 'إدارة الإعلانات' : 'Manage Listings' }), _jsx("p", { className: "mt-2 text-muted-foreground", children: isRTL
                                        ? 'مراجعة والموافقة على إعلانات العقارات'
                                        : 'Review and approve property listings' })] }), _jsxs(Select, { value: statusFilter, onValueChange: (value) => setSearchParams({ status: value }), children: [_jsx(SelectTrigger, { className: "w-[180px]", children: _jsx(SelectValue, { placeholder: isRTL ? 'اختر الحالة' : 'Select status' }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: isRTL ? 'الكل' : 'All' }), _jsx(SelectItem, { value: "pending", children: isRTL ? 'قيد الانتظار' : 'Pending' }), _jsx(SelectItem, { value: "approved", children: isRTL ? 'معتمد' : 'Approved' }), _jsx(SelectItem, { value: "rejected", children: isRTL ? 'مرفوض' : 'Rejected' })] })] })] }), _jsx("div", { className: "bg-white rounded-lg border", children: loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) })) : properties.length === 0 ? (_jsx("div", { className: "text-center py-12", children: _jsx("p", { className: "text-muted-foreground", children: isRTL ? 'لا توجد إعلانات' : 'No listings found' }) })) : (_jsxs(_Fragment, { children: [_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: isRTL ? 'العنوان' : 'Title' }), _jsx(TableHead, { children: isRTL ? 'المدينة' : 'City' }), _jsx(TableHead, { children: isRTL ? 'الحي' : 'Neighborhood' }), _jsx(TableHead, { children: isRTL ? 'السعر' : 'Price' }), _jsx(TableHead, { children: isRTL ? 'الحالة' : 'Status' }), _jsx(TableHead, { children: isRTL ? 'التاريخ' : 'Date' }), _jsx(TableHead, { className: "text-right", children: isRTL ? 'الإجراءات' : 'Actions' })] }) }), _jsx(TableBody, { children: properties.map((property) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-medium max-w-xs truncate", children: getTitle(property) }), _jsx(TableCell, { children: getCityName(property.city) }), _jsx(TableCell, { children: getNeighborhoodName(property.neighborhood) }), _jsxs(TableCell, { children: [formatPrice(property.price), " DH"] }), _jsx(TableCell, { children: getStatusBadge(property.status) }), _jsx(TableCell, { children: formatDate(property.created_at) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx(Link, { to: `/admin/listings/${property.id}`, children: _jsx(Button, { variant: "ghost", size: "sm", children: _jsx(Eye, { className: "h-4 w-4" }) }) }), property.status === 'pending' && (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleStatusChange(property.id, 'approved'), disabled: actionLoading === property.id, className: "text-green-600 hover:text-green-700 hover:bg-green-50", children: actionLoading === property.id ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(CheckCircle, { className: "h-4 w-4" })) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleStatusChange(property.id, 'rejected'), disabled: actionLoading === property.id, className: "text-red-600 hover:text-red-700 hover:bg-red-50", children: actionLoading === property.id ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(XCircle, { className: "h-4 w-4" })) })] }))] }) })] }, property.id))) })] }), totalCount > pageSize && (_jsxs("div", { className: "flex items-center justify-between border-t px-4 py-3", children: [_jsx("div", { className: "text-sm text-muted-foreground", children: isRTL
                                            ? `عرض ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalCount)} من ${totalCount}`
                                            : `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalCount)} of ${totalCount}` }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(p => Math.max(1, p - 1)), disabled: page === 1, children: isRTL ? 'السابق' : 'Previous' }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(p => p + 1), disabled: page * pageSize >= totalCount, children: isRTL ? 'التالي' : 'Next' })] })] }))] })) })] }) }));
}
