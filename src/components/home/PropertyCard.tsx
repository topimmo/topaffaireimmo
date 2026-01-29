import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Bed, Bath, Square, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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
  
  // ✅ Add click handler to log property ID
  const handleCardClick = (e: React.MouseEvent) => {
    console.log("[PropertyCard] Clicked property:", {
      id: property.id,
      title: property.title,
    });
  };
  
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
      onClick={handleCardClick}
      className={cn(
        "group block bg-white rounded-xl border border-muted overflow-hidden transition-all duration-300 hover:-translate-y-1",
        "shadow-[0_2px_4px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.06)]",
        "hover:shadow-[0_4px_8px_rgba(0,0,0,0.06),0_16px_32px_rgba(0,0,0,0.1)]",
        className
      )}
    >
      {/* Image Container */}
      <div
        className={cn(
          "relative overflow-hidden",
          size === "large" ? "aspect-[4/3]" : "aspect-[16/10]"
        )}
      >
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Badges */}
        <div className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} flex gap-2`}>
          {property.featured && (
            <Badge className="bg-secondary text-secondary-foreground font-medium">
              {isRTL ? 'مميز' : 'À la une'}
            </Badge>
          )}
          <Badge
            variant="outline"
            className="bg-white/90 backdrop-blur-sm text-foreground border-0"
          >
            {property.type}
          </Badge>
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors group/fav`}
        >
          <Heart className="h-4 w-4 text-foreground/70 group-hover/fav:text-primary transition-colors" />
        </button>

        {/* Price */}
        <div className={`absolute bottom-3 ${isRTL ? 'right-3' : 'left-3'}`}>
          <p className="font-mono-price text-xl md:text-2xl font-semibold text-white drop-shadow-lg">
            {formatPrice(property.price)}{" "}
            <span className="text-sm font-normal">MAD</span>
            {property.priceType === "rent" && (
              <span className="text-sm font-normal">{t('property.perMonth')}</span>
            )}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-5">
        <h3
          className={cn(
            "font-display font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors",
            size === "large" ? "text-xl" : "text-lg"
          )}
        >
          {displayTitle}
        </h3>

        <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm line-clamp-1">
            {displayNeighborhood && (
              <>
                <span className="font-medium text-foreground">{displayNeighborhood}</span>
                <span className="mx-1.5">•</span>
              </>
            )}
            {displayCity}
          </p>
        </div>

        {/* Features */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-muted">
          {property.bedrooms !== undefined && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Bed className="h-4 w-4" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms !== undefined && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Bath className="h-4 w-4" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Square className="h-4 w-4" />
            <span>{property.area} m²</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
