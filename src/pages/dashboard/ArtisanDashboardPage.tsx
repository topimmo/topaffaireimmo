import { useState } from 'react';
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
  MessageSquare, BadgeCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const recentLeads = [
    { name: 'Ahmed B.', service: 'Plomberie', time: 'Il y a 2h', status: 'new' as const },
    { name: 'Sara M.', service: 'Sanitaire', time: 'Il y a 5h', status: 'contacted' as const },
    { name: 'Khalid R.', service: 'Chauffage', time: 'Hier', status: 'closed' as const },
    { name: 'Fatima Z.', service: 'Plomberie', time: 'Il y a 2j', status: 'new' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Eye className="h-5 w-5 text-[#0FC2C0]" />} label="Vues du profil" value="1,247" change={12} />
        <StatCard icon={<Phone className="h-5 w-5 text-[#0FC2C0]" />} label="Clics contacts" value="89" change={8} />
        <StatCard icon={<TrendingUp className="h-5 w-5 text-[#0FC2C0]" />} label="Taux de conversion" value="7.1%" change={-2} />
        <StatCard icon={<Star className="h-5 w-5 text-[#0FC2C0]" />} label="Note moyenne" value="4.9" change={0.1} changeLabel="ce mois" />
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
            <CardTitle className="text-white text-lg">Leads récents</CardTitle>
            <Button variant="ghost" size="sm" className="text-[#0FC2C0] text-xs">Voir tout</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLeads.map((lead, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[#0A1F2E]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0FC2C0]/20 flex items-center justify-center text-[#0FC2C0] font-bold text-sm">
                    {lead.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{lead.name}</p>
                    <p className="text-xs text-gray-400">{lead.service}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={cn(
                    'text-xs',
                    lead.status === 'new' && 'bg-blue-500/20 text-blue-400',
                    lead.status === 'contacted' && 'bg-amber-500/20 text-amber-400',
                    lead.status === 'closed' && 'bg-green-500/20 text-green-400',
                  )}>
                    {lead.status === 'new' ? 'Nouveau' : lead.status === 'contacted' ? 'Contacté' : 'Fermé'}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">{lead.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Leads Section
function LeadsSection() {
  const leads = [
    { id: '1', name: 'Ahmed Benali', email: 'ahmed@email.com', phone: '+212 6 12 34 56 78', service: 'Plomberie', date: '2024-01-15', status: 'new' },
    { id: '2', name: 'Sara Mousaoui', email: 'sara@email.com', phone: '+212 6 98 76 54 32', service: 'Sanitaire', date: '2024-01-14', status: 'contacted' },
    { id: '3', name: 'Khalid Rachidi', email: 'khalid@email.com', phone: '+212 6 11 22 33 44', service: 'Chauffage', date: '2024-01-13', status: 'closed' },
    { id: '4', name: 'Fatima Zahra', email: 'fatima@email.com', phone: '+212 6 55 66 77 88', service: 'Plomberie', date: '2024-01-12', status: 'new' },
    { id: '5', name: 'Omar Benjelloun', email: 'omar@email.com', phone: '+212 6 44 33 22 11', service: 'Sanitaire', date: '2024-01-11', status: 'contacted' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Leads</h2>
          <p className="text-sm text-gray-400">{leads.length} contacts reçus</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input placeholder="Rechercher..." className="pl-9 bg-[#1B2F3C] border-[#2A3F4C] text-white w-48" />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-36 bg-[#1B2F3C] border-[#2A3F4C] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
              <SelectItem value="all" className="text-white">Tous</SelectItem>
              <SelectItem value="new" className="text-white">Nouveaux</SelectItem>
              <SelectItem value="contacted" className="text-white">Contactés</SelectItem>
              <SelectItem value="closed" className="text-white">Fermés</SelectItem>
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
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-[#0A1F2E]/50">
                  <td className="p-4">
                    <p className="font-medium text-white text-sm">{lead.name}</p>
                    <p className="text-xs text-gray-400 md:hidden">{lead.phone}</p>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <p className="text-sm text-gray-300">{lead.phone}</p>
                    <p className="text-xs text-gray-400">{lead.email}</p>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className="bg-[#0FC2C0]/10 border-[#0FC2C0]/30 text-[#0FC2C0] text-xs">
                      {lead.service}
                    </Badge>
                  </td>
                  <td className="p-4 hidden sm:table-cell text-sm text-gray-400">{lead.date}</td>
                  <td className="p-4">
                    <Select defaultValue={lead.status}>
                      <SelectTrigger className="w-28 h-8 bg-transparent border-[#2A3F4C] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
                        <SelectItem value="new" className="text-blue-400 text-xs">Nouveau</SelectItem>
                        <SelectItem value="contacted" className="text-amber-400 text-xs">Contacté</SelectItem>
                        <SelectItem value="closed" className="text-green-400 text-xs">Fermé</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-[#2A3F4C]">
          <p className="text-xs text-gray-400">Page 1 sur 3</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-[#2A3F4C] text-gray-300 h-8">Précédent</Button>
            <Button variant="outline" size="sm" className="border-[#2A3F4C] text-gray-300 h-8">Suivant</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Profile Section
function ProfileSection() {
  const [selectedServices, setSelectedServices] = useState(['Plomberie', 'Sanitaire', 'Chauffage']);
  const allServices = ['Plomberie', 'Électricité', 'Peinture', 'Menuiserie', 'Sanitaire', 'Chauffage', 'Carrelage', 'Jardinage', 'Serrurerie', 'Climatisation'];
  const maxServices = 5;

  const toggleService = (service: string) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(prev => prev.filter(s => s !== service));
    } else if (selectedServices.length < maxServices) {
      setSelectedServices(prev => [...prev, service]);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Éditer le profil</h2>
        <Button className="bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white">
          <Save className="h-4 w-4 mr-2" />Enregistrer
        </Button>
      </div>

      {/* Avatar */}
      <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-2 ring-[#0FC2C0]">
                <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80" />
                <AvatarFallback className="bg-[#0FC2C0] text-white text-2xl">MA</AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#0FC2C0] text-white hover:bg-[#0DA9A7]">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">Mohamed El Alami</h3>
              <div className="flex items-center gap-2 mt-1">
                <BadgeCheck className="h-4 w-4 text-[#0FC2C0]" />
                <span className="text-sm text-[#0FC2C0]">Profil vérifié</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
        <CardHeader><CardTitle className="text-white text-lg">Informations</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Nom complet</Label>
              <Input defaultValue="Mohamed El Alami" className="bg-[#0A1F2E] border-[#2A3F4C] text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Années d'expérience</Label>
              <Input type="number" defaultValue="12" className="bg-[#0A1F2E] border-[#2A3F4C] text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300 text-sm">Description</Label>
            <Textarea defaultValue="Plombier professionnel avec plus de 12 ans d'expérience. Spécialisé dans les installations sanitaires et le chauffage central." rows={4} className="bg-[#0A1F2E] border-[#2A3F4C] text-white" />
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg">Services</CardTitle>
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              selectedServices.length >= maxServices
                ? 'bg-red-500/20 text-red-400'
                : 'bg-[#0FC2C0]/20 text-[#0FC2C0]'
            )}>
              {selectedServices.length}/{maxServices} max
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allServices.map(service => {
              const selected = selectedServices.includes(service);
              const disabled = !selected && selectedServices.length >= maxServices;
              return (
                <button
                  key={service}
                  onClick={() => toggleService(service)}
                  disabled={disabled}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm transition-all border',
                    selected
                      ? 'bg-[#0FC2C0] text-white border-[#0FC2C0]'
                      : disabled
                        ? 'bg-[#0A1F2E] text-gray-600 border-[#2A3F4C] cursor-not-allowed opacity-50'
                        : 'bg-[#0A1F2E] text-gray-300 border-[#2A3F4C] hover:border-[#0FC2C0] hover:text-[#0FC2C0]'
                  )}
                >
                  {selected && <X className="h-3 w-3 inline mr-1" />}
                  {service}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Reviews Section
function ReviewsSection() {
  const reviews = [
    { name: 'Ahmed B.', rating: 5, comment: 'Excellent travail, rapide et professionnel !', date: '15 Jan 2024', verified: true },
    { name: 'Sara M.', rating: 4, comment: 'Très bon service. Je recommande.', date: '12 Jan 2024', verified: true },
    { name: 'Khalid R.', rating: 5, comment: 'Travail impeccable, merci beaucoup !', date: '10 Jan 2024', verified: false },
    { name: 'Fatima Z.', rating: 5, comment: 'Ponctuel et efficace, je referai appel à ses services.', date: '8 Jan 2024', verified: true },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Avis clients</h2>

      {/* Summary */}
      <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="text-center">
              <p className="text-5xl font-bold text-white">4.9</p>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={cn('h-5 w-5', i <= 4 ? 'fill-amber-400 text-amber-400' : 'fill-amber-400 text-amber-400')} />
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-1">127 avis</p>
            </div>
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map(rating => {
                const counts: Record<number, number> = { 5: 95, 4: 22, 3: 8, 2: 1, 1: 1 };
                const pct = Math.round((counts[rating] / 127) * 100);
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm text-gray-400 w-3">{rating}</span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <div className="flex-1 h-2 bg-[#0A1F2E] rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">{counts[rating]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review, i) => (
          <Card key={i} className="bg-[#1B2F3C] border-[#2A3F4C]">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0FC2C0]/20 flex items-center justify-center text-[#0FC2C0] font-bold">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white text-sm">{review.name}</p>
                      {review.verified && <Badge className="bg-green-500/20 text-green-400 text-[10px]">Vérifié</Badge>}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={cn('h-3 w-3', s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-600')} />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{review.date}</span>
              </div>
              <p className="text-sm text-gray-300">{review.comment}</p>
            </CardContent>
          </Card>
        ))}
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

  const renderContent = () => {
    switch (activeItem) {
      case 'overview': return <OverviewSection />;
      case 'profile': return <ProfileSection />;
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
      userName="Mohamed El Alami"
      userRole="Artisan vérifié"
    >
      {renderContent()}
    </DashboardLayout>
  );
}
