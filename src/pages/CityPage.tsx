import { useParams, Navigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { MOROCCO_CITIES } from '../lib/seo';
import { getCityContent } from '../data/cityContent';

import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MobileFAB from '../components/layout/MobileFAB';

import BannerSlot from '../components/advertising/BannerSlot';
import { SITE_URL } from "@/config/site";
import { CheckCircle2 } from 'lucide-react';

/**
 * City Landing Page
 * SEO-optimized pages for major Moroccan cities
 * Examples: /casablanca, /rabat, /marrakech
 */
export default function CityPage() {
  const { city } = useParams<{ city: string }>();
  const { language, t } = useLanguage();

  // Find city in our list
  const cityData = MOROCCO_CITIES.find(c => c.slug === city?.toLowerCase());

  // If city not found, redirect to home
  if (!cityData) {
    return <Navigate to="/" replace />;
  }

  const cityName = language === 'ar' ? cityData.name_ar : cityData.name_fr;
  
  // Get SEO-optimized content for this city
  const cityContent = getCityContent(cityData.slug);
  
  // SEO Title format: "Immobilier à {City} – Vente & Location d'Appartements"
  const pageTitle = `Immobilier à ${cityName} – Vente & Location d'Appartements | TopAffaireImmo`;
  // Meta description format from requirements
  const pageDescription = cityContent?.introduction || 
    `Découvrez les meilleures annonces immobilières à ${cityName} : vente et location d'appartements, maisons et terrains.`;

  // Enhanced structured data for the city with BreadcrumbList and CollectionPage
  const structuredData: any[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: cityData.name_fr,
      alternateName: cityData.name_ar,
      address: {
        '@type': 'PostalAddress',
        addressLocality: cityData.name_fr,
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
          name: cityName,
          item: `${SITE_URL}/${cityData.slug}`,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `Immobilier à ${cityName}`,
      description: pageDescription,
      url: `${SITE_URL}/${cityData.slug}`,
      about: {
        '@type': 'RealEstateAgent',
        name: 'TopAffaireImmo',
        areaServed: {
          '@type': 'City',
          name: cityData.name_fr,
          addressCountry: 'MA',
        },
      },
    },
  ];

  // Add FAQPage structured data if city has FAQ content
  if (cityContent?.faqs && cityContent.faqs.length > 0) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: cityContent.faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={`immobilier ${cityName}, propriété ${cityName}, appartement ${cityName}, villa ${cityName}, location ${cityName}, vente ${cityName}`}
        canonical={`/${cityData.slug}`}
        structuredData={structuredData}
      />

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 container mx-auto px-4 py-8">
          {/* HERO BANNER (same as home/hero) */}
          <div className="mb-6">
            <BannerSlot page="home" position="hero" />
          </div>

          {/* Layout: content + sidebar on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main content */}
            <div className="lg:col-span-8">
              <div className="max-w-4xl mx-auto">
                {/* City Header */}
                <div className="mb-8">
                  {/* H1 format: SEO-optimized or fallback */}
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">
                    {language === 'fr'
                      ? (cityContent?.h1 || `Immobilier à ${cityName} : Vente et Location`)
                      : `العقارات في ${cityName}: البيع والإيجار`}
                  </h1>
                  
                  {/* Introduction paragraph */}
                  {cityContent && language === 'fr' ? (
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {cityContent.introduction}
                    </p>
                  ) : (
                    <p className="text-lg text-muted-foreground">
                      {language === 'fr'
                        ? `Trouvez les meilleures offres immobilières à ${cityName}. Appartements, villas et maisons disponibles à la vente et à la location avec photos et prix transparents.`
                        : `اعثر على أفضل العروض العقارية في ${cityName}. شقق وفيلات ومنازل متاحة للبيع والإيجار مع صور وأسعار شفافة.`}
                    </p>
                  )}
                </div>

                {/* MIDDLE BANNER (same as home/middle) */}
                <div className="mb-8">
                  <BannerSlot page="home" position="middle" />
                </div>

                {/* Main Content Section */}
                {cityContent && language === 'fr' ? (
                  <div className="space-y-8">
                    {/* Main content paragraphs */}
                    <div className="prose prose-lg max-w-none">
                      {cityContent.mainContent.split('\n\n').map((paragraph, index) => (
                        <p key={index} className="text-muted-foreground mb-4 leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {/* Highlights Section */}
                    {cityContent.highlights && cityContent.highlights.length > 0 && (
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 text-primary">
                          Points Clés
                        </h2>
                        <ul className="space-y-2">
                          {cityContent.highlights.map((highlight, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                              <span className="text-muted-foreground">{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Conclusion */}
                    <div className="bg-card border rounded-lg p-6">
                      <p className="text-muted-foreground leading-relaxed">
                        {cityContent.conclusion}
                      </p>
                      
                      {/* Quick Links */}
                      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                        <a
                          href={`/search?city=${cityData.id}`}
                          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          Voir toutes les annonces
                        </a>
                        <a
                          href="/add-listing"
                          className="inline-flex items-center justify-center px-6 py-3 border border-input rounded-lg hover:bg-accent transition-colors"
                        >
                          Publier une annonce
                        </a>
                      </div>
                    </div>

                    {/* FAQ Section */}
                    {cityContent.faqs && cityContent.faqs.length > 0 && (
                      <div className="mt-12">
                        <h2 className="text-2xl font-bold mb-6">
                          Questions Fréquentes sur l'Immobilier à {cityName}
                        </h2>
                        <div className="space-y-6">
                          {cityContent.faqs.map((faq, index) => (
                            <div key={index} className="bg-card border rounded-lg p-6">
                              <h3 className="text-lg font-semibold mb-3 text-primary">
                                {faq.question}
                              </h3>
                              <p className="text-muted-foreground leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Fallback for cities without content or Arabic language */
                  <div className="bg-card border rounded-lg p-8 text-center">
                    <h2 className="text-2xl font-semibold mb-4">
                      {language === 'fr' ? 'Bientôt disponible' : 'قريبا'}
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      {language === 'fr'
                        ? `Les annonces pour ${cityName} seront bientôt disponibles. Nous préparons une sélection exceptionnelle de propriétés dans cette ville.`
                        : `ستتوفر إعلانات ${cityName} قريبًا. نحن نعد مجموعة استثنائية من العقارات في هذه المدينة.`}
                    </p>

                    {/* Quick Links */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                      <a
                        href={`/search?city=${cityData.id}`}
                        className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        {language === 'fr' ? 'Voir toutes les annonces' : 'عرض جميع الإعلانات'}
                      </a>
                      <a
                        href="/add-listing"
                        className="inline-flex items-center justify-center px-6 py-3 border border-input rounded-lg hover:bg-accent transition-colors"
                      >
                        {language === 'fr' ? 'Publier une annonce' : 'نشر إعلان'}
                      </a>
                    </div>
                    
                    {/* City Information */}
                    <div className="mt-12 prose prose-lg max-w-none">
                      <h2 className="text-2xl font-semibold mb-4">
                        {language === 'fr' ? `À propos de ${cityName}` : `حول ${cityName}`}
                      </h2>
                      <p className="text-muted-foreground">
                        {language === 'fr'
                          ? `${cityName} est l'une des villes principales du Maroc, offrant un marché immobilier dynamique avec des opportunités variées pour l'achat et la location de propriétés.`
                          : `${cityName} هي واحدة من المدن الرئيسية في المغرب، وتوفر سوق عقارات ديناميكي مع فرص متنوعة لشراء وتأجير العقارات.`}
                      </p>
                    </div>
                  </div>
                )}

                {/* BOTTOM BANNER */}
                <div className="mt-10">
                  <BannerSlot page="property" position="bottom" />
                </div>
              </div>
            </div>

            {/* Sidebar banner (same as home/sidebar) */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                <BannerSlot page="home" position="sidebar" />
              </div>
            </aside>
          </div>
        </main>

        <Footer />
        <MobileFAB />
      </div>
    </>
  );
}
