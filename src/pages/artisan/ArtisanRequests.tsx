import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Loader2, Eye, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  urgency: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  preferred_contact_method: string;
  created_at: string;
  viewed_by_artisan_at: string | null;
  artisan_response: string | null;
  service_categories?: {
    name_fr: string;
    name_ar: string;
  };
  cities?: {
    name_fr: string;
    name_ar: string;
  };
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  viewed: 'bg-blue-500',
  contacted: 'bg-indigo-500',
  accepted: 'bg-green-500',
  rejected: 'bg-red-500',
  completed: 'bg-purple-500',
};

const urgencyColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  normal: 'bg-gray-100 text-gray-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export default function ArtisanRequests() {
  const { isRTL } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?next=/artisan/requests');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter((req) => req.status === statusFilter));
    }
  }, [statusFilter, requests]);

  const fetchRequests = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          service_categories (name_fr, name_ar),
          cities (name_fr, name_ar)
        `)
        .eq('assigned_artisan_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (request: ServiceRequest) => {
    setSelectedRequest(request);
    setResponseText(request.artisan_response || '');
    setDetailsDialogOpen(true);

    // Mark as viewed if not already
    if (!request.viewed_by_artisan_at) {
      try {
        await supabase
          .from('requests')
          .update({ viewed_by_artisan_at: new Date().toISOString() })
          .eq('id', request.id);
        
        // Refresh requests to update the UI
        await fetchRequests();
      } catch (error) {
        console.error('Error marking as viewed:', error);
      }
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      const updates: any = {
        status,
        artisan_response: responseText || null,
        artisan_responded_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('requests')
        .update(updates)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast.success(isRTL ? 'تم تحديث الحالة' : 'Statut mis à jour');
      setDetailsDialogOpen(false);
      await fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
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
    const color = urgencyColors[urgency] || 'bg-gray-100 text-gray-800';
    return (
      <Badge variant="outline" className={color}>
        {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
      </Badge>
    );
  };

  if (authLoading || loading) {
    return (
      <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="flex-1 flex items-center justify-center pt-24 pb-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-semibold text-foreground">
                {isRTL ? 'الطلبات المعينة لي' : 'Mes Demandes'}
              </h1>
              <p className="text-muted-foreground mt-2">
                {isRTL
                  ? 'الطلبات المعينة لك من قبل الإدارة'
                  : 'Demandes qui vous ont été assignées par l\'administrateur'}
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/dashboard/artisan">
                {isRTL ? 'العودة' : 'Retour'}
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {isRTL ? 'الإجمالي' : 'Total'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{requests.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {isRTL ? 'معلقة' : 'En attente'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {requests.filter((r) => r.status === 'pending' || r.status === 'viewed').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {isRTL ? 'مقبولة' : 'Acceptées'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {requests.filter((r) => r.status === 'accepted' || r.status === 'contacted').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {isRTL ? 'مكتملة' : 'Complétées'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {requests.filter((r) => r.status === 'completed').length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{isRTL ? 'جميع الطلبات' : 'Toutes les demandes'}</CardTitle>
                  <CardDescription>
                    {isRTL
                      ? `إجمالي ${filteredRequests.length} طلب`
                      : `Total ${filteredRequests.length} demandes`}
                  </CardDescription>
                </div>
                <div className="w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder={isRTL ? 'تصفية' : 'Filtrer'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isRTL ? 'الكل' : 'Tous'}</SelectItem>
                      <SelectItem value="pending">{isRTL ? 'معلقة' : 'En attente'}</SelectItem>
                      <SelectItem value="accepted">{isRTL ? 'مقبولة' : 'Acceptées'}</SelectItem>
                      <SelectItem value="completed">{isRTL ? 'مكتملة' : 'Complétées'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isRTL ? 'لا توجد طلبات' : 'Aucune demande'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isRTL ? 'العنوان' : 'Titre'}</TableHead>
                        <TableHead>{isRTL ? 'الفئة' : 'Catégorie'}</TableHead>
                        <TableHead>{isRTL ? 'العميل' : 'Client'}</TableHead>
                        <TableHead>{isRTL ? 'الأولوية' : 'Urgence'}</TableHead>
                        <TableHead>{isRTL ? 'الحالة' : 'Statut'}</TableHead>
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
                          <TableCell>{request.client_name}</TableCell>
                          <TableCell>{getUrgencyBadge(request.urgency)}</TableCell>
                          <TableCell>{getStatusBadge(request.status)}</TableCell>
                          <TableCell>
                            {new Date(request.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(request)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isRTL ? 'تفاصيل الطلب' : 'Détails de la demande'}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="font-semibold">{isRTL ? 'العنوان' : 'Titre'}</Label>
                <p className="mt-1">{selectedRequest.title}</p>
              </div>

              <div>
                <Label className="font-semibold">{isRTL ? 'الوصف' : 'Description'}</Label>
                <p className="mt-1 text-muted-foreground">{selectedRequest.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">{isRTL ? 'اسم العميل' : 'Nom du client'}</Label>
                  <p className="mt-1">{selectedRequest.client_name}</p>
                </div>
                <div>
                  <Label className="font-semibold">{isRTL ? 'الأولوية' : 'Urgence'}</Label>
                  <div className="mt-1">{getUrgencyBadge(selectedRequest.urgency)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">{isRTL ? 'الهاتف' : 'Téléphone'}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${selectedRequest.client_phone}`} className="text-primary hover:underline">
                      {selectedRequest.client_phone}
                    </a>
                  </div>
                </div>
                {selectedRequest.client_email && (
                  <div>
                    <Label className="font-semibold">{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${selectedRequest.client_email}`} className="text-primary hover:underline">
                        {selectedRequest.client_email}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="font-semibold">{isRTL ? 'الحالة الحالية' : 'Statut actuel'}</Label>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>

              <div>
                <Label htmlFor="response">{isRTL ? 'ردك' : 'Votre réponse'}</Label>
                <Textarea
                  id="response"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder={isRTL ? 'أضف ردك هنا...' : 'Ajoutez votre réponse ici...'}
                  className="mt-2"
                  rows={4}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Select
                  value={selectedRequest.status}
                  onValueChange={(value) => handleUpdateStatus(value)}
                  disabled={processing}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewed">Vu</SelectItem>
                    <SelectItem value="contacted">Contacté</SelectItem>
                    <SelectItem value="accepted">Accepté</SelectItem>
                    <SelectItem value="rejected">Refusé</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailsDialogOpen(false)}
              disabled={processing}
            >
              {isRTL ? 'إغلاق' : 'Fermer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
