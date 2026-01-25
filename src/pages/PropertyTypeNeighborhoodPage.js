import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, Navigate, useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { MOROCCO_CITIES, findNeighborhoodInCity, PROPERTY_TYPES, TRANSACTION_TYPES } from '../lib/seo';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MobileFAB from '../components/layout/MobileFAB';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage, } from '@/components/ui/breadcrumb';
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
    const { city, neighborhood, propertyType, transactionType } = useParams();
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
        return _jsx(Navigate, { to: "/", replace: true });
    }
    // Find neighborhood
    const neighborhoodData = findNeighborhoodInCity(cityData.slug, neighborhood?.toLowerCase() || '');
    if (!neighborhoodData) {
        return _jsx(Navigate, { to: `/immobilier/${cityData.slug}`, replace: true });
    }
    // Find property type
    const propertyTypeData = PROPERTY_TYPES.find(pt => pt.slug === propertyType?.toLowerCase());
    // Find transaction type
    const transactionTypeData = TRANSACTION_TYPES.find(tt => tt.slug === transactionType?.toLowerCase());
    // Build filters for useProperties hook
    const filters = {
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
    }
    else if (propertyTypeData) {
        pageTitle = `${propertyTypeName} à ${neighborhoodName}, ${cityName} | TopAffaireImmo`;
        pageDescription = `Découvrez nos ${propertyTypeName.toLowerCase()}s à ${neighborhoodName} (${cityName}). ${hasListings ? `${count} annonce${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''}.` : 'Trouvez votre bien idéal.'}`;
    }
    else if (transactionTypeData) {
        pageTitle = `Immobilier ${transactionTypeData.id === 'sale' ? 'à vendre' : 'à louer'} à ${neighborhoodName}, ${cityName} | TopAffaireImmo`;
        pageDescription = `Trouvez des propriétés ${transactionTypeData.id === 'sale' ? 'à vendre' : 'à louer'} à ${neighborhoodName} (${cityName}). ${hasListings ? `${count} annonce${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''}.` : 'Trouvez votre bien idéal.'}`;
    }
    else {
        pageTitle = `Immobilier ${neighborhoodName}, ${cityName} | TopAffaireImmo`;
        pageDescription = `Découvrez l'immobilier à ${neighborhoodName} (${cityName}). ${hasListings ? `${count} annonce${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''}.` : 'Trouvez votre bien idéal.'}`;
    }
    // Check if we should add noindex for filtered pages with query params
    const hasFilterParams = Array.from(searchParams.keys()).some(key => !['page'].includes(key));
    const shouldNoindex = hasFilterParams || !hasListings;
    // Canonical URL - base route without query params
    let canonicalPath = `/immobilier/${cityData.slug}/${neighborhoodData.slug}`;
    if (propertyType)
        canonicalPath += `/${propertyType}`;
    if (transactionType)
        canonicalPath += `/${transactionType}`;
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
    const handlePageChange = (page) => {
        setCurrentPage(page);
        setSearchParams({ page: page.toString() });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    return (_jsxs(_Fragment, { children: [_jsx(SEO, { title: pageTitle, description: pageDescription, canonical: canonicalPath, structuredData: structuredData, noindex: shouldNoindex }), _jsxs("div", { className: "min-h-screen flex flex-col bg-background", children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 container mx-auto px-4 py-8 pt-24", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsx(Breadcrumb, { className: "mb-6", children: _jsxs(BreadcrumbList, { children: [_jsx(BreadcrumbItem, { children: _jsx(BreadcrumbLink, { href: "/", children: "Accueil" }) }), _jsx(BreadcrumbSeparator, { children: _jsx(ChevronRight, { className: "h-4 w-4" }) }), _jsx(BreadcrumbItem, { children: _jsx(BreadcrumbLink, { href: "/search", children: "Immobilier" }) }), _jsx(BreadcrumbSeparator, { children: _jsx(ChevronRight, { className: "h-4 w-4" }) }), _jsx(BreadcrumbItem, { children: _jsx(BreadcrumbLink, { href: `/immobilier/${cityData.slug}`, children: cityName }) }), _jsx(BreadcrumbSeparator, { children: _jsx(ChevronRight, { className: "h-4 w-4" }) }), _jsx(BreadcrumbItem, { children: _jsx(BreadcrumbLink, { href: `/immobilier/${cityData.slug}/${neighborhoodData.slug}`, children: neighborhoodName }) }), propertyTypeData && (_jsxs(_Fragment, { children: [_jsx(BreadcrumbSeparator, { children: _jsx(ChevronRight, { className: "h-4 w-4" }) }), _jsx(BreadcrumbItem, { children: _jsx(BreadcrumbPage, { children: propertyTypeName }) })] })), transactionTypeData && (_jsxs(_Fragment, { children: [_jsx(BreadcrumbSeparator, { children: _jsx(ChevronRight, { className: "h-4 w-4" }) }), _jsx(BreadcrumbItem, { children: _jsx(BreadcrumbPage, { children: transactionTypeName }) })] }))] }) }), _jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl md:text-4xl font-bold mb-4", children: propertyTypeData && transactionTypeData
                                                ? `${propertyTypeName} ${transactionTypeData.id === 'sale' ? 'à vendre' : 'à louer'} à ${neighborhoodName}`
                                                : propertyTypeData
                                                    ? `${propertyTypeName} à ${neighborhoodName}`
                                                    : transactionTypeData
                                                        ? `Immobilier ${transactionTypeData.id === 'sale' ? 'à vendre' : 'à louer'} à ${neighborhoodName}`
                                                        : `Immobilier ${neighborhoodName}` }), _jsxs("p", { className: "text-lg text-muted-foreground", children: [cityName, " \u2022 ", hasListings ? `${count} annonce${count > 1 ? 's' : ''}` : 'Aucune annonce disponible'] })] }), loading ? (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" }) })) : hasListings ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8", children: properties.map((property) => (_jsx(PropertyCard, { property: property }, property.id))) }), totalPages > 1 && (_jsx("div", { className: "flex justify-center mt-8", children: _jsx(Pagination, { children: _jsxs(PaginationContent, { children: [_jsx(PaginationItem, { children: _jsx(PaginationPrevious, { onClick: () => currentPage > 1 && handlePageChange(currentPage - 1), className: currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer' }) }), [...Array(totalPages)].map((_, i) => {
                                                            const pageNum = i + 1;
                                                            if (pageNum === 1 ||
                                                                pageNum === totalPages ||
                                                                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                                                return (_jsx(PaginationItem, { children: _jsx(PaginationLink, { onClick: () => handlePageChange(pageNum), isActive: currentPage === pageNum, className: "cursor-pointer", children: pageNum }) }, pageNum));
                                                            }
                                                            else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                                                return (_jsx(PaginationItem, { children: _jsx(PaginationEllipsis, {}) }, pageNum));
                                                            }
                                                            return null;
                                                        }), _jsx(PaginationItem, { children: _jsx(PaginationNext, { onClick: () => currentPage < totalPages && handlePageChange(currentPage + 1), className: currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer' }) })] }) }) }))] })) : (_jsxs("div", { className: "bg-card border rounded-lg p-8 text-center", children: [_jsx("h2", { className: "text-2xl font-semibold mb-4", children: language === 'fr' ? 'Aucune annonce disponible' : 'لا توجد إعلانات متاحة' }), _jsx("p", { className: "text-muted-foreground mb-6", children: language === 'fr'
                                                ? `Nous n'avons pas encore d'annonces pour ${propertyTypeName ? propertyTypeName.toLowerCase() + 's' : 'propriétés'} ${transactionTypeData ? (transactionTypeData.id === 'sale' ? 'à vendre' : 'à louer') : ''} à ${neighborhoodName}. Explorez d'autres quartiers ou créez une alerte.`
                                                : 'لا توجد لدينا إعلانات لهذه المنطقة حاليًا.' }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsx(Link, { to: `/immobilier/${cityData.slug}/${neighborhoodData.slug}`, className: "inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors", children: language === 'fr' ? `Voir tout à ${neighborhoodName}` : `عرض الكل في ${neighborhoodName}` }), _jsx(Link, { to: `/immobilier/${cityData.slug}`, className: "inline-flex items-center justify-center px-6 py-3 border border-input rounded-lg hover:bg-accent transition-colors", children: language === 'fr' ? `Explorer ${cityName}` : `استكشف ${cityName}` })] })] }))] }) }), _jsx(Footer, {}), _jsx(MobileFAB, {})] })] }));
}
