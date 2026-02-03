import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { MOROCCO_CITIES, SAHARA_CITIES } from '../lib/seo';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MobileFAB from '../components/layout/MobileFAB';
import BannerSlot from '../components/advertising/BannerSlot';
import { SITE_URL } from '@/config/site';
import { Link } from 'react-router-dom';

/**
 * Moroccan Sahara Landing Page
 * SEO-optimized page for the Southern Provinces (Sahara Marocain)
 * URL: /sahara-marocain
 */
export default function MoroccanSaharaPage() {
  const { language, t } = useLanguage();

  // Get Sahara cities data - filter by checking if id is in SAHARA_CITIES
  const saharaCities = MOROCCO_CITIES.filter(c => 
    SAHARA_CITIES.includes(c.id as typeof SAHARA_CITIES[number])
  );

  // Exact title format from requirements: "Immobilier au Sahara Marocain – Vente & Location"
  const pageTitle = 'Immobilier au Sahara Marocain – Vente & Location | TopAffaireImmo';
  const pageDescription = 
    'Découvrez les opportunités immobilières dans les provinces du Sud du Maroc : Laâyoune, Dakhla, Boujdour, Smara et Tarfaya. Appartements, villas et terrains à vendre ou à louer.';

  // Structured data for the Sahara region
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: 'Sahara Marocain',
      alternateName: 'الصحراء المغربية',
      description: 'Provinces du Sud - Région du Sahara Marocain',
      address: {
        '@type': 'PostalAddress',
        addressRegion: 'Sahara Marocain',
        addressCountry: 'MA',
      },
      containedInPlace: {
        '@type': 'Country',
        name: 'Morocco',
        alternateName: 'المغرب',
      },
    },
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
          name: 'Sahara Marocain',
          item: `${SITE_URL}/sahara-marocain`,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pageTitle,
      description: pageDescription,
      url: `${SITE_URL}/sahara-marocain`,
    },
  ];

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords="immobilier sahara marocain, provinces du sud maroc, laayoune, dakhla, immobilier laayoune, immobilier dakhla, boujdour, smara, tarfaya"
        canonical="/sahara-marocain"
        structuredData={structuredData}
      />

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 container mx-auto px-4 py-8">
          {/* Hero Banner */}
          <div className="mb-6">
            <BannerSlot page="home" position="hero" />
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="mb-12 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {language === 'fr' 
                  ? 'Immobilier au Sahara Marocain'
                  : 'العقارات في الصحراء المغربية'}
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {language === 'fr'
                  ? 'Découvrez les opportunités immobilières exceptionnelles dans les provinces du Sud du Maroc'
                  : 'اكتشف الفرص العقارية الاستثنائية في الأقاليم الجنوبية للمغرب'}
              </p>
            </div>

            {/* Middle Banner */}
            <div className="mb-8">
              <BannerSlot page="home" position="middle" />
            </div>

            {/* Introduction */}
            <div className="prose prose-lg max-w-none mb-12">
              <p className="text-muted-foreground text-lg leading-relaxed">
                {language === 'fr'
                  ? 'Le Sahara Marocain offre des opportunités immobilières uniques dans un cadre en pleine expansion. Les provinces du Sud connaissent un développement remarquable avec des projets d\'infrastructure modernes et des zones économiques attractives.'
                  : 'يقدم الصحراء المغربية فرصًا عقارية فريدة في إطار متنامٍ. تشهد الأقاليم الجنوبية تطورًا ملحوظًا مع مشاريع بنية تحتية حديثة ومناطق اقتصادية جذابة.'}
              </p>
            </div>

            {/* Sahara Cities Grid */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold mb-6">
                {language === 'fr' ? 'Villes du Sahara Marocain' : 'مدن الصحراء المغربية'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {saharaCities.map((city) => {
                  const cityName = language === 'ar' ? city.name_ar : city.name_fr;
                  return (
                    <Link
                      key={city.id}
                      to={`/${city.slug}`}
                      className="group bg-card border rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:border-primary"
                    >
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                        {cityName}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {language === 'fr'
                          ? `Découvrir l'immobilier à ${cityName}`
                          : `اكتشف العقارات في ${cityName}`}
                      </p>
                      <div className="flex gap-2">
                        <Link
                          to={`/${city.slug}/vente`}
                          className="text-sm text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {language === 'fr' ? 'Vente' : 'للبيع'}
                        </Link>
                        <span className="text-muted-foreground">•</span>
                        <Link
                          to={`/${city.slug}/location`}
                          className="text-sm text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {language === 'fr' ? 'Location' : 'للإيجار'}
                        </Link>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Key Cities Highlights */}
            <div className="mb-12 bg-card border rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">
                {language === 'fr' ? 'Villes principales' : 'المدن الرئيسية'}
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Laâyoune (العيون)</h3>
                  <p className="text-muted-foreground">
                    {language === 'fr'
                      ? 'Capitale régionale des provinces du Sud, Laâyoune est un centre économique et administratif majeur avec un développement urbain moderne.'
                      : 'العاصمة الإقليمية للأقاليم الجنوبية، العيون مركز اقتصادي وإداري رئيسي مع تطوير حضري حديث.'}
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Dakhla (الداخلة)</h3>
                  <p className="text-muted-foreground">
                    {language === 'fr'
                      ? 'Située sur une péninsule exceptionnelle, Dakhla connaît un essor touristique et économique remarquable, attirant investisseurs et résidents.'
                      : 'تقع على شبه جزيرة استثنائية، تشهد الداخلة نموًا سياحيًا واقتصاديًا ملحوظًا، مما يجذب المستثمرين والمقيمين.'}
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Boujdour, Smara & Tarfaya</h3>
                  <p className="text-muted-foreground">
                    {language === 'fr'
                      ? 'Ces villes stratégiques offrent des opportunités immobilières intéressantes dans une région en pleine transformation.'
                      : 'هذه المدن الاستراتيجية تقدم فرصًا عقارية مثيرة للاهتمام في منطقة في طور التحول.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center bg-primary/5 border border-primary/20 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-4">
                {language === 'fr' 
                  ? 'Prêt à investir dans le Sahara Marocain ?'
                  : 'مستعد للاستثمار في الصحراء المغربية؟'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {language === 'fr'
                  ? 'Parcourez nos annonces ou publiez votre propriété dès maintenant'
                  : 'تصفح إعلاناتنا أو انشر عقارك الآن'}
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
        </main>

        <Footer />
        <MobileFAB />
      </div>
    </>
  );
}
