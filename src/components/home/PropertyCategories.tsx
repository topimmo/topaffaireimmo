import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import {
  Building2,
  Home,
  Castle,
  Mountain,
  Briefcase,
  Store,
  type LucideIcon
} from "lucide-react";

type DbCategory = {
  id: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  description_fr?: string | null;
  description_ar?: string | null;
  icon?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
};

type UiCategory = {
  id: string;
  slug: string;
  icon: LucideIcon;
  nameFr: string;
  nameAr: string;
  descriptionFr: string;
  descriptionAr: string;
  link: string;
  gradient: string;
  iconColor: string;
};

const ICON_MAP: Record<string, LucideIcon> = {
  building2: Building2,
  home: Home,
  castle: Castle,
  mountain: Mountain,
  briefcase: Briefcase,
  store: Store,
  apartment: Building2,
  appartement: Building2,
  villa: Castle,
  house: Home,
  maison: Home,
  terrain: Mountain,
  land: Mountain,
  bureau: Briefcase,
  office: Briefcase,
  commercial: Store
};

const SEARCH_TYPE_MAP: Record<string, string> = {
  appartement: "apartment",
  apartment: "apartment",
  villa: "villa",
  maison: "house",
  house: "house",
  terrain: "land",
  land: "land",
  bureau: "office",
  office: "office",
  commercial: "commercial"
};

const FALLBACK_CATEGORIES: UiCategory[] = [
  {
    id: "apartment",
    slug: "apartment",
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
    slug: "villa",
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
    slug: "house",
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
    slug: "land",
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
    slug: "office",
    icon: Briefcase,
    nameFr: "Bureau",
    nameAr: "مكتب",
    descriptionFr: "Espaces de bureau professionnels",
    descriptionAr: "مكاتب احترافية",
    link: "/search?type=office",
    gradient: "from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200",
    iconColor: "text-indigo-600"
  },
  {
    id: "commercial",
    slug: "commercial",
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

const FALLBACK_STYLES_BY_SLUG = FALLBACK_CATEGORIES.reduce<Record<string, UiCategory>>(
  (acc, category) => {
    acc[category.slug] = category;
    return acc;
  },
  {}
);

function resolveIcon(category: DbCategory, fallback?: LucideIcon) {
  const iconKey = category.icon?.toLowerCase() ?? category.slug?.toLowerCase();
  return (iconKey && ICON_MAP[iconKey]) || fallback || Building2;
}

function resolveLink(slug: string, fallback?: string) {
  const searchType = SEARCH_TYPE_MAP[slug] || slug;
  return fallback ?? `/search?type=${encodeURIComponent(searchType)}`;
}

function mapDbToUiCategories(data: DbCategory[]): UiCategory[] {
  if (!data?.length) return FALLBACK_CATEGORIES;

  const palette = FALLBACK_CATEGORIES.map((cat) => cat.gradient);
  return data.map((category, index) => {
    const slug = category.slug?.toLowerCase() || `category-${index}`;
    const style = FALLBACK_STYLES_BY_SLUG[slug];

    return {
      id: category.id || slug,
      slug,
      icon: resolveIcon(category, style?.icon),
      nameFr: category.name_fr || style?.nameFr || slug,
      nameAr: category.name_ar || style?.nameAr || slug,
      descriptionFr: category.description_fr || style?.descriptionFr || category.name_fr || "",
      descriptionAr: category.description_ar || style?.descriptionAr || category.name_ar || "",
      link: resolveLink(slug, style?.link),
      gradient: style?.gradient || palette[index % palette.length],
      iconColor: style?.iconColor || "text-primary"
    };
  });
}

export default function PropertyCategories() {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<UiCategory[]>(FALLBACK_CATEGORIES);

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      if (import.meta.env.DEV) {
        console.log("[PropertyCategories] Fetching site_categories", {
          filters: { is_active: true },
          order: "sort_order asc"
        });
      }

      try {
        const { data, error } = await supabase
          .from<DbCategory>("site_categories")
          .select("*")
          .eq("is_active", true)
          .order("sort_order");

        if (import.meta.env.DEV) {
          const slugs = data?.map((cat) => cat.slug) || [];
          const newOrUnmapped = slugs.filter(
            (slug) => slug && !FALLBACK_STYLES_BY_SLUG[slug]
          );
          console.log("[PropertyCategories] Active categories fetched", {
            count: slugs.length,
            slugs,
            newOrUnmapped
          });
        }

        if (error) {
          console.error("[PropertyCategories] Error fetching categories", error);
          return;
        }

        if (data && data.length && isMounted) {
          setCategories(mapDbToUiCategories(data));
        }
      } catch (err) {
        console.error("[PropertyCategories] Unexpected error", err);
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

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
          {categories.map((category) => {
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
