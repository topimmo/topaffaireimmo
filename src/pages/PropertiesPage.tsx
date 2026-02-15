import { useState, Fragment } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PropertyCard } from '@/components/cards/PropertyCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SlidersHorizontal, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AdSlot } from '@/components/shared/AdSlot';
import { EmptyState } from '@/components/shared/EmptyState';

const mockProperties = [
  {
    id: '1',
    title: 'Appartement moderne avec vue mer',
    price: 2500000,
    location: 'Ain Diab, Casablanca',
    type: 'Appartement',
    status: 'sale' as const,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    bedrooms: 3,
    bathrooms: 2,
    surface: 140,
    isBoosted: true,
    views: 1247,
  },
  {
    id: '2',
    title: 'Villa de luxe avec piscine',
    price: 8500000,
    location: 'Palmeraie, Marrakech',
    type: 'Villa',
    status: 'sale' as const,
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
    bedrooms: 5,
    bathrooms: 4,
    surface: 420,
    isBoosted: true,
    views: 2156,
  },
  {
    id: '3',
    title: 'Studio meublé centre-ville',
    price: 4500,
    location: 'Agdal, Rabat',
    type: 'Studio',
    status: 'rent' as const,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    surface: 45,
    views: 823,
  },
  {
    id: '4',
    title: 'Penthouse avec terrasse',
    price: 15000,
    location: 'Maarif, Casablanca',
    type: 'Penthouse',
    status: 'rent' as const,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    bedrooms: 4,
    bathrooms: 3,
    surface: 250,
    views: 1534,
  },
  {
    id: '5',
    title: 'Appartement familial spacieux',
    price: 1800000,
    location: 'Guéliz, Marrakech',
    type: 'Appartement',
    status: 'sale' as const,
    image: 'https://images.unsplash.com/photo-1502672260066-6bc054ba9c75?w=800&q=80',
    bedrooms: 4,
    bathrooms: 2,
    surface: 180,
    views: 945,
  },
  {
    id: '6',
    title: 'Bureau moderne centre affaires',
    price: 12000,
    location: 'CFC, Casablanca',
    type: 'Bureau',
    status: 'rent' as const,
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    surface: 95,
    views: 673,
  },
];

function PropertyListingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[#1B2F3C] rounded-lg p-4 space-y-3">
          <Skeleton className="h-48 w-full bg-[#2A3F4C]" />
          <Skeleton className="h-6 w-3/4 bg-[#2A3F4C]" />
          <Skeleton className="h-4 w-1/2 bg-[#2A3F4C]" />
        </div>
      ))}
    </div>
  );
}

