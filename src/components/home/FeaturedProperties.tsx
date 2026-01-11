import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import PropertyCard, { Property } from "./PropertyCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

const featuredProperties: Property[] = [
  {
    id: "1",
    title: "Luxury Penthouse with Ocean View",
    titleAr: "بنتهاوس فاخر مع إطلالة على المحيط",
    price: 4500000,
    priceType: "sale",
    type: "Apartment",
    city: "Casablanca",
    cityAr: "الدار البيضاء",
    address: "Corniche Ain Diab",
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    featured: true,
  },
  {
    id: "2",
    title: "Modern Villa in Prestigious Neighborhood",
    titleAr: "فيلا عصرية في حي راقي",
    price: 8200000,
    priceType: "sale",
    type: "Villa",
    city: "Marrakech",
    cityAr: "مراكش",
    address: "Amelkis Golf Resort",
    bedrooms: 5,
    bathrooms: 4,
    area: 450,
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
    featured: true,
  },
  {
    id: "3",
    title: "Contemporary Apartment in City Center",
    titleAr: "شقة معاصرة في وسط المدينة",
    price: 2800000,
    priceType: "sale",
    type: "Apartment",
    city: "Rabat",
    cityAr: "الرباط",
    address: "Agdal District",
    bedrooms: 3,
    bathrooms: 2,
    area: 165,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    featured: true,
  },
  {
    id: "4",
    title: "Beachfront House with Private Pool",
    titleAr: "منزل على الشاطئ مع مسبح خاص",
    price: 6500000,
    priceType: "sale",
    type: "House",
    city: "Tangier",
    cityAr: "طنجة",
    address: "Cap Spartel",
    bedrooms: 4,
    bathrooms: 3,
    area: 320,
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
    featured: true,
  },
];

export default function FeaturedProperties() {
  const { t, isRTL } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
