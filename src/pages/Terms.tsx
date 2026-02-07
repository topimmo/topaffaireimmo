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
    title: "Conditions d'utilisation",
    metaDescription: "Consultez les conditions d'utilisation de la plateforme immobilière TopAffaireImmo.",
    mainContent: "L'utilisation de la plateforme TopAffaireImmo implique l'acceptation des présentes conditions.\nL'utilisateur est responsable du contenu des annonces publiées et s'engage à fournir des informations exactes.\nTopAffaireImmo se réserve le droit de modifier ou supprimer toute annonce ne respectant pas les règles.\nLes conditions peuvent être mises à jour à tout moment.",
  },
  ar: {
    title: "شروط الاستخدام",
    metaDescription: "اطّلع على شروط استخدام منصة TopAffaireImmo العقارية.",
    mainContent: "يخضع استخدام منصة TopAffaireImmo للموافقة على شروط الاستخدام الحالية.\nيتحمل المستخدم مسؤولية محتوى الإعلانات المنشورة ويلتزم بتقديم معلومات صحيحة.\nتحتفظ المنصة بحق تعديل أو حذف أي إعلان مخالف.\nيمكن تحديث الشروط في أي وقت.",
  },
};

export default function Terms() {
  const { language, isRTL } = useLanguage();
  
  // ✅ fallback in case language is not "fr" | "ar"
  const lang: Lang = (language === "ar" ? "ar" : "fr");
  const t = content[lang];

  // Set SEO metadata
  useSEO({
    title: `${t.title} | TopAffaireImmo`,
    description: t.metaDescription,
    canonical: "/terms",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": t.title,
      "description": t.metaDescription,
      "url": `${SITE_URL}/terms`,
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
            "item": `${SITE_URL}/terms`
          }
        ]
      }
    }
  });

  return (
    <div className={`bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="pt-24 pb-16">
        <CMSPageWrapper 
          slug="terms" 
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
