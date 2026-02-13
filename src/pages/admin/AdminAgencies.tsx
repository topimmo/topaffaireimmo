import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { isValidUuid } from '@/lib/utils';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Building, Loader2, Mail, Phone, Download, Search } from 'lucide-react';
import { toast } from 'sonner';

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
  const [filteredAgencies, setFilteredAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, withListings: 0 });
  
  // Filter and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    fetchAgencies();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    applyFilters();
  }, [agencies, debouncedSearchQuery, statusFilter]);

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
      const agencyIds = agenciesData.map((a) => a.id).filter((id) => isValidUuid(id));
      const listingCounts: Record<string, number> = {};

      if (agencyIds.length > 0) {
        const { data: listingsData } = await supabase
          .from('properties')
          .select('owner_id')
          .in('owner_id', agencyIds);

        // Count listings per agency
        if (listingsData) {
          listingsData.forEach((listing) => {
            if (listing.owner_id) {
              listingCounts[listing.owner_id] = (listingCounts[listing.owner_id] || 0) + 1;
            }
          });
        }
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

  const applyFilters = () => {
    let filtered = [...agencies];

    // Apply search filter (using debounced query)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((agency) => {
        const searchableFields = [
          agency.agency_name,
          agency.full_name,
          agency.email,
          agency.phone,
        ];
        return searchableFields.some((field) => 
          field?.toLowerCase().includes(query)
        );
      });
    }

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((agency) => agency.listing_count && agency.listing_count > 0);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((agency) => !agency.listing_count || agency.listing_count === 0);
    }

    setFilteredAgencies(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const exportToCSV = () => {
    try {
      // Prepare CSV headers
      const headers = [
        'Agency Name',
        'Contact Person',
        'Email',
        'Phone',
        'License',
        'Listings',
        'Registered Date'
      ];

      // Prepare CSV rows
      const rows = filteredAgencies.map((agency) => [
        agency.agency_name || '-',
        agency.full_name || '-',
        agency.email,
        agency.phone || '-',
        agency.agency_license || '-',
        agency.listing_count || 0,
        formatDate(agency.created_at)
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `agencies_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(isRTL ? 'تم تصدير البيانات بنجاح' : 'Data exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error(isRTL ? 'فشل تصدير البيانات' : 'Failed to export data');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-MA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Pagination
  const totalPages = Math.ceil(filteredAgencies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAgencies = filteredAgencies.slice(startIndex, endIndex);

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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle>{isRTL ? 'قائمة الوكالات' : 'Agencies List'}</CardTitle>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1 sm:min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={isRTL ? 'بحث بالاسم، البريد، أو الهاتف...' : 'Search by name, email, or phone...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={isRTL ? 'الحالة' : 'Status'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
                    <SelectItem value="active">{isRTL ? 'نشط' : 'Active'}</SelectItem>
                    <SelectItem value="inactive">{isRTL ? 'غير نشط' : 'Inactive'}</SelectItem>
                  </SelectContent>
                </Select>

                {/* Export Button */}
                <Button 
                  onClick={exportToCSV}
                  variant="outline"
                  disabled={filteredAgencies.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isRTL ? 'تصدير CSV' : 'Export CSV'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredAgencies.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {debouncedSearchQuery || statusFilter !== 'all'
                    ? (isRTL ? 'لا توجد نتائج مطابقة' : 'No matching results')
                    : (isRTL ? 'لا توجد وكالات' : 'No agencies found')}
                </p>
              </div>
            ) : (
              <>
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
                    {paginatedAgencies.map((agency) => (
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
                          <Badge variant={agency.listing_count && agency.listing_count > 0 ? "default" : "secondary"}>
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      {isRTL 
                        ? `عرض ${startIndex + 1}-${Math.min(endIndex, filteredAgencies.length)} من ${filteredAgencies.length}`
                        : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredAgencies.length)} of ${filteredAgencies.length}`}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        {isRTL ? 'السابق' : 'Previous'}
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-10"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        {isRTL ? 'التالي' : 'Next'}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
