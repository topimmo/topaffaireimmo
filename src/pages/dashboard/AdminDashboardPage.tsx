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
import {
  Shield, Home, Users, FileText, Activity, BarChart3, Bell, Settings,
  Eye, CheckCircle, XCircle, Clock, Search, AlertTriangle, Info, Ban,
  Server, Database, Zap, HardDrive, Cpu, Globe, ChevronRight, BadgeCheck,
  Filter, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems: SidebarItem[] = [
  { icon: <Shield className="h-4 w-4" />, label: 'Modération', id: 'moderation', badge: 12 },
  { icon: <Home className="h-4 w-4" />, label: 'Propriétés', id: 'properties', badge: 5 },
  { icon: <BadgeCheck className="h-4 w-4" />, label: 'Vérification artisans', id: 'artisans', badge: 3 },
  { icon: <Users className="h-4 w-4" />, label: 'Utilisateurs', id: 'users' },
  { icon: <FileText className="h-4 w-4" />, label: 'Logs', id: 'logs' },
  { icon: <BarChart3 className="h-4 w-4" />, label: 'Performance', id: 'performance' },
  { icon: <Activity className="h-4 w-4" />, label: 'Audit Trail', id: 'audit' },
  { icon: <Bell className="h-4 w-4" />, label: 'Notifications', id: 'notifications' },
  { icon: <Server className="h-4 w-4" />, label: 'Santé système', id: 'health' },
];

// Moderation Queue
function ModerationSection() {
  const items = [
    { id: '1', type: 'property', title: 'Appartement Casablanca', author: 'Ahmed B.', date: '15 Jan', status: 'pending' as const },
    { id: '2', type: 'property', title: 'Villa Marrakech', author: 'Sara M.', date: '14 Jan', status: 'pending' as const },
    { id: '3', type: 'artisan', title: 'Profil: Khalid R.', author: 'Khalid R.', date: '14 Jan', status: 'pending' as const },
    { id: '4', type: 'property', title: 'Studio Rabat', author: 'Fatima Z.', date: '13 Jan', status: 'pending' as const },
    { id: '5', type: 'artisan', title: 'Profil: Omar B.', author: 'Omar B.', date: '13 Jan', status: 'pending' as const },
    { id: '6', type: 'property', title: 'Local commercial Tanger', author: 'Youssef T.', date: '12 Jan', status: 'pending' as const },
  ];

  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(items.map(i => [i.id, i.status]))
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard icon={<Clock className="h-5 w-5 text-amber-400" />} label="En attente" value="12" />
        <StatCard icon={<CheckCircle className="h-5 w-5 text-green-400" />} label="Approuvés (mois)" value="87" />
        <StatCard icon={<XCircle className="h-5 w-5 text-red-400" />} label="Rejetés (mois)" value="14" />
        <StatCard icon={<Eye className="h-5 w-5 text-[#0FC2C0]" />} label="Total soumissions" value="113" />
      </div>

      <Card className="bg-[#1B2F3C] border-[#2A3F4C] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-lg">File d'attente de modération</CardTitle>
          <div className="flex items-center gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-32 h-8 bg-transparent border-[#2A3F4C] text-xs text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
                <SelectItem value="all" className="text-white">Tous</SelectItem>
                <SelectItem value="property" className="text-white">Propriétés</SelectItem>
                <SelectItem value="artisan" className="text-white">Artisans</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A3F4C]">
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4">Élément</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4 hidden sm:table-cell">Auteur</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4 hidden md:table-cell">Type</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4">Statut</th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A3F4C]">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-[#0A1F2E]/50">
                  <td className="p-4">
                    <p className="font-medium text-white text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500 sm:hidden">{item.author}</p>
                  </td>
                  <td className="p-4 text-sm text-gray-300 hidden sm:table-cell">{item.author}</td>
                  <td className="p-4 hidden md:table-cell">
                    <Badge className={cn('text-xs', item.type === 'property' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400')}>
                      {item.type === 'property' ? 'Propriété' : 'Artisan'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={statuses[item.id] as any || 'pending'} />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      {statuses[item.id] === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => setStatuses(p => ({ ...p, [item.id]: 'approved' }))} className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />Approuver
                          </Button>
                          <Button size="sm" onClick={() => setStatuses(p => ({ ...p, [item.id]: 'rejected' }))} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-7 text-xs">
                            <XCircle className="h-3 w-3 mr-1" />Rejeter
                          </Button>
                        </>
                      )}
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
    { time: '14:20:42', severity: 'success', message: 'Paiement boost validé: Villa Marrakech (#2)', entity: 'payment' },
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

// Performance Monitor
function PerformanceSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Moniteur de performance</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Cpu className="h-5 w-5 text-[#0FC2C0]" />} label="Temps réponse API" value="142ms" change={-8} changeLabel="vs hier" />
        <StatCard icon={<Globe className="h-5 w-5 text-[#0FC2C0]" />} label="Temps chargement page" value="1.2s" change={-5} changeLabel="vs hier" />
        <StatCard icon={<AlertTriangle className="h-5 w-5 text-amber-400" />} label="Taux d'erreur" value="0.3%" change={0.1} changeLabel="vs hier" />
        <StatCard icon={<Users className="h-5 w-5 text-[#0FC2C0]" />} label="Utilisateurs actifs" value="1,247" change={12} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
          <CardHeader><CardTitle className="text-white text-lg">Temps de réponse</CardTitle></CardHeader>
          <CardContent>
            <MiniChart data={[150, 135, 160, 140, 130, 145, 155, 120, 140, 130, 125, 142]} height={160} />
          </CardContent>
        </Card>
        <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
          <CardHeader><CardTitle className="text-white text-lg">Taux d'erreur</CardTitle></CardHeader>
          <CardContent>
            <MiniChart data={[0.5, 0.3, 0.8, 0.2, 0.4, 0.3, 0.6, 0.2, 0.3, 0.1, 0.4, 0.3]} color="#D32F2F" height={160} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Audit Trail
