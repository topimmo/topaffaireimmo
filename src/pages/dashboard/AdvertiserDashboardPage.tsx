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
import { Skeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard, Home, PlusCircle, Users, BarChart3, Zap, Settings,
  Eye, Phone, TrendingUp, MessageSquare, Edit, Trash2, Search, Upload,
  MapPin, DollarSign, ChevronRight, ChevronLeft, Check, Image, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems: SidebarItem[] = [
  { icon: <LayoutDashboard className="h-4 w-4" />, label: 'Vue d\'ensemble', id: 'overview' },
  { icon: <Home className="h-4 w-4" />, label: 'Mes annonces', id: 'listings' },
  { icon: <PlusCircle className="h-4 w-4" />, label: 'Créer une annonce', id: 'create' },
  { icon: <Users className="h-4 w-4" />, label: 'Leads', id: 'leads', badge: 8 },
  { icon: <BarChart3 className="h-4 w-4" />, label: 'Analytiques', id: 'analytics' },
  { icon: <Zap className="h-4 w-4" />, label: 'Boost', id: 'boost' },
  { icon: <Settings className="h-4 w-4" />, label: 'Paramètres', id: 'settings' },
];

// Overview
function OverviewSection() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Eye className="h-5 w-5 text-[#0FC2C0]" />} label="Vues totales" value="12,487" change={15} />
        <StatCard icon={<Phone className="h-5 w-5 text-[#0FC2C0]" />} label="Révélations tel." value="342" change={8} />
        <StatCard icon={<MessageSquare className="h-5 w-5 text-[#0FC2C0]" />} label="Clics WhatsApp" value="189" change={22} />
        <StatCard icon={<TrendingUp className="h-5 w-5 text-[#0FC2C0]" />} label="Taux conversion" value="4.3%" change={-0.5} />
      </div>
      <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
        <CardHeader><CardTitle className="text-white text-lg">Performance des annonces</CardTitle></CardHeader>
        <CardContent>
          <MiniChart data={[200, 350, 280, 420, 380, 500, 450, 520, 480, 600, 550, 650]} height={180} />
          <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
            <span>Jan</span><span>Fév</span><span>Mar</span><span>Avr</span><span>Mai</span><span>Jun</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// My Listings
