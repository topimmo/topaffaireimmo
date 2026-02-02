import { useParams, Navigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { MOROCCO_CITIES, PROPERTY_TYPES } from '../lib/seo';
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

          <div className="max-w-4xl mx-auto">
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
            <div className="mb-8">
              <BannerSlot page="search" position="middle" />
            </div>

            {/* Coming Soon Message with CTA */}
            <div className="bg-card border rounded-lg p-8 mb-8">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-4">
                  {language === 'fr' ? 'Annonces disponibles prochainement' : 'الإعلانات متاحة قريباً'}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {language === 'fr'
                    ? `Les annonces de ${propertyName.toLowerCase()}s à ${cityName} seront bientôt disponibles. En attendant, parcourez toutes nos annonces ou publiez la vôtre.`
                    : `ستتوفر إعلانات ${propertyData.name_ar} في ${cityName} قريبًا. في هذه الأثناء، تصفح جميع إعلاناتنا أو انشر إعلانك.`}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/search"
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    {language === 'fr' ? 'Voir toutes les annonces' : 'عرض جميع الإعلانات'}
                  </Link>
                  <Link
                    to="/add-listing"
                    className="inline-flex items-center justify-center px-6 py-3 border border-input rounded-lg hover:bg-accent transition-colors"
                  >
                    {language === 'fr' ? 'Publier une annonce' : 'نشر إعلان'}
                  </Link>
                </div>
              </div>
            </div>

            {/* SEO Content */}
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-semibold mb-4">
                {language === 'fr' 
                  ? `Pourquoi choisir un ${propertyName.toLowerCase()} à ${cityName} ?`
                  : `لماذا تختار ${propertyData.name_ar} في ${cityName}؟`}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {language === 'fr'
                  ? `Les ${propertyName.toLowerCase()}s à ${cityName} offrent un excellent rapport qualité-prix et diverses options selon vos besoins. Que ce soit pour y vivre ou pour investir, cette ville propose des opportunités intéressantes.`
                  : `يقدم ${propertyData.name_ar} في ${cityName} قيمة ممتازة وخيارات متنوعة حسب احتياجاتك. سواء للسكن أو للاستثمار، توفر هذه المدينة فرصًا مثيرة للاهتمام.`}
              </p>
            </div>
          </div>
        </main>

        <Footer />
        <MobileFAB />
      </div>
    </>
  );
}
