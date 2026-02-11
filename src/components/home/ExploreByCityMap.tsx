import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import MoroccoMap from "./MoroccoMap";
import ExploreCities from "./ExploreCities";
import { FEATURED_CITIES } from "@/constants/cities";

export default function ExploreByCityMap() {
  const [mapError, setMapError] = useState(false);
  const navigate = useNavigate();
  const { isRTL } = useLanguage();

  const handleCityClick = (slug: string) => {
    navigate(`/${slug}`);
  };

  // Fallback to old city cards if map fails
  if (mapError) {
    return <ExploreCities />;
  }

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

        {/* Morocco Map */}
        <div className="mt-10">
          <MoroccoMap />
        </div>
      </div>
    </section>
  );
}
