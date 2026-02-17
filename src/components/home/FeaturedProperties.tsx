import { PropertyCard } from '@/components/cards/PropertyCard';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const featuredProperties = [
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
    // FULL FREE MODE: Removed isBoosted flag
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
    // FULL FREE MODE: Removed isBoosted flag
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
];

export function FeaturedProperties() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-[#0D2838] to-[#0A1F2E]">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Propriétés en vedette
            </h2>
            <p className="text-lg text-gray-300">
              Découvrez une sélection de biens immobiliers
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

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProperties.map((property) => (
            <PropertyCard key={property.id} {...property} />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center md:hidden">
          <Button
            variant="outline"
            className="border-[#0FC2C0] text-[#0FC2C0] hover:bg-[#0FC2C0] hover:text-white"
          >
            Voir toutes les propriétés
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
