import { MapPin, Bed, Bath, Square, Phone, Eye, Heart, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface PropertyCardProps {
  id: string;
  title: string;
  price: number;
  location: string;
  type: string;
  status: 'sale' | 'rent';
  image: string;
  bedrooms?: number;
  bathrooms?: number;
  surface: number;
  isBoosted?: boolean;
  views?: number;
  className?: string;
}

export function PropertyCard({
  id,
  title,
  price,
  location,
  type,
  status,
  image,
  bedrooms,
  bathrooms,
  surface,
  isBoosted = false,
  views = 0,
  className,
}: PropertyCardProps) {
  return (
    <Card
      className={cn(
        'group overflow-hidden bg-[#1B2F3C] border-[#2A3F4C] card-hover cursor-pointer',
        // FULL FREE MODE: Removed premium-glow styling
        className
      )}
    >
      <Link to={`/property/${id}`}>
        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-[#0FC2C0] text-white font-semibold">
              {status === 'sale' ? 'Vente' : 'Location'}
            </Badge>
            {/* FULL FREE MODE: Removed Premium badge */}
          </div>

          {/* Favorite Button */}
          <button 
            onClick={(e) => e.preventDefault()}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-[#0FC2C0] transition-colors"
          >
            <Heart className="h-4 w-4" />
          </button>

          {/* Type Badge */}
          <Badge className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white border-0">
            {type}
          </Badge>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Price */}
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-[#0FC2C0]">
                {price.toLocaleString('fr-MA')} DH
              </span>
              {status === 'rent' && <span className="text-sm text-gray-400 ml-1">/mois</span>}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Eye className="h-3 w-3" />
              {views}
            </div>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-white text-lg line-clamp-1 group-hover:text-[#0FC2C0] transition-colors">
            {title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-gray-400">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{location}</span>
          </div>

          {/* Features */}
          <div className="flex items-center gap-4 text-sm text-gray-300 border-t border-[#2A3F4C] pt-3">
            {bedrooms !== undefined && (
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4 text-gray-400" />
                <span>{bedrooms}</span>
              </div>
            )}
            {bathrooms !== undefined && (
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4 text-gray-400" />
                <span>{bathrooms}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Square className="h-4 w-4 text-gray-400" />
              <span>{surface} m²</span>
            </div>
          </div>

          {/* Contact Button */}
          <Button 
            onClick={(e) => e.preventDefault()}
            className="w-full bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white font-medium"
          >
            <Phone className="h-4 w-4 mr-2" />
            Contacter
          </Button>
        </CardContent>
      </Link>
    </Card>
  );
}
