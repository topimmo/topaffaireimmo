import { useState, useEffect, useRef } from 'react';
import { DashboardLayout, SidebarItem } from '@/components/shared/DashboardLayout';
import { StatCard, MiniChart } from '@/components/shared/DashboardWidgets';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard, User, Wrench, Clock, Users, Star, BarChart3, Bell, Settings,
  Eye, Phone, TrendingUp, Calendar, Search, ChevronDown, Camera, X, Save, Loader2,
  MessageSquare, BadgeCheck, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { uploadArtisanAvatar, validateFile } from '@/lib/storage';
import { compressImage } from '@/lib/imageUtils';
import {
  useArtisanStats,
  useArtisanRequests,
  useArtisanReviews,
  useArtisanProfile,
  useServiceCategories,
} from '@/hooks/useArtisanDashboard';
import { toast } from 'sonner';

const sidebarItems: SidebarItem[] = [
  { icon: <LayoutDashboard className="h-4 w-4" />, label: 'Vue d\'ensemble', id: 'overview' },
  { icon: <User className="h-4 w-4" />, label: 'Profil', id: 'profile' },
  { icon: <Wrench className="h-4 w-4" />, label: 'Services', id: 'services' },
  { icon: <Clock className="h-4 w-4" />, label: 'Disponibilité', id: 'availability' },
  { icon: <Users className="h-4 w-4" />, label: 'Leads', id: 'leads', badge: 5 },
  { icon: <Star className="h-4 w-4" />, label: 'Avis', id: 'reviews' },
  { icon: <BarChart3 className="h-4 w-4" />, label: 'Analytiques', id: 'analytics' },
  { icon: <Bell className="h-4 w-4" />, label: 'Notifications', id: 'notifications', badge: 3 },
  { icon: <Settings className="h-4 w-4" />, label: 'Paramètres', id: 'settings' },
];