function ListingsSection() {
  const listings = [
    { id: '1', title: 'Appartement moderne vue mer', location: 'Ain Diab, Casablanca', price: '2,500,000 DH', status: 'approved' as const, views: 1247, isBoosted: true, image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80' },
    { id: '2', title: 'Villa luxe piscine', location: 'Palmeraie, Marrakech', price: '8,500,000 DH', status: 'approved' as const, views: 2156, isBoosted: true, image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&q=80' },
    { id: '3', title: 'Studio centre-ville', location: 'Agdal, Rabat', price: '4,500 DH/mois', status: 'pending' as const, views: 0, isBoosted: false, image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80' },
    { id: '4', title: 'Terrain constructible 500m²', location: 'Bouskoura', price: '3,200,000 DH', status: 'draft' as const, views: 0, isBoosted: false, image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80' },
    { id: '5', title: 'Local commercial', location: 'Maarif, Casablanca', price: '12,000 DH/mois', status: 'rejected' as const, views: 0, isBoosted: false, image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Mes annonces</h2>
          <p className="text-sm text-gray-400">{listings.length} annonces</p>
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
              <SelectItem value="approved" className="text-white">Approuvé</SelectItem>
              <SelectItem value="pending" className="text-white">En attente</SelectItem>
              <SelectItem value="draft" className="text-white">Brouillon</SelectItem>
              <SelectItem value="rejected" className="text-white">Rejeté</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {listings.map(listing => (
          <Card key={listing.id} className={cn(
            'bg-[#1B2F3C] border-[#2A3F4C] overflow-hidden',
            listing.isBoosted && 'premium-glow'
          )}>
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="relative sm:w-48 h-32 sm:h-auto flex-shrink-0">
                  <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
                  {listing.isBoosted && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px]">⭐ Premium</Badge>
                    </div>
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{listing.title}</h3>
                      <StatusBadge status={listing.status} />
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <MapPin className="h-3 w-3" />{listing.location}
                    </div>
                    <p className="text-lg font-bold text-[#0FC2C0]">{listing.price}</p>
                    {listing.views > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Eye className="h-3 w-3" />{listing.views} vues
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-[#2A3F4C] text-gray-300 hover:bg-[#0A1F2E] h-8">
                      <Edit className="h-3 w-3 mr-1" />Éditer
                    </Button>
                    {!listing.isBoosted && listing.status === 'approved' && (
                      <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white h-8">
                        <Zap className="h-3 w-3 mr-1" />Booster
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-red-400 h-8 w-8">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Create Listing (Multi-step)
function CreateListingSection() {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const steps = ['Informations', 'Images', 'Caractéristiques', 'Aperçu'];

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const features = ['Vue mer', 'Piscine', 'Parking', 'Ascenseur', 'Climatisation', 'Terrasse', 'Jardin', 'Gardiennage', 'Double vitrage', 'Cuisine équipée', 'Concierge', 'Balcon'];

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-white">Créer une annonce</h2>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold flex-shrink-0',
              i + 1 <= step ? 'bg-[#0FC2C0] text-white' : 'bg-[#2A3F4C] text-gray-500'
            )}>
              {i + 1 < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn('text-xs hidden sm:block', i + 1 <= step ? 'text-white' : 'text-gray-500')}>{s}</span>
            {i < steps.length - 1 && <div className={cn('flex-1 h-0.5 mx-2', i + 1 < step ? 'bg-[#0FC2C0]' : 'bg-[#2A3F4C]')} />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
        <CardContent className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Titre de l'annonce</Label>
                <Input placeholder="Ex: Appartement moderne avec vue mer" className="bg-[#0A1F2E] border-[#2A3F4C] text-white" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Type de bien</Label>
                  <Select>
                    <SelectTrigger className="bg-[#0A1F2E] border-[#2A3F4C] text-white"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
                      <SelectItem value="appartement" className="text-white">Appartement</SelectItem>
                      <SelectItem value="villa" className="text-white">Villa</SelectItem>
                      <SelectItem value="studio" className="text-white">Studio</SelectItem>
                      <SelectItem value="terrain" className="text-white">Terrain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Type de transaction</Label>
                  <Select>
                    <SelectTrigger className="bg-[#0A1F2E] border-[#2A3F4C] text-white"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
                      <SelectItem value="sale" className="text-white">Vente</SelectItem>
                      <SelectItem value="rent" className="text-white">Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Localisation</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input placeholder="Ville, quartier..." className="pl-10 bg-[#0A1F2E] border-[#2A3F4C] text-white" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Prix (DH)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input type="number" placeholder="0" className="pl-10 bg-[#0A1F2E] border-[#2A3F4C] text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Surface (m²)</Label>
                  <Input type="number" placeholder="0" className="bg-[#0A1F2E] border-[#2A3F4C] text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Description</Label>
                <Textarea placeholder="Décrivez votre bien..." rows={4} className="bg-[#0A1F2E] border-[#2A3F4C] text-white" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Label className="text-gray-300">Photos du bien</Label>
              {/* Upload Area */}
              <div className="border-2 border-dashed border-[#2A3F4C] rounded-xl p-8 text-center hover:border-[#0FC2C0]/50 transition-colors cursor-pointer">
                <Upload className="h-10 w-10 text-gray-500 mx-auto mb-3" />
                <p className="text-sm text-gray-300 mb-1">Cliquez ou glissez vos images ici</p>
                <p className="text-xs text-gray-500">PNG, JPG jusqu'à 10 MB. Max 10 photos.</p>
              </div>
              {/* Preview */}
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-[#0A1F2E]">
                    <img src={`https://images.unsplash.com/photo-154532441${i}cc1a3fa10c00?w=400&q=60`} alt="" className="w-full h-full object-cover" />
                    <button className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 text-white hover:bg-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Chambres</Label>
                  <Input type="number" placeholder="0" className="bg-[#0A1F2E] border-[#2A3F4C] text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Salles de bain</Label>
                  <Input type="number" placeholder="0" className="bg-[#0A1F2E] border-[#2A3F4C] text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Étage</Label>
                  <Input type="number" placeholder="0" className="bg-[#0A1F2E] border-[#2A3F4C] text-white" />
                </div>
              </div>
              <div>
                <Label className="text-gray-300 mb-3 block">Caractéristiques</Label>
                <div className="flex flex-wrap gap-2">
                  {features.map(f => {
                    const sel = selectedFeatures.includes(f);
                    return (
                      <button key={f} onClick={() => setSelectedFeatures(prev => sel ? prev.filter(x => x !== f) : [...prev, f])}
                        className={cn('px-3 py-1.5 rounded-full text-sm border transition-all',
                          sel ? 'bg-[#0FC2C0] text-white border-[#0FC2C0]' : 'bg-[#0A1F2E] text-gray-300 border-[#2A3F4C] hover:border-[#0FC2C0]')}>
                        {sel && <Check className="h-3 w-3 inline mr-1" />}{f}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 text-center py-8">
              <div className="w-16 h-16 rounded-full bg-[#0FC2C0]/20 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-[#0FC2C0]" />
              </div>
              <h3 className="text-xl font-bold text-white">Prêt à publier !</h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Votre annonce sera soumise pour vérification. Elle sera publiée après approbation par notre équipe.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="border-[#2A3F4C] text-gray-300 hover:bg-[#1B2F3C] disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />Précédent
        </Button>
        {step < totalSteps ? (
          <Button onClick={() => setStep(step + 1)} className="bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white">
            Suivant<ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button className="bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white">
            Soumettre l'annonce
          </Button>
        )}
      </div>
    </div>
  );
}

// Leads Section
function LeadsSection() {
  const leads = [
    { id: '1', name: 'Yasmine Alaoui', property: 'Appartement vue mer', contact: '+212 6 12 34 56 78', type: 'phone', date: '15 Jan', status: 'new' },
    { id: '2', name: 'Karim Bennani', property: 'Villa luxe piscine', contact: 'WhatsApp', type: 'whatsapp', date: '14 Jan', status: 'contacted' },
    { id: '3', name: 'Leila Fassi', property: 'Studio centre-ville', contact: 'Formulaire', type: 'form', date: '13 Jan', status: 'closed' },
    { id: '4', name: 'Rachid Amrani', property: 'Appartement vue mer', contact: '+212 6 55 66 77 88', type: 'phone', date: '12 Jan', status: 'new' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Leads</h2>
        <Button variant="outline" className="border-[#2A3F4C] text-gray-300 hover:bg-[#1B2F3C]">
          Exporter CSV
        </Button>
      </div>

      <Card className="bg-[#1B2F3C] border-[#2A3F4C] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A3F4C]">
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4">Client</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4 hidden md:table-cell">Propriété</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4 hidden sm:table-cell">Contact</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4">Date</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase p-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A3F4C]">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-[#0A1F2E]/50">
                  <td className="p-4 font-medium text-white text-sm">{lead.name}</td>
                  <td className="p-4 text-sm text-gray-300 hidden md:table-cell">{lead.property}</td>
                  <td className="p-4 text-sm text-gray-400 hidden sm:table-cell">{lead.contact}</td>
                  <td className="p-4 text-sm text-gray-400">{lead.date}</td>
                  <td className="p-4">
                    <Select defaultValue={lead.status}>
                      <SelectTrigger className="w-28 h-7 bg-transparent border-[#2A3F4C] text-xs">
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
      </Card>
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
          <SelectTrigger className="w-36 bg-[#1B2F3C] border-[#2A3F4C] text-white"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
            <SelectItem value="7" className="text-white">7 jours</SelectItem>
            <SelectItem value="30" className="text-white">30 jours</SelectItem>
            <SelectItem value="90" className="text-white">90 jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Eye className="h-5 w-5 text-[#0FC2C0]" />} label="Vues totales" value="12,487" change={15} />
        <StatCard icon={<Phone className="h-5 w-5 text-[#0FC2C0]" />} label="Révélations tel." value="342" change={8} />
        <StatCard icon={<MessageSquare className="h-5 w-5 text-[#0FC2C0]" />} label="Clics WhatsApp" value="189" change={22} />
        <StatCard icon={<TrendingUp className="h-5 w-5 text-[#0FC2C0]" />} label="Conversion" value="4.3%" change={-0.5} />
      </div>

      <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
        <CardHeader><CardTitle className="text-white text-lg">Vues des annonces</CardTitle></CardHeader>
        <CardContent>
          <MiniChart data={[200, 350, 280, 420, 380, 500, 450, 520, 480, 600, 550, 650, 620, 700, 680]} height={200} />
        </CardContent>
      </Card>
    </div>
  );
}

// Boost Section
function BoostSection() {
  const plans = [
    { name: 'Starter', price: '99', duration: '7 jours', features: ['Position améliorée', 'Badge Premium', 'Statistiques basiques'] },
    { name: 'Pro', price: '249', duration: '30 jours', features: ['Top des résultats', 'Badge Premium + Glow', 'Statistiques avancées', 'Support prioritaire'], recommended: true },
    { name: 'Elite', price: '499', duration: '60 jours', features: ['Top absolu', 'Badge Elite + Glow animé', 'Analytics complets', 'Support VIP', 'Partage réseaux sociaux'] },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Booster vos annonces</h2>
        <p className="text-sm text-gray-400 mt-1">Augmentez la visibilité de vos biens</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <Card key={plan.name} className={cn(
            'bg-[#1B2F3C] border-[#2A3F4C] relative overflow-hidden',
            plan.recommended && 'premium-glow'
          )}>
            {plan.recommended && (
              <div className="absolute top-0 right-0 bg-[#0FC2C0] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                Recommandé
              </div>
            )}
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-sm text-gray-400">{plan.duration}</p>
              </div>
              <div>
                <span className="text-3xl font-bold text-[#0FC2C0]">{plan.price}</span>
                <span className="text-gray-400 ml-1">DH</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="h-4 w-4 text-[#0FC2C0] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className={cn(
                'w-full',
                plan.recommended
                  ? 'bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white'
                  : 'bg-[#0A1F2E] hover:bg-[#0FC2C0]/20 text-white border border-[#2A3F4C]'
              )}>
                Choisir {plan.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdvertiserDashboardPage() {
  const [activeItem, setActiveItem] = useState('overview');

  const renderContent = () => {
    switch (activeItem) {
      case 'overview': return <OverviewSection />;
      case 'listings': return <ListingsSection />;
      case 'create': return <CreateListingSection />;
      case 'leads': return <LeadsSection />;
      case 'analytics': return <AnalyticsSection />;
      case 'boost': return <BoostSection />;
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
