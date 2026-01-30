import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Building2, 
  Home, 
  Castle, 
  Mountain, 
  Briefcase, 
  Store 
} from "lucide-react";

const PROPERTY_CATEGORIES = [
  {
    id: "apartment",
    icon: Building2,
    nameFr: "Appartement",
    nameAr: "شقة",
    descriptionFr: "Appartements modernes et confortables",
    descriptionAr: "شقق حديثة ومريحة",
    link: "/search?type=apartment",
    gradient: "from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200",
    iconColor: "text-blue-600"
  },
  {
    id: "villa",
    icon: Castle,
    nameFr: "Villa",
    nameAr: "فيلا",
    descriptionFr: "Villas de luxe avec jardin",
    descriptionAr: "فيلات فاخرة مع حديقة",
    link: "/search?type=villa",
    gradient: "from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200",
    iconColor: "text-purple-600"
  },
  {
    id: "house",
    icon: Home,
    nameFr: "Maison",
    nameAr: "منزل",
    descriptionFr: "Maisons familiales spacieuses",
    descriptionAr: "منازل عائلية واسعة",
    link: "/search?type=house",
    gradient: "from-green-50 to-green-100 hover:from-green-100 hover:to-green-200",
    iconColor: "text-green-600"
  },
  {
    id: "land",
    icon: Mountain,
    nameFr: "Terrain",
    nameAr: "أرض",
    descriptionFr: "Terrains à bâtir disponibles",
    descriptionAr: "أراضي متاحة للبناء",
    link: "/search?type=land",
    gradient: "from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200",
    iconColor: "text-amber-600"
  },
  {
    id: "office",
    icon: Briefcase,
    nameFr: "Bureau",
    nameAr: "مكتب",
    descriptionFr: "Espaces de bureau professionnels",
    descriptionAr: "مكاتب احترافية",
    link: "/search?type=commercial",
    gradient: "from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200",
    iconColor: "text-indigo-600"
  },
  {
    id: "commercial",
    icon: Store,
    nameFr: "Commercial",
    nameAr: "تجاري",
    descriptionFr: "Propriétés commerciales",
    descriptionAr: "عقارات تجارية",
    link: "/search?type=commercial",
    gradient: "from-rose-50 to-rose-100 hover:from-rose-100 hover:to-rose-200",
    iconColor: "text-rose-600"
  }
];

export default function PropertyCategories() {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();

  const handleCategoryClick = (link: string) => {
    navigate(link);
  };

  return (
    <section className={`py-12 md:py-16 lg:py-20 bg-muted/30 ${isRTL ? "rtl" : "ltr"}`}>
      <div className="container px-4 md:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 md:mb-4">
            {isRTL ? "تصفح حسب نوع العقار" : "Parcourir par catégorie"}
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
            {isRTL
              ? "اكتشف مجموعة واسعة من العقارات التي تناسب احتياجاتك"
              : "Découvrez une large gamme de propriétés adaptées à vos besoins"}
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
          {PROPERTY_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.link)}
                className={`
                  group relative overflow-hidden rounded-lg md:rounded-xl 
                  bg-gradient-to-br ${category.gradient}
                  p-4 md:p-6 lg:p-8
                  transition-all duration-300 ease-out
                  hover:shadow-lg hover:scale-105
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  text-left
                `}
              >
                {/* Icon */}
                <div className="mb-3 md:mb-4">
                  <div className="inline-flex p-2 md:p-3 rounded-lg bg-white/80 backdrop-blur-sm">
                    <Icon className={`h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 ${category.iconColor}`} />
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="font-semibold text-sm md:text-base lg:text-lg mb-1 md:mb-2 text-foreground">
                    {isRTL ? category.nameAr : category.nameFr}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                    {isRTL ? category.descriptionAr : category.descriptionFr}
                  </p>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
