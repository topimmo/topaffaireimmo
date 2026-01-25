import { useParams, Navigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { TRANSACTION_TYPES, PROPERTY_TYPES, MOROCCO_CITIES } from '../lib/seo';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MobileFAB from '../components/layout/MobileFAB';

/**
 * SEO Landing Page for Real Estate Transactions
 * Handles URLs like:
 * - /acheter, /louer
 * - /acheter-appartement, /louer-villa
 * - /acheter-casablanca, /louer-rabat
 * - /acheter-appartement-casablanca-maarif
 */
export default function TransactionPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();

  // Parse the slug to extract transaction, property type, city, neighborhood
  const parts = slug?.toLowerCase().split('-') || [];
  
  // First part is always transaction type
  const transactionSlug = parts[0];
  const transaction = TRANSACTION_TYPES.find(t => t.slug === transactionSlug);

  if (!transaction) {
    return <Navigate to="/" replace />;
  }

  // Try to find property type
  let propertyType = null;
  let propertyTypeIndex = -1;
  if (parts.length > 1) {
    propertyType = PROPERTY_TYPES.find(p => p.slug === parts[1]);
    if (propertyType) propertyTypeIndex = 1;
  }

  // Try to find city
  let city = null;
  let cityIndex = -1;
  const citySearchIndex = propertyTypeIndex > 0 ? propertyTypeIndex + 1 : 1;
  if (parts.length > citySearchIndex) {
    city = MOROCCO_CITIES.find(c => c.slug === parts[citySearchIndex]);
    if (city) cityIndex = citySearchIndex;
  }

  // Remaining parts are neighborhood
  let neighborhood = null;
  if (cityIndex > 0 && parts.length > cityIndex + 1) {
    neighborhood = parts.slice(cityIndex + 1).join(' ');
  }

  // Generate content based on what we found
  const transactionName = language === 'ar' ? transaction.name_ar : transaction.name_fr;
  const propertyTypeName = propertyType 
    ? (language === 'ar' ? propertyType.name_ar : propertyType.name_fr)
    : (language === 'fr' ? 'Propriétés' : 'عقارات');
  const cityName = city 
    ? (language === 'ar' ? city.name_ar : city.name_fr)
    : null;

  // Build title and description
  let title = `${propertyTypeName} ${transactionName}`;
  if (neighborhood && cityName) {
    title += ` ${neighborhood}, ${cityName}`;
  } else if (cityName) {
    title += ` ${cityName}`;
  } else {
    title += ` Maroc`;
  }
  title += ` | TopAffaireImmo`;

  const transactionVerb = transaction.id === 'sale' ? 'à vendre' : 'à louer';
  let description = `Découvrez les meilleures ${propertyTypeName.toLowerCase()} ${transactionVerb}`;
  if (neighborhood && cityName) {
    description += ` à ${neighborhood}, ${cityName}`;
  } else if (cityName) {
    description += ` à ${cityName}`;
  } else {
    description += ` au Maroc`;
  }
  description += `. Annonces vérifiées, photos HD, prix transparents et contact direct avec les propriétaires.`;

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    "name": title,
    "description": description,
    "url": `https://topaffaireimmo.vercel.app/${slug}`,
    "about": {
      "@type": "Offer",
      "itemOffered": {
        "@type": "RealEstateListing",
        "name": propertyTypeName
      },
      "areaServed": city ? {
        "@type": "City",
        "name": city.name_fr,
        "addressCountry": "MA"
      } : {
        "@type": "Country",
        "name": "Morocco"
      }
    }
  };

  return (
    <>
      <SEO
        title={title}
        description={description}
        keywords={`${propertyTypeName} ${transactionVerb}, immobilier ${cityName || 'Maroc'}, ${transactionName}`}
        canonical={`/${slug}`}
        structuredData={structuredData}
      />
      
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {propertyTypeName} {transactionName}
                {neighborhood && cityName && ` - ${neighborhood}, ${cityName}`}
                {!neighborhood && cityName && ` - ${cityName}`}
                {!cityName && ` au Maroc`}
              </h1>
              <p className="text-lg text-muted-foreground">
                {language === 'fr'
                  ? `Trouvez votre ${propertyTypeName.toLowerCase()} idéal ${transactionVerb}`
                  : `ابحث عن ${propertyTypeName} المثالي`}
              </p>
            </div>

            {/* Coming Soon Notice */}
            <div className="bg-card border rounded-lg p-8 mb-8">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-4">
                  {language === 'fr' ? 'Page en préparation' : 'الصفحة قيد الإعداد'}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {language === 'fr'
                    ? 'Cette page SEO est en cours de préparation pour le lancement officiel. Les annonces correspondantes seront bientôt disponibles.'
                    : 'هذه الصفحة قيد الإعداد للإطلاق الرسمي. ستتوفر الإعلانات المقابلة قريبًا.'}
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="/search"
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

            {/* SEO Content */}
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-semibold mb-4">
                {language === 'fr' 
                  ? `Pourquoi ${transactionName.toLowerCase()} avec TopAffaireImmo ?`
                  : `لماذا ${transactionName} مع TopAffaireImmo؟`}
              </h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>
                  {language === 'fr' 
                    ? 'Annonces vérifiées et de qualité'
                    : 'إعلانات موثوقة وذات جودة'}
                </li>
                <li>
                  {language === 'fr'
                    ? 'Photos HD et visites virtuelles'
                    : 'صور عالية الدقة وجولات افتراضية'}
                </li>
                <li>
                  {language === 'fr'
                    ? 'Contact direct avec les propriétaires'
                    : 'اتصال مباشر مع المالكين'}
                </li>
                <li>
                  {language === 'fr'
                    ? 'Prix transparents sans frais cachés'
                    : 'أسعار شفافة بدون رسوم خفية'}
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
