import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
    const { city, neighborhood } = useParams();
    const { language, t } = useLanguage();
    // Find city in our list
    const cityData = MOROCCO_CITIES.find(c => c.slug === city?.toLowerCase());
    // If city not found, redirect to home
    if (!cityData) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    // Find neighborhood in this city
    const neighborhoodData = findNeighborhoodInCity(cityData.slug, neighborhood?.toLowerCase() || '');
    // If neighborhood not found, redirect to city page
    if (!neighborhoodData) {
        return _jsx(Navigate, { to: `/immobilier/${cityData.slug}`, replace: true });
    }
    const cityName = language === 'ar' ? cityData.name_ar : cityData.name_fr;
    const neighborhoodName = language === 'ar' ? neighborhoodData.name_ar : neighborhoodData.name_fr;
    const pageTitle = `Immobilier ${neighborhoodName} ${cityName} - Vente et Location | TopAffaireImmo`;
    const pageDescription = `Découvrez les meilleures offres immobilières à ${neighborhoodName}, ${cityName}, Maroc. Appartements, villas, maisons et terrains à vendre ou à louer. Annonces vérifiées dans ce quartier prisé.`;
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
                }
            ]
        }
    ];
    return (_jsxs(_Fragment, { children: [_jsx(SEO, { title: pageTitle, description: pageDescription, keywords: `immobilier ${neighborhoodName}, ${neighborhoodName} ${cityName}, propriété ${neighborhoodName}, appartement ${neighborhoodName}, villa ${neighborhoodName}`, canonical: `/immobilier/${cityData.slug}/${neighborhoodData.slug}`, structuredData: structuredData }), _jsxs("div", { className: "min-h-screen flex flex-col bg-background", children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 container mx-auto px-4 py-8", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "mb-8 text-center", children: [_jsxs("h1", { className: "text-4xl md:text-5xl font-bold mb-4", children: [t('realEstate'), " ", neighborhoodName] }), _jsx("p", { className: "text-xl text-muted-foreground", children: cityName }), _jsx("p", { className: "text-lg text-muted-foreground mt-2", children: language === 'fr'
                                                ? `Trouvez votre propriété idéale à ${neighborhoodName}, ${cityName}`
                                                : `ابحث عن العقار المثالي في ${neighborhoodName}، ${cityName}` })] }), _jsxs("div", { className: "bg-card border rounded-lg p-8 text-center", children: [_jsx("h2", { className: "text-2xl font-semibold mb-4", children: language === 'fr' ? 'Bientôt disponible' : 'قريبا' }), _jsx("p", { className: "text-muted-foreground mb-6", children: language === 'fr'
                                                ? `Les annonces pour ${neighborhoodName} à ${cityName} seront bientôt disponibles. Nous préparons une sélection exceptionnelle de propriétés dans ce quartier.`
                                                : `ستتوفر إعلانات ${neighborhoodName} في ${cityName} قريبًا. نحن نعد مجموعة استثنائية من العقارات في هذا الحي.` }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center mt-8", children: [_jsx("a", { href: `/search?city=${cityData.id}`, className: "inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors", children: language === 'fr' ? `Voir toutes les annonces à ${cityName}` : `عرض جميع الإعلانات في ${cityName}` }), _jsx("a", { href: "/add-listing", className: "inline-flex items-center justify-center px-6 py-3 border border-input rounded-lg hover:bg-accent transition-colors", children: language === 'fr' ? 'Publier une annonce' : 'نشر إعلان' })] })] }), _jsxs("div", { className: "mt-12 prose prose-lg max-w-none", children: [_jsx("h2", { className: "text-2xl font-semibold mb-4", children: language === 'fr' ? `À propos de ${neighborhoodName}` : `حول ${neighborhoodName}` }), _jsx("p", { className: "text-muted-foreground", children: language === 'fr'
                                                ? `${neighborhoodName} est l'un des quartiers recherchés de ${cityName}, offrant un cadre de vie agréable et des opportunités immobilières variées. Découvrez des appartements, villas et maisons à vendre ou à louer dans ce quartier prisé.`
                                                : `${neighborhoodName} هو أحد الأحياء المرغوبة في ${cityName}، ويوفر بيئة معيشية ممتعة وفرص عقارية متنوعة.` })] }), _jsxs("div", { className: "mt-8 grid md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-card border rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-3", children: language === 'fr' ? 'Vivre à ' + neighborhoodName : 'العيش في ' + neighborhoodName }), _jsxs("ul", { className: "list-disc list-inside space-y-2 text-muted-foreground text-sm", children: [_jsx("li", { children: language === 'fr'
                                                                ? 'Proximité des commerces et services'
                                                                : 'قرب من المحلات التجارية والخدمات' }), _jsx("li", { children: language === 'fr'
                                                                ? 'Réseau de transport accessible'
                                                                : 'شبكة نقل متاحة' }), _jsx("li", { children: language === 'fr'
                                                                ? 'Environnement dynamique'
                                                                : 'بيئة ديناميكية' })] })] }), _jsxs("div", { className: "bg-card border rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold mb-3", children: language === 'fr' ? 'Types de propriétés' : 'أنواع العقارات' }), _jsxs("ul", { className: "list-disc list-inside space-y-2 text-muted-foreground text-sm", children: [_jsx("li", { children: language === 'fr'
                                                                ? 'Appartements modernes'
                                                                : 'شقق حديثة' }), _jsx("li", { children: language === 'fr'
                                                                ? 'Villas avec jardin'
                                                                : 'فلل مع حديقة' }), _jsx("li", { children: language === 'fr'
                                                                ? 'Espaces commerciaux'
                                                                : 'مساحات تجارية' })] })] })] })] }) }), _jsx(Footer, {}), _jsx(MobileFAB, {})] })] }));
}
