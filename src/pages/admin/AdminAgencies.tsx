import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Building, Loader2, Mail, Phone } from 'lucide-react';

interface Agency {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  agency_name: string | null;
  agency_license: string | null;
  created_at: string;
  listing_count?: number;
}

export default function AdminAgencies() {
  const { language, isRTL } = useLanguage();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, withListings: 0 });

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    setLoading(true);

    try {
      // Fetch agencies from profiles
      const { data: agenciesData, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, agency_name, agency_license, created_at')
        .eq('advertiser_type', 'agency')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching agencies:', error);
        setAgencies([]);
        return;
      }

      if (!agenciesData || agenciesData.length === 0) {
        setAgencies([]);
        setStats({ total: 0, withListings: 0 });
        setLoading(false);
        return;
      }

      // Fetch listing counts for each agency
      const agencyIds = agenciesData.map((a) => a.id);
      const { data: listingsData } = await supabase
        .from('properties')
        .select('owner_id')
        .in('owner_id', agencyIds);

      // Count listings per agency
      const listingCounts: Record<string, number> = {};
      if (listingsData) {
        listingsData.forEach((listing) => {
          if (listing.owner_id) {
            listingCounts[listing.owner_id] = (listingCounts[listing.owner_id] || 0) + 1;
          }
        });
      }

      // Merge data
      const enrichedAgencies = agenciesData.map((agency) => ({
        ...agency,
        listing_count: listingCounts[agency.id] || 0,
      }));

      setAgencies(enrichedAgencies);

      // Calculate stats
      const withListings = enrichedAgencies.filter((a) => a.listing_count && a.listing_count > 0).length;
      setStats({
        total: enrichedAgencies.length,
        withListings,
      });
    } catch (error) {
      console.error('Error in fetchAgencies:', error);
      setAgencies([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-MA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isRTL ? 'الوكالات' : 'Agencies'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isRTL
              ? 'إدارة الوكالات العقارية'
              : 'Manage real estate agencies'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isRTL ? 'إجمالي الوكالات' : 'Total Agencies'}
              </CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isRTL ? 'وكالات نشطة' : 'Active Agencies'}
              </CardTitle>
              <Building className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.withListings}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {isRTL ? 'مع إعلانات' : 'With listings'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Agencies Table */}
        <Card>
          <CardHeader>
            <CardTitle>{isRTL ? 'قائمة الوكالات' : 'Agencies List'}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : agencies.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {isRTL ? 'لا توجد وكالات' : 'No agencies found'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRTL ? 'اسم الوكالة' : 'Agency Name'}</TableHead>
                    <TableHead>{isRTL ? 'المسؤول' : 'Contact Person'}</TableHead>
                    <TableHead>{isRTL ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                    <TableHead>{isRTL ? 'الهاتف' : 'Phone'}</TableHead>
                    <TableHead>{isRTL ? 'الترخيص' : 'License'}</TableHead>
                    <TableHead>{isRTL ? 'الإعلانات' : 'Listings'}</TableHead>
                    <TableHead>{isRTL ? 'تاريخ التسجيل' : 'Registered'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agencies.map((agency) => (
                    <TableRow key={agency.id}>
                      <TableCell className="font-medium">
                        {agency.agency_name || '-'}
                      </TableCell>
                      <TableCell>{agency.full_name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{agency.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {agency.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{agency.phone}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {agency.agency_license || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {agency.listing_count || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(agency.created_at)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
