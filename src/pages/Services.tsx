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
import { getEnv } from "@/lib/env";

function MaskedSupabaseUrl() {
  const url = getEnv('VITE_SUPABASE_URL');
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
    <section className={`pt-28 pb-16 bg-gradient-to-b from-muted/30 to-background ${isRTL ? "rtl" : "ltr"}`}>
      <div className="container px-4 md:px-6">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 animate-fade-up">
            <span className="text-2xl">🛠️</span>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold animate-fade-up">
            {isRTL ? "خدمات" : "Services"}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground animate-fade-up">
            {copy.pageTitle}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg animate-fade-up">
            {copy.pageSubtitle}
          </p>
        </div>

        {error && (
          <div className="mb-6 text-sm text-destructive text-center bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            {copy.error}
          </div>
        )}

        {/* BLOCK 1: Top Services - Enhanced Cards */}
        <div className="mb-16">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
            <span className="inline-block w-1 h-6 bg-primary rounded-full" />
            {copy.topServicesTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Link
                  key={category.id}
                  to={`/services/${category.slug}`}
                  className={`
                    group rounded-2xl border-2 border-border/50 bg-white hover:border-primary/50 
                    shadow-premium hover:shadow-premium-lg transition-all duration-300
                    p-6 md:p-8 flex flex-col gap-5 hover-lift-strong
                    bg-gradient-to-br ${category.gradient}
                    animate-fade-up
                  `}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="p-4 rounded-xl bg-white/90 shadow-md group-hover:shadow-lg transition-all group-hover:scale-110 duration-300">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <ChevronRight className={`h-5 w-5 text-primary group-hover:translate-x-0.5 transition-transform ${isRTL ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg md:text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
                      {isRTL ? category.nameAr : category.nameFr}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {isRTL ? category.descriptionAr : category.descriptionFr}
                    </p>
                  </div>
                  <div className="flex items-center text-sm font-medium text-primary mt-auto">
                    {copy.explore}
                    <ChevronRight className={`h-4 w-4 ${isRTL ? "mr-1 rotate-180" : "ml-1"} group-hover:translate-x-1 transition-transform`} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* BLOCK 2: All Other Services - Compact Grid */}
        {otherCategories.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <span className="inline-block w-1 h-6 bg-secondary rounded-full" />
              {copy.allServicesTitle}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {otherCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <Link
                    key={category.id}
                    to={`/services/${category.slug}`}
                    className={`
                      group rounded-xl border border-border/50 bg-white hover:border-primary/50
                      shadow-sm hover:shadow-md transition-all duration-300
                      p-4 md:p-5 flex flex-col gap-3 hover-lift
                      bg-gradient-to-br ${category.gradient}
                      animate-fade-up
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-white/80 shadow-sm group-hover:shadow transition-all group-hover:scale-105 duration-300 flex-shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-medium text-sm md:text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors flex-1">
                        {isRTL ? category.nameAr : category.nameFr}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {isRTL ? category.descriptionAr : category.descriptionFr}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* BLOCK 3: Artisan CTA - Enhanced Design */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 rounded-2xl p-8 md:p-12 text-center shadow-premium-lg border border-primary/10">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2 animate-fade-up">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground animate-fade-up">
              {copy.ctaTitle}
            </h2>
            <p className="text-muted-foreground text-base md:text-lg animate-fade-up">
              {copy.ctaSubtitle}
            </p>
            <Button 
              asChild 
              size="lg" 
              className="mt-6 bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all rounded-xl hover:scale-[1.02] text-base font-semibold px-8 animate-fade-up"
            >
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
                className="h-32 rounded-xl border border-dashed border-muted bg-white/60 animate-pulse shadow-sm"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
