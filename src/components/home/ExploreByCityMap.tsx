import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
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
    <section className={`py-8 md:py-12 bg-background noise-texture ${isRTL ? "rtl" : "ltr"}`}>
      <div className="container">
        {/* Section Title */}
        <div className="text-center mb-8">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-3">
            {isRTL ? "استكشف حسب المدينة" : "Explore by City"}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isRTL
              ? "اكتشف العقارات في المدن الرئيسية بالمغرب"
              : "Découvrez les propriétés dans les principales villes du Maroc"}
          </p>
        </div>

        {/* Most Requested Cities - Clickable Chips */}
        <div className="mb-8">
          <h3 className="text-center text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
            {isRTL ? "المدن الأكثر طلباً" : "Most Requested Cities"}
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {FEATURED_CITIES.map((city) => (
              <button
                key={city.slug}
                onClick={() => handleCityClick(city.slug)}
                className="px-6 py-2.5 rounded-full bg-background border border-border hover:border-terracotta hover:bg-terracotta/5 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="font-medium text-foreground">
                  {isRTL ? city.nameAr : city.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Morocco Map */}
        <div className="mt-8">
          <MoroccoMap />
        </div>
      </div>
    </section>
  );
}
