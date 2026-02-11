import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Bed, Bath, Square, Heart, Sparkles } from "lucide-react";
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
  boosted?: boolean;
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

  // Determine if this is a premium-tier card (premium, sponsored, or boosted)
  const isPremiumTier = property.isPremium || property.sponsored || property.boosted;

  return (
    <Link
      to={`/property/${property.id}`}
      className={cn(
        "group block",
        className
      )}
    >
      <Card className={cn(
        "overflow-hidden hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 rounded-xl",
        // Premium card styling
        isPremiumTier && "ring-2 ring-amber-400/40 hover:ring-amber-400/60 shadow-lg shadow-amber-500/10",
        property.isPremium && "bg-gradient-to-br from-card via-card to-amber-50/30 dark:to-amber-900/10",
        property.sponsored && "bg-gradient-to-br from-card via-card to-blue-50/30 dark:to-blue-900/10"
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
          isPremiumTier && "from-black/60 via-amber-900/5"
        )} />

        {/* Premium glow effect */}
        {isPremiumTier && (
          <div className="absolute inset-0 bg-gradient-to-t from-amber-400/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}

        {/* Badges - Premium styling */}
        <div className={cn(
          "absolute top-3 flex gap-2 flex-wrap",
          isRTL ? "right-3" : "left-3"
        )}>
          {property.isPremium && (
            <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold shadow-lg border-0 gap-1">
              <Sparkles className="h-3 w-3" />
              {isRTL ? 'بريميوم' : 'Premium'}
            </Badge>
          )}
          {property.sponsored && (
            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold shadow-lg border-0">
              {isRTL ? 'مدعوم' : 'Sponsorisé'}
            </Badge>
          )}
          {property.boosted && !property.isPremium && !property.sponsored && (
            <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold shadow-lg border-0">
              {isRTL ? 'معزز' : 'Boosté'}
            </Badge>
          )}
          {property.featured && !isPremiumTier && (
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
          <p className={cn(
            "font-mono-price text-xl md:text-2xl font-bold text-white drop-shadow-lg",
            isPremiumTier && "drop-shadow-[0_2px_4px_rgba(251,191,36,0.3)]"
          )}>
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
          "flex items-center gap-5 border-t",
          isPremiumTier ? "border-amber-200/50 dark:border-amber-800/30" : "border-border/50",
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
