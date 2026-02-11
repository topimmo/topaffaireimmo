import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FEATURED_CITIES } from "@/constants/cities";
import { MapPin, Building2, TrendingUp } from "lucide-react";

export default function PremiumCityGrid() {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();

  const handleCityClick = (slug: string) => {
    navigate(`/${slug}`);
  };

  return (
    <section className={`py-20 md:py-24 bg-muted/20 ${isRTL ? "rtl" : "ltr"}`}>
      <div className="container">
        {/* Section Title - Premium Typography */}
        <div className="text-center mb-12">
          <h2 className="section-title mb-3">
            {isRTL ? "استكشف حسب المدينة" : "Explore by City"}
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
            {isRTL ? "المدن الأكثر طلباً" : "Most Requested Cities"}
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {FEATURED_CITIES.map((city) => (
              <Button
                key={city.slug}
                variant="outline"
                onClick={() => handleCityClick(city.slug)}
                className="px-6 py-3 rounded-full hover:border-primary hover:bg-primary/5 hover:shadow-md shadow-sm transition-all duration-300"
              >
                <span className="font-semibold">
                  {isRTL ? city.nameAr : city.name}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Premium City Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {FEATURED_CITIES.map((city) => (
            <Card
              key={city.slug}
              onClick={() => handleCityClick(city.slug)}
              className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
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

                {/* City Info */}
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">
                    {isRTL ? "استكشف العقارات" : "Découvrir les biens"}
                  </span>
                </div>

                {/* Stats (optional decorative element) */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
                  <TrendingUp className="h-4 w-4" />
                  <span>
                    {isRTL ? "منطقة مرغوبة" : "Zone recherchée"}
                  </span>
                </div>
              </div>

              {/* Bottom Accent */}
              <div className="h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 group-hover:from-primary group-hover:via-primary/80 group-hover:to-primary transition-all duration-300" />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
