import { useLanguage } from "@/contexts/LanguageContext";
import { CMSPageWrapper } from "@/components/CMSPageWrapper";
import { useSEO } from "@/components/SEO";
import { SITE_URL } from "@/config/site";

type Lang = "fr" | "ar";

type PageContent = {
  title: string;
  metaDescription: string;
  mainContent: string;
};

const content: Record<Lang, PageContent> = {
  fr: {
    title: "Politique de confidentialité",
    metaDescription: "Découvrez comment TopAffaireImmo protège et utilise vos données personnelles en toute sécurité.",
    mainContent: "TopAffaireImmo accorde une grande importance à la protection de vos données personnelles.\nLes informations collectées sont utilisées uniquement pour le bon fonctionnement de la plateforme et l'amélioration de nos services.\nAucune donnée personnelle n'est vendue ou partagée avec des tiers sans autorisation.\nVous pouvez à tout moment demander la modification ou la suppression de vos données.",
  },
  ar: {
    title: "سياسة الخصوصية",
    metaDescription: "تعرف على كيفية حماية واستخدام بياناتك الشخصية على منصة TopAffaireImmo.",
    mainContent: "تولي منصة TopAffaireImmo أهمية كبيرة لحماية البيانات الشخصية لمستخدميها.\nتُستخدم المعلومات التي يتم جمعها فقط لضمان حسن سير المنصة وتحسين الخدمات المقدمة.\nلا يتم بيع أو مشاركة أي بيانات شخصية مع أطراف أخرى دون موافقة.\nيمكنك طلب تعديل أو حذف بياناتك في أي وقت.",
  },
};

export default function Privacy() {
  const { language, isRTL } = useLanguage();

  // ✅ fallback in case language is not "fr" | "ar"
  const lang: Lang = (language === "ar" ? "ar" : "fr");
  const t = content[lang];

  // Set SEO metadata
  useSEO({
    title: `${t.title} | TopAffaireImmo`,
    description: t.metaDescription,
    canonical: "/privacy",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": t.title,
      "description": t.metaDescription,
      "url": `${SITE_URL}/privacy`,
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Accueil",
            "item": SITE_URL
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": t.title,
            "item": `${SITE_URL}/privacy`
          }
        ]
      }
    }
  });

  return (
    <div className={`bg-background ${isRTL ? "rtl" : "ltr"}`}>
      <div className="pt-24 pb-16">
        <CMSPageWrapper 
          slug="privacy" 
          defaultTitle={{ fr: content.fr.title, ar: content.ar.title }}
        >
        <div className="container max-w-4xl">
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-foreground mb-4">
            {t.title}
          </h1>

          <div className="prose prose-neutral max-w-none">
            <div className="bg-white rounded-xl border p-8">
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                {t.mainContent}
              </p>
            </div>
          </div>
        </div>
        </CMSPageWrapper>
      </div>
    </div>
  );
}
