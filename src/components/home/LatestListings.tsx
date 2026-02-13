import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import PropertyCard, { Property } from "./PropertyCard";
import PropertyCardSkeleton from "./PropertyCardSkeleton";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useLatestProperties } from "@/hooks/useProperties";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";

// Helper to get public image URL
function getPublicImageUrl(pathOrUrl: string) {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  return supabase.storage.from("property-images").getPublicUrl(pathOrUrl).data.publicUrl;
}

// Ad Card Component for in-feed ad injection
interface AdCardProps {
  position: number;
  isRTL: boolean;
}

function InFeedAdCard({ position, isRTL }: AdCardProps) {
  return (
    <Card className="overflow-hidden rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border-dashed border-2 border-muted-foreground/20 flex items-center justify-center min-h-[360px]">
      <div className="text-center p-6">
        <div className="w-12 h-12 rounded-full bg-muted-foreground/10 flex items-center justify-center mx-auto mb-3">
          <Megaphone className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <p className="text-sm text-muted-foreground/70 font-medium">
          {isRTL ? "مساحة إعلانية" : "Espace Publicitaire"}
        </p>
        <p className="text-xs text-muted-foreground/50 mt-1">
          Ad slot #{position}
        </p>
      </div>
    </Card>
  );
}

// Configuration for ad injection
const AD_INJECTION_CONFIG = {
  enabled: false, // Toggle to enable/disable in-feed ads
  insertAfterEvery: 6, // Insert ad after every N items
  maxAds: 2, // Maximum number of ads to show
};

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
        isPremium: prop.featured || false, // Map featured to premium for now
        boosted: false, // Can be set based on boost status from monetization
      };
    });
  }, [dbProperties, language]);
  
  // Function to inject ads into the listings array
  const getListingsWithAds = (listings: Property[]) => {
    if (!AD_INJECTION_CONFIG.enabled) return listings.map(l => ({ type: 'property' as const, data: l }));
    
    const result: Array<{ type: 'property' | 'ad'; data: Property | number }> = [];
    let adCount = 0;
    
    listings.forEach((listing, index) => {
      result.push({ type: 'property', data: listing });
      
      // Insert ad after every N items
      const position = index + 1;
      if (
        position % AD_INJECTION_CONFIG.insertAfterEvery === 0 &&
        adCount < AD_INJECTION_CONFIG.maxAds
      ) {
        adCount++;
        result.push({ type: 'ad', data: adCount });
      }
    });
    
    return result;
  };
  
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
    const skeletonCount = 6;
    
    return (
      <section className={`py-20 md:py-24 bg-muted/30 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="container max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <Clock className="h-5 w-5 text-primary" />
                <span className="section-label text-primary">
                  {isRTL ? 'أضيف مؤخراً' : 'Récemment ajouté'}
                </span>
              </div>
              <h2 className="section-title">
                {t('latest.title')}
              </h2>
              <p className="section-subtitle max-w-xl">
                {t('latest.subtitle')}
              </p>
            </div>

            <Link to="/search">
              <Button variant="outline" className="gap-2.5 h-11 rounded-full border-2 hover:border-primary hover:bg-primary/5" disabled>
                {t('viewAll')}
                <ArrowRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
            </Link>
          </div>

          {/* Filter Pills - Show as disabled during loading */}
          <div className="flex flex-wrap gap-3 mb-10">
            {filters.map((filter) => (
              <Button
                key={filter.value}
                variant="outline"
                size="sm"
                disabled
                className="rounded-full px-5 h-10"
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Skeleton Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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

  const listingsWithAds = getListingsWithAds(filteredListings.slice(0, 9));

  return (
    <section className={`py-20 md:py-24 bg-muted/30 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="container max-w-7xl mx-auto">
        {/* Section Header - Premium Typography */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <Clock className="h-5 w-5 text-primary" />
              <span className="section-label text-primary">
                {isRTL ? 'أضيف مؤخراً' : 'Récemment ajouté'}
              </span>
            </div>
            <h2 className="section-title">
              {t('latest.title')}
            </h2>
            <p className="section-subtitle max-w-xl">
              {t('latest.subtitle')}
            </p>
          </div>

          <Link to="/search">
            <Button variant="outline" className="gap-2.5 h-11 rounded-full border-2 hover:border-primary hover:bg-primary/5 hover:shadow-md transition-all duration-300">
              {t('viewAll')}
              <ArrowRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
          </Link>
        </div>

        {/* Filter Pills - Premium Styling with stronger active state */}
        <div className="flex flex-wrap gap-3 mb-10">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              variant={activeFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                "transition-all duration-300 rounded-full px-5 h-10 font-medium",
                activeFilter === filter.value 
                  ? "shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40" 
                  : "hover:border-primary hover:bg-primary/5 hover:shadow-md"
              )}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Grid - Premium Spacing with Ad Injection Support */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {listingsWithAds.map((item, index) => (
            <div
              key={item.type === 'property' ? (item.data as Property).id : `ad-${item.data}`}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {item.type === 'property' ? (
                <PropertyCard property={item.data as Property} size="default" />
              ) : (
                <InFeedAdCard position={item.data as number} isRTL={isRTL} />
              )}
            </div>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              {isRTL ? 'لم يتم العثور على عقارات لهذه الفئة.' : 'Aucune propriété trouvée pour cette catégorie.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
