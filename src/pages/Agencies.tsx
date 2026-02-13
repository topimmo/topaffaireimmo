import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { isValidUuid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone, Home, Loader2, Users } from "lucide-react";
import PromoBanner from "@/components/PromoBanner";

type Agency = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  agency_name: string | null;
  agency_logo: string | null; // can be URL or storage path
  agency_description_fr: string | null;
  agency_description_ar: string | null;
  agency_cities: string[] | null;
  listing_count: number;
};

function getPublicAgencyLogoUrl(pathOrUrl: string) {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http")) return pathOrUrl;

  // ⚠️ IMPORTANT: اسم bucket خاصو يكون الصحيح عندكم
  // إذا كان مختلف، بدل "agency-logos" للاسم الحقيقي.
  return supabase.storage.from("agency-logos").getPublicUrl(pathOrUrl).data.publicUrl;
}

export default function Agencies() {
  const langCtx = useLanguage() as any;

  // ✅ Fallback باش ما تطيحش الصفحة إذا t ما موجوداش
  const t: (k: string) => string =
    typeof langCtx?.t === "function" ? langCtx.t : (k) => k;

  const language: "fr" | "ar" = langCtx?.language || "fr";
  const isRTL: boolean = !!langCtx?.isRTL;

  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      // 1) جيب الوكالات
      const { data: agencyData, error: agencyErr } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          phone,
          agency_name,
          agency_logo,
          agency_description_fr,
          agency_description_ar,
          agency_cities
        `)
        .eq("user_type", "agency");

      if (agencyErr) throw agencyErr;

      const baseAgencies = (agencyData || []).map((a: any) => ({
        id: a.id,
        full_name: a.full_name ?? null,
        email: a.email ?? null,
        phone: a.phone ?? null,
        agency_name: a.agency_name ?? null,
        agency_logo: a.agency_logo ?? null,
        agency_description_fr: a.agency_description_fr ?? null,
        agency_description_ar: a.agency_description_ar ?? null,
        agency_cities: a.agency_cities ?? null,
        listing_count: 0,
      })) as Agency[];

      if (baseAgencies.length === 0) {
        setAgencies([]);
        setLoading(false);
        return;
      }

      // 2) جيب جميع الإعلانات published ديال هاد الوكالات (query وحدة)
      const agencyIds = baseAgencies.map((a) => a.id).filter((id) => isValidUuid(id));

      if (agencyIds.length === 0) {
        setAgencies(baseAgencies);
        setLoading(false);
        return;
      }

      const { data: props, error: propsErr } = await supabase
        .from("properties")
        .select("owner_id")
        .in("owner_id", agencyIds)
        // Only count published properties on public agencies page
        .eq("status", "published")
        .or('is_archived.is.null,is_archived.eq.false');

      if (propsErr) throw propsErr;

      // حساب counts فـ JS
      const counts = new Map<string, number>();
      (props || []).forEach((p: any) => {
        const id = String(p.owner_id || "");
        if (!id) return;
        counts.set(id, (counts.get(id) || 0) + 1);
      });

      const merged = baseAgencies.map((a) => ({
        ...a,
        listing_count: counts.get(a.id) || 0,
      }));

      // ترتيب: الأكثر إعلانات فوق
      merged.sort((a, b) => (b.listing_count || 0) - (a.listing_count || 0));

      setAgencies(merged);
    } catch (e: any) {
      console.error("[Agencies] load error:", e);
      setLoadError(e?.message || "Unexpected error");
      setAgencies([]);
    } finally {
      setLoading(false);
    }
  };

  const getAgencyDescription = (agency: Agency) => {
    if (language === "ar") return agency.agency_description_ar;
    return agency.agency_description_fr;
  };

  return (
    <>
      <main className="flex-1 pt-24 pb-16">
        <div className="container">
          {/* Promo Banner at top of agencies page */}
          <div className="py-6">
            <PromoBanner position="agencies-top" />
          </div>

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
              {t("nav.agencies") === "nav.agencies"
                ? isRTL
                  ? "الوكالات"
                  : "Agences"
                : t("nav.agencies")}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isRTL
                ? "اكتشف الوكالات العقارية الموثوقة في المغرب. تصفح قوائمهم وتواصل معهم مباشرة."
                : "Découvrez les agences immobilières de confiance au Maroc. Parcourez leurs annonces et contactez-les directement."}
            </p>
          </div>

          {/* Error */}
          {!loading && loadError && (
            <div className="bg-white rounded-2xl border p-8 text-center mb-8">
              <h2 className="font-display text-xl font-semibold text-foreground">
                {isRTL ? "وقع خطأ" : "Une erreur est survenue"}
              </h2>
              <p className="text-muted-foreground mt-2">{loadError}</p>
              <div className="mt-4">
                <Button onClick={fetchAgencies}>
                  {isRTL ? "إعادة المحاولة" : "Réessayer"}
                </Button>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          )}

          {/* No agencies */}
          {!loading && !loadError && agencies.length === 0 && (
            <div className="bg-white rounded-2xl border p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                {isRTL ? "لا توجد وكالات مسجلة حتى الآن" : "Aucune agence enregistrée pour le moment"}
              </h2>
              <p className="text-muted-foreground">
                {isRTL ? "كن أول وكالة تنضم إلى منصتنا!" : "Soyez la première agence à rejoindre notre plateforme!"}
              </p>
            </div>
          )}

          {/* Agencies Grid */}
          {!loading && !loadError && agencies.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agencies.map((agency) => {
                const logoUrl = agency.agency_logo ? getPublicAgencyLogoUrl(agency.agency_logo) : "";
                const name = agency.agency_name || agency.full_name || agency.email || "Agency";

                return (
                  <div
                    key={agency.id}
                    className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Agency Logo/Header */}
                    <div className="aspect-[3/1] bg-gradient-to-br from-primary/10 to-secondary/10 relative flex items-center justify-center">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Building2 className="h-16 w-16 text-primary/40" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                        {name}
                      </h3>

                      {/* Description */}
                      {getAgencyDescription(agency) && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {getAgencyDescription(agency)}
                        </p>
                      )}

                      {/* Cities */}
                      {agency.agency_cities && agency.agency_cities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {agency.agency_cities.slice(0, 6).map((city, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              {city}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Home className="h-4 w-4" />
                          <strong className="text-foreground">{agency.listing_count}</strong>
                          {isRTL ? "إعلان" : "annonces"}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button asChild className="flex-1">
                          <Link to={`/search?owner=${agency.id}`}>
                            {isRTL ? "عرض الإعلانات" : "Voir les annonces"}
                          </Link>
                        </Button>

                        {agency.phone && (
                          <Button variant="outline" size="icon" asChild>
                            <a href={`tel:${agency.phone}`} aria-label="Call">
                              <Phone className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
