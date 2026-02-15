import { MapPin, Phone, Star, BadgeCheck, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ArtisanCardProps {
  id: string;
  name: string;
  avatar: string;
  services: string[];
  location: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isAvailable: boolean;
  yearsExperience?: number;
  className?: string;
}

export function ArtisanCard({
  name,
  avatar,
  services,
  location,
  rating,
  reviewCount,
  isVerified,
  isAvailable,
  yearsExperience,
  className,
}: ArtisanCardProps) {
  return (
    <Card
      className={cn(
        'group overflow-hidden bg-[#1B2F3C] border-[#2A3F4C] card-hover cursor-pointer',
        className
      )}
    >
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className={cn(
              'h-16 w-16',
              isVerified && 'ring-2 ring-[#0FC2C0]'
            )}>
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="bg-[#0FC2C0] text-white font-bold text-xl">
                {name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-[#0FC2C0] rounded-full p-1">
                <BadgeCheck className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-white text-lg line-clamp-1 group-hover:text-[#0FC2C0] transition-colors">
                {name}
              </h3>
              <Badge
                className={cn(
                  'text-xs',
                  isAvailable
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                )}
              >
                {isAvailable ? 'Disponible' : 'Occupé'}
              </Badge>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium text-white">{rating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-gray-400">({reviewCount} avis)</span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{location}</span>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="flex flex-wrap gap-2">
          {services.slice(0, 3).map((service, index) => (
            <Badge
              key={index}
              variant="outline"
              className="bg-[#0FC2C0]/10 border-[#0FC2C0]/30 text-[#0FC2C0] text-xs"
            >
              {service}
            </Badge>
          ))}
          {services.length > 3 && (
            <Badge
              variant="outline"
              className="bg-gray-500/10 border-gray-500/30 text-gray-400 text-xs"
            >
              +{services.length - 3}
            </Badge>
          )}
        </div>

        {/* Experience */}
        {yearsExperience && (
          <div className="flex items-center gap-1 text-sm text-gray-300">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>{yearsExperience} ans d'expérience</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-[#2A3F4C]">
          <Button className="flex-1 bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white font-medium">
            <Phone className="h-4 w-4 mr-2" />
            Appeler
          </Button>
          <Button variant="outline" className="flex-1 border-[#2A3F4C] text-gray-300 hover:bg-[#0A1F2E] hover:text-white">
            Voir profil
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
