import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/auditLog';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

interface ServiceRequest {
  id: string;
  client_id: string;
  category_id: string;
  city_id: number;
  title: string;
  description: string;
  status: string;
  assigned_artisan_id: string | null;
  created_at: string;
  client_name: string;
  client_phone: string;
  urgency: string;
  service_categories?: {
    name_fr: string;
    name_ar: string;
  };
  cities?: {
    name_fr: string;
    name_ar: string;
  };
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface ArtisanProfile {
  id: string;
  user_id: string;
  business_name: string;
  is_verified: boolean;
  is_active: boolean;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  pending: 'bg-yellow-500',
  viewed: 'bg-blue-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  completed: 'bg-purple-500',
  cancelled: 'bg-gray-500',
};

export default function AdminServiceRequests() {
  const { isRTL } = useLanguage();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  const [artisans, setArtisans] = useState<ArtisanProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter((req) => req.status === statusFilter));
    }
  }, [statusFilter, requests]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch total count
      const { count, error: countError } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      setTotalCount(count || 0);

      // Fetch requests with related data (paginated)
      const from = currentPage * pageSize;
      const to = from + pageSize - 1;
      
      const { data: requestsData, error: requestsError } = await supabase
        .from('requests')
        .select(`
          *,
          service_categories (name_fr, name_ar),
          cities (name_fr, name_ar),
          profiles!requests_client_id_fkey (full_name, email)
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (requestsError) throw requestsError;
      setRequests(requestsData || []);

      // Fetch verified artisans (limited to 100 most recent)
      const { data: artisansData, error: artisansError } = await supabase
        .from('artisan_profiles')
        .select('id, user_id, business_name, is_verified, is_active')
        .eq('is_verified', true)
        .eq('is_active', true)
        .order('business_name', { ascending: true })
        .limit(100);

      if (artisansError) throw artisansError;
      setArtisans(artisansData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setDetailsDialogOpen(true);
  };

  const handleOpenAssignDialog = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setSelectedArtisan(request.assigned_artisan_id || '');
    setAssignDialogOpen(true);
  };

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('admin_update_request_status', {
        p_request_id: requestId,
        p_status: newStatus,
      });

      if (error) throw error;

      const result = data[0];
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      // Log admin action
      await logAdminAction({
        action: 'update',
        entity_type: 'service_request',
        entity_id: requestId,
        metadata: { status: newStatus },
      });

      toast.success(result.message);
      await fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update request status');
    } finally {
      setProcessing(false);
    }
  };

  const handleAssignArtisan = async () => {
    if (!selectedRequest || !selectedArtisan) {
      toast.error('Please select an artisan');
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('admin_assign_request', {
        p_request_id: selectedRequest.id,
        p_artisan_id: selectedArtisan,
      });

      if (error) throw error;

      const result = data[0];
      if (!result.success) {
        toast.error(result.message);
        return;
      }

      // Log admin action
      await logAdminAction({
        action: 'assign',
        entity_type: 'service_request',
        entity_id: selectedRequest.id,
        metadata: { artisan_id: selectedArtisan },
      });

      toast.success(result.message);
      setAssignDialogOpen(false);
      setSelectedRequest(null);
      setSelectedArtisan('');
      await fetchData();
    } catch (error) {
      console.error('Error assigning artisan:', error);
      toast.error('Failed to assign artisan');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const color = statusColors[status] || 'bg-gray-500';
    return (
      <Badge className={`${color} text-white`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-100 text-blue-800',
      normal: 'bg-gray-100 text-gray-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    const color = colors[urgency] || 'bg-gray-100 text-gray-800';
    return (
      <Badge variant="outline" className={color}>
        {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isRTL ? 'طلبات الخدمات' : 'Service Requests'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isRTL
                ? 'إدارة طلبات الخدمات من العملاء'
                : 'Manage service requests from clients'}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{isRTL ? 'جميع الطلبات' : 'All Requests'}</CardTitle>
                <CardDescription>
                  {isRTL
                    ? `إجمالي ${filteredRequests.length} طلب`
                    : `Total ${filteredRequests.length} requests`}
                </CardDescription>
              </div>
              <div className="w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? 'تصفية حسب الحالة' : 'Filter by status'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
                    <SelectItem value="pending">{isRTL ? 'معلق' : 'Pending'}</SelectItem>
                    <SelectItem value="approved">{isRTL ? 'موافق عليه' : 'Approved'}</SelectItem>
                    <SelectItem value="rejected">{isRTL ? 'مرفوض' : 'Rejected'}</SelectItem>
                    <SelectItem value="completed">{isRTL ? 'مكتمل' : 'Completed'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {isRTL ? 'لا توجد طلبات' : 'No requests found'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRTL ? 'العنوان' : 'Title'}</TableHead>
                      <TableHead>{isRTL ? 'الفئة' : 'Category'}</TableHead>
                      <TableHead>{isRTL ? 'المدينة' : 'City'}</TableHead>
                      <TableHead>{isRTL ? 'العميل' : 'Client'}</TableHead>
                      <TableHead>{isRTL ? 'الأولوية' : 'Urgency'}</TableHead>
                      <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                      <TableHead>{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.title}</TableCell>
                        <TableCell>
                          {isRTL
                            ? request.service_categories?.name_ar
                            : request.service_categories?.name_fr}
                        </TableCell>
                        <TableCell>
                          {isRTL ? request.cities?.name_ar : request.cities?.name_fr}
                        </TableCell>
                        <TableCell>
                          {request.profiles?.full_name || request.client_name}
                        </TableCell>
                        <TableCell>{getUrgencyBadge(request.urgency)}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(request)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenAssignDialog(request)}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Pagination Controls */}
            {!loading && filteredRequests.length > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {isRTL
                    ? `عرض ${currentPage * pageSize + 1}-${Math.min((currentPage + 1) * pageSize, totalCount)} من ${totalCount}`
                    : `Showing ${currentPage * pageSize + 1}-${Math.min((currentPage + 1) * pageSize, totalCount)} of ${totalCount}`}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                  >
                    {isRTL ? 'السابق' : 'Previous'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={(currentPage + 1) * pageSize >= totalCount}
                  >
                    {isRTL ? 'التالي' : 'Next'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isRTL ? 'تفاصيل الطلب' : 'Request Details'}
              </DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="font-semibold">{isRTL ? 'العنوان' : 'Title'}</Label>
                  <p className="mt-1">{selectedRequest.title}</p>
                </div>
                <div>
                  <Label className="font-semibold">{isRTL ? 'الوصف' : 'Description'}</Label>
                  <p className="mt-1 text-muted-foreground">{selectedRequest.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">{isRTL ? 'اسم العميل' : 'Client Name'}</Label>
                    <p className="mt-1">{selectedRequest.client_name}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">{isRTL ? 'رقم الهاتف' : 'Phone'}</Label>
                    <p className="mt-1">{selectedRequest.client_phone}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">{isRTL ? 'الحالة' : 'Status'}</Label>
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  </div>
                  <div>
                    <Label className="font-semibold">{isRTL ? 'الأولوية' : 'Urgency'}</Label>
                    <div className="mt-1">{getUrgencyBadge(selectedRequest.urgency)}</div>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Select
                    value={selectedRequest.status}
                    onValueChange={(value) => handleUpdateStatus(selectedRequest.id, value)}
                    disabled={processing}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Assign Artisan Dialog */}
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isRTL ? 'تعيين حرفي' : 'Assign Artisan'}
              </DialogTitle>
              <DialogDescription>
                {isRTL
                  ? 'اختر حرفيًا لتعيينه لهذا الطلب'
                  : 'Select an artisan to assign to this request'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{isRTL ? 'الحرفي' : 'Artisan'}</Label>
                <Select value={selectedArtisan} onValueChange={setSelectedArtisan}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? 'اختر حرفيًا' : 'Select artisan'} />
                  </SelectTrigger>
                  <SelectContent>
                    {artisans.map((artisan) => (
                      <SelectItem key={artisan.user_id} value={artisan.user_id}>
                        {artisan.business_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAssignDialogOpen(false)}
                disabled={processing}
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleAssignArtisan} disabled={processing || !selectedArtisan}>
                {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isRTL ? 'تعيين' : 'Assign'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
