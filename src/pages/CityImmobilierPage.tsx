import { useParams, Navigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { MOROCCO_CITIES, getNeighborhoodsByCity } from '../lib/seo';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MobileFAB from '../components/layout/MobileFAB';
import { MapPin } from 'lucide-react';
import { SITE_URL } from "@/config/site";

/**
 * City Immobilier Page
 * SEO-optimized pages for major Moroccan cities with neighborhood listings
 * Examples: /immobilier/casablanca, /immobilier/rabat
 */
export default function CityImmobilierPage() {
  const { city } = useParams<{ city: string }>();
  const { language, t } = useLanguage();

  // Find city in our list
  const cityData = MOROCCO_CITIES.find(c => c.slug === city?.toLowerCase());

  // If city not found, redirect to home
  if (!cityData) {
    return <Navigate to="/" replace />;
  }

  // Get neighborhoods for this city
  const neighborhoods = getNeighborhoodsByCity(cityData.slug);

  const cityName = language === 'ar' ? cityData.name_ar : cityData.name_fr;
  const pageTitle = `Immobilier ${cityName} - Quartiers et Propriétés | TopAffaireImmo`;
  const pageDescription = `Explorez l'immobilier à ${cityName}, Maroc. Découvrez tous les quartiers : ${neighborhoods.slice(0, 3).map(n => n.name_fr).join(', ')} et plus. Appartements, villas, maisons à vendre ou à louer.`;

  // Enhanced structured data for the city with neighborhoods and BreadcrumbList
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Place",
      "name": cityData.name_fr,
      "alternateName": cityData.name_ar,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": cityData.name_fr,
        "addressCountry": "MA"
      },
      "containsPlace": neighborhoods.map(n => ({
        "@type": "Place",
        "name": n.name_fr,
        "alternateName": n.name_ar,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": n.name_fr,
          "addressRegion": cityData.name_fr,
          "addressCountry": "MA"
        }
      }))
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
        }
      ]
    }
  ];

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={`immobilier ${cityName}, quartiers ${cityName}, ${neighborhoods.map(n => n.name_fr).join(', ')}, propriété ${cityName}`}
        canonical={`/immobilier/${cityData.slug}`}
        structuredData={structuredData}
      />
      
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* City Header */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {t('realEstate')} {cityName}
              </h1>
              <p className="text-xl text-muted-foreground">
                {language === 'fr' 
                  ? `Explorez les quartiers et propriétés à ${cityName}`
                  : `استكشف الأحياء والعقارات في ${cityName}`}
              </p>
            </div>

            {/* Neighborhoods Grid */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">
                {language === 'fr' ? 'Quartiers Populaires' : 'الأحياء الشعبية'}
              </h2>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {neighborhoods.map((neighborhood) => {
                  const neighborhoodName = language === 'ar' ? neighborhood.name_ar : neighborhood.name_fr;
                  
                  return (
                    <Link
                      key={neighborhood.id}
                      to={`/immobilier/${cityData.slug}/${neighborhood.slug}`}
                      className="group bg-card border rounded-lg p-6 hover:border-primary hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {neighborhoodName}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {language === 'fr' 
                              ? 'Voir les propriétés'
                              : 'عرض العقارات'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Coming Soon Notice */}
            <div className="bg-card border rounded-lg p-8 mb-8">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-4">
                  {language === 'fr' ? 'Annonces Bientôt Disponibles' : 'الإعلانات قريبًا'}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {language === 'fr'
                    ? `Les annonces pour ${cityName} seront bientôt disponibles. Explorez nos quartiers ci-dessus ou recherchez dans toute la ville.`
                    : `ستتوفر إعلانات ${cityName} قريبًا. استكشف أحيائنا أعلاه أو ابحث في جميع أنحاء المدينة.`}
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href={`/search?city=${cityData.id}`}
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    {language === 'fr' ? 'Rechercher des propriétés' : 'البحث عن العقارات'}
                  </a>
                  <a 
                    href="/add-listing"
                    className="inline-flex items-center justify-center px-6 py-3 border border-input rounded-lg hover:bg-accent transition-colors"
                  >
                    {language === 'fr' ? 'Publier une annonce' : 'نشر إعلان'}
                  </a>
                </div>
              </div>
            </div>

            {/* City Information */}
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-semibold mb-4">
                {language === 'fr' ? `Immobilier à ${cityName}` : `العقارات في ${cityName}`}
              </h2>
              <p className="text-muted-foreground">
                {language === 'fr'
                  ? `${cityName} est l'une des villes principales du Maroc, offrant un marché immobilier dynamique avec des opportunités variées dans chaque quartier. Du centre-ville animé aux quartiers résidentiels paisibles, trouvez la propriété qui vous correspond.`
                  : `${cityName} هي واحدة من المدن الرئيسية في المغرب، وتوفر سوق عقارات ديناميكي مع فرص متنوعة في كل حي.`}
              </p>

              <h3 className="text-xl font-semibold mt-8 mb-3">
                {language === 'fr' ? 'Pourquoi choisir TopAffaireImmo ?' : 'لماذا تختار TopAffaireImmo؟'}
              </h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>
                  {language === 'fr' 
                    ? 'Couverture complète de tous les quartiers de la ville'
                    : 'تغطية شاملة لجميع أحياء المدينة'}
                </li>
                <li>
                  {language === 'fr'
                    ? 'Annonces vérifiées et à jour'
                    : 'إعلانات موثوقة ومحدثة'}
                </li>
                <li>
                  {language === 'fr'
                    ? 'Photos HD et descriptions détaillées'
                    : 'صور عالية الدقة ووصف مفصل'}
                </li>
                <li>
                  {language === 'fr'
                    ? 'Contact direct avec les propriétaires et agences'
                    : 'اتصال مباشر مع المالكين والوكالات'}
                </li>
              </ul>
            </div>
          </div>
        </main>

        <Footer />
        <MobileFAB />
      </div>
    </>
  );
}
