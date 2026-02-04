import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Image as ImageIcon,
  ExternalLink,
  Eye,
  Home,
  Building,
  Users,
  FileText,
  Settings,
  Trash2,
  Edit,
  MapPin,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BannerRequest {
  id: string;
  company_name: string;
  contact_email: string;
  contact_phone: string | null;
  duration_days: number;
  price: number;
  banner_image_url: string;
  target_url: string;
  payment_proof_url: string | null;
  status: string;
  admin_notes: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  advertiser: {
    email: string;
    full_name: string | null;
  };
  slot: {
    name_fr: string;
    name_ar: string;
    page: string;
    size: string;
  };
}

interface Property {
  id: string;
  title_fr: string;
  title_ar: string;
  price: number;
  status: string;
  transaction_type: string;
  property_type: string;
  advertiser_type: string;
  created_at: string;
  images: string[];
  city: { name_fr: string; name_ar: string } | null;
  owner: { email: string; full_name: string | null } | null;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  user_role: string;
  advertiser_type: string | null;
  company_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
};

const propertyStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  approved: 'bg-green-100 text-green-800', // Legacy, should be published
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-slate-100 text-slate-800',
  sold: 'bg-blue-100 text-blue-800',
  rented: 'bg-purple-100 text-purple-800',
};

export default function AdminPanel() {
  const { t, language, isRTL } = useLanguage();
  const { user, profile, loading: authLoading, profileLoading } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<'properties' | 'ads' | 'content' | 'users'>('properties');
  const [requests, setRequests] = useState<BannerRequest[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState<'all' | 'real_estate_advertiser' | 'commercial_advertiser'>('all');
  const [selectedRequest, setSelectedRequest] = useState<BannerRequest | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [propertyActionType, setPropertyActionType] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !profileLoading && profile) {
      if (!profile.is_admin) {
        navigate('/');
      } else {
        fetchRequests();
        fetchProperties();
      }
    } else if (!authLoading && !profileLoading && !user) {
      navigate('/login');
    }
  }, [user, profile, authLoading, profileLoading, navigate]);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('banner_requests')
      .select(`
        *,
        advertiser:profiles(email, full_name),
        slot:banner_slots(name_fr, name_ar, page, size)
      `)
      .order('created_at', { ascending: false });

    if (data) setRequests(data as unknown as BannerRequest[]);
  };

  const fetchProperties = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('properties')
      .select(`
        id,
        title_fr,
        title_ar,
        price,
        status,
        transaction_type,
        property_type,
        advertiser_type,
        created_at,
        images,
        city:cities(name_fr, name_ar),
        owner:profiles!properties_owner_id_fkey(email, full_name)
      `)
      .order('created_at', { ascending: false });

    if (data) setProperties(data as unknown as Property[]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      if (import.meta.env.DEV) {
        console.log('👥 Fetching users from profiles table...')
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching users:', {
          code: error.code,
          message: error.message,
          details: error.details
        })
        // Show error to user but don't crash
        return
      }
      
      if (data) {
        if (import.meta.env.DEV) {
          console.log(`✅ Fetched ${data.length} users from profiles`)
        }
        setUsers(data as unknown as UserProfile[])
      } else {
        console.warn('⚠️ No users returned from profiles query')
        setUsers([])
      }
    } catch (exception) {
      console.error('❌ Exception fetching users:', exception)
      // Allow admin panel to continue with empty user list
      setUsers([])
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);
      
      if (error) {
        console.error('❌ Error toggling user status:', error)
        return
      }
      
      if (import.meta.env.DEV) {
        console.log(`✅ User ${userId} status toggled to ${!currentStatus}`)
      }
      fetchUsers();
    } catch (exception) {
      console.error('❌ Exception toggling user status:', exception)
    }
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_role: newRole })
        .eq('id', userId);
      
      if (error) {
        console.error('❌ Error changing user role:', error)
        return
      }
      
      if (import.meta.env.DEV) {
        console.log(`✅ User ${userId} role changed to ${newRole}`)
      }
      fetchUsers();
    } catch (exception) {
      console.error('❌ Exception changing user role:', exception)
    }
  };

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;
    setProcessing(true);

    const updates: Record<string, unknown> = {
      admin_notes: adminNotes || null,
      updated_at: new Date().toISOString(),
    };

    if (actionType === 'approve') {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + selectedRequest.duration_days);
      
      updates.status = 'active';
      updates.approved_at = startDate.toISOString();
      updates.start_date = startDate.toISOString();
      updates.end_date = endDate.toISOString();
    } else {
      updates.status = 'rejected';
    }

    await supabase
      .from('banner_requests')
      .update(updates)
      .eq('id', selectedRequest.id);

    setProcessing(false);
    setSelectedRequest(null);
    setActionType(null);
    setAdminNotes('');
    fetchRequests();
  };

  const handlePropertyAction = async () => {
    if (!selectedProperty || !propertyActionType) return;
    setProcessing(true);

    if (propertyActionType === 'delete') {
      await supabase.from('properties').delete().eq('id', selectedProperty.id);
    } else {
      // Fix: Set status to 'published' instead of 'approved' to make listings visible publicly
      interface PropertyUpdateData {
        status: string;
        approved_at?: string;
        approved_by?: string | null;
        published_at?: string;
        is_archived?: boolean;
        rejected_at?: string;
        rejected_by?: string | null;
      }
      
      const updateData: PropertyUpdateData = {
        status: propertyActionType === 'approve' ? 'published' : 'rejected'
      };
      
      if (propertyActionType === 'approve') {
        const now = new Date().toISOString();
        updateData.approved_at = now;
        updateData.approved_by = user?.id || null;
        updateData.published_at = now;
        updateData.is_archived = false;
      } else {
        // Rejected
        const now = new Date().toISOString();
        updateData.rejected_at = now;
        updateData.rejected_by = user?.id || null;
      }
      
      await supabase.from('properties').update(updateData).eq('id', selectedProperty.id);
    }

    setProcessing(false);
    setSelectedProperty(null);
    setPropertyActionType(null);
    fetchProperties();
  };

  const getStatusLabel = (status: string) => {
    return t(`advertising.${status}`);
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

  const getSlotName = (slot: BannerRequest['slot']) => {
    return language === 'ar' ? slot.name_ar : slot.name_fr;
  };

  const filterByStatus = (status: string) => {
    if (status === 'all') return requests;
    return requests.filter(r => r.status === status);
  };

  const filterPropertiesByStatus = (status: string) => {
    if (status === 'all') return properties;
    return properties.filter(p => p.status === status);
  };

  const getPropertyTitle = (property: Property) => {
    return language === 'ar' ? property.title_ar : property.title_fr;
  };

  const getCityName = (city: Property['city']) => {
    if (!city) return '-';
    return language === 'ar' ? city.name_ar : city.name_fr;
  };

  const getAdvertiserTypeLabel = (type: string) => {
    const labels: Record<string, { fr: string; ar: string }> = {
      owner: { fr: 'Propriétaire', ar: 'مالك' },
      broker: { fr: 'Courtier', ar: 'سمسار' },
      agency: { fr: 'Agence', ar: 'وكالة' },
    };
    return labels[type]?.[language] || type;
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, { fr: string; ar: string }> = {
      apartment: { fr: 'Appartement', ar: 'شقة' },
      house: { fr: 'Maison', ar: 'منزل' },
      villa: { fr: 'Villa', ar: 'فيلا' },
      land: { fr: 'Terrain', ar: 'أرض' },
      commercial: { fr: 'Commercial', ar: 'تجاري' },
    };
    return labels[type]?.[language] || type;
  };

  if (authLoading || profileLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile?.is_admin) {
    return (
      <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center px-4">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground mb-4">
              {isRTL ? 'الوصول مرفوض' : 'Accès refusé'}
            </h1>
            <p className="text-muted-foreground">
              {isRTL 
                ? 'ليس لديك صلاحية للوصول إلى هذه الصفحة'
                : 'Vous n\'avez pas accès à cette page'}
            </p>
          </div>
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold text-foreground mb-4">
              {t('admin.title')}
            </h1>
            <p className="text-muted-foreground">
              {isRTL ? 'إدارة العقارات والإعلانات والمحتوى' : 'Gérer les propriétés, les annonces et le contenu'}
            </p>
          </div>

          {/* Section Navigation */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Button
              variant={activeSection === 'properties' ? 'default' : 'outline'}
              onClick={() => setActiveSection('properties')}
            >
              <Home className="h-4 w-4 mr-2" />
              {isRTL ? 'العقارات' : 'Propriétés'}
              <Badge variant="secondary" className="ml-2">{properties.length}</Badge>
            </Button>
            <Button
              variant={activeSection === 'ads' ? 'default' : 'outline'}
              onClick={() => setActiveSection('ads')}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              {isRTL ? 'الإعلانات' : 'Publicités'}
              <Badge variant="secondary" className="ml-2">{requests.length}</Badge>
            </Button>
            <Button
              variant={activeSection === 'content' ? 'default' : 'outline'}
              onClick={() => setActiveSection('content')}
            >
              <FileText className="h-4 w-4 mr-2" />
              {isRTL ? 'المحتوى' : 'Contenu'}
            </Button>
            <Button
              variant={activeSection === 'users' ? 'default' : 'outline'}
              onClick={() => { setActiveSection('users'); fetchUsers(); }}
            >
              <Users className="h-4 w-4 mr-2" />
              {isRTL ? 'المستخدمين' : 'Utilisateurs'}
              <Badge variant="secondary" className="ml-2">{users.length}</Badge>
            </Button>
          </div>

          {/* Properties Management Section */}
          {activeSection === 'properties' && (
            <Tabs defaultValue="pending" className="space-y-6">
              <TabsList>
                <TabsTrigger value="pending">
                  {isRTL ? 'قيد الانتظار' : 'En attente'} ({filterPropertiesByStatus('pending').length})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  {isRTL ? 'موافق عليه' : 'Approuvé'} ({filterPropertiesByStatus('approved').length})
                </TabsTrigger>
                <TabsTrigger value="all">
                  {isRTL ? 'الكل' : 'Tous'} ({properties.length})
                </TabsTrigger>
              </TabsList>

              {['pending', 'approved', 'all'].map((tab) => (
                <TabsContent key={tab} value={tab} className="space-y-4">
                  {filterPropertiesByStatus(tab).length === 0 ? (
                    <div className="bg-white rounded-xl border p-12 text-center">
                      <p className="text-muted-foreground">
                        {isRTL ? 'لا توجد عقارات' : 'Aucune propriété'}
                      </p>
                    </div>
                  ) : (
                    filterPropertiesByStatus(tab).map((property) => (
                      <div key={property.id} className="bg-white rounded-xl border p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Image */}
                          <div className="w-full md:w-32 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {property.images?.[0] ? (
                              <img
                                src={property.images[0]}
                                alt={getPropertyTitle(property)}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Home className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge className={propertyStatusColors[property.status]}>
                                {property.status === 'draft' ? (isRTL ? 'مسودة' : 'Brouillon') :
                                 property.status === 'pending' ? (isRTL ? 'قيد الانتظار' : 'En attente') :
                                 property.status === 'published' ? (isRTL ? 'منشور' : 'Publié') :
                                 property.status === 'approved' ? (isRTL ? 'منشور' : 'Publié') :  // Legacy, treat as published
                                 property.status === 'rejected' ? (isRTL ? 'مرفوض' : 'Rejeté') :
                                 property.status === 'archived' ? (isRTL ? 'مؤرشف' : 'Archivé') :
                                 property.status}
                              </Badge>
                              <Badge variant="outline">
                                {property.transaction_type === 'sale' ? (isRTL ? 'للبيع' : 'Vente') : (isRTL ? 'للإيجار' : 'Location')}
                              </Badge>
                              <Badge variant="outline">
                                {getPropertyTypeLabel(property.property_type)}
                              </Badge>
                              <Badge variant="secondary">
                                {getAdvertiserTypeLabel(property.advertiser_type)}
                              </Badge>
                            </div>

                            <h3 className="font-semibold text-foreground truncate">
                              {getPropertyTitle(property) || (isRTL ? 'بدون عنوان' : 'Sans titre')}
                            </h3>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {getCityName(property.city)}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {new Intl.NumberFormat('fr-MA').format(property.price)} MAD
                              </span>
                              <span>
                                {property.owner?.full_name || property.owner?.email || '-'}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex md:flex-col gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/property/${property.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            {property.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedProperty(property);
                                    setPropertyActionType('approve');
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedProperty(property);
                                    setPropertyActionType('reject');
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
                              onClick={() => {
                                setSelectedProperty(property);
                                setPropertyActionType('delete');
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}

          {/* Ads Management Section */}
          {activeSection === 'ads' && (
            <Tabs defaultValue="pending" className="space-y-6">
              <TabsList>
                <TabsTrigger value="pending">
                  {t('advertising.pending')} ({filterByStatus('pending').length})
                </TabsTrigger>
                <TabsTrigger value="active">
                  {t('advertising.active')} ({filterByStatus('active').length})
                </TabsTrigger>
                <TabsTrigger value="all">
                  {isRTL ? 'الكل' : 'Tous'} ({requests.length})
                </TabsTrigger>
              </TabsList>

              {['pending', 'active', 'all'].map((tab) => (
                <TabsContent key={tab} value={tab} className="space-y-4">
                  {filterByStatus(tab).length === 0 ? (
                    <div className="bg-white rounded-xl border p-12 text-center">
                      <p className="text-muted-foreground">
                        {isRTL ? 'لا توجد طلبات' : 'Aucune demande'}
                      </p>
                    </div>
                  ) : (
                    filterByStatus(tab).map((request) => (
                      <div
                        key={request.id}
                        className="bg-white rounded-xl border p-6"
                      >
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* Banner Preview */}
                          <div className="w-full lg:w-64 flex-shrink-0">
                            <div
                              className="aspect-[728/90] rounded-lg overflow-hidden bg-muted cursor-pointer"
                              onClick={() => setPreviewUrl(request.banner_image_url)}
                            >
                              {request.banner_image_url ? (
                                <img
                                  src={request.banner_image_url}
                                  alt={request.company_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge
                                variant="secondary"
                                className={cn('font-normal', statusColors[request.status])}
                              >
                                {getStatusLabel(request.status)}
                              </Badge>
                              <Badge variant="outline">
                                {request.duration_days} {t('advertising.days')}
                              </Badge>
                              <Badge variant="outline">
                                {formatPrice(request.price)} MAD
                              </Badge>
                            </div>

                            <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                              {request.company_name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {getSlotName(request.slot)} ({request.slot.size})
                            </p>

                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                              <div>
                                <span className="text-muted-foreground">{isRTL ? 'المعلن' : 'Annonceur'}:</span>
                                <p>{request.advertiser.full_name || request.advertiser.email}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{t('advertising.contactEmail')}:</span>
                                <p>{request.contact_email}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{isRTL ? 'تاريخ الإنشاء' : 'Créé le'}:</span>
                                <p>{formatDate(request.created_at)}</p>
                              </div>
                              {request.start_date && (
                                <div>
                                  <span className="text-muted-foreground">{t('advertising.startDate')}:</span>
                                  <p>{formatDate(request.start_date)}</p>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <a
                                href={request.target_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {isRTL ? 'عرض الرابط' : 'Voir le lien'}
                              </a>
                              {request.payment_proof_url && (
                                <button
                                  onClick={() => setPreviewUrl(request.payment_proof_url)}
                                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                >
                                  <Eye className="h-3 w-3" />
                                  {t('admin.viewPayment')}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          {request.status === 'pending' && (
                            <div className="flex lg:flex-col gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setActionType('approve');
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                                {t('admin.approve')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setActionType('reject');
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                                {t('admin.reject')}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}

          {/* Content Management Section */}
          {activeSection === 'content' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Privacy Policy Card */}
                <div className="bg-white rounded-xl border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {isRTL ? 'سياسة الخصوصية' : 'Politique de confidentialité'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? 'FR / AR' : 'FR / AR'}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to="/privacy">
                      <Eye className="h-4 w-4 mr-2" />
                      {isRTL ? 'عرض' : 'Voir'}
                    </Link>
                  </Button>
                </div>

                {/* Terms Card */}
                <div className="bg-white rounded-xl border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {isRTL ? 'الشروط والأحكام' : 'Conditions générales'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? 'FR / AR' : 'FR / AR'}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to="/terms">
                      <Eye className="h-4 w-4 mr-2" />
                      {isRTL ? 'عرض' : 'Voir'}
                    </Link>
                  </Button>
                </div>

                {/* About Card */}
                <div className="bg-white rounded-xl border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {isRTL ? 'من نحن' : 'À propos'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? 'FR / AR' : 'FR / AR'}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to="/about">
                      <Eye className="h-4 w-4 mr-2" />
                      {isRTL ? 'عرض' : 'Voir'}
                    </Link>
                  </Button>
                </div>

                {/* Contact Card */}
                <div className="bg-white rounded-xl border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {isRTL ? 'اتصل بنا' : 'Contact'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? 'FR / AR' : 'FR / AR'}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to="/contact">
                      <Eye className="h-4 w-4 mr-2" />
                      {isRTL ? 'عرض' : 'Voir'}
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Statistics Overview */}
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold mb-4">
                  {isRTL ? 'نظرة عامة على الإحصائيات' : 'Aperçu des statistiques'}
                </h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-primary">{properties.length}</p>
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? 'إجمالي العقارات' : 'Total propriétés'}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-yellow-600">
                      {filterPropertiesByStatus('pending').length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? 'قيد الانتظار' : 'En attente'}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {filterByStatus('active').length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? 'إعلانات نشطة' : 'Pubs actives'}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-blue-600">{requests.length}</p>
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? 'إجمالي الطلبات' : 'Total demandes'}
                    </p>
                  </div>
                </div>
              </div>

              {/* AdSense Info */}
              <div className="bg-white rounded-xl border p-6">
                <h3 className="font-semibold mb-4">
                  {isRTL ? 'معلومات Google AdSense' : 'Informations Google AdSense'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {isRTL 
                    ? 'يتم عرض إعلانات AdSense تلقائياً عند عدم وجود إعلانات مباشرة نشطة. تأكد من إضافة معرف AdSense الخاص بك في الإعدادات.'
                    : 'Les annonces AdSense sont affichées automatiquement lorsqu\'il n\'y a pas de publicités directes actives. Assurez-vous d\'avoir ajouté votre ID AdSense dans les paramètres.'}
                </p>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-mono">
                    {isRTL ? 'المواقع: الصفحة الرئيسية، البحث، صفحات العقارات' : 'Emplacements: Accueil, Recherche, Pages propriétés'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Users Management Section */}
          {activeSection === 'users' && (
            <div className="space-y-6">
              {/* User filters */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={userFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserFilter('all')}
                >
                  {isRTL ? 'الكل' : 'Tous'} ({users.length})
                </Button>
                <Button
                  variant={userFilter === 'real_estate_advertiser' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserFilter('real_estate_advertiser')}
                >
                  {isRTL ? 'معلنو العقارات' : 'Immobilier'} ({users.filter(u => u.user_role === 'real_estate_advertiser').length})
                </Button>
                <Button
                  variant={userFilter === 'commercial_advertiser' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUserFilter('commercial_advertiser')}
                >
                  {isRTL ? 'المعلنون التجاريون' : 'Publicités'} ({users.filter(u => u.user_role === 'commercial_advertiser').length})
                </Button>
              </div>

              {/* Users list */}
              <div className="space-y-4">
                {users
                  .filter(u => userFilter === 'all' || u.user_role === userFilter)
                  .map((userItem) => (
                    <div key={userItem.id} className="bg-white rounded-xl border p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold">{userItem.full_name || userItem.email}</h3>
                            <Badge className={userItem.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {userItem.is_active ? (isRTL ? 'نشط' : 'Actif') : (isRTL ? 'معطل' : 'Inactif')}
                            </Badge>
                            <Badge variant="outline">
                              {userItem.user_role === 'admin' ? (isRTL ? 'مدير' : 'Admin') :
                               userItem.user_role === 'commercial_advertiser' ? (isRTL ? 'إعلانات تجارية' : 'Publicités') :
                               (isRTL ? 'عقارات' : 'Immobilier')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{userItem.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {isRTL ? 'انضم في:' : 'Inscrit le:'} {formatDate(userItem.created_at)}
                            {userItem.company_name && ` • ${userItem.company_name}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            className="border rounded px-2 py-1 text-sm"
                            value={userItem.user_role}
                            onChange={(e) => changeUserRole(userItem.id, e.target.value)}
                          >
                            <option value="real_estate_advertiser">{isRTL ? 'عقارات' : 'Immobilier'}</option>
                            <option value="commercial_advertiser">{isRTL ? 'إعلانات تجارية' : 'Publicités'}</option>
                            <option value="admin">{isRTL ? 'مدير' : 'Admin'}</option>
                          </select>
                          <Button
                            variant={userItem.is_active ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() => toggleUserStatus(userItem.id, userItem.is_active)}
                          >
                            {userItem.is_active ? (isRTL ? 'تعطيل' : 'Désactiver') : (isRTL ? 'تفعيل' : 'Activer')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                {users.filter(u => userFilter === 'all' || u.user_role === userFilter).length === 0 && (
                  <div className="bg-white rounded-xl border p-12 text-center">
                    <p className="text-muted-foreground">
                      {isRTL ? 'لا يوجد مستخدمين' : 'Aucun utilisateur'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Action Dialog */}
      <Dialog open={!!selectedRequest && !!actionType} onOpenChange={() => {
        setSelectedRequest(null);
        setActionType(null);
        setAdminNotes('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? t('admin.approve') : t('admin.reject')} - {selectedRequest?.company_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('admin.notes')}</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={isRTL ? 'ملاحظات (اختياري)...' : 'Notes (optionnel)...'}
              />
            </div>
            {actionType === 'approve' && selectedRequest && (
              <div className="p-4 bg-muted/50 rounded-lg text-sm">
                <p>
                  {isRTL 
                    ? `سيبدأ الإعلان اليوم وينتهي بعد ${selectedRequest.duration_days} يوم`
                    : `La publicité commencera aujourd'hui et se terminera dans ${selectedRequest.duration_days} jours`}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setActionType(null);
                setAdminNotes('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              className={actionType === 'reject' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : actionType === 'approve' ? (
                t('admin.approve')
              ) : (
                t('admin.reject')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('admin.viewBanner')}</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
