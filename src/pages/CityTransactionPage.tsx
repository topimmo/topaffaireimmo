import { useParams, Navigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { MOROCCO_CITIES } from '../lib/seo';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MobileFAB from '../components/layout/MobileFAB';
import BannerSlot from '../components/advertising/BannerSlot';
import { SITE_URL } from '@/config/site';

/**
 * City Transaction Type Page
 * SEO-optimized pages for city + transaction type combinations
 * Examples: /casablanca/vente, /rabat/location
 */
export default function CityTransactionPage() {
  const { city, type } = useParams<{ city: string; type: string }>();
  const { language, t } = useLanguage();

  // Find city in our list
  const cityData = MOROCCO_CITIES.find(c => c.slug === city?.toLowerCase());

  // Validate transaction type
  const validTypes = ['vente', 'location'];
  if (!cityData || !type || !validTypes.includes(type)) {
    return <Navigate to="/" replace />;
  }

  const cityName = language === 'ar' ? cityData.name_ar : cityData.name_fr;
  const isRental = type === 'location';
  const transactionType = isRental ? 'rent' : 'sale';
  
  // Generate SEO metadata
  const transactionText = isRental 
    ? (language === 'fr' ? 'Location' : 'إيجار')
    : (language === 'fr' ? 'Vente' : 'بيع');
  
  const pageTitle = `${transactionText} Immobilier à ${cityName} | TopAffaireImmo`;
  const pageDescription = isRental
    ? `Découvrez les meilleures annonces de location à ${cityName} : appartements, maisons et villas à louer. Prix, photos et contact direct.`
    : `Trouvez les meilleures propriétés à vendre à ${cityName} : appartements, villas, maisons et terrains. Annonces vérifiées avec prix et photos.`;

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
          name: transactionText,
          item: `${SITE_URL}/${cityData.slug}/${type}`,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pageTitle,
      description: pageDescription,
      url: `${SITE_URL}/${cityData.slug}/${type}`,
    },
  ];

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={`${type} ${cityName}, immobilier ${cityName}, propriété ${type} ${cityName}, ${isRental ? 'louer' : 'acheter'} ${cityName}`}
        canonical={`/${cityData.slug}/${type}`}
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
                {transactionText} {language === 'fr' ? 'Immobilier à' : ''} {cityName}
              </h1>
              <p className="text-lg text-muted-foreground">
                {isRental
                  ? language === 'fr'
                    ? `Parcourez les meilleures offres de location à ${cityName}. Appartements, maisons et villas disponibles.`
                    : `تصفح أفضل عروض الإيجار في ${cityName}. شقق ومنازل وفيلات متاحة.`
                  : language === 'fr'
                    ? `Découvrez les propriétés à vendre à ${cityName}. Appartements, villas, maisons et terrains.`
                    : `اكتشف العقارات المعروضة للبيع في ${cityName}. شقق وفيلات ومنازل وأراضي.`}
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
                    ? `Les annonces de ${type} pour ${cityName} seront bientôt disponibles. En attendant, parcourez toutes nos annonces ou publiez la vôtre.`
                    : `ستتوفر إعلانات ${type === 'vente' ? 'البيع' : 'الإيجار'} لـ ${cityName} قريبًا. في هذه الأثناء، تصفح جميع إعلاناتنا أو انشر إعلانك.`}
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
                  ? `Pourquoi ${type === 'vente' ? 'acheter' : 'louer'} à ${cityName} ?`
                  : `لماذا ${type === 'vente' ? 'الشراء' : 'الإيجار'} في ${cityName}؟`}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {language === 'fr'
                  ? `${cityName} offre de nombreuses opportunités immobilières pour tous les budgets. Que vous recherchiez un appartement moderne, une villa spacieuse ou une maison traditionnelle, vous trouverez des options variées dans cette ville.`
                  : `تقدم ${cityName} العديد من الفرص العقارية لجميع الميزانيات. سواء كنت تبحث عن شقة حديثة أو فيلا واسعة أو منزل تقليدي، ستجد خيارات متنوعة في هذه المدينة.`}
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
