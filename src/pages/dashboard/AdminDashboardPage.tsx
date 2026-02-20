import { useState } from 'react';
import { DashboardLayout, SidebarItem } from '@/components/shared/DashboardLayout';
import { StatCard, MiniChart } from '@/components/shared/DashboardWidgets';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield, Home, Users, FileText, Activity, BarChart3, Bell, Settings,
  Eye, CheckCircle, XCircle, Clock, Search, AlertTriangle, Info, Ban,
  Server, Database, Zap, HardDrive, Cpu, Globe, ChevronRight, BadgeCheck,
  Filter, RefreshCw, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  useAdminStats,
  usePendingProperties,
  useUnverifiedArtisans,
  useUsers,
  useAuditLogs,
} from '@/hooks/useAdminDashboard';
import { toast } from 'sonner';

const sidebarItems: SidebarItem[] = [
  { icon: <BarChart3 className="h-4 w-4" />, label: 'Vue d\'ensemble', id: 'overview' },
  { icon: <Home className="h-4 w-4" />, label: 'Propriétés', id: 'properties' },
  { icon: <BadgeCheck className="h-4 w-4" />, label: 'Artisans', id: 'artisans' },
  { icon: <Users className="h-4 w-4" />, label: 'Utilisateurs', id: 'users' },
  { icon: <FileText className="h-4 w-4" />, label: 'Logs', id: 'logs' },
  { icon: <Activity className="h-4 w-4" />, label: 'Audit Trail', id: 'audit' },
];

