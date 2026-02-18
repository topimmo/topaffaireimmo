import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout, SidebarItem } from '@/components/shared/DashboardLayout';
import { StatCard, MiniChart } from '@/components/shared/DashboardWidgets';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyProperties } from '@/hooks/useProperties';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useLeads } from '@/hooks/useLeads';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  LayoutDashboard, Home, PlusCircle, Users, BarChart3, Zap, Settings,
  Eye, Phone, TrendingUp, MessageSquare, Edit, Trash2, MapPin, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems: SidebarItem[] = [
  { icon: <LayoutDashboard className="h-4 w-4" />, label: 'Vue d\'ensemble', id: 'overview' },
  { icon: <Home className="h-4 w-4" />, label: 'Mes annonces', id: 'listings' },
  { icon: <Users className="h-4 w-4" />, label: 'Leads', id: 'leads' },
  { icon: <BarChart3 className="h-4 w-4" />, label: 'Analytiques', id: 'analytics' },
  // FULL FREE MODE: Removed Boost section
  { icon: <Settings className="h-4 w-4" />, label: 'Paramètres', id: 'settings' },
];

// Overview
function OverviewSection() {
  const { stats, recentActivity, loading } = useDashboardStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="bg-[#1B2F3C] border-[#2A3F4C]">
              <CardContent className="p-6">
                <Skeleton className="h-16 bg-[#2A3F4C]" />
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
          icon={<Home className="h-5 w-5 text-[#0FC2C0]" />} 
          label="Propriétés" 
          value={stats.totalProperties.toString()} 
        />
        <StatCard 
          icon={<Eye className="h-5 w-5 text-[#0FC2C0]" />} 
          label="Vues totales" 
          value={stats.totalViews.toString()} 
        />
        <StatCard 
          icon={<MessageSquare className="h-5 w-5 text-[#0FC2C0]" />} 
          label="Leads" 
          value={stats.totalLeads.toString()} 
        />
        <StatCard 
          icon={<TrendingUp className="h-5 w-5 text-[#0FC2C0]" />} 
          label="Taux conversion" 
          value={`${stats.conversionRate}%`} 
        />
      </div>

      {recentActivity.length > 0 && (
        <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between border-b border-[#2A3F4C] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    {activity.type === 'view' ? (
                      <Eye className="h-4 w-4 text-blue-400" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-green-400" />
                    )}
                    <div>
                      <p className="text-sm text-white">
                        {activity.type === 'view' ? 'Nouvelle vue' : 'Nouveau lead'}
                        {activity.userName && ` - ${activity.userName}`}
                      </p>
                      <p className="text-xs text-gray-400">{activity.propertyTitle}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// My Listings
function ListingsSection() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { properties, loading } = useMyProperties();

  const filteredProperties = statusFilter === 'all' 
    ? properties 
    : properties.filter(p => p.status === statusFilter);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-[#1B2F3C] border-[#2A3F4C]">
            <CardContent className="p-6">
              <Skeleton className="h-24 bg-[#2A3F4C]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Mes annonces</h2>
          <p className="text-sm text-gray-400">{filteredProperties.length} annonces</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-[#1B2F3C] border-[#2A3F4C] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
              <SelectItem value="all" className="text-white">Tous</SelectItem>
              <SelectItem value="draft" className="text-white">Brouillon</SelectItem>
              <SelectItem value="pending" className="text-white">En attente</SelectItem>
              <SelectItem value="approved" className="text-white">Approuvé</SelectItem>
              <SelectItem value="published" className="text-white">Publié</SelectItem>
              <SelectItem value="rejected" className="text-white">Rejeté</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            className="bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white"
            onClick={() => navigate('/create-property')}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Créer une annonce
          </Button>
        </div>
      </div>

      {filteredProperties.length === 0 ? (
        <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
          <CardContent className="p-12 text-center">
            <Home className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Aucune annonce</h3>
            <p className="text-gray-400 mb-4">
              {statusFilter === 'all' 
                ? "Vous n'avez pas encore créé d'annonces" 
                : `Aucune annonce avec le statut "${statusFilter}"`}
            </p>
            <Button 
              className="bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white"
              onClick={() => navigate('/create-property')}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Créer votre première annonce
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProperties.map(listing => {
            const image = listing.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80';
            const isBoosted = listing.featured || false;
            const views = listing.views_count || 0;

            return (
              <Card key={listing.id} className={cn(
                'bg-[#1B2F3C] border-[#2A3F4C] overflow-hidden',
                // FULL FREE MODE: Removed premium-glow
              )}>
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Image */}
                    <div className="relative sm:w-48 h-32 sm:h-auto flex-shrink-0">
                      <img src={image} alt={listing.title_fr || ''} className="w-full h-full object-cover" />
                      {/* FULL FREE MODE: Removed Premium badge */}
                    </div>
                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{listing.title_fr}</h3>
                          <StatusBadge status={(listing.status || 'draft') as 'draft' | 'pending' | 'approved' | 'published' | 'rejected' | 'expired'} />
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <MapPin className="h-3 w-3" />
                          {listing.city?.name_fr || 'Non spécifié'}
                          {listing.neighborhood?.name_fr && `, ${listing.neighborhood.name_fr}`}
                        </div>
                        <p className="text-lg font-bold text-[#0FC2C0]">
                          {listing.price?.toLocaleString('fr-MA')} DH
                          {listing.transaction_type === 'rent' && '/mois'}
                        </p>
                        {views > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Eye className="h-3 w-3" />{views} vues
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-[#2A3F4C] text-gray-300 hover:bg-[#0A1F2E] h-8"
                          disabled
                        >
                          <Edit className="h-3 w-3 mr-1" />Éditer
                        </Button>
                        {/* FULL FREE MODE: Removed Booster button */}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-gray-500 hover:text-red-400 h-8 w-8"
                          disabled
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


// Leads Section
function LeadsSection() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { leads, loading, updateLeadStatus } = useLeads({ status: statusFilter });

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await updateLeadStatus(leadId, newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 bg-[#2A3F4C]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Leads</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-[#1B2F3C] border-[#2A3F4C] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
            <SelectItem value="all" className="text-white">Tous</SelectItem>
            <SelectItem value="new" className="text-white">Nouveau</SelectItem>
            <SelectItem value="contacted" className="text-white">Contacté</SelectItem>
            <SelectItem value="qualified" className="text-white">Qualifié</SelectItem>
            <SelectItem value="closed" className="text-white">Fermé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {leads.length === 0 ? (
        <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Aucun lead</h3>
            <p className="text-gray-400">
              {statusFilter === 'all' 
                ? "Vous n'avez pas encore reçu de leads" 
                : `Aucun lead avec le statut "${statusFilter}"`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-[#1B2F3C] border-[#2A3F4C] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A3F4C]">
                  <th className="text-left text-xs font-medium text-gray-400 uppercase p-4">Client</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase p-4 hidden md:table-cell">Propriété</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase p-4 hidden sm:table-cell">Type</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase p-4">Date</th>
                  <th className="text-left text-xs font-medium text-gray-400 uppercase p-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A3F4C]">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-[#0A1F2E]/50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-white text-sm">{lead.name}</p>
                        {lead.phone && (
                          <p className="text-xs text-gray-400">{lead.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-300 hidden md:table-cell">
                      {lead.property?.title_fr || 'Propriété'}
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          'text-xs',
                          lead.source === 'phone' && 'border-blue-500 text-blue-400',
                          lead.source === 'whatsapp' && 'border-green-500 text-green-400',
                          lead.source === 'email' && 'border-purple-500 text-purple-400',
                          lead.source === 'form' && 'border-gray-500 text-gray-400'
                        )}
                      >
                        {lead.source}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {new Date(lead.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </td>
                    <td className="p-4">
                      <Select 
                        value={lead.status} 
                        onValueChange={(value) => handleStatusChange(lead.id, value)}
                      >
                        <SelectTrigger className="w-28 h-7 bg-transparent border-[#2A3F4C] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
                          <SelectItem value="new" className="text-blue-400 text-xs">Nouveau</SelectItem>
                          <SelectItem value="contacted" className="text-amber-400 text-xs">Contacté</SelectItem>
                          <SelectItem value="qualified" className="text-purple-400 text-xs">Qualifié</SelectItem>
                          <SelectItem value="closed" className="text-green-400 text-xs">Fermé</SelectItem>
                          <SelectItem value="spam" className="text-red-400 text-xs">Spam</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// Analytics Section
function AnalyticsSection() {
  const [days, setDays] = useState(30);
  const { analytics, loading } = useAnalytics(days);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 bg-[#2A3F4C]" />
      </div>
    );
  }

  // Prepare data for charts
  const viewsChartData = analytics.viewsOverTime.map(d => d.count);
  const leadsChartData = analytics.leadsOverTime.map(d => d.count);

  // Calculate totals
  const totalViews = viewsChartData.reduce((sum, val) => sum + val, 0);
  const totalLeads = leadsChartData.reduce((sum, val) => sum + val, 0);
  const totalContactClicks = analytics.contactClicks.phone + analytics.contactClicks.whatsapp + analytics.contactClicks.email;
  const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Analytiques</h2>
        <Select value={days.toString()} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-36 bg-[#1B2F3C] border-[#2A3F4C] text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
            <SelectItem value="7" className="text-white">7 jours</SelectItem>
            <SelectItem value="30" className="text-white">30 jours</SelectItem>
            <SelectItem value="90" className="text-white">90 jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Eye className="h-5 w-5 text-[#0FC2C0]" />} 
          label="Vues totales" 
          value={totalViews.toString()} 
        />
        <StatCard 
          icon={<Phone className="h-5 w-5 text-[#0FC2C0]" />} 
          label="Clics contact" 
          value={totalContactClicks.toString()} 
        />
        <StatCard 
          icon={<MessageSquare className="h-5 w-5 text-[#0FC2C0]" />} 
          label="Leads" 
          value={totalLeads.toString()} 
        />
        <StatCard 
          icon={<TrendingUp className="h-5 w-5 text-[#0FC2C0]" />} 
          label="Conversion" 
          value={`${conversionRate}%`} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Vues des annonces</CardTitle>
          </CardHeader>
          <CardContent>
            {viewsChartData.length > 0 ? (
              <MiniChart data={viewsChartData} height={200} />
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">
                Aucune donnée
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Leads reçus</CardTitle>
          </CardHeader>
          <CardContent>
            {leadsChartData.length > 0 ? (
              <MiniChart data={leadsChartData} height={200} color="#10b981" />
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-500">
                Aucune donnée
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {analytics.topProperties.length > 0 && (
        <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Propriétés les plus vues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topProperties.map((property, index) => (
                <div key={property.id} className="flex items-center justify-between border-b border-[#2A3F4C] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#0FC2C0]/20 flex items-center justify-center text-[#0FC2C0] font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{property.title}</p>
                      <p className="text-xs text-gray-400">{property.leads} leads</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">{property.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Boost Section
// FULL FREE MODE: BoostSection disabled
// function BoostSection() {
//   const plans = [
//     { name: 'Starter', price: '99', duration: '7 jours', features: ['Position améliorée', 'Badge Premium', 'Statistiques basiques'] },
//     { name: 'Pro', price: '249', duration: '30 jours', features: ['Top des résultats', 'Badge Premium + Glow', 'Statistiques avancées', 'Support prioritaire'], recommended: true },
//     { name: 'Elite', price: '499', duration: '60 jours', features: ['Top absolu', 'Badge Elite + Glow animé', 'Analytics complets', 'Support VIP', 'Partage réseaux sociaux'] },
//   ];
//   return (
//     <div className="space-y-6">
//       <div>
//         <h2 className="text-xl font-bold text-white">Booster vos annonces</h2>
//         <p className="text-sm text-gray-400 mt-1">Augmentez la visibilité de vos biens</p>
//       </div>
//       {/* Disabled in FULL FREE MODE */}
//     </div>
//   );
// }

export default function AdvertiserDashboardPage() {
  const [activeItem, setActiveItem] = useState('overview');

  const renderContent = () => {
    switch (activeItem) {
      case 'overview': return <OverviewSection />;
      case 'listings': return <ListingsSection />;
      case 'leads': return <LeadsSection />;
      case 'analytics': return <AnalyticsSection />;
      // FULL FREE MODE: Removed boost case
      default: return <OverviewSection />;
    }
  };

  return (
    <DashboardLayout
      title={sidebarItems.find(i => i.id === activeItem)?.label || 'Tableau de bord'}
      sidebarItems={sidebarItems}
      activeItem={activeItem}
      onItemChange={setActiveItem}
      userName="Agence Premium Immo"
      userRole="Agent immobilier"
    >
      {renderContent()}
    </DashboardLayout>
  );
}
