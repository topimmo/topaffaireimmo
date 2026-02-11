import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FEATURED_CITIES } from "@/constants/cities";
import { MapPin, Building2, TrendingUp, ChevronRight } from "lucide-react";

// Property count estimates per city (for display purposes)
const cityPropertyCounts: Record<string, number> = {
  casablanca: 450,
  rabat: 280,
  marrakech: 320,
  tanger: 180,
  agadir: 150,
  fes: 120,
};

export default function PremiumCityGrid() {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();

  const handleCityClick = (slug: string) => {
    navigate(`/${slug}`);
  };

  return (
    <section className={`py-20 md:py-24 bg-muted/20 ${isRTL ? "rtl" : "ltr"}`}>
      <div className="container max-w-7xl mx-auto">
        {/* Section Title - Premium Typography */}
        <div className="text-center mb-12">
          <h2 className="section-title mb-3">
            {isRTL ? "استكشف حسب المدينة" : "Explorez par Ville"}
          </h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            {isRTL
              ? "اكتشف العقارات في المدن الرئيسية بالمغرب"
              : "Découvrez les propriétés dans les principales villes du Maroc"}
          </p>
        </div>

        {/* Most Requested Cities - Premium Chips */}
        <div className="mb-12">
          <h3 className="text-center section-label text-muted-foreground mb-5">
            {isRTL ? "المدن الأكثر طلباً" : "Villes les Plus Recherchées"}
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {FEATURED_CITIES.map((city) => (
              <Button
                key={city.slug}
                variant="outline"
                onClick={() => handleCityClick(city.slug)}
                className="px-6 py-3 h-auto rounded-full hover:border-primary hover:bg-primary/5 hover:shadow-lg shadow-sm transition-all duration-300 active:scale-95"
              >
                <span className="font-semibold">
                  {isRTL ? city.nameAr : city.name}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Premium City Grid - Responsive: 1 col mobile, 2 cols tablet, 3 cols desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED_CITIES.map((city) => {
            const propertyCount = cityPropertyCounts[city.slug] || 100;
            
            return (
              <Card
                key={city.slug}
                onClick={() => handleCityClick(city.slug)}
                className="group cursor-pointer overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] rounded-xl"
              >
                {/* Card Content */}
                <div className="p-6 md:p-8">
                  {/* Icon Container */}
                  <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <Building2 className="h-7 w-7" />
                  </div>

                  {/* City Name */}
                  <h3 className="font-display text-xl md:text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {isRTL ? city.nameAr : city.name}
                  </h3>

                  {/* Property Count Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 text-sm text-muted-foreground mb-4">
                    <span className="font-semibold text-foreground">{propertyCount}+</span>
                    <span>{isRTL ? "إعلان" : "annonces"}</span>
                  </div>

                  {/* City Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">
                        {isRTL ? "استكشف العقارات" : "Découvrir les biens"}
                      </span>
                    </div>
                    <ChevronRight className={`h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 ${isRTL ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
                  </div>

                  {/* Stats (optional decorative element) */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground/70 mt-3 pt-3 border-t border-border/30">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span>
                      {isRTL ? "منطقة مرغوبة" : "Zone recherchée"}
                    </span>
                  </div>
                </div>

                {/* Bottom Accent */}
                <div className="h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 group-hover:from-primary group-hover:via-primary/80 group-hover:to-primary transition-all duration-300" />
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
