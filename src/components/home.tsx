import HeroSearch from "@/components/home/HeroSearch";
import FeaturedProperties from "@/components/home/FeaturedProperties";
import LatestListings from "@/components/home/LatestListings";
import PropertyCategories from "@/components/home/PropertyCategories";
import AdBanner from "@/components/home/AdBanner";
import PromoBanner from "@/components/PromoBanner";
import SEO from "@/components/SEO";
import { FAQ, generalFAQ } from "@/components/FAQ";
import { SITE_URL } from "@/config/site";

function Home() {
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
        {/* Hero Section */}
        <HeroSearch />

        {/* Promo Banner (home-top) - After hero, before featured properties */}
        <section className="py-6">
          <PromoBanner position="home-top" />
        </section>

        {/* Featured properties - Reduced spacing for compact design */}
        <FeaturedProperties />

        {/* ✅ Ad banner (home middle) - Small gap above Featured section */}
        <AdBanner
          page="home"
          position="home-middle"
          className="-mt-4"
        />

        {/* Promo Banner (home-middle) - Between sections */}
        <section className="py-6">
          <PromoBanner position="home-middle" />
        </section>

        {/* Latest listings */}
        <section className="mt-16">
          <LatestListings />
        </section>

        {/* Property Categories */}
        <PropertyCategories />

        {/* FAQ Section with FAQPage Schema */}
        <FAQ items={generalFAQ} className="bg-muted/30 mt-16" />
      </main>
    </>
  );
}

export default Home;
