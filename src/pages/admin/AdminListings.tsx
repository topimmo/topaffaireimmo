import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
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
import { Eye, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Property {
  id: string;
  title_fr: string;
  title_ar: string;
  price: number;
  status: string;
  transaction_type: string;
  property_type: string;
  created_at: string;
  city: { name_fr: string; name_ar: string } | null;
  neighborhood: { name_fr: string; name_ar: string } | null;
}

export default function AdminListings() {
  const { language, isRTL } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'pending';

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, [statusFilter]);

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
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data } = await query;

    if (data) setProperties(data as unknown as Property[]);
    setLoading(false);
  };

  const handleStatusChange = async (propertyId: string, newStatus: string) => {
    setActionLoading(propertyId);
    const { error } = await supabase
      .from('properties')
      .update({ status: newStatus })
      .eq('id', propertyId);

    if (!error) {
      await fetchProperties();
    }
    setActionLoading(null);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      sold: 'bg-blue-100 text-blue-800',
      rented: 'bg-purple-100 text-purple-800',
    };

    const labels: Record<string, { fr: string; ar: string }> = {
      pending: { fr: 'En attente', ar: 'قيد الانتظار' },
      approved: { fr: 'Approuvé', ar: 'معتمد' },
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-MA');
  };

  const getTitle = (property: Property) => {
    return language === 'ar' ? property.title_ar : property.title_fr;
  };

  const getCityName = (city: Property['city']) => {
    if (!city) return '-';
    return language === 'ar' ? city.name_ar : city.name_fr;
  };

  const getNeighborhoodName = (neighborhood: Property['neighborhood']) => {
    if (!neighborhood) return '-';
    return language === 'ar' ? neighborhood.name_ar : neighborhood.name_fr;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isRTL ? 'إدارة الإعلانات' : 'Manage Listings'}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {isRTL
                ? 'مراجعة والموافقة على إعلانات العقارات'
                : 'Review and approve property listings'}
            </p>
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => setSearchParams({ status: value })}
          >
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
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-lg border">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {isRTL ? 'لا توجد إعلانات' : 'No listings found'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? 'العنوان' : 'Title'}</TableHead>
                  <TableHead>{isRTL ? 'المدينة' : 'City'}</TableHead>
                  <TableHead>{isRTL ? 'الحي' : 'Neighborhood'}</TableHead>
                  <TableHead>{isRTL ? 'السعر' : 'Price'}</TableHead>
                  <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead className="text-right">{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium max-w-xs truncate">
                      {getTitle(property)}
                    </TableCell>
                    <TableCell>{getCityName(property.city)}</TableCell>
                    <TableCell>{getNeighborhoodName(property.neighborhood)}</TableCell>
                    <TableCell>{formatPrice(property.price)} DH</TableCell>
                    <TableCell>{getStatusBadge(property.status)}</TableCell>
                    <TableCell>{formatDate(property.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/listings/${property.id}`}>
                          <Button variant="ghost" size="sm">
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
                            >
                              {actionLoading === property.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
