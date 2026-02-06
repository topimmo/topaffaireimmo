import { useParams, Navigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { MOROCCO_CITIES, findNeighborhoodInCity, PROPERTY_TYPES } from '../lib/seo';
import { getNeighborhoodContent } from '../data/neighborhoodContent';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MobileFAB from '../components/layout/MobileFAB';
import { SITE_URL } from "@/config/site";
import { CheckCircle2, Home, Building2, TrendingUp } from 'lucide-react';

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
  
  // Get SEO-optimized content for this neighborhood
  const neighborhoodContent = getNeighborhoodContent(cityData.slug, neighborhoodData.slug);
  
  const pageTitle = neighborhoodContent?.h1 
    ? `${neighborhoodContent.h1} - Vente et Location | TopAffaireImmo`
    : `Immobilier ${neighborhoodName} ${cityName} - Vente et Location | TopAffaireImmo`;
  const pageDescription = neighborhoodContent?.introduction || 
    `Découvrez les meilleures offres immobilières à ${neighborhoodName}, ${cityName}, Maroc. Appartements, villas, maisons et terrains à vendre ou à louer. Annonces vérifiées dans ce quartier prisé.`;

  // Enhanced structured data for the neighborhood with BreadcrumbList
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Place",
      "name": `${neighborhoodData.name_fr}, ${cityData.name_fr}`,
      "alternateName": `${neighborhoodData.name_ar}, ${cityData.name_ar}`,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": neighborhoodData.name_fr,
        "addressRegion": cityData.name_fr,
        "addressCountry": "MA"
      },
      "containedInPlace": {
        "@type": "City",
        "name": cityData.name_fr,
        "alternateName": cityData.name_ar,
        "addressCountry": "MA"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Accueil",
          "item": `${SITE_URL}/`
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Immobilier",
          "item": `${SITE_URL}/search`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": cityName,
          "item": `${SITE_URL}/immobilier/${cityData.slug}`
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": neighborhoodName,
          "item": `${SITE_URL}/immobilier/${cityData.slug}/${neighborhoodData.slug}`
        }
      ]
    }
  ];

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
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {neighborhoodContent?.h1 || `${t('realEstate')} ${neighborhoodName}, ${cityName}`}
              </h1>
              
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Link to="/" className="hover:text-primary">Accueil</Link>
                <span>/</span>
                <Link to={`/${cityData.slug}`} className="hover:text-primary">{cityName}</Link>
                <span>/</span>
                <span>{neighborhoodName}</span>
              </div>
              
              {neighborhoodContent && language === 'fr' ? (
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {neighborhoodContent.introduction}
                </p>
              ) : (
                <p className="text-lg text-muted-foreground">
                  {language === 'fr' 
                    ? `Trouvez votre propriété idéale à ${neighborhoodName}, ${cityName}`
                    : `ابحث عن العقار المثالي في ${neighborhoodName}، ${cityName}`}
                </p>
              )}
            </div>

            {/* Main Content Section */}
            {neighborhoodContent && language === 'fr' ? (
              <div className="space-y-8">
                {/* Description */}
                <div className="prose prose-lg max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {neighborhoodContent.description}
                  </p>
                </div>

                {/* Property Types and Price Info Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Property Types */}
                  <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Building2 className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">Types de Propriétés</h2>
                    </div>
                    <ul className="space-y-2">
                      {neighborhoodContent.propertyTypes.map((type, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{type}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Price Information */}
                  <div className="bg-card border rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">Informations Prix</h2>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {neighborhoodContent.priceInfo}
                    </p>
                  </div>
                </div>

                {/* Highlights Section */}
                {neighborhoodContent.highlights && neighborhoodContent.highlights.length > 0 && (
                  <div className="bg-primary/5 border border-primary/10 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Home className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold text-primary">Points Forts du Quartier</h2>
                    </div>
                    <ul className="grid md:grid-cols-2 gap-3">
                      {neighborhoodContent.highlights.map((highlight, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* SEO Internal Links */}
                <div className="bg-card border rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Recherches Populaires à {neighborhoodName}</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {PROPERTY_TYPES.slice(0, 4).map((propType) => (
                      <Link
                        key={propType.id}
                        to={`/search?city=${cityData.id}&propertyType=${propType.id}`}
                        className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="text-sm">{propType.name_fr} à {neighborhoodName}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Call to Action */}
                <div className="bg-card border rounded-lg p-8 text-center">
                  <h2 className="text-2xl font-semibold mb-4">
                    Trouvez Votre Bien Immobilier à {neighborhoodName}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Explorez nos annonces vérifiées à {neighborhoodName}, {cityName} ou publiez votre propre annonce gratuitement.
                  </p>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      to={`/search?city=${cityData.id}`}
                      className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Voir les Annonces à {cityName}
                    </Link>
                    <Link
                      to="/add-listing"
                      className="inline-flex items-center justify-center px-6 py-3 border border-input rounded-lg hover:bg-accent transition-colors"
                    >
                      Publier une Annonce
                    </Link>
                  </div>
                </div>

                {/* Related Links */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Explorez d'Autres Quartiers</h3>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to={`/${cityData.slug}`}
                      className="px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-sm"
                    >
                      Tous les quartiers de {cityName}
                    </Link>
                    <Link
                      to={`/${cityData.slug}/vente`}
                      className="px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-sm"
                    >
                      Acheter à {cityName}
                    </Link>
                    <Link
                      to={`/${cityData.slug}/location`}
                      className="px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-sm"
                    >
                      Louer à {cityName}
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* Fallback for neighborhoods without content or Arabic language */
              <div className="space-y-8">
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
                    <Link
                      to={`/search?city=${cityData.id}`}
                      className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      {language === 'fr' ? `Voir toutes les annonces à ${cityName}` : `عرض جميع الإعلانات في ${cityName}`}
                    </Link>
                    <Link
                      to="/add-listing"
                      className="inline-flex items-center justify-center px-6 py-3 border border-input rounded-lg hover:bg-accent transition-colors"
                    >
                      {language === 'fr' ? 'Publier une annonce' : 'نشر إعلان'}
                    </Link>
                  </div>
                </div>

                {/* Generic Neighborhood Information */}
                <div className="prose prose-lg max-w-none">
                  <h2 className="text-2xl font-semibold mb-4">
                    {language === 'fr' ? `À propos de ${neighborhoodName}` : `حول ${neighborhoodName}`}
                  </h2>
                  <p className="text-muted-foreground">
                    {language === 'fr'
                      ? `${neighborhoodName} est l'un des quartiers recherchés de ${cityName}, offrant un cadre de vie agréable et des opportunités immobilières variées. Découvrez des appartements, villas et maisons à vendre ou à louer dans ce quartier prisé.`
                      : `${neighborhoodName} هو أحد الأحياء المرغوبة في ${cityName}، ويوفر بيئة معيشية ممتعة وفرص عقارية متنوعة.`}
                  </p>
                </div>

                {/* Generic SEO Content */}
                <div className="grid md:grid-cols-2 gap-6">
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
            )}
          </div>
        </main>

        <Footer />
        <MobileFAB />
      </div>
    </>
  );
}
