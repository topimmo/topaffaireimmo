import { useParams, Navigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { MOROCCO_CITIES, PROPERTY_TYPES } from '../lib/seo';
import SearchResults from '../components/search/SearchResults';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MobileFAB from '../components/layout/MobileFAB';
import BannerSlot from '../components/advertising/BannerSlot';
import { SITE_URL } from '@/config/site';

/**
 * City Property Type Page
 * SEO-optimized pages for city + property type combinations
 * Examples: /casablanca/appartements, /rabat/maisons
 */
export default function CityPropertyTypePage() {
  const { city, propertyType } = useParams<{ city: string; propertyType: string }>();
  const { language, t } = useLanguage();

  // Find city in our list
  const cityData = MOROCCO_CITIES.find(c => c.slug === city?.toLowerCase());

  // Map plural forms to property type slugs
  const propertyTypeMap: Record<string, string> = {
    'appartements': 'appartement',
    'maisons': 'maison',
    'villas': 'villa',
    'terrains': 'terrain',
    'commerciaux': 'commercial',
  };

  const propertySlug = propertyType ? propertyTypeMap[propertyType] : undefined;
  const propertyData = PROPERTY_TYPES.find(p => p.slug === propertySlug);

  // Validate inputs
  if (!cityData || !propertyData) {
    return <Navigate to="/" replace />;
  }

  const cityName = language === 'ar' ? cityData.name_ar : cityData.name_fr;
  const propertyName = language === 'ar' ? propertyData.name_ar : propertyData.name_fr;
  
  // Generate SEO metadata
  const pageTitle = `${propertyName}s à ${cityName} – Vente & Location | TopAffaireImmo`;
  const pageDescription = `Découvrez les meilleures annonces de ${propertyName.toLowerCase()}s à ${cityName} : vente et location. Prix, photos, caractéristiques et contact direct avec les propriétaires.`;

  // Structured data
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Accueil',
          item: `${SITE_URL}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: cityName,
          item: `${SITE_URL}/${cityData.slug}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: `${propertyName}s`,
          item: `${SITE_URL}/${cityData.slug}/${propertyType}`,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pageTitle,
      description: pageDescription,
      url: `${SITE_URL}/${cityData.slug}/${propertyType}`,
    },
  ];

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={`${propertyName} ${cityName}, ${propertyType} ${cityName}, immobilier ${cityName}, ${propertyName} vente ${cityName}, ${propertyName} location ${cityName}`}
        canonical={`/${cityData.slug}/${propertyType}`}
        structuredData={structuredData}
      />

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 container mx-auto px-4 py-8">
          {/* Hero Banner */}
          <div className="mb-6">
            <BannerSlot page="search" position="hero" />
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {propertyName}s à {cityName}
            </h1>
            <p className="text-lg text-muted-foreground">
              {language === 'fr'
                ? `Explorez notre sélection de ${propertyName.toLowerCase()}s à ${cityName}. Trouvez votre propriété idéale parmi nos annonces vérifiées.`
                : `استكشف مجموعتنا من ${propertyData.name_ar} في ${cityName}. اعثر على العقار المثالي بين إعلاناتنا المؤكدة.`}
            </p>
          </div>

          {/* Middle Banner */}
          <div className="mb-6">
            <BannerSlot page="search" position="middle" />
          </div>

          {/* Search Results */}
          <SearchResults
            filters={{
              property_type: propertyData.id,
              city: cityData.name_fr,
            }}
            showFilters={true}
          />
        </main>

        <Footer />
        <MobileFAB />
      </div>
    </>
  );
}
