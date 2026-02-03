import { useRef, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import PropertyCard, { Property } from "./PropertyCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useFeaturedProperties } from "@/hooks/useProperties";
import { supabase } from "@/lib/supabase";

// Helper to get public image URL
function getPublicImageUrl(pathOrUrl: string) {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  return supabase.storage.from("property-images").getPublicUrl(pathOrUrl).data.publicUrl;
}

export default function FeaturedProperties() {
  const { t, isRTL, language } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch real featured properties from database
  const { properties: dbProperties, loading } = useFeaturedProperties(6);
  
  // Map database properties to PropertyCard format
  const featuredProperties: Property[] = useMemo(() => {
    return dbProperties.map((prop) => {
      const firstImg = prop.images?.[0] || "";
      const image = firstImg
        ? getPublicImageUrl(firstImg)
        : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80";

      return {
        id: prop.id,
        title: language === "ar" ? prop.title_ar || prop.title_fr || "Annonce" : prop.title_fr || prop.title_ar || "Annonce",
        titleAr: prop.title_ar || undefined,
        price: prop.price || 0,
        priceType: (prop.transaction_type as "sale" | "rent") || "sale",
        type: prop.property_type || "Property",
        city: language === "ar" ? prop.city?.name_ar || prop.city?.name_fr || "" : prop.city?.name_fr || prop.city?.name_ar || "",
        cityAr: prop.city?.name_ar || undefined,
        address: prop.address || (language === "ar" ? prop.neighborhood?.name_ar : prop.neighborhood?.name_fr) || "",
        bedrooms: prop.bedrooms || undefined,
        bathrooms: prop.bathrooms || undefined,
        area: prop.area || undefined,
        image,
        featured: prop.featured || false,
      };
    });
  }, [dbProperties, language]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const actualDirection = isRTL 
        ? (direction === "left" ? "right" : "left") 
        : direction;
      scrollContainerRef.current.scrollBy({
        left: actualDirection === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };
  
  // Show loading state
  if (loading) {
    return (
      <section className={`py-16 md:py-24 bg-background noise-texture ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="container">
          <div className="text-center text-muted-foreground">
            {isRTL ? 'جاري التحميل...' : 'Chargement...'}
          </div>
        </div>
      </section>
    );
  }
  
  // Don't render section if no featured properties
  if (featuredProperties.length === 0) {
    return null;
  }

  return (
    <section className={`py-16 md:py-24 bg-background noise-texture ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="container">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                {isRTL ? 'مختارة لك' : 'Sélectionné pour vous'}
              </span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground">
              {t('featured.title')}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl">
              {t('featured.subtitle')}
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              className="rounded-full h-11 w-11 border-muted hover:border-primary hover:text-primary"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              className="rounded-full h-11 w-11 border-muted hover:border-primary hover:text-primary"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {featuredProperties.map((property) => (
            <div
              key={property.id}
              className="flex-shrink-0 w-[320px] md:w-[380px] snap-start"
            >
              <PropertyCard property={property} size="large" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
