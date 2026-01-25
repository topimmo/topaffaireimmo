import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface City {
  name: string;
  nameAr: string;
  slug: string;
  image: string;
}

const cities: City[] = [
  {
    name: "Agadir",
    nameAr: "أكادير",
    slug: "agadir",
    image: "/cities/placeholder.jpg",
  },
  {
    name: "Casablanca",
    nameAr: "الدار البيضاء",
    slug: "casablanca",
    image: "/cities/placeholder.jpg",
  },
  {
    name: "Dar Bouazza",
    nameAr: "دار بوعزة",
    slug: "dar-bouazza",
    image: "/cities/placeholder.jpg",
  },
  {
    name: "Fès",
    nameAr: "فاس",
    slug: "fes",
    image: "/cities/placeholder.jpg",
  },
];

export default function ExploreCities() {
  const { isRTL } = useLanguage();

  return (
    <section className={`py-16 md:py-24 bg-background noise-texture ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="container">
        {/* Section Title */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-3">
            {isRTL ? 'استكشف حسب المدينة' : 'Explore by City'}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isRTL 
              ? 'اكتشف العقارات في المدن الرئيسية بالمغرب'
              : 'Découvrez les propriétés dans les principales villes du Maroc'}
          </p>
        </div>

        {/* City Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cities.map((city) => (
            <Link
              key={city.slug}
              to={`/ville/${city.slug}`}
              className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300"
            >
              {/* Image Container with Fixed Aspect Ratio */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={city.image}
                  alt={isRTL ? city.nameAr : city.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                
                {/* Dark Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                
                {/* City Name */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-white font-display text-xl md:text-2xl font-semibold">
                    {isRTL ? city.nameAr : city.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