// Overview Section
function OverviewSection() {
  const { stats, loading } = useAdminStats();

  if (loading) {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Users className="h-5 w-5 text-[#0FC2C0]" />} 
          label="Total Utilisateurs" 
          value={stats?.totalUsers?.toString() || '0'} 
        />
        <StatCard 
          icon={<Home className="h-5 w-5 text-blue-400" />} 
          label="Propriétés" 
          value={stats?.totalProperties?.toString() || '0'} 
        />
        <StatCard 
          icon={<Clock className="h-5 w-5 text-amber-400" />} 
          label="En attente" 
          value={stats?.pendingProperties?.toString() || '0'} 
        />
        <StatCard 
          icon={<BadgeCheck className="h-5 w-5 text-purple-400" />} 
          label="Artisans" 
          value={stats?.totalArtisans?.toString() || '0'} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Propriétés par statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A1F2E]">
              <span className="text-sm text-gray-300">En attente de validation</span>
              <Badge className="bg-amber-500/20 text-amber-400">{stats?.pendingProperties || 0}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A1F2E]">
              <span className="text-sm text-gray-300">Approuvées</span>
              <Badge className="bg-green-500/20 text-green-400">{stats?.approvedProperties || 0}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Artisans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A1F2E]">
              <span className="text-sm text-gray-300">Non vérifiés</span>
              <Badge className="bg-amber-500/20 text-amber-400">{stats?.unverifiedArtisans || 0}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A1F2E]">
              <span className="text-sm text-gray-300">Total artisans</span>
              <Badge className="bg-purple-500/20 text-purple-400">{stats?.totalArtisans || 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Properties Moderation Section
function PropertiesSection() {
  const { properties, loading, error, approveProperty, rejectProperty } = usePendingProperties();
  const [processing, setProcessing] = useState<string | null>(null);

  const handleApprove = async (propertyId: string) => {
    setProcessing(propertyId);
    const result = await approveProperty(propertyId);
    setProcessing(null);
    
    if (result.success) {
      toast.success('Propriété approuvée');
    } else {
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleReject = async (propertyId: string) => {
    setProcessing(propertyId);
    const result = await rejectProperty(propertyId);
    setProcessing(null);
    
    if (result.success) {
      toast.success('Propriété rejetée');
    } else {
      toast.error('Erreur lors du rejet');
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full bg-gray-700" />;
  }

  if (error) {
    return (
      <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
        <CardContent className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400">Erreur lors du chargement</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Modération des propriétés</h2>
          <p className="text-sm text-gray-400">{properties.length} propriétés en attente</p>
        </div>
      </div>

      <Card className="bg-[#1B2F3C] border-[#2A3F4C] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A3F4C]">
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4">Titre</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4 hidden md:table-cell">Auteur</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4 hidden sm:table-cell">Ville</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4">Date</th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A3F4C]">
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400">
                    <Home className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune propriété en attente</p>
                  </td>
                </tr>
              ) : (
                properties.map(property => (
                  <tr key={property.id} className="hover:bg-[#0A1F2E]/50">
                    <td className="p-4">
                      <p className="font-medium text-white text-sm">{property.title}</p>
                      <p className="text-xs text-gray-400 md:hidden">{property.author_name}</p>
                    </td>
                    <td className="p-4 hidden md:table-cell text-sm text-gray-300">
                      {property.author_name || 'N/A'}
                    </td>
                    <td className="p-4 hidden sm:table-cell text-sm text-gray-400">
                      {property.city || 'N/A'}
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {new Date(property.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApprove(property.id)}
                          disabled={processing === property.id}
                          className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                        >
                          {processing === property.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approuver
                            </>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleReject(property.id)}
                          disabled={processing === property.id}
                          variant="outline" 
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-7 text-xs"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejeter
                        </Button>
                      </div>
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

// Artisans Verification Section
function ArtisansSection() {
  const { artisans, loading, error, verifyArtisan, rejectArtisan } = useUnverifiedArtisans();
  const [processing, setProcessing] = useState<string | null>(null);

  const handleVerify = async (artisanId: string) => {
    setProcessing(artisanId);
    const result = await verifyArtisan(artisanId);
    setProcessing(null);
    
    if (result.success) {
      toast.success('Artisan vérifié');
    } else {
      toast.error('Erreur lors de la vérification');
    }
  };

  const handleReject = async (artisanId: string) => {
    setProcessing(artisanId);
    const result = await rejectArtisan(artisanId);
    setProcessing(null);
    
    if (result.success) {
      toast.success('Artisan rejeté');
    } else {
      toast.error('Erreur lors du rejet');
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full bg-gray-700" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Vérification des artisans</h2>
          <p className="text-sm text-gray-400">{artisans.length} artisans en attente</p>
        </div>
      </div>

      <Card className="bg-[#1B2F3C] border-[#2A3F4C] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A3F4C]">
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4">Nom</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4 hidden md:table-cell">Téléphone</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4 hidden sm:table-cell">Catégorie</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4">Date</th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A3F4C]">
              {artisans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400">
                    <BadgeCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun artisan en attente</p>
                  </td>
                </tr>
              ) : (
                artisans.map(artisan => (
                  <tr key={artisan.id} className="hover:bg-[#0A1F2E]/50">
                    <td className="p-4">
                      <p className="font-medium text-white text-sm">{artisan.business_name}</p>
                      <p className="text-xs text-gray-400 md:hidden">{artisan.phone}</p>
                    </td>
                    <td className="p-4 hidden md:table-cell text-sm text-gray-300">
                      {artisan.phone}
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-400 text-xs">
                        {artisan.service_category || 'N/A'}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {new Date(artisan.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleVerify(artisan.id)}
                          disabled={processing === artisan.id}
                          className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                        >
                          {processing === artisan.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Vérifier
                            </>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleReject(artisan.id)}
                          disabled={processing === artisan.id}
                          variant="outline" 
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-7 text-xs"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejeter
                        </Button>
                      </div>
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

// Users Management Section
function UsersSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const { users, loading, updateUserRole, toggleUserStatus } = useUsers(searchTerm);
  const [processing, setProcessing] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setProcessing(userId);
    const result = await updateUserRole(userId, newRole);
    setProcessing(null);
    
    if (result.success) {
      toast.success('Rôle mis à jour');
    } else {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleToggleStatus = async (userId: string) => {
    setProcessing(userId);
    const result = await toggleUserStatus(userId);
    setProcessing(null);
    
    if (result.success) {
      toast.success('Statut mis à jour');
    } else {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full bg-gray-700" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Gestion des utilisateurs</h2>
          <p className="text-sm text-gray-400">{users.length} utilisateurs</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Rechercher..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-[#1B2F3C] border-[#2A3F4C] text-white w-64" 
          />
        </div>
      </div>

      <Card className="bg-[#1B2F3C] border-[#2A3F4C] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A3F4C]">
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4">Utilisateur</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4 hidden sm:table-cell">Rôle</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4 hidden md:table-cell">Inscrit le</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4">Statut</th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A3F4C]">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-[#0A1F2E]/50">
                  <td className="p-4">
                    <p className="font-medium text-white text-sm">{user.full_name || 'N/A'}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <Select
                      value={user.user_role}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                      disabled={processing === user.id}
                    >
                      <SelectTrigger className="w-32 h-8 bg-transparent border-[#2A3F4C] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
                        <SelectItem value="user" className="text-white text-xs">User</SelectItem>
                        <SelectItem value="artisan" className="text-purple-400 text-xs">Artisan</SelectItem>
                        <SelectItem value="advertiser" className="text-blue-400 text-xs">Advertiser</SelectItem>
                        <SelectItem value="admin" className="text-red-400 text-xs">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4 hidden md:table-cell text-sm text-gray-400">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="p-4">
                    <Badge className={cn(
                      'text-xs',
                      user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    )}>
                      {user.is_active ? 'Actif' : 'Banni'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleToggleStatus(user.id)}
                        disabled={processing === user.id}
                        variant="outline"
                        className={cn(
                          'h-7 text-xs',
                          user.is_active 
                            ? 'border-red-500/50 text-red-400 hover:bg-red-500/10'
                            : 'border-green-500/50 text-green-400 hover:bg-green-500/10'
                        )}
                      >
                        {user.is_active ? <Ban className="h-3 w-3 mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                        {user.is_active ? 'Bannir' : 'Activer'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// Logs Viewer
function LogsSection() {
  const logs = [
    { time: '14:23:15', severity: 'info', message: 'Nouvelle annonce soumise: Appartement Casablanca', entity: 'property' },
    // FULL FREE MODE: Removed payment boost log
    { time: '14:18:05', severity: 'warning', message: 'Tentative de connexion échouée: user@spam.com (3ème essai)', entity: 'auth' },
    { time: '14:15:33', severity: 'error', message: 'Échec upload image: taille dépassée (15MB)', entity: 'upload' },
    { time: '14:12:19', severity: 'info', message: 'Profil artisan mis à jour: Mohamed E. (#45)', entity: 'artisan' },
    { time: '14:10:02', severity: 'success', message: 'Annonce approuvée: Studio Rabat (#103)', entity: 'moderation' },
    { time: '14:08:44', severity: 'warning', message: 'Rate limit atteint: API /search (user #78)', entity: 'api' },
    { time: '14:05:11', severity: 'info', message: 'Nouvel utilisateur inscrit: yasmine@email.com', entity: 'auth' },
    { time: '14:02:33', severity: 'error', message: 'Erreur base de données: timeout query /listings', entity: 'database' },
    { time: '14:00:15', severity: 'info', message: 'Backup automatique terminé avec succès', entity: 'system' },
  ];

  const severityConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    info: { color: 'text-blue-400 bg-blue-500/10', icon: <Info className="h-3 w-3" /> },
    success: { color: 'text-green-400 bg-green-500/10', icon: <CheckCircle className="h-3 w-3" /> },
    warning: { color: 'text-amber-400 bg-amber-500/10', icon: <AlertTriangle className="h-3 w-3" /> },
    error: { color: 'text-red-400 bg-red-500/10', icon: <XCircle className="h-3 w-3" /> },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white">Logs en temps réel</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input placeholder="Rechercher..." className="pl-9 bg-[#1B2F3C] border-[#2A3F4C] text-white w-48" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-28 bg-[#1B2F3C] border-[#2A3F4C] text-white h-9"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
              <SelectItem value="all" className="text-white">Tous</SelectItem>
              <SelectItem value="error" className="text-red-400">Erreurs</SelectItem>
              <SelectItem value="warning" className="text-amber-400">Alertes</SelectItem>
              <SelectItem value="info" className="text-blue-400">Info</SelectItem>
              <SelectItem value="success" className="text-green-400">Succès</SelectItem>
            </SelectContent>
          </Select>
          <Button size="icon" variant="outline" className="border-[#2A3F4C] text-gray-400 hover:text-white h-9 w-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="divide-y divide-[#2A3F4C]">
              {logs.map((log, i) => {
                const config = severityConfig[log.severity];
                return (
                  <div key={i} className={cn('flex items-start gap-3 p-3 hover:bg-[#0A1F2E]/50 transition-colors', log.severity === 'error' && 'bg-red-500/5')}>
                    <span className="text-xs text-gray-500 font-mono w-16 flex-shrink-0 pt-0.5">{log.time}</span>
                    <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium flex-shrink-0', config.color)}>
                      {config.icon}
                      <span className="uppercase">{log.severity}</span>
                    </div>
                    <p className="text-sm text-gray-300 flex-1">{log.message}</p>
                    <Badge variant="outline" className="text-[10px] text-gray-500 border-[#2A3F4C] flex-shrink-0">{log.entity}</Badge>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// Audit Trail
function AuditSection() {
  const [actionFilter, setActionFilter] = useState<string | undefined>();
  const { logs, loading } = useAuditLogs({ action: actionFilter });

  const actionColors: Record<string, string> = {
    create: 'bg-blue-500/20 text-blue-400',
    approve: 'bg-green-500/20 text-green-400',
    reject: 'bg-red-500/20 text-red-400',
    update: 'bg-amber-500/20 text-amber-400',
    delete: 'bg-red-500/20 text-red-400',
    ban: 'bg-red-500/20 text-red-400',
    unban: 'bg-green-500/20 text-green-400',
  };

  if (loading) {
    return <Skeleton className="h-96 w-full bg-gray-700" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Piste d'audit</h2>
        <Select value={actionFilter || 'all'} onValueChange={(v) => setActionFilter(v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-36 bg-[#1B2F3C] border-[#2A3F4C] text-white"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
            <SelectItem value="all" className="text-white">Tous les types</SelectItem>
            <SelectItem value="create" className="text-white">Créations</SelectItem>
            <SelectItem value="approve" className="text-white">Approbations</SelectItem>
            <SelectItem value="reject" className="text-white">Rejets</SelectItem>
            <SelectItem value="update" className="text-white">Modifications</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
        <CardContent className="p-6">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucun log pour le moment</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-[#2A3F4C]" />
              <div className="space-y-6">
                {logs.map((log) => {
                  const actionColor = actionColors[log.action] || 'bg-[#0FC2C0]/20 text-[#0FC2C0]';
                  const dotColor = 
                    log.action === 'create' ? 'bg-blue-400' : 
                    log.action === 'approve' ? 'bg-green-400' : 
                    log.action === 'reject' || log.action === 'delete' || log.action === 'ban' ? 'bg-red-400' : 
                    'bg-[#0FC2C0]';
                  
                  return (
                    <div key={log.id} className="flex gap-4 relative">
                      <div className="w-9 h-9 rounded-full bg-[#0A1F2E] border-2 border-[#2A3F4C] flex items-center justify-center flex-shrink-0 z-10">
                        <div className={cn('w-3 h-3 rounded-full', dotColor)} />
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={cn('text-xs', actionColor)}>{log.action}</Badge>
                          <span className="text-sm text-white font-medium">{log.admin_name}</span>
                          <span className="text-xs text-gray-500">→</span>
                          <span className="text-sm text-gray-400">{log.entity_type}</span>
                          {log.entity_id && (
                            <span className="text-xs text-gray-500 font-mono">#{log.entity_id.slice(0, 8)}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(log.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [activeItem, setActiveItem] = useState('overview');
  const { user, profile } = useAuth();

  const renderContent = () => {
    switch (activeItem) {
      case 'overview': return <OverviewSection />;
      case 'properties': return <PropertiesSection />;
      case 'artisans': return <ArtisansSection />;
      case 'users': return <UsersSection />;
      case 'logs': return <LogsSection />;
      case 'audit': return <AuditSection />;
      default: return <OverviewSection />;
    }
  };

  return (
    <DashboardLayout
      title={sidebarItems.find(i => i.id === activeItem)?.label || 'Administration'}
      sidebarItems={sidebarItems}
      activeItem={activeItem}
      onItemChange={setActiveItem}
      userName={profile?.full_name || user?.email || 'Admin'}
      userRole="Administrateur"
    >
      {renderContent()}
    </DashboardLayout>
  );
}
