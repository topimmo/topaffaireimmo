import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import PropertyCard, { Property } from "./PropertyCard";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const allListings: Property[] = [
  {
    id: "5",
    title: "Spacious Family Apartment",
    titleAr: "شقة عائلية واسعة",
    price: 1850000,
    priceType: "sale",
    type: "Apartment",
    city: "Casablanca",
    cityAr: "الدار البيضاء",
    address: "Maarif District",
    bedrooms: 3,
    bathrooms: 2,
    area: 145,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  },
  {
    id: "6",
    title: "Modern Studio for Rent",
    titleAr: "ستوديو عصري للإيجار",
    price: 6500,
    priceType: "rent",
    type: "Apartment",
    city: "Rabat",
    cityAr: "الرباط",
    address: "Hassan District",
    bedrooms: 1,
    bathrooms: 1,
    area: 55,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  },
  {
    id: "7",
    title: "Commercial Space in Prime Location",
    titleAr: "محل تجاري في موقع متميز",
    price: 25000,
    priceType: "rent",
    type: "Commercial",
    city: "Casablanca",
    cityAr: "الدار البيضاء",
    address: "Boulevard Zerktouni",
    area: 200,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  },
  {
    id: "8",
    title: "Traditional Riad with Modern Amenities",
    titleAr: "رياض تقليدي بمرافق عصرية",
    price: 3200000,
    priceType: "sale",
    type: "House",
    city: "Marrakech",
    cityAr: "مراكش",
    address: "Medina",
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  },
  {
    id: "9",
    title: "Building Plot with Sea View",
    titleAr: "قطعة أرض مع إطلالة بحرية",
    price: 1500000,
    priceType: "sale",
    type: "Land",
    city: "Agadir",
    cityAr: "أكادير",
    address: "Taghazout Bay",
    area: 500,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
  },
  {
    id: "10",
    title: "Cozy 2-Bedroom Apartment",
    titleAr: "شقة مريحة بغرفتين",
    price: 8000,
    priceType: "rent",
    type: "Apartment",
    city: "Tangier",
    cityAr: "طنجة",
    address: "City Center",
    bedrooms: 2,
    bathrooms: 1,
    area: 85,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
  },
];

export default function LatestListings() {
  const { t, isRTL } = useLanguage();
  const [activeFilter, setActiveFilter] = useState("all");
  
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

  return (
    <section className={`py-16 md:py-24 bg-muted/30 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="container">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                {isRTL ? 'أضيف مؤخراً' : 'Récemment ajouté'}
              </span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground">
              {t('latest.title')}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl">
              {t('latest.subtitle')}
            </p>
          </div>

          <Link to="/search">
            <Button variant="outline" className="gap-2">
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
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                activeFilter === filter.value
                  ? "bg-primary text-white shadow-md scale-105"
                  : "bg-white text-foreground/70 border border-muted hover:border-primary/30 hover:text-primary"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((property, index) => (
            <div
              key={property.id}
              className={cn(
                "animate-in fade-in slide-in-from-bottom-4 duration-500",
                {
                  "lg:col-span-2 lg:row-span-1": index === 0,
                  "delay-75": index === 1,
                  "delay-100": index === 2,
                  "delay-150": index === 3,
                  "delay-200": index >= 4,
                }
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <PropertyCard
                property={property}
                size={index === 0 ? "large" : "default"}
              />
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
