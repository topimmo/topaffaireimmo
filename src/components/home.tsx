import HeroSearch from "@/components/home/HeroSearch";
import EntryGateway from "@/components/home/EntryGateway";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import LatestListings from "@/components/home/LatestListings";
import PropertyCategories from "@/components/home/PropertyCategories";
import AdBanner from "@/components/home/AdBanner";
import PromoBanner from "@/components/PromoBanner";
import SEO from "@/components/SEO";
import { FAQ, getGeneralFAQ } from "@/components/FAQ";
import { useLanguage } from "@/contexts/LanguageContext";
import { SITE_URL } from "@/config/site";

function Home() {
  const { t } = useLanguage();
  // Structured data for home page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "TopAffaireImmo - Immobilier au Maroc",
    "description": "Découvrez les meilleures annonces immobilières au Maroc. Appartements, maisons, villas à vendre et à louer.",
    "url": SITE_URL,
    "inLanguage": ["fr-MA", "ar-MA"],
    "about": {
      "@type": "RealEstateAgent",
      "name": "TopAffaireImmo",
      "areaServed": {
        "@type": "Country",
        "name": "Morocco",
        "alternateName": "المغرب"
      }
    }
  };

  return (
    <>
      <SEO
        title="TopAffaireImmo - Immobilier Maroc | Vente & Location"
        description="Trouvez votre propriété idéale au Maroc : appartements, villas, maisons à vendre et à louer à Casablanca, Rabat, Marrakech. Annonces vérifiées."
        keywords="immobilier maroc, appartement maroc, villa maroc, maison maroc, location maroc, vente maroc, casablanca, rabat, marrakech"
        canonical="/"
        ogImage={`${SITE_URL}/og-image.jpg`}
        structuredData={structuredData}
      />
      <main className="flex-1">
        {/* Hero Section with Search */}
        <HeroSearch />

        {/* Entry Gateway - Services / Real Estate */}
        <EntryGateway />

        {/* Promo Banner (home-top) */}
        <PromoBanner position="home-top" />

        {/* Featured properties */}
        <FeaturedProperties />

        {/* Ad banner (home middle) */}
        <AdBanner page="home" position="home-middle" className="py-8" />

        {/* Promo Banner (home-middle) */}
        <PromoBanner position="home-middle" />

        {/* Latest listings */}
        <LatestListings />

        {/* Property Categories */}
        <PropertyCategories />

        {/* FAQ Section with FAQPage Schema */}
        <FAQ items={getGeneralFAQ(t)} className="bg-muted/20 py-12 md:py-16" />
      </main>
    </>
  );
}

export default Home;
