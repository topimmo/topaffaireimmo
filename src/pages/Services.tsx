import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  FALLBACK_SERVICE_CATEGORIES,
  ServiceCategory,
  ServiceCategoryRow,
  normalizeServiceCategories,
  TOP_SERVICE_SLUGS,
} from "@/lib/services";
import { Button } from "@/components/ui/button";
import { UserPlus, ChevronRight } from "lucide-react";

function MaskedSupabaseUrl() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) return "missing";
  return `${url.substring(0, 30)}...`;
}

export default function Services() {
  const { isRTL } = useLanguage();
  const [categories, setCategories] = useState<ServiceCategory[]>(FALLBACK_SERVICE_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const copy = useMemo(
    () => ({
      pageTitle: isRTL ? "خدمات احترافية لمنزلك" : "Services pour votre maison",
      pageSubtitle: isRTL
        ? "اكتشف أفضل الحرفيين والخدمات المنزلية، من السباكة إلى الكهرباء"
        : "Découvrez les meilleurs artisans et services pour votre maison",
      error: isRTL
        ? "تعذر تحميل الخدمات حالياً. سيتم عرض الفئات الافتراضية."
        : "Impossible de charger les services pour le moment. Les catégories par défaut sont affichées.",
      topServicesTitle: isRTL
        ? "الخدمات الأكثر طلباً"
        : "Les services les plus demandés",
      allServicesTitle: isRTL ? "جميع الخدمات" : "Tous les services",
      ctaTitle: isRTL ? "هل أنت حرفي محترف؟" : "Vous êtes professionnel ?",
      ctaSubtitle: isRTL
        ? "أنشئ ملفك المهني واعثر على عملاء بالقرب منك"
        : "Créez votre profil et trouvez des clients près de chez vous",
      ctaButton: isRTL ? "إنشاء ملفي" : "Créer mon profil",
      explore: isRTL ? "استكشاف الخدمات" : "Découvrir les services",
    }),
    [isRTL]
  );

  useEffect(() => {
    let cancelled = false;

    const fetchServiceCategories = async () => {
      setLoading(true);
      setError(null);

      const supabaseUrl = MaskedSupabaseUrl();
      const filters = { is_active: true };
      const orderBy = { column: "sort_order", ascending: true as const };

      if (import.meta.env.DEV) {
        console.log("[Services] Fetching service_categories", {
          supabaseUrl,
          filters,
          orderBy,
        });
      }

      const { data, error } = await supabase
        .from("service_categories")
        .select(
          "id, slug, name_fr, name_ar, description_fr, description_ar, icon, sort_order, is_active"
        )
        .eq("is_active", true)
        .order(orderBy.column, { ascending: orderBy.ascending });

      if (import.meta.env.DEV) {
        console.log("[Services] Supabase response", {
          supabaseUrl,
          count: data?.length ?? 0,
          slugs: data?.map((row) => row.slug),
          error: error?.message,
        });
      }

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const typedData = (data ?? []) as ServiceCategoryRow[];
      const { categories: normalized, skipped, usedFallback } = normalizeServiceCategories(typedData);

      if (import.meta.env.DEV) {
        console.log("[Services] Normalization summary", {
          returned: data?.length ?? 0,
          accepted: normalized.length,
          usedFallback,
          skipped,
          skippedReasons: skipped.map((s) => s.reason),
        });
      }

      if (!cancelled) {
        setCategories(normalized);
        setLoading(false);
      }
    };

    fetchServiceCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // Split categories into top 6 and rest
  const topCategories = useMemo(() => {
    const topSet = new Set(TOP_SERVICE_SLUGS);
    return categories
      .filter((c) => topSet.has(c.slug as typeof TOP_SERVICE_SLUGS[number]))
      .sort((a, b) => {
        const aIdx = TOP_SERVICE_SLUGS.indexOf(a.slug as typeof TOP_SERVICE_SLUGS[number]);
        const bIdx = TOP_SERVICE_SLUGS.indexOf(b.slug as typeof TOP_SERVICE_SLUGS[number]);
        return aIdx - bIdx;
      })
      .slice(0, 6);
  }, [categories]);

  const otherCategories = useMemo(() => {
    const topSet = new Set(TOP_SERVICE_SLUGS);
    return categories.filter((c) => !topSet.has(c.slug as typeof TOP_SERVICE_SLUGS[number]));
  }, [categories]);

  return (
    <section className={`pt-28 pb-16 bg-muted/20 ${isRTL ? "rtl" : "ltr"}`}>
      <div className="container px-4 md:px-6">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            {isRTL ? "خدمات" : "Services"}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            {copy.pageTitle}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            {copy.pageSubtitle}
          </p>
        </div>

        {error && (
          <div className="mb-6 text-sm text-destructive text-center">
            {copy.error}
          </div>
        )}

        {/* BLOCK 1: Top Services */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
            {copy.topServicesTitle}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 md:gap-6">
            {topCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.id}
                  to={`/services/${category.slug}`}
                  className={`
                    group rounded-xl border bg-white shadow-sm hover:shadow-lg transition-all
                    p-5 md:p-6 flex flex-col gap-4 hover:-translate-y-1
                    bg-gradient-to-br ${category.gradient}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-white/90 shadow-sm">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg md:text-xl text-foreground mb-1">
                      {isRTL ? category.nameAr : category.nameFr}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {isRTL ? category.descriptionAr : category.descriptionFr}
                    </p>
                  </div>
                  <div className="flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                    {copy.explore}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* BLOCK 2: All Other Services */}
        {otherCategories.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">
              {copy.allServicesTitle}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {otherCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <Link
                    key={category.id}
                    to={`/services/${category.slug}`}
                    className={`
                      group rounded-lg border bg-white shadow-sm hover:shadow-md transition-all
                      p-4 flex flex-col gap-3 hover:-translate-y-0.5
                      bg-gradient-to-br ${category.gradient}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/80 shadow-sm">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-medium text-sm md:text-base text-foreground line-clamp-1">
                        {isRTL ? category.nameAr : category.nameFr}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {isRTL ? category.descriptionAr : category.descriptionFr}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* BLOCK 3: Artisan CTA */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-6 md:p-10 text-center">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-2">
              <UserPlus className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              {copy.ctaTitle}
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
              {copy.ctaSubtitle}
            </p>
            <Button asChild size="lg" className="mt-4">
              <Link to="/register?type=artisan">{copy.ctaButton}</Link>
            </Button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-28 rounded-xl border border-dashed border-muted bg-white/60 animate-pulse"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
