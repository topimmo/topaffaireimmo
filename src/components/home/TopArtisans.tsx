import { ArtisanCard } from '@/components/cards/ArtisanCard';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const topArtisans = [
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
];

export function TopArtisans() {
  return (
    <section className="py-16 md:py-24 bg-[#0A1F2E]">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Artisans de confiance
            </h2>
            <p className="text-lg text-gray-300">
              Professionnels vérifiés avec les meilleures évaluations
            </p>
          </div>
          <Button
            variant="outline"
            className="hidden md:flex border-[#0FC2C0] text-[#0FC2C0] hover:bg-[#0FC2C0] hover:text-white"
          >
            Voir tout
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Artisans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topArtisans.map((artisan) => (
            <ArtisanCard key={artisan.id} {...artisan} />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center md:hidden">
          <Button
            variant="outline"
            className="border-[#0FC2C0] text-[#0FC2C0] hover:bg-[#0FC2C0] hover:text-white"
          >
            Voir tous les artisans
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