function FilterSidebar() {
  const [budget, setBudget] = useState([0, 10000000]);
  const [surface, setSurface] = useState([0, 500]);

  return (
    <div className="space-y-6">
      {/* Transaction Type */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Type de transaction</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="sale" />
            <label htmlFor="sale" className="text-sm text-gray-300 cursor-pointer">Vente</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="rent" />
            <label htmlFor="rent" className="text-sm text-gray-300 cursor-pointer">Location</label>
          </div>
        </div>
      </div>

      {/* Property Type */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Type de bien</Label>
        <Select>
          <SelectTrigger className="bg-[#1B2F3C] border-[#2A3F4C] text-white">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
            <SelectItem value="appartement" className="text-white">Appartement</SelectItem>
            <SelectItem value="villa" className="text-white">Villa</SelectItem>
            <SelectItem value="studio" className="text-white">Studio</SelectItem>
            <SelectItem value="terrain" className="text-white">Terrain</SelectItem>
            <SelectItem value="commerce" className="text-white">Commerce</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Budget Range */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Budget (DH)</Label>
        <div className="space-y-4">
          <Slider
            value={budget}
            onValueChange={setBudget}
            max={10000000}
            step={100000}
            className="[&_[role=slider]]:bg-[#0FC2C0] [&_[role=slider]]:border-[#0FC2C0]"
          />
          <div className="flex items-center gap-2 text-sm">
            <Input
              type="number"
              value={budget[0]}
              onChange={(e) => setBudget([Number(e.target.value), budget[1]])}
              className="bg-[#1B2F3C] border-[#2A3F4C] text-white"
            />
            <span className="text-gray-400">-</span>
            <Input
              type="number"
              value={budget[1]}
              onChange={(e) => setBudget([budget[0], Number(e.target.value)])}
              className="bg-[#1B2F3C] border-[#2A3F4C] text-white"
            />
          </div>
        </div>
      </div>

      {/* Surface */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Surface (m²)</Label>
        <div className="space-y-4">
          <Slider
            value={surface}
            onValueChange={setSurface}
            max={500}
            step={10}
            className="[&_[role=slider]]:bg-[#0FC2C0] [&_[role=slider]]:border-[#0FC2C0]"
          />
          <div className="flex items-center gap-2 text-sm">
            <Input
              type="number"
              value={surface[0]}
              onChange={(e) => setSurface([Number(e.target.value), surface[1]])}
              className="bg-[#1B2F3C] border-[#2A3F4C] text-white"
            />
            <span className="text-gray-400">-</span>
            <Input
              type="number"
              value={surface[1]}
              onChange={(e) => setSurface([surface[0], Number(e.target.value)])}
              className="bg-[#1B2F3C] border-[#2A3F4C] text-white"
            />
          </div>
        </div>
      </div>

      {/* Rooms */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Chambres</Label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((num) => (
            <Button
              key={num}
              variant="outline"
              className="border-[#2A3F4C] text-gray-300 hover:bg-[#0FC2C0] hover:text-white hover:border-[#0FC2C0]"
            >
              {num}+
            </Button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Ville</Label>
        <Select>
          <SelectTrigger className="bg-[#1B2F3C] border-[#2A3F4C] text-white">
            <SelectValue placeholder="Toutes les villes" />
          </SelectTrigger>
          <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
            <SelectItem value="casablanca" className="text-white">Casablanca</SelectItem>
            <SelectItem value="rabat" className="text-white">Rabat</SelectItem>
            <SelectItem value="marrakech" className="text-white">Marrakech</SelectItem>
            <SelectItem value="fes" className="text-white">Fès</SelectItem>
            <SelectItem value="tanger" className="text-white">Tanger</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-[#2A3F4C]">
        <Button
          variant="outline"
          className="flex-1 border-[#2A3F4C] text-gray-300 hover:bg-[#0A1F2E] hover:text-white"
        >
          Réinitialiser
        </Button>
        <Button className="flex-1 bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white">
          Appliquer
        </Button>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  const [isLoading] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A1F2E]">
      <Header />
      
      <main className="container mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Propriétés disponibles</h1>
            <p className="text-gray-400">{mockProperties.length} résultats trouvés</p>
          </div>

          {/* Mobile Filter */}
          <Sheet>
            <SheetTrigger asChild>
              <Button className="lg:hidden bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white">
                <SlidersHorizontal className="h-5 w-5 mr-2" />
                Filtres
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-[#0A1F2E] border-[#1B2F3C] w-80">
              <SheetHeader>
                <SheetTitle className="text-white">Filtres</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)] mt-6">
                <FilterSidebar />
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Sort */}
          <Select defaultValue="recent">
            <SelectTrigger className="hidden lg:flex w-48 bg-[#1B2F3C] border-[#2A3F4C] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
              <SelectItem value="recent" className="text-white">Plus récent</SelectItem>
              <SelectItem value="price-asc" className="text-white">Prix croissant</SelectItem>
              <SelectItem value="price-desc" className="text-white">Prix décroissant</SelectItem>
              <SelectItem value="surface" className="text-white">Surface</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24 bg-[#1B2F3C] rounded-xl p-6 border border-[#2A3F4C]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Filtres</h2>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <FilterSidebar />
            </div>
          </aside>

          {/* Properties Grid */}
          <div className="flex-1">
            {isLoading ? (
              <PropertyListingSkeleton />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {mockProperties.map((property, index) => (
                  <Fragment key={property.id}>
                    <PropertyCard {...property} />
                    {/* In-feed ad every 6 cards on desktop */}
                    {(index + 1) % 6 === 0 && index !== mockProperties.length - 1 && (
                      <div className="hidden md:block col-span-full">
                        <AdSlot variant="infeed" slotId={`properties-infeed-${index}`} />
                      </div>
                    )}
                    {/* In-feed ad every 4 cards on mobile */}
                    {(index + 1) % 4 === 0 && index !== mockProperties.length - 1 && (
                      <div className="md:hidden col-span-full">
                        <AdSlot variant="infeed" slotId={`properties-infeed-mobile-${index}`} />
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && (
              <div className="flex justify-center gap-2 mt-12">
                <Button variant="outline" className="border-[#2A3F4C] text-gray-300 hover:bg-[#1B2F3C]">
                  Précédent
                </Button>
                {[1, 2, 3, 4].map((page) => (
                  <Button
                    key={page}
                    variant={page === 1 ? 'default' : 'outline'}
                    className={
                      page === 1
                        ? 'bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white'
                        : 'border-[#2A3F4C] text-gray-300 hover:bg-[#1B2F3C]'
                    }
                  >
                    {page}
                  </Button>
                ))}
                <Button variant="outline" className="border-[#2A3F4C] text-gray-300 hover:bg-[#1B2F3C]">
                  Suivant
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
