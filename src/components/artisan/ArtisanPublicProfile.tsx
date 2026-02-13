import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Phone, Mail, MapPin, CheckCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArtisanService {
  category_name_fr: string;
  category_name_ar: string;
  subcategory_name_fr: string;
  subcategory_name_ar: string;
  city: string;
}

interface ArtisanPublicProfileProps {
  profile: {
    id: string;
    business_name: string;
    description_fr?: string | null;
    description_ar?: string | null;
    phone: string;
    whatsapp?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    is_verified: boolean;
    is_boosted: boolean;
    city_name_fr?: string;
    city_name_ar?: string;
  };
  services?: ArtisanService[];
  isRTL?: boolean;
  className?: string;
}

export default function ArtisanPublicProfile({
  profile,
  services = [],
  isRTL = false,
  className,
}: ArtisanPublicProfileProps) {
  // Get initials from name for fallback
  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header with Avatar */}
      <div className="relative bg-gradient-to-r from-primary/10 to-primary/5 p-6 pb-20">
        {profile.is_boosted && (
          <Badge className="absolute top-4 right-4 bg-yellow-500 text-white">
            <Star className="h-3 w-3 mr-1" />
            {isRTL ? 'مُعزز' : 'Boosté'}
          </Badge>
        )}
        
        <div className="flex flex-col items-center">
          {/* Avatar */}
          <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.business_name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
              {getInitials(profile.business_name)}
            </AvatarFallback>
          </Avatar>

          {/* Business Name */}
          <h2 className="mt-4 text-2xl font-bold text-foreground flex items-center gap-2">
            {profile.business_name}
            {profile.is_verified && (
              <span title={isRTL ? 'مُفعّل' : 'Vérifié'}>
                <CheckCircle className="h-5 w-5 text-blue-500" />
              </span>
            )}
          </h2>

          {/* Location */}
          {profile.city_name_fr && (
            <div className="mt-1 flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">
                {isRTL ? profile.city_name_ar : profile.city_name_fr}
              </span>
            </div>
          )}
        </div>
      </div>

      <CardContent className="pt-6 space-y-6">
        {/* Description */}
        {(profile.description_fr || profile.description_ar) && (
          <div>
            <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-2">
              {isRTL ? 'حول' : 'À propos'}
            </h3>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {isRTL ? profile.description_ar : profile.description_fr}
            </p>
          </div>
        )}

        {/* Services */}
        {services.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
              {isRTL ? 'الخدمات' : 'Services'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {services.map((service, index) => (
                <Badge key={index} variant="secondary" className="text-sm py-1.5 px-3">
                  {isRTL ? service.subcategory_name_ar : service.subcategory_name_fr}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Contact Information */}
        <div>
          <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
            {isRTL ? 'معلومات الاتصال' : 'Contact'}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${profile.phone}`} className="hover:text-primary transition-colors">
                {profile.phone}
              </a>
            </div>

            {profile.whatsapp && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-green-600" />
                <a
                  href={`https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  WhatsApp: {profile.whatsapp}
                </a>
              </div>
            )}

            {profile.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${profile.email}`} className="hover:text-primary transition-colors">
                  {profile.email}
                </a>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