// Overview Section
function OverviewSection() {
  const { stats, loading: statsLoading } = useArtisanStats();
  const { requests, loading: requestsLoading } = useArtisanRequests();
  const recentRequests = requests.slice(0, 5);

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="bg-[#1B2F3C] border-[#2A3F4C]">
              <CardContent className="p-6">
                <Skeleton className="h-12 w-full bg-gray-700" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Users className="h-5 w-5 text-[#0FC2C0]" />} 
          label="Demandes totales" 
          value={stats?.totalRequests?.toString() || '0'} 
        />
        <StatCard 
          icon={<Clock className="h-5 w-5 text-amber-400" />} 
          label="En attente" 
          value={stats?.pendingRequests?.toString() || '0'} 
        />
        <StatCard 
          icon={<Star className="h-5 w-5 text-[#0FC2C0]" />} 
          label="Note moyenne" 
          value={stats?.averageRating?.toFixed(1) || '0.0'} 
        />
        <StatCard 
          icon={<BadgeCheck className="h-5 w-5 text-green-400" />} 
          label="Missions complétées" 
          value={stats?.completedJobs?.toString() || '0'} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mini Chart */}
        <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <MiniChart data={[20, 35, 25, 45, 50, 38, 60, 55, 70, 65, 80, 75]} height={120} />
            <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
              <span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Jun</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white text-lg">Demandes récentes</CardTitle>
            <Button variant="ghost" size="sm" className="text-[#0FC2C0] text-xs">Voir tout</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {requestsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full bg-gray-700" />)}
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune demande pour le moment</p>
              </div>
            ) : (
              recentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0A1F2E]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#0FC2C0]/20 flex items-center justify-center text-[#0FC2C0] font-bold text-sm">
                      {request.client_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{request.client_name || 'Client'}</p>
                      <p className="text-xs text-gray-400">{request.service_name || 'Service'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={cn(
                      'text-xs',
                      request.status === 'pending' && 'bg-blue-500/20 text-blue-400',
                      request.status === 'contacted' && 'bg-amber-500/20 text-amber-400',
                      request.status === 'completed' && 'bg-green-500/20 text-green-400',
                    )}>
                      {request.status === 'pending' ? 'Nouveau' : request.status === 'contacted' ? 'Contacté' : request.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(request.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Leads Section
function LeadsSection() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { requests, loading, error, updateRequestStatus } = useArtisanRequests(
    statusFilter === 'all' ? undefined : statusFilter
  );
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    setUpdating(requestId);
    const result = await updateRequestStatus(requestId, newStatus);
    setUpdating(null);
    
    if (result.success) {
      toast.success('Statut mis à jour');
    } else {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full bg-gray-700" />
        <Skeleton className="h-96 w-full bg-gray-700" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">Erreur lors du chargement des demandes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Demandes</h2>
          <p className="text-sm text-gray-400">{requests.length} contacts reçus</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-[#1B2F3C] border-[#2A3F4C] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
              <SelectItem value="all" className="text-white">Tous</SelectItem>
              <SelectItem value="pending" className="text-white">En attente</SelectItem>
              <SelectItem value="contacted" className="text-white">Contactés</SelectItem>
              <SelectItem value="completed" className="text-white">Terminés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-[#1B2F3C] border-[#2A3F4C] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A3F4C]">
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4">Client</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4 hidden md:table-cell">Contact</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4">Service</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4 hidden sm:table-cell">Date</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A3F4C]">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune demande pour le moment</p>
                  </td>
                </tr>
              ) : (
                requests.map(request => (
                  <tr key={request.id} className="hover:bg-[#0A1F2E]/50">
                    <td className="p-4">
                      <p className="font-medium text-white text-sm">{request.client_name || 'Client'}</p>
                      <p className="text-xs text-gray-400 md:hidden">{request.client_phone}</p>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <p className="text-sm text-gray-300">{request.client_phone || 'N/A'}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="bg-[#0FC2C0]/10 border-[#0FC2C0]/30 text-[#0FC2C0] text-xs">
                        {request.service_name || 'Service'}
                      </Badge>
                    </td>
                    <td className="p-4 hidden sm:table-cell text-sm text-gray-400">
                      {new Date(request.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-4">
                      <Select
                        value={request.status}
                        onValueChange={(value) => handleStatusChange(request.id, value)}
                        disabled={updating === request.id}
                      >
                        <SelectTrigger className="w-32 h-8 bg-transparent border-[#2A3F4C] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
                          <SelectItem value="pending" className="text-blue-400 text-xs">En attente</SelectItem>
                          <SelectItem value="contacted" className="text-amber-400 text-xs">Contacté</SelectItem>
                          <SelectItem value="completed" className="text-green-400 text-xs">Terminé</SelectItem>
                          <SelectItem value="cancelled" className="text-red-400 text-xs">Annulé</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// Profile Section
function ProfileSection() {
  const { profile, loading, updateProfile } = useArtisanProfile();
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name || '');
      setDescription(profile.description_fr || '');
      setPhone(profile.phone || '');
      setWhatsapp(profile.whatsapp || '');
    }
  }, [profile]);

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    const validation = validateFile(file, {
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    if (!validation.valid) {
      toast.error(validation.error || 'Fichier non valide');
      return;
    }

    setUploadingAvatar(true);
    try {
      const compressed = await compressImage(file);
      const result = await uploadArtisanAvatar(compressed, user.id);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Update profile with new avatar URL
      const updateResult = await updateProfile({
        avatar_url: result.url,
      });

      if (updateResult.success) {
        toast.success('Photo de profil mise à jour avec succès');
      } else {
        toast.error('Erreur lors de la mise à jour de la photo');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Erreur lors du téléchargement de la photo');
    } finally {
      setUploadingAvatar(false);
      // Reset input
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateProfile({
      business_name: businessName,
      description_fr: description,
      phone,
      whatsapp,
    });
    setSaving(false);

    if (result.success) {
      toast.success('Profil mis à jour avec succès');
    } else {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-12 w-full bg-gray-700" />
        <Skeleton className="h-64 w-full bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Éditer le profil</h2>
        <Button 
          className="bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Enregistrer
        </Button>
      </div>

      {/* Avatar */}
      <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-2 ring-[#0FC2C0]">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-[#0FC2C0] text-white text-2xl">
                  {profile?.business_name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button 
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#0FC2C0] text-white hover:bg-[#0DA9A7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                type="button"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{profile?.business_name || 'Artisan'}</h3>
              <div className="flex items-center gap-2 mt-1">
                {profile?.is_verified && (
                  <>
                    <BadgeCheck className="h-4 w-4 text-[#0FC2C0]" />
                    <span className="text-sm text-[#0FC2C0]">Profil vérifié</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
        <CardHeader><CardTitle className="text-white text-lg">Informations</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300 text-sm">Nom de l'entreprise</Label>
            <Input 
              value={businessName} 
              onChange={(e) => setBusinessName(e.target.value)}
              className="bg-[#0A1F2E] border-[#2A3F4C] text-white" 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Téléphone</Label>
              <Input 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                className="bg-[#0A1F2E] border-[#2A3F4C] text-white" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">WhatsApp</Label>
              <Input 
                value={whatsapp} 
                onChange={(e) => setWhatsapp(e.target.value)}
                className="bg-[#0A1F2E] border-[#2A3F4C] text-white" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300 text-sm">Description</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              rows={4} 
              className="bg-[#0A1F2E] border-[#2A3F4C] text-white" 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Services Section
function ServicesSection() {
  const { profile, loading: profileLoading } = useArtisanProfile();
  const { categories, loading: categoriesLoading } = useServiceCategories();

  if (profileLoading || categoriesLoading) {
    return <Skeleton className="h-64 w-full bg-gray-700" />;
  }

  const currentCategory = categories.find(c => c.id === profile?.service_category_id);

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-white">Mon Service</h2>

      <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
        <CardHeader>
          <CardTitle className="text-white text-lg">Catégorie de service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Catégorie actuelle</Label>
              <div className="mt-2 p-4 bg-[#0A1F2E] border border-[#2A3F4C] rounded-lg">
                <p className="text-white font-medium">
                  {currentCategory?.name_fr || 'Non défini'}
                </p>
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300">
                  <p className="font-medium mb-1">Note importante</p>
                  <p>
                    La catégorie de service est définie lors de la création de votre profil artisan. 
                    Pour modifier votre catégorie, veuillez contacter le support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Reviews Section
function ReviewsSection() {
  const { reviews, loading } = useArtisanReviews();
  const { stats } = useArtisanStats();

  if (loading) {
    return <Skeleton className="h-96 w-full bg-gray-700" />;
  }

  const avgRating = stats?.averageRating || 0;
  const totalReviews = reviews.length;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Avis clients</h2>

      {/* Summary */}
      <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="text-center">
              <p className="text-5xl font-bold text-white">{avgRating.toFixed(1)}</p>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={cn('h-5 w-5', i <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-600')} />
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-1">{totalReviews} avis</p>
            </div>
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = reviews.filter(r => r.rating === rating).length;
                const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 w-3">{rating}</span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <div className="flex-1 h-2 bg-[#0A1F2E] rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
            <CardContent className="p-12 text-center text-gray-400">
              <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucun avis pour le moment</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="bg-[#1B2F3C] border-[#2A3F4C]">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0FC2C0]/20 flex items-center justify-center text-[#0FC2C0] font-bold">
                      {review.client_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white text-sm">{review.client_name}</p>
                        {review.is_verified && (
                          <Badge className="bg-green-500/20 text-green-400 text-[10px]">Vérifié</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className={cn('h-3 w-3', s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-600')} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(review.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{review.review_text}</p>
                {review.artisan_response && (
                  <div className="mt-3 p-3 bg-[#0A1F2E] rounded-lg border-l-2 border-[#0FC2C0]">
                    <p className="text-xs text-[#0FC2C0] font-medium mb-1">Votre réponse</p>
                    <p className="text-sm text-gray-300">{review.artisan_response}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Analytics Section
function AnalyticsSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Analytiques</h2>
        <Select defaultValue="30">
          <SelectTrigger className="w-36 bg-[#1B2F3C] border-[#2A3F4C] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
            <SelectItem value="7" className="text-white">7 derniers jours</SelectItem>
            <SelectItem value="30" className="text-white">30 derniers jours</SelectItem>
            <SelectItem value="90" className="text-white">90 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Eye className="h-5 w-5 text-[#0FC2C0]" />} label="Vues du profil" value="3,847" change={18} />
        <StatCard icon={<Phone className="h-5 w-5 text-[#0FC2C0]" />} label="Contacts reçus" value="234" change={12} />
        <StatCard icon={<TrendingUp className="h-5 w-5 text-[#0FC2C0]" />} label="Taux conversion" value="6.1%" change={-1.5} />
      </div>

      <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
        <CardHeader><CardTitle className="text-white text-lg">Vues du profil</CardTitle></CardHeader>
        <CardContent>
          <MiniChart data={[120, 150, 130, 180, 200, 170, 220, 190, 250, 230, 280, 260, 300, 290, 320]} height={200} />
          <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
            <span>1 Jan</span><span>8 Jan</span><span>15 Jan</span><span>22 Jan</span><span>30 Jan</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
          <CardHeader><CardTitle className="text-white text-lg">Sources de contact</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Appels téléphoniques', value: 45, color: '#0FC2C0' },
              { label: 'WhatsApp', value: 32, color: '#25D366' },
              { label: 'Formulaire contact', value: 18, color: '#0288D1' },
              { label: 'Email direct', value: 5, color: '#FFAB00' },
            ].map(source => (
              <div key={source.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{source.label}</span>
                  <span className="text-white font-medium">{source.value}%</span>
                </div>
                <div className="h-2 bg-[#0A1F2E] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${source.value}%`, backgroundColor: source.color }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
          <CardHeader><CardTitle className="text-white text-lg">Contacts par service</CardTitle></CardHeader>
          <CardContent>
            <MiniChart data={[45, 30, 25, 20, 15]} color="#FFAB00" height={160} />
            <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
              <span>Plomberie</span><span>Sanitaire</span><span>Chauffage</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Availability Section
function AvailabilitySection() {
  const [available, setAvailable] = useState(true);
  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const [activeDays, setActiveDays] = useState([true, true, true, true, true, true, false]);

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-bold text-white">Disponibilité</h2>

      <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-white">Statut de disponibilité</h3>
              <p className="text-sm text-gray-400">Les clients verront si vous êtes disponible</p>
            </div>
            <Switch checked={available} onCheckedChange={setAvailable} />
          </div>
          <div className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-lg',
            available ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
          )}>
            <div className={cn('w-2 h-2 rounded-full', available ? 'bg-green-400' : 'bg-gray-400')} />
            <span className="text-sm font-medium">{available ? 'Disponible' : 'Indisponible'}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
        <CardHeader><CardTitle className="text-white text-lg">Jours de travail</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {days.map((day, i) => (
            <div key={day} className="flex items-center justify-between p-3 rounded-lg bg-[#0A1F2E]">
              <span className="text-sm text-white">{day}</span>
              <Switch checked={activeDays[i]} onCheckedChange={(val) => setActiveDays(prev => { const next = [...prev]; next[i] = val; return next; })} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button className="bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white w-full sm:w-auto">
        <Save className="h-4 w-4 mr-2" />Enregistrer les modifications
      </Button>
    </div>
  );
}

export default function ArtisanDashboardPage() {
  const [activeItem, setActiveItem] = useState('overview');
  const { user, profile } = useAuth();

  const renderContent = () => {
    switch (activeItem) {
      case 'overview': return <OverviewSection />;
      case 'profile': return <ProfileSection />;
      case 'services': return <ServicesSection />;
      case 'leads': return <LeadsSection />;
      case 'reviews': return <ReviewsSection />;
      case 'analytics': return <AnalyticsSection />;
      case 'availability': return <AvailabilitySection />;
      default: return <OverviewSection />;
    }
  };

  return (
    <DashboardLayout
      title={sidebarItems.find(i => i.id === activeItem)?.label || 'Tableau de bord'}
      sidebarItems={sidebarItems}
      activeItem={activeItem}
      onItemChange={setActiveItem}
      userName={profile?.full_name || user?.email || 'Artisan'}
      userRole="Artisan"
    >
      {renderContent()}
    </DashboardLayout>
  );
}
