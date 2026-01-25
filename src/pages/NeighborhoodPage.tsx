import { useParams, Navigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { MOROCCO_CITIES, findNeighborhoodInCity } from '../lib/seo';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MobileFAB from '../components/layout/MobileFAB';

/**
 * Neighborhood Landing Page
 * SEO-optimized pages for major Moroccan neighborhoods
 * Examples: /immobilier/casablanca/maarif, /immobilier/rabat/agdal
 */
export default function NeighborhoodPage() {
  const { city, neighborhood } = useParams<{ city: string; neighborhood: string }>();
  const { language, t } = useLanguage();

  // Find city in our list
  const cityData = MOROCCO_CITIES.find(c => c.slug === city?.toLowerCase());

  // If city not found, redirect to home
  if (!cityData) {
    return <Navigate to="/" replace />;
  }

  // Find neighborhood in this city
  const neighborhoodData = findNeighborhoodInCity(cityData.slug, neighborhood?.toLowerCase() || '');

  // If neighborhood not found, redirect to city page
  if (!neighborhoodData) {
    return <Navigate to={`/immobilier/${cityData.slug}`} replace />;
  }

  const cityName = language === 'ar' ? cityData.name_ar : cityData.name_fr;
  const neighborhoodName = language === 'ar' ? neighborhoodData.name_ar : neighborhoodData.name_fr;
  
  const pageTitle = `Immobilier ${neighborhoodName} ${cityName} - Vente et Location | TopAffaireImmo`;
  const pageDescription = `Découvrez les meilleures offres immobilières à ${neighborhoodName}, ${cityName}, Maroc. Appartements, villas, maisons et terrains à vendre ou à louer. Annonces vérifiées dans ce quartier prisé.`;

  // Structured data for the neighborhood
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Place",
    "name": `${neighborhoodData.name_fr}, ${cityData.name_fr}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": neighborhoodData.name_fr,
      "addressRegion": cityData.name_fr,
      "addressCountry": "MA"
    },
    "containedInPlace": {
      "@type": "City",
      "name": cityData.name_fr,
      "addressCountry": "MA"
    }
  };

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={`immobilier ${neighborhoodName}, ${neighborhoodName} ${cityName}, propriété ${neighborhoodName}, appartement ${neighborhoodName}, villa ${neighborhoodName}`}
        canonical={`/immobilier/${cityData.slug}/${neighborhoodData.slug}`}
        structuredData={structuredData}
      />
      
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Neighborhood Header */}
            <div className="mb-8 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {t('realEstate')} {neighborhoodName}
              </h1>
              <p className="text-xl text-muted-foreground">
                {cityName}
              </p>
              <p className="text-lg text-muted-foreground mt-2">
                {language === 'fr' 
                  ? `Trouvez votre propriété idéale à ${neighborhoodName}, ${cityName}`
                  : `ابحث عن العقار المثالي في ${neighborhoodName}، ${cityName}`}
              </p>
            </div>

            {/* Coming Soon Message */}
            <div className="bg-card border rounded-lg p-8 text-center">
              <h2 className="text-2xl font-semibold mb-4">
                {language === 'fr' ? 'Bientôt disponible' : 'قريبا'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {language === 'fr'
                  ? `Les annonces pour ${neighborhoodName} à ${cityName} seront bientôt disponibles. Nous préparons une sélection exceptionnelle de propriétés dans ce quartier.`
                  : `ستتوفر إعلانات ${neighborhoodName} في ${cityName} قريبًا. نحن نعد مجموعة استثنائية من العقارات في هذا الحي.`}
              </p>
              
              {/* Quick Links */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <a 
                  href={`/search?city=${cityData.id}`}
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {language === 'fr' ? `Voir toutes les annonces à ${cityName}` : `عرض جميع الإعلانات في ${cityName}`}
                </a>
                <a 
                  href="/add-listing"
                  className="inline-flex items-center justify-center px-6 py-3 border border-input rounded-lg hover:bg-accent transition-colors"
                >
                  {language === 'fr' ? 'Publier une annonce' : 'نشر إعلان'}
                </a>
              </div>
            </div>

            {/* Neighborhood Information */}
            <div className="mt-12 prose prose-lg max-w-none">
              <h2 className="text-2xl font-semibold mb-4">
                {language === 'fr' ? `À propos de ${neighborhoodName}` : `حول ${neighborhoodName}`}
              </h2>
              <p className="text-muted-foreground">
                {language === 'fr'
                  ? `${neighborhoodName} est l'un des quartiers recherchés de ${cityName}, offrant un cadre de vie agréable et des opportunités immobilières variées. Découvrez des appartements, villas et maisons à vendre ou à louer dans ce quartier prisé.`
                  : `${neighborhoodName} هو أحد الأحياء المرغوبة في ${cityName}، ويوفر بيئة معيشية ممتعة وفرص عقارية متنوعة.`}
              </p>
            </div>

            {/* SEO Content - Benefits */}
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">
                  {language === 'fr' ? 'Vivre à ' + neighborhoodName : 'العيش في ' + neighborhoodName}
                </h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                  <li>
                    {language === 'fr' 
                      ? 'Proximité des commerces et services'
                      : 'قرب من المحلات التجارية والخدمات'}
                  </li>
                  <li>
                    {language === 'fr'
                      ? 'Réseau de transport accessible'
                      : 'شبكة نقل متاحة'}
                  </li>
                  <li>
                    {language === 'fr'
                      ? 'Environnement dynamique'
                      : 'بيئة ديناميكية'}
                  </li>
                </ul>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">
                  {language === 'fr' ? 'Types de propriétés' : 'أنواع العقارات'}
                </h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground text-sm">
                  <li>
                    {language === 'fr' 
                      ? 'Appartements modernes'
                      : 'شقق حديثة'}
                  </li>
                  <li>
                    {language === 'fr'
                      ? 'Villas avec jardin'
                      : 'فلل مع حديقة'}
                  </li>
                  <li>
                    {language === 'fr'
                      ? 'Espaces commerciaux'
                      : 'مساحات تجارية'}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>

        <Footer />
        <MobileFAB />
      </div>
    </>
  );
}