function AuditSection() {
  const events = [
    { time: '14:23', action: 'Création annonce', user: 'Ahmed B.', entity: 'Propriété #104', type: 'create' },
    { time: '14:18', action: 'Approbation', user: 'Admin', entity: 'Propriété #103', type: 'approve' },
    { time: '14:15', action: 'Connexion', user: 'Sara M.', entity: 'Session', type: 'login' },
    { time: '14:10', action: 'Modification profil', user: 'Khalid R.', entity: 'Artisan #45', type: 'edit' },
    { time: '14:05', action: 'Rejet', user: 'Admin', entity: 'Propriété #99', type: 'reject' },
    { time: '14:00', action: 'Inscription', user: 'Fatima Z.', entity: 'Utilisateur #312', type: 'create' },
    { time: '13:55', action: 'Paiement boost', user: 'Omar B.', entity: 'Propriété #87', type: 'payment' },
    { time: '13:50', action: 'Suppression', user: 'Admin', entity: 'Propriété #65', type: 'delete' },
  ];

  const actionColors: Record<string, string> = {
    create: 'bg-blue-500/20 text-blue-400',
    approve: 'bg-green-500/20 text-green-400',
    reject: 'bg-red-500/20 text-red-400',
    edit: 'bg-amber-500/20 text-amber-400',
    login: 'bg-[#0FC2C0]/20 text-[#0FC2C0]',
    delete: 'bg-red-500/20 text-red-400',
    payment: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Piste d'audit</h2>
        <Select defaultValue="all">
          <SelectTrigger className="w-36 bg-[#1B2F3C] border-[#2A3F4C] text-white"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
            <SelectItem value="all" className="text-white">Tous les types</SelectItem>
            <SelectItem value="create" className="text-white">Créations</SelectItem>
            <SelectItem value="approve" className="text-white">Approbations</SelectItem>
            <SelectItem value="reject" className="text-white">Rejets</SelectItem>
            <SelectItem value="edit" className="text-white">Modifications</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
        <CardContent className="p-6">
          <div className="relative">
            <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-[#2A3F4C]" />
            <div className="space-y-6">
              {events.map((event, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className="w-9 h-9 rounded-full bg-[#0A1F2E] border-2 border-[#2A3F4C] flex items-center justify-center flex-shrink-0 z-10">
                    <div className={cn('w-3 h-3 rounded-full', event.type === 'create' ? 'bg-blue-400' : event.type === 'approve' ? 'bg-green-400' : event.type === 'reject' || event.type === 'delete' ? 'bg-red-400' : event.type === 'payment' ? 'bg-purple-400' : 'bg-[#0FC2C0]')} />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn('text-xs', actionColors[event.type])}>{event.action}</Badge>
                      <span className="text-sm text-white font-medium">{event.user}</span>
                      <span className="text-xs text-gray-500">→</span>
                      <span className="text-sm text-gray-400">{event.entity}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// System Health
function SystemHealthSection() {
  const services = [
    { name: 'Base de données', icon: <Database className="h-5 w-5" />, status: 'healthy', uptime: '99.99%', latency: '12ms' },
    { name: 'Stockage', icon: <HardDrive className="h-5 w-5" />, status: 'healthy', uptime: '99.95%', latency: '45ms' },
    { name: 'Authentification', icon: <Shield className="h-5 w-5" />, status: 'warning', uptime: '99.8%', latency: '89ms' },
    { name: 'Edge Functions', icon: <Zap className="h-5 w-5" />, status: 'healthy', uptime: '99.97%', latency: '23ms' },
    { name: 'CDN', icon: <Globe className="h-5 w-5" />, status: 'healthy', uptime: '100%', latency: '8ms' },
    { name: 'Email Service', icon: <Server className="h-5 w-5" />, status: 'error', uptime: '95.2%', latency: '—' },
  ];

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    healthy: { label: 'Opérationnel', color: 'text-green-400', bg: 'bg-green-500' },
    warning: { label: 'Dégradé', color: 'text-amber-400', bg: 'bg-amber-500' },
    error: { label: 'En panne', color: 'text-red-400', bg: 'bg-red-500' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Santé du système</h2>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-green-400 font-medium">Système opérationnel</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(service => {
          const config = statusConfig[service.status];
          return (
            <Card key={service.name} className={cn(
              'bg-[#1B2F3C] border-[#2A3F4C]',
              service.status === 'error' && 'border-red-500/30'
            )}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg', service.status === 'healthy' ? 'bg-green-500/15 text-green-400' : service.status === 'warning' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400')}>
                      {service.icon}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{service.name}</p>
                      <p className={cn('text-xs font-medium', config.color)}>{config.label}</p>
                    </div>
                  </div>
                  <div className={cn('w-3 h-3 rounded-full', config.bg, service.status !== 'error' && 'animate-pulse')} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-[#0A1F2E] rounded-lg p-2">
                    <p className="text-xs text-gray-500">Uptime</p>
                    <p className="font-medium text-white">{service.uptime}</p>
                  </div>
                  <div className="bg-[#0A1F2E] rounded-lg p-2">
                    <p className="text-xs text-gray-500">Latence</p>
                    <p className="font-medium text-white">{service.latency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [activeItem, setActiveItem] = useState('moderation');

  const renderContent = () => {
    switch (activeItem) {
      case 'moderation': return <ModerationSection />;
      case 'logs': return <LogsSection />;
      case 'performance': return <PerformanceSection />;
      case 'audit': return <AuditSection />;
      case 'health': return <SystemHealthSection />;
      default: return <ModerationSection />;
    }
  };

  return (
    <DashboardLayout
      title={sidebarItems.find(i => i.id === activeItem)?.label || 'Administration'}
      sidebarItems={sidebarItems}
      activeItem={activeItem}
      onItemChange={setActiveItem}
      userName="Administrateur"
      userRole="Super Admin"
    >
      {renderContent()}
    </DashboardLayout>
  );
}
