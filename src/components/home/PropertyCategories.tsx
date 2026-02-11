import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

const DEFAULT_ICON = Building2;

const ICON_MAP: Record<string, LucideIcon> = {
  building2: DEFAULT_ICON,
  home: Home,
  castle: Castle,
  mountain: Mountain,
  briefcase: Briefcase,
  store: Store,
  apartment: DEFAULT_ICON,
  appartement: DEFAULT_ICON,
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
  return (iconKey && ICON_MAP[iconKey]) || fallback || DEFAULT_ICON;
}

function resolveLink(slug: string, fallback?: string) {
  const searchType = SEARCH_TYPE_MAP[slug] || slug;
  return fallback ?? `/search?type=${encodeURIComponent(searchType)}`;
}

function generateFallbackSlug(index: number) {
  return `category-${index}`;
}

function mapDbToUiCategories(data: DbCategory[]): UiCategory[] {
  if (!data?.length) return FALLBACK_CATEGORIES;

  const palette = FALLBACK_CATEGORIES.map((cat) => cat.gradient);
  return data.map((category, index) => {
    const slug = category.slug?.toLowerCase() || generateFallbackSlug(index);
    const style = FALLBACK_STYLES_BY_SLUG[slug];

    return {
      id: category.id ?? slug,
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
      const filters = { is_active: true };
      const orderBy = { column: "sort_order", ascending: true };

      if (import.meta.env.DEV) {
        console.log("[PropertyCategories] Fetching site_categories", {
          filters,
          order: orderBy
        });
      }

      try {
        const { data, error } = await supabase
          .from("site_categories")
          .select("*")
          .eq("is_active", filters.is_active)
          .order(orderBy.column, { ascending: orderBy.ascending });

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

        if (data?.length && isMounted) {
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
    <section className={`section-spacing bg-background ${isRTL ? "rtl" : "ltr"}`}>
      <div className="container">
        {/* Section Title */}
        <div className="text-center mb-8 md:mb-10">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-2">
            {isRTL ? "تصفح حسب نوع العقار" : "Parcourir par catégorie"}
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            {isRTL
              ? "اكتشف مجموعة واسعة من العقارات التي تناسب احتياجاتك"
              : "Découvrez une large gamme de propriétés adaptées à vos besoins"}
          </p>
        </div>

        {/* Categories Grid - Auto-fit for scalability */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card
                key={category.id}
                className="group relative overflow-hidden p-5 hover:cursor-pointer transition-all duration-300 text-start"
                onClick={() => handleCategoryClick(category.link)}
              >
                {/* Icon */}
                <div className="mb-3">
                  <div className={`inline-flex p-2.5 rounded-lg ${category.gradient}`}>
                    <Icon className={`h-5 w-5 ${category.iconColor}`} />
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-medium text-sm mb-1 text-foreground group-hover:text-primary transition-colors">
                  {isRTL ? category.nameAr : category.nameFr}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {isRTL ? category.descriptionAr : category.descriptionFr}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
