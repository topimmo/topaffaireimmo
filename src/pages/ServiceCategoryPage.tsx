import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  FALLBACK_SERVICE_CATEGORIES,
  ServiceCategory,
  ServiceCategoryRow,
  SERVICE_SLUG_REGEX,
  normalizeServiceCategories,
} from "@/lib/services";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { getEnv } from "@/lib/env";

function MaskedSupabaseUrl() {
  const url = getEnv('VITE_SUPABASE_URL');
  if (!url) return "missing";
  return `${url.substring(0, 30)}...`;
}

export default function ServiceCategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const normalizedSlug = slug?.toLowerCase() || "";
  const { isRTL } = useLanguage();

  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const copy = useMemo(
    () => ({
      titleFallback: isRTL ? "الخدمة غير متاحة" : "Service indisponible",
      subtitleFallback: isRTL
        ? "تعذر العثور على هذه الفئة. جرّب فئة أخرى."
        : "Impossible de trouver cette catégorie. Essayez-en une autre.",
      providersComing: isRTL
        ? "سيتم عرض مقدمي الخدمات قريباً لهذه الفئة."
        : "Les prestataires seront bientôt disponibles pour cette catégorie.",
      exploreOther: isRTL ? "الرجوع إلى الخدمات" : "Revenir aux services",
      slugInvalid: isRTL
        ? "المعرف يجب أن يكون بالأحرف الصغيرة، الأرقام والشرطات فقط."
        : "Le slug doit utiliser uniquement des minuscules, chiffres et tirets.",
    }),
    [isRTL]
  );

  useEffect(() => {
    let cancelled = false;

    const fetchCategory = async () => {
      if (!normalizedSlug) {
        setError(copy.slugInvalid);
        setLoading(false);
        return;
      }

      if (!SERVICE_SLUG_REGEX.test(normalizedSlug)) {
        setError(copy.slugInvalid);
        setLoading(false);
        return;
      }

      const supabaseUrl = MaskedSupabaseUrl();

      if (import.meta.env.DEV) {
        console.log("[ServiceCategory] Fetching category", {
          slug: normalizedSlug,
          supabaseUrl,
        });
      }

      const { data, error } = await supabase
        .from("service_categories")
        .select(
          "id, slug, name_fr, name_ar, description_fr, description_ar, icon, sort_order, is_active"
        )
        .eq("slug", normalizedSlug)
        .eq("is_active", true)
        .limit(1);

      if (import.meta.env.DEV) {
        console.log("[ServiceCategory] Supabase response", {
          slug: normalizedSlug,
          supabaseUrl,
          found: data?.length ?? 0,
          error: error?.message,
        });
      }

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const typedData = (data ?? []) as ServiceCategoryRow[];
      const normalized = normalizeServiceCategories(typedData);
      if (import.meta.env.DEV) {
        console.log("[ServiceCategory] Normalization", {
          slug: normalizedSlug,
          accepted: normalized.categories.length,
          skipped: normalized.skipped,
          usedFallback: normalized.usedFallback,
        });
      }

      if (!cancelled) {
        const fromDb = normalized.categories.find(
          (cat) => cat.slug === normalizedSlug
        );
        setCategory(fromDb || normalized.categories[0] || null);
        setLoading(false);
      }
    };

    fetchCategory();

    return () => {
      cancelled = true;
    };
  }, [normalizedSlug, copy.slugInvalid]);

  if (loading) {
    return (
      <section className={`pt-28 pb-16 ${isRTL ? "rtl" : "ltr"}`}>
        <div className="container px-4 md:px-6">
          <div className="h-32 rounded-xl border border-dashed bg-muted/30 animate-pulse" />
        </div>
      </section>
    );
  }

  if (!category) {
    return (
      <section className={`pt-28 pb-16 ${isRTL ? "rtl" : "ltr"}`}>
        <div className="container px-4 md:px-6 text-center space-y-4">
          <h1 className="text-2xl font-semibold">{copy.titleFallback}</h1>
          <p className="text-muted-foreground">{copy.subtitleFallback}</p>
          <Link
            to="/services"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
          >
            {copy.exploreOther}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={`pt-28 pb-16 bg-muted/10 ${isRTL ? "rtl" : "ltr"}`}>
      <div className="container px-4 md:px-6 space-y-8">
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            {isRTL ? "خدمة" : "Service"}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              {isRTL ? category.nameAr : category.nameFr}
            </h1>
            {/* Coming Soon Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium border border-blue-200">
              {isRTL ? "⏳ قريباً" : "⏳ Bientôt disponible"}
            </span>
            <span className="text-xs text-muted-foreground">#{category.slug}</span>
          </div>
          <p className="text-muted-foreground text-base md:text-lg max-w-3xl">
            {isRTL ? category.descriptionAr : category.descriptionFr}
          </p>
          <Link
            to="/services"
            className="text-sm text-primary hover:underline inline-flex items-center gap-2"
          >
            ← {copy.exploreOther}
          </Link>
        </div>

        {/* Enhanced Empty State with CTAs */}
        <div className="rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 p-8 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl font-semibold text-blue-900">
              {isRTL ? "🚧 الخدمة قيد التطوير" : "🚧 Service en cours d'ouverture"}
            </h2>
            <p className="text-blue-800">
              {isRTL 
                ? "قريباً — سنوصلك بمزودي الخدمات بمجرد توفرهم."
                : "Bientôt disponible — nous vous mettrons en relation dès que les prestataires seront disponibles."}
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Link
                to={`/contact?service=${encodeURIComponent(category.slug)}&notify=true`}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                {isRTL ? "🔔 أعلمني عند التوفر" : "🔔 M'avertir quand disponible"}
              </Link>
              <Link
                to="/artisan/onboarding"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-primary text-primary font-medium hover:bg-primary/10 transition-colors"
              >
                {isRTL ? "هل أنت مزود خدمة؟ انضم إلينا" : "Êtes-vous prestataire ? Rejoignez-nous"}
              </Link>
            </div>
            <p className="text-sm text-blue-700 mt-4">
              {isRTL
                ? "💡 نصيحة: يمكنك أيضاً استكشاف الخدمات المتاحة حالياً"
                : "💡 Astuce : Vous pouvez également explorer les services actuellement disponibles"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-2">
              {isRTL ? "ما يمكن توقعه" : "À quoi s'attendre"}
            </h2>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-primary/60" />
                {isRTL ? "دعم 24/7" : "Support 24/7"}
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-primary/60" />
                {isRTL ? "مزودون موثوقون ومصادق عليهم" : "Prestataires vérifiés"}
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-primary/60" />
                {isRTL ? "أسعار شفافة حسب الفئة" : "Tarifs transparents par catégorie"}
              </li>
            </ul>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-2">
              {isRTL ? "خدمات مشابهة" : "Services similaires"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FALLBACK_SERVICE_CATEGORIES.filter((c) => c.slug !== category.slug)
                .slice(0, 4)
                .map((fallback) => {
                  const Icon = fallback.icon;
                  return (
                    <Link
                      key={fallback.slug}
                      to={`/services/${fallback.slug}`}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2 hover:bg-muted transition-colors"
                    >
                      <div className="p-2 rounded-md bg-muted">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {isRTL ? fallback.nameAr : fallback.nameFr}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          #{fallback.slug}
                        </p>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Artisan CTA */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-6 md:p-8 text-center">
          <div className="max-w-xl mx-auto space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-foreground">
              {isRTL
                ? `هل أنت متخصص في ${category.nameAr}؟`
                : `Vous êtes spécialiste en ${category.nameFr.toLowerCase()} ?`}
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              {isRTL
                ? "أنشئ ملفك المهني واعثر على عملاء بالقرب منك"
                : "Créez votre profil et trouvez des clients près de chez vous"}
            </p>
            <Button asChild size="default" className="mt-3">
              <Link to="/register?type=artisan">
                {isRTL ? "إنشاء ملفي" : "Créer mon profil"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
