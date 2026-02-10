import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  FALLBACK_SERVICE_CATEGORIES,
  ServiceCategory,
  ServiceCategoryRow,
  normalizeServiceCategories,
} from "@/lib/services";

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

  const sectionCopy = useMemo(
    () => ({
      title: isRTL ? "خدمات احترافية لمنزلك" : "Services pour votre maison",
      subtitle: isRTL
        ? "اكتشف أفضل الحرفيين والخدمات المنزلية، من السباكة إلى الكهرباء"
        : "Découvrez les meilleurs artisans et services pour votre maison",
      error: isRTL
        ? "تعذر تحميل الخدمات حالياً. سيتم عرض الفئات الافتراضية."
        : "Impossible de charger les services pour le moment. Les catégories par défaut sont affichées.",
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

  const slugNote = useMemo(
    () =>
      isRTL
        ? "يجب أن يكون المعرف بالحروف الصغيرة والأرقام والشرطات فقط (مثال: plomberie)"
        : "Les slugs doivent utiliser uniquement des minuscules, chiffres et tirets (ex: plomberie)",
    [isRTL]
  );

  return (
    <section className={`pt-28 pb-16 bg-muted/20 ${isRTL ? "rtl" : "ltr"}`}>
      <div className="container px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            {isRTL ? "خدمات" : "Services"}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            {sectionCopy.title}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            {sectionCopy.subtitle}
          </p>
          <p className="text-xs text-muted-foreground/80">{slugNote}</p>
        </div>

        {error && (
          <div className="mb-6 text-sm text-destructive text-center">
            {sectionCopy.error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                to={`/services/${category.slug}`}
                className={`
                  group rounded-xl border bg-white shadow-sm hover:shadow-md transition-all
                  p-4 md:p-6 flex flex-col gap-3 hover:-translate-y-1
                  bg-gradient-to-br ${category.gradient}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-white/80 shadow-sm">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    #{category.slug}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold text-base md:text-lg text-foreground mb-1">
                    {isRTL ? category.nameAr : category.nameFr}
                  </h2>
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                    {isRTL ? category.descriptionAr : category.descriptionFr}
                  </p>
                </div>
                <div className="text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                  {isRTL ? "استكشاف الخدمات" : "Découvrir les services"} →
                </div>
              </Link>
            );
          })}
        </div>

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
