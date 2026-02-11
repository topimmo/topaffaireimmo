import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Bed, Bath, Square, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface Property {
  id: string;
  title: string;
  titleAr?: string;
  price: number;
  priceType: "sale" | "rent";
  type: string;
  city: string;
  cityAr?: string;
  neighborhood?: string;
  neighborhoodAr?: string;
  address: string;
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  image: string;
  featured?: boolean;
  isPremium?: boolean;
  sponsored?: boolean;
}

interface PropertyCardProps {
  property: Property;
  className?: string;
  size?: "default" | "large";
}

export default function PropertyCard({
  property,
  className,
  size = "default",
}: PropertyCardProps) {
  const { t, language, isRTL } = useLanguage();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-MA", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(price);
  };
  
  const displayTitle = language === 'ar' && property.titleAr ? property.titleAr : property.title;
  const displayCity = language === 'ar' && property.cityAr ? property.cityAr : property.city;
  const displayNeighborhood = language === 'ar' && property.neighborhoodAr ? property.neighborhoodAr : property.neighborhood;

  return (
    <Link
      to={`/property/${property.id}`}
      className={cn(
        "group block",
        className
      )}
    >
      <Card className={cn(
        "overflow-hidden hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300",
        property.isPremium && "ring-2 ring-primary/20 hover:ring-primary/40"
      )}>
      {/* Image Container */}
      <div
        className={cn(
          "relative overflow-hidden",
          size === "large" ? "aspect-[16/11]" : "aspect-[16/10]"
        )}
      >
        <img
          src={property.image}
          alt={`${property.title} - ${property.city}${property.neighborhood ? ', ' + property.neighborhood : ''}`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Premium gradient overlay */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent",
          property.isPremium && "from-primary/20 via-black/10"
        )} />

        {/* Badges - Premium styling */}
        <div className={cn(
          "absolute top-3 flex gap-2 flex-wrap",
          isRTL ? "right-3" : "left-3"
        )}>
          {property.isPremium && (
            <Badge className="bg-primary text-primary-foreground font-semibold shadow-lg border border-primary-foreground/20">
              {isRTL ? 'بريميوم' : 'Premium'}
            </Badge>
          )}
          {property.sponsored && (
            <Badge className="bg-amber-500 text-white font-semibold shadow-lg">
              {isRTL ? 'مدعوم' : 'Sponsorisé'}
            </Badge>
          )}
          {property.featured && (
            <Badge className="bg-secondary text-secondary-foreground font-semibold shadow-md">
              {isRTL ? 'مميز' : 'À la une'}
            </Badge>
          )}
          <Badge
            variant="outline"
            className="bg-white/95 backdrop-blur-sm text-foreground border-0 font-medium shadow-sm"
          >
            {property.type}
          </Badge>
        </div>

        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} rounded-full bg-white/95 backdrop-blur-sm hover:bg-white shadow-md h-10 w-10`}
        >
          <Heart className="h-4 w-4 text-foreground/70 hover:text-primary transition-colors" />
        </Button>

        {/* Price - Premium display */}
        <div className={`absolute bottom-3 ${isRTL ? 'right-3' : 'left-3'}`}>
          <p className="font-mono-price text-xl md:text-2xl font-bold text-white drop-shadow-lg">
            {formatPrice(property.price)}{" "}
            <span className="text-sm font-medium opacity-90">MAD</span>
            {property.priceType === "rent" && (
              <span className="text-sm font-medium opacity-90">{t('property.perMonth')}</span>
            )}
          </p>
        </div>
      </div>

      {/* Content - Enhanced spacing */}
      <div className={cn("p-5", size === "large" ? "md:p-5" : "md:p-6")}>
        <h3
          className={cn(
            "font-display font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors tracking-tight",
            size === "large" ? "text-lg md:text-xl" : "text-lg"
          )}
        >
          {displayTitle}
        </h3>

        <div className="flex items-center gap-1.5 mt-2.5 text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm line-clamp-1">
            {displayNeighborhood && (
              <>
                <span className="font-medium text-foreground">{displayNeighborhood}</span>
                <span className="mx-1.5 opacity-50">•</span>
              </>
            )}
            {displayCity}
          </p>
        </div>

        {/* Features - Premium divider */}
        <div className={cn(
          "flex items-center gap-5 border-t border-border/50",
          size === "large" ? "mt-4 pt-4" : "mt-5 pt-5"
        )}>
          {property.bedrooms !== undefined && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bed className="h-4 w-4" />
              <span className="font-medium">{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms !== undefined && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bath className="h-4 w-4" />
              <span className="font-medium">{property.bathrooms}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Square className="h-4 w-4" />
            <span className="font-medium">{property.area} m²</span>
          </div>
        </div>
      </div>
      </Card>
    </Link>
  );
}
