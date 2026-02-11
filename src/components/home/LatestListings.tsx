import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import PropertyCard, { Property } from "./PropertyCard";
import PropertyCardSkeleton from "./PropertyCardSkeleton";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useLatestProperties } from "@/hooks/useProperties";
import { supabase } from "@/lib/supabase";

// Helper to get public image URL
function getPublicImageUrl(pathOrUrl: string) {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  return supabase.storage.from("property-images").getPublicUrl(pathOrUrl).data.publicUrl;
}

export default function LatestListings() {
  const { t, isRTL, language } = useLanguage();
  const [activeFilter, setActiveFilter] = useState("all");
  
  // Fetch real latest properties from database (published only)
  const { properties: dbProperties, loading } = useLatestProperties(12);
  
  // Map database properties to PropertyCard format
  const allListings: Property[] = useMemo(() => {
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
  
  const filters = [
    { value: "all", label: isRTL ? "الكل" : "Tous" },
    { value: "apartment", label: t("property.apartment") },
    { value: "house", label: t("property.house") },
    { value: "villa", label: t("property.villa") },
    { value: "commercial", label: t("property.commercial") },
    { value: "land", label: t("property.land") },
  ];

  const filteredListings =
    activeFilter === "all"
      ? allListings
      : allListings.filter(
          (listing) => listing.type.toLowerCase() === activeFilter
        );
  
  // Show loading state with skeleton cards
  if (loading) {
    // Show 6 skeleton cards (responsive grid layout via CSS: 1 col mobile, 2 cols tablet, 3 cols desktop)
    const skeletonCount = 6;
    
    return (
      <section className={`py-12 md:py-16 bg-muted/20 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="container">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary uppercase tracking-wider">
                  {isRTL ? 'أضيف مؤخراً' : 'Récemment ajouté'}
                </span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground">
                {t('latest.title')}
              </h2>
              <p className="text-muted-foreground text-sm mt-1 max-w-xl">
                {t('latest.subtitle')}
              </p>
            </div>

            <Link to="/search">
              <Button variant="outline" className="gap-2 h-9" disabled>
                {t('viewAll')}
                <ArrowRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
            </Link>
          </div>

          {/* Filter Pills - Show as disabled during loading */}
          <div className="flex flex-wrap gap-2 mb-8">
            {filters.map((filter) => (
              <button
                key={filter.value}
                disabled
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-foreground/40 border border-border cursor-not-allowed"
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Skeleton Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: skeletonCount }).map((_, index) => (
              <div key={index}>
                <PropertyCardSkeleton size="default" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  // Don't render section if no listings
  if (allListings.length === 0) {
    return null;
  }

  return (
    <section className={`py-12 md:py-16 bg-muted/20 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="container">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wider">
                {isRTL ? 'أضيف مؤخراً' : 'Récemment ajouté'}
              </span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground">
              {t('latest.title')}
            </h2>
            <p className="text-muted-foreground text-sm mt-1 max-w-xl">
              {t('latest.subtitle')}
            </p>
          </div>

          <Link to="/search">
            <Button variant="outline" className="gap-2 h-9">
              {t('viewAll')}
              <ArrowRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                activeFilter === filter.value
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white text-foreground/70 border border-border hover:border-primary/30 hover:text-primary"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.slice(0, 6).map((property, index) => (
            <div
              key={property.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <PropertyCard property={property} size="default" />
            </div>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {isRTL ? 'لم يتم العثور على عقارات لهذه الفئة.' : 'Aucune propriété trouvée pour cette catégorie.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
