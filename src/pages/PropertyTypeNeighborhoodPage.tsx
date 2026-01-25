import { useParams, Navigate, useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { MOROCCO_CITIES, findNeighborhoodInCity, PROPERTY_TYPES, TRANSACTION_TYPES } from '../lib/seo';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MobileFAB from '../components/layout/MobileFAB';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { useProperties } from '../hooks/useProperties';
import PropertyCard from '../components/home/PropertyCard';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

/**
 * Property Type & Transaction Neighborhood Page
 * SEO-optimized pages for specific property types and transactions in neighborhoods
 * Route: /immobilier/[city]/[neighborhood]/[propertyType]/[transactionType]
 * Example: /immobilier/casablanca/maarif/appartement/vente
 */
export default function PropertyTypeNeighborhoodPage() {
  const { city, neighborhood, propertyType, transactionType } = useParams<{
    city: string;
    neighborhood: string;
    propertyType: string;
    transactionType: string;
  }>();
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);

  // Get page from URL params
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1', 10);
    setCurrentPage(page);
  }, [searchParams]);

  // Find city data
  const cityData = MOROCCO_CITIES.find(c => c.slug === city?.toLowerCase());
  
  if (!cityData) {
    return <Navigate to="/" replace />;
  }

  // Find neighborhood
  const neighborhoodData = findNeighborhoodInCity(cityData.slug, neighborhood?.toLowerCase() || '');
  
  if (!neighborhoodData) {
    return <Navigate to={`/immobilier/${cityData.slug}`} replace />;
  }

  // Find property type
  const propertyTypeData = PROPERTY_TYPES.find(pt => pt.slug === propertyType?.toLowerCase());
  
  // Find transaction type
  const transactionTypeData = TRANSACTION_TYPES.find(tt => tt.slug === transactionType?.toLowerCase());

  // Build filters for useProperties hook
  const filters: any = {
    neighborhood_id: neighborhoodData.id,
    status: 'approved',
  };

  if (propertyTypeData) {
    filters.property_type = propertyTypeData.id;
  }

  if (transactionTypeData) {
    filters.transaction_type = transactionTypeData.id;
  }

  // Fetch properties with pagination
  const { properties, loading, count } = useProperties({
    filters,
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
  });

  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);
  const hasListings = (count || 0) > 0;

  // Build page title and description
  const cityName = language === 'ar' ? cityData.name_ar : cityData.name_fr;
  const neighborhoodName = language === 'ar' ? neighborhoodData.name_ar : neighborhoodData.name_fr;
  const propertyTypeName = propertyTypeData ? (language === 'ar' ? propertyTypeData.name_ar : propertyTypeData.name_fr) : '';
  const transactionTypeName = transactionTypeData ? (language === 'ar' ? transactionTypeData.name_ar : transactionTypeData.name_fr) : '';

  let pageTitle = '';
  let pageDescription = '';

  if (propertyTypeData && transactionTypeData) {
    pageTitle = `${propertyTypeName} ${transactionTypeData.id === 'sale' ? 'à vendre' : 'à louer'} à ${neighborhoodName}, ${cityName} | TopAffaireImmo`;
    pageDescription = `Découvrez nos ${propertyTypeName.toLowerCase()}s ${transactionTypeData.id === 'sale' ? 'à vendre' : 'à louer'} à ${neighborhoodName} (${cityName}). Prix en MAD, photos, contact direct. ${hasListings ? `${count} annonce${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''}.` : 'Trouvez votre bien idéal.'}`;
  } else if (propertyTypeData) {
    pageTitle = `${propertyTypeName} à ${neighborhoodName}, ${cityName} | TopAffaireImmo`;
    pageDescription = `Découvrez nos ${propertyTypeName.toLowerCase()}s à ${neighborhoodName} (${cityName}). ${hasListings ? `${count} annonce${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''}.` : 'Trouvez votre bien idéal.'}`;
  } else if (transactionTypeData) {
    pageTitle = `Immobilier ${transactionTypeData.id === 'sale' ? 'à vendre' : 'à louer'} à ${neighborhoodName}, ${cityName} | TopAffaireImmo`;
    pageDescription = `Trouvez des propriétés ${transactionTypeData.id === 'sale' ? 'à vendre' : 'à louer'} à ${neighborhoodName} (${cityName}). ${hasListings ? `${count} annonce${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''}.` : 'Trouvez votre bien idéal.'}`;
  } else {
    pageTitle = `Immobilier ${neighborhoodName}, ${cityName} | TopAffaireImmo`;
    pageDescription = `Découvrez l'immobilier à ${neighborhoodName} (${cityName}). ${hasListings ? `${count} annonce${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''}.` : 'Trouvez votre bien idéal.'}`;
  }

  // Check if we should add noindex for filtered pages with query params
  const hasFilterParams = Array.from(searchParams.keys()).some(key => !['page'].includes(key));
  const shouldNoindex = hasFilterParams || !hasListings;

  // Canonical URL - base route without query params
  let canonicalPath = `/immobilier/${cityData.slug}/${neighborhoodData.slug}`;
  if (propertyType) canonicalPath += `/${propertyType}`;
  if (transactionType) canonicalPath += `/${transactionType}`;

  // Structured data
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
          "item": "https://topaffaireimmo.vercel.app/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Immobilier",
          "item": "https://topaffaireimmo.vercel.app/search"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": cityName,
          "item": `https://topaffaireimmo.vercel.app/immobilier/${cityData.slug}`
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": neighborhoodName,
          "item": `https://topaffaireimmo.vercel.app/immobilier/${cityData.slug}/${neighborhoodData.slug}`
        },
        ...(propertyTypeData ? [{
          "@type": "ListItem",
          "position": 5,
          "name": propertyTypeName,
          "item": `https://topaffaireimmo.vercel.app/immobilier/${cityData.slug}/${neighborhoodData.slug}/${propertyType}`
        }] : []),
        ...(transactionTypeData ? [{
          "@type": "ListItem",
          "position": propertyTypeData ? 6 : 5,
          "name": transactionTypeName,
        }] : [])
      ]
    }
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSearchParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <SEO
        title={pageTitle}
        description={pageDescription}
        canonical={canonicalPath}
        structuredData={structuredData}
        noindex={shouldNoindex}
      />
      
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8 pt-24">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumbs */}
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator><ChevronRight className="h-4 w-4" /></BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/search">Immobilier</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator><ChevronRight className="h-4 w-4" /></BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/immobilier/${cityData.slug}`}>{cityName}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator><ChevronRight className="h-4 w-4" /></BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/immobilier/${cityData.slug}/${neighborhoodData.slug}`}>{neighborhoodName}</BreadcrumbLink>
                </BreadcrumbItem>
                {propertyTypeData && (
                  <>
                    <BreadcrumbSeparator><ChevronRight className="h-4 w-4" /></BreadcrumbSeparator>
                    <BreadcrumbItem>
                      <BreadcrumbPage>{propertyTypeName}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
                {transactionTypeData && (
                  <>
                    <BreadcrumbSeparator><ChevronRight className="h-4 w-4" /></BreadcrumbSeparator>
                    <BreadcrumbItem>
                      <BreadcrumbPage>{transactionTypeName}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>

            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {propertyTypeData && transactionTypeData 
                  ? `${propertyTypeName} ${transactionTypeData.id === 'sale' ? 'à vendre' : 'à louer'} à ${neighborhoodName}`
                  : propertyTypeData
                  ? `${propertyTypeName} à ${neighborhoodName}`
                  : transactionTypeData
                  ? `Immobilier ${transactionTypeData.id === 'sale' ? 'à vendre' : 'à louer'} à ${neighborhoodName}`
                  : `Immobilier ${neighborhoodName}`
                }
              </h1>
              <p className="text-lg text-muted-foreground">
                {cityName} • {hasListings ? `${count} annonce${count > 1 ? 's' : ''}` : 'Aucune annonce disponible'}
              </p>
            </div>

            {/* Listings Grid or Empty State */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : hasListings ? (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  onClick={() => handlePageChange(pageNum)}
                                  isActive={currentPage === pageNum}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}

                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-card border rounded-lg p-8 text-center">
                <h2 className="text-2xl font-semibold mb-4">
                  {language === 'fr' ? 'Aucune annonce disponible' : 'لا توجد إعلانات متاحة'}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {language === 'fr'
                    ? `Nous n'avons pas encore d'annonces pour ${propertyTypeName ? propertyTypeName.toLowerCase() + 's' : 'propriétés'} ${transactionTypeData ? (transactionTypeData.id === 'sale' ? 'à vendre' : 'à louer') : ''} à ${neighborhoodName}. Explorez d'autres quartiers ou créez une alerte.`
                    : 'لا توجد لدينا إعلانات لهذه المنطقة حاليًا.'}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    to={`/immobilier/${cityData.slug}/${neighborhoodData.slug}`}
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    {language === 'fr' ? `Voir tout à ${neighborhoodName}` : `عرض الكل في ${neighborhoodName}`}
                  </Link>
                  <Link 
                    to={`/immobilier/${cityData.slug}`}
                    className="inline-flex items-center justify-center px-6 py-3 border border-input rounded-lg hover:bg-accent transition-colors"
                  >
                    {language === 'fr' ? `Explorer ${cityName}` : `استكشف ${cityName}`}
                  </Link>
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
