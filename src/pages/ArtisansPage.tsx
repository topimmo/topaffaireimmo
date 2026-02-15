import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ArtisanCard } from '@/components/cards/ArtisanCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SlidersHorizontal, X, Star } from 'lucide-react';

const mockArtisans = [
  {
    id: '1',
    name: 'Mohamed El Alami',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    services: ['Plomberie', 'Sanitaire', 'Chauffage'],
    location: 'Casablanca et environs',
    rating: 4.9,
    reviewCount: 127,
    isVerified: true,
    isAvailable: true,
    yearsExperience: 12,
  },
  {
    id: '2',
    name: 'Rachid Benjelloun',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    services: ['Électricité', 'Domotique', 'Alarmes'],
    location: 'Rabat - Salé',
    rating: 4.8,
    reviewCount: 93,
    isVerified: true,
    isAvailable: false,
    yearsExperience: 15,
  },
  {
    id: '3',
    name: 'Youssef Tahiri',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    services: ['Peinture', 'Décoration', 'Revêtements'],
    location: 'Marrakech',
    rating: 4.7,
    reviewCount: 84,
    isVerified: true,
    isAvailable: true,
    yearsExperience: 8,
  },
  {
    id: '4',
    name: 'Hassan Berrada',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',
    services: ['Menuiserie', 'Ébénisterie', 'Agencement'],
    location: 'Fès',
    rating: 4.9,
    reviewCount: 156,
    isVerified: true,
    isAvailable: true,
    yearsExperience: 20,
  },
  {
    id: '5',
    name: 'Karim Idrissi',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
    services: ['Jardinage', 'Paysagisme', 'Entretien'],
    location: 'Tanger',
    rating: 4.6,
    reviewCount: 72,
    isVerified: false,
    isAvailable: true,
    yearsExperience: 5,
  },
  {
    id: '6',
    name: 'Omar Bennani',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80',
    services: ['Serrurerie', 'Dépannage', 'Installation'],
    location: 'Casablanca',
    rating: 4.8,
    reviewCount: 98,
    isVerified: true,
    isAvailable: true,
    yearsExperience: 10,
  },
];

function FilterSidebar() {
  return (
    <div className="space-y-6">
      {/* Services */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Services</Label>
        <div className="space-y-2">
          {[
            'Plomberie',
            'Électricité',
            'Peinture',
            'Menuiserie',
            'Jardinage',
            'Serrurerie',
          ].map((service) => (
            <div key={service} className="flex items-center space-x-2">
              <Checkbox id={service.toLowerCase()} />
              <label
                htmlFor={service.toLowerCase()}
                className="text-sm text-gray-300 cursor-pointer"
              >
                {service}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Zone d'intervention</Label>
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

      {/* Rating */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Évaluation minimum</Label>
        <div className="space-y-2">
          {[5, 4, 3].map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox id={`rating-${rating}`} />
              <label
                htmlFor={`rating-${rating}`}
                className="text-sm text-gray-300 cursor-pointer flex items-center gap-1"
              >
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-1">et plus</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Disponibilité</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="available" />
            <label htmlFor="available" className="text-sm text-gray-300 cursor-pointer">
              Disponible maintenant
            </label>
          </div>
        </div>
      </div>

      {/* Verified */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Statut</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="verified" />
            <label htmlFor="verified" className="text-sm text-gray-300 cursor-pointer">
              Profils vérifiés uniquement
            </label>
          </div>
        </div>
      </div>

      {/* Search by name */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Rechercher par nom</Label>
        <Input
          placeholder="Nom de l'artisan..."
          className="bg-[#1B2F3C] border-[#2A3F4C] text-white placeholder:text-gray-500"
        />
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

export default function ArtisansPage() {
  return (
    <div className="min-h-screen bg-[#0A1F2E]">
      <Header />

      <main className="container mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Artisans professionnels
            </h1>
            <p className="text-gray-400">{mockArtisans.length} artisans trouvés</p>
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
          <Select defaultValue="rating">
            <SelectTrigger className="hidden lg:flex w-48 bg-[#1B2F3C] border-[#2A3F4C] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
              <SelectItem value="rating" className="text-white">Meilleure note</SelectItem>
              <SelectItem value="reviews" className="text-white">Plus d'avis</SelectItem>
              <SelectItem value="experience" className="text-white">Plus d'expérience</SelectItem>
              <SelectItem value="recent" className="text-white">Plus récent</SelectItem>
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

          {/* Artisans Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {mockArtisans.map((artisan) => (
                <ArtisanCard key={artisan.id} {...artisan} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-12">
              <Button variant="outline" className="border-[#2A3F4C] text-gray-300 hover:bg-[#1B2F3C]">
                Précédent
              </Button>
              {[1, 2, 3].map((page) => (
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
