import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/auditLog';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Loader2, Eye, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ArtisanProfile {
  id: string;
  user_id: string;
  business_name: string;
  description_fr?: string;
  description_ar?: string;
  phone: string;
  email?: string;
  is_verified: boolean;
  is_active: boolean;
  is_boosted: boolean;
  created_at: string;
  service_categories?: {
    name_fr: string;
    name_ar: string;
  };
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface ArtisanService {
  id: string;
  category_id: string;
  subcategory_id: string;
  city: string;
  is_active: boolean;
  service_categories?: {
    name_fr: string;
    name_ar: string;
  };
  service_subcategories?: {
    name_fr: string;
    name_ar: string;
  };
}

export default function AdminArtisans() {
  const { isRTL } = useLanguage();
  const [artisans, setArtisans] = useState<ArtisanProfile[]>([]);
  const [filteredArtisans, setFilteredArtisans] = useState<ArtisanProfile[]>([]);
  const [selectedArtisan, setSelectedArtisan] = useState<ArtisanProfile | null>(null);
  const [artisanServices, setArtisanServices] = useState<ArtisanService[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    fetchArtisans();
  }, []);

  useEffect(() => {
    if (verificationFilter === 'all') {
      setFilteredArtisans(artisans);
    } else if (verificationFilter === 'verified') {
      setFilteredArtisans(artisans.filter((a) => a.is_verified));
    } else if (verificationFilter === 'unverified') {
      setFilteredArtisans(artisans.filter((a) => !a.is_verified));
    }
  }, [verificationFilter, artisans]);

  const fetchArtisans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('artisan_profiles')
        .select(`
          *,
          service_categories (name_fr, name_ar),
          profiles!artisan_profiles_user_id_fkey (full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArtisans(data || []);
    } catch (error) {
      console.error('Error fetching artisans:', error);
      toast.error('Failed to load artisans');
    } finally {
      setLoading(false);
    }
  };

  const fetchArtisanServices = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('artisan_services')
        .select(`
          *,
          service_categories (name_fr, name_ar),
          service_subcategories (name_fr, name_ar)
        `)
        .eq('artisan_id', userId);

      if (error) throw error;
      setArtisanServices(data || []);
    } catch (error) {
      console.error('Error fetching artisan services:', error);
      toast.error('Failed to load artisan services');
    }
  };

  const handleViewDetails = async (artisan: ArtisanProfile) => {
    setSelectedArtisan(artisan);
    await fetchArtisanServices(artisan.user_id);
    setDetailsDialogOpen(true);
  };

  const handleToggleVerified = async (artisanId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setProcessing(true);
    
    try {
      const { error } = await supabase
        .from('artisan_profiles')
        .update({ is_verified: newStatus })
        .eq('id', artisanId);

      if (error) throw error;

      // Log admin action
      await logAdminAction({
        action: 'update',
        entity_type: 'artisan_profile',
        entity_id: artisanId,
        metadata: { is_verified: newStatus },
      });

      toast.success(`Artisan ${newStatus ? 'verified' : 'unverified'} successfully`);
      await fetchArtisans();
    } catch (error) {
      console.error('Error updating verification status:', error);
      toast.error('Failed to update verification status');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleActive = async (artisanId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    setProcessing(true);
    
    try {
      const { error } = await supabase
        .from('artisan_profiles')
        .update({ is_active: newStatus })
        .eq('id', artisanId);

      if (error) throw error;

      // Log admin action
      await logAdminAction({
        action: 'update',
        entity_type: 'artisan_profile',
        entity_id: artisanId,
        metadata: { is_active: newStatus },
      });

      toast.success(`Artisan ${newStatus ? 'activated' : 'deactivated'} successfully`);
      await fetchArtisans();
    } catch (error) {
      console.error('Error updating active status:', error);
      toast.error('Failed to update active status');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AdminLayout>
      <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isRTL ? 'الحرفيون' : 'Artisans'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isRTL
                ? 'إدارة ملفات الحرفيين والتحقق منها'
                : 'Manage and verify artisan profiles'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {isRTL ? 'إجمالي الحرفيين' : 'Total Artisans'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{artisans.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {isRTL ? 'موثق' : 'Verified'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {artisans.filter((a) => a.is_verified).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {isRTL ? 'غير موثق' : 'Unverified'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {artisans.filter((a) => !a.is_verified).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                {isRTL ? 'نشط' : 'Active'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {artisans.filter((a) => a.is_active).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{isRTL ? 'جميع الحرفيين' : 'All Artisans'}</CardTitle>
                <CardDescription>
                  {isRTL
                    ? `إجمالي ${filteredArtisans.length} حرفي`
                    : `Total ${filteredArtisans.length} artisans`}
                </CardDescription>
              </div>
              <div className="w-48">
                <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRTL ? 'تصفية' : 'Filter'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
                    <SelectItem value="verified">{isRTL ? 'موثق' : 'Verified'}</SelectItem>
                    <SelectItem value="unverified">{isRTL ? 'غير موثق' : 'Unverified'}</SelectItem>
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
            ) : filteredArtisans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {isRTL ? 'لا يوجد حرفيون' : 'No artisans found'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRTL ? 'اسم العمل' : 'Business Name'}</TableHead>
                      <TableHead>{isRTL ? 'الفئة' : 'Category'}</TableHead>
                      <TableHead>{isRTL ? 'الهاتف' : 'Phone'}</TableHead>
                      <TableHead>{isRTL ? 'موثق' : 'Verified'}</TableHead>
                      <TableHead>{isRTL ? 'نشط' : 'Active'}</TableHead>
                      <TableHead>{isRTL ? 'معزز' : 'Boosted'}</TableHead>
                      <TableHead>{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArtisans.map((artisan) => (
                      <TableRow key={artisan.id}>
                        <TableCell className="font-medium">{artisan.business_name}</TableCell>
                        <TableCell>
                          {isRTL
                            ? artisan.service_categories?.name_ar
                            : artisan.service_categories?.name_fr}
                        </TableCell>
                        <TableCell>{artisan.phone}</TableCell>
                        <TableCell>
                          {artisan.is_verified ? (
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {isRTL ? 'موثق' : 'Verified'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600">
                              <XCircle className="h-3 w-3 mr-1" />
                              {isRTL ? 'غير موثق' : 'Unverified'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={artisan.is_active}
                            onCheckedChange={() => handleToggleActive(artisan.id, artisan.is_active)}
                            disabled={processing}
                          />
                        </TableCell>
                        <TableCell>
                          {artisan.is_boosted && (
                            <Badge className="bg-purple-500 text-white">
                              {isRTL ? 'معزز' : 'Boosted'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(artisan)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={artisan.is_verified ? 'outline' : 'default'}
                              size="sm"
                              onClick={() => handleToggleVerified(artisan.id, artisan.is_verified)}
                              disabled={processing}
                            >
                              {artisan.is_verified ? (
                                <XCircle className="h-4 w-4" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isRTL ? 'تفاصيل الحرفي' : 'Artisan Details'}
              </DialogTitle>
            </DialogHeader>
            {selectedArtisan && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">{isRTL ? 'اسم العمل' : 'Business Name'}</Label>
                    <p className="mt-1">{selectedArtisan.business_name}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">{isRTL ? 'الهاتف' : 'Phone'}</Label>
                    <p className="mt-1">{selectedArtisan.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-semibold">{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
                    <p className="mt-1">{selectedArtisan.email || selectedArtisan.profiles?.email}</p>
                  </div>
                  <div>
                    <Label className="font-semibold">{isRTL ? 'الفئة' : 'Category'}</Label>
                    <p className="mt-1">
                      {isRTL
                        ? selectedArtisan.service_categories?.name_ar
                        : selectedArtisan.service_categories?.name_fr}
                    </p>
                  </div>
                </div>

                {selectedArtisan.description_fr && (
                  <div>
                    <Label className="font-semibold">{isRTL ? 'الوصف (فرنسي)' : 'Description (French)'}</Label>
                    <p className="mt-1 text-muted-foreground">{selectedArtisan.description_fr}</p>
                  </div>
                )}

                {selectedArtisan.description_ar && (
                  <div>
                    <Label className="font-semibold">{isRTL ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
                    <p className="mt-1 text-muted-foreground" dir="rtl">{selectedArtisan.description_ar}</p>
                  </div>
                )}

                <div>
                  <Label className="font-semibold mb-2 block">
                    {isRTL ? 'الخدمات المقدمة' : 'Services Offered'}
                  </Label>
                  {artisanServices.length === 0 ? (
                    <p className="text-muted-foreground">{isRTL ? 'لا توجد خدمات' : 'No services'}</p>
                  ) : (
                    <div className="space-y-2">
                      {artisanServices.map((service) => (
                        <div key={service.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="font-medium">
                              {isRTL
                                ? service.service_categories?.name_ar
                                : service.service_categories?.name_fr}
                            </span>
                            {service.service_subcategories && (
                              <span className="text-muted-foreground ml-2">
                                → {isRTL
                                  ? service.service_subcategories.name_ar
                                  : service.service_subcategories.name_fr}
                              </span>
                            )}
                            <span className="text-muted-foreground ml-2">
                              ({service.city})
                            </span>
                          </div>
                          <Badge variant={service.is_active ? 'default' : 'outline'}>
                            {service.is_active ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'غير نشط' : 'Inactive')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <div className="flex items-center gap-2">
                    <Label>{isRTL ? 'موثق' : 'Verified'}:</Label>
                    <Switch
                      checked={selectedArtisan.is_verified}
                      onCheckedChange={() => {
                        handleToggleVerified(selectedArtisan.id, selectedArtisan.is_verified);
                        setSelectedArtisan({ ...selectedArtisan, is_verified: !selectedArtisan.is_verified });
                      }}
                      disabled={processing}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label>{isRTL ? 'نشط' : 'Active'}:</Label>
                    <Switch
                      checked={selectedArtisan.is_active}
                      onCheckedChange={() => {
                        handleToggleActive(selectedArtisan.id, selectedArtisan.is_active);
                        setSelectedArtisan({ ...selectedArtisan, is_active: !selectedArtisan.is_active });
                      }}
                      disabled={processing}
                    />
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
