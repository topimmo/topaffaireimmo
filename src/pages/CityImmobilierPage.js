import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useParams, Navigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { MOROCCO_CITIES, getNeighborhoodsByCity } from '../lib/seo';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MobileFAB from '../components/layout/MobileFAB';
import { MapPin } from 'lucide-react';
/**
 * City Immobilier Page
 * SEO-optimized pages for major Moroccan cities with neighborhood listings
 * Examples: /immobilier/casablanca, /immobilier/rabat
 */
export default function CityImmobilierPage() {
    const { city } = useParams();
    const { language, t } = useLanguage();
    // Find city in our list
    const cityData = MOROCCO_CITIES.find(c => c.slug === city?.toLowerCase());
    // If city not found, redirect to home
    if (!cityData) {
        return _jsx(Navigate, { to: "/", replace: true });
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
                }
            ]
        }
    ];
    return (_jsxs(_Fragment, { children: [_jsx(SEO, { title: pageTitle, description: pageDescription, keywords: `immobilier ${cityName}, quartiers ${cityName}, ${neighborhoods.map(n => n.name_fr).join(', ')}, propriété ${cityName}`, canonical: `/immobilier/${cityData.slug}`, structuredData: structuredData }), _jsxs("div", { className: "min-h-screen flex flex-col bg-background", children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 container mx-auto px-4 py-8", children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("div", { className: "mb-8", children: [_jsxs("h1", { className: "text-4xl md:text-5xl font-bold mb-4", children: [t('realEstate'), " ", cityName] }), _jsx("p", { className: "text-xl text-muted-foreground", children: language === 'fr'
                                                ? `Explorez les quartiers et propriétés à ${cityName}`
                                                : `استكشف الأحياء والعقارات في ${cityName}` })] }), _jsxs("div", { className: "mb-12", children: [_jsx("h2", { className: "text-2xl font-semibold mb-6", children: language === 'fr' ? 'Quartiers Populaires' : 'الأحياء الشعبية' }), _jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-4", children: neighborhoods.map((neighborhood) => {
                                                const neighborhoodName = language === 'ar' ? neighborhood.name_ar : neighborhood.name_fr;
                                                return (_jsx(Link, { to: `/immobilier/${cityData.slug}/${neighborhood.slug}`, className: "group bg-card border rounded-lg p-6 hover:border-primary hover:shadow-md transition-all", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(MapPin, { className: "h-5 w-5 text-primary mt-1 flex-shrink-0" }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-lg group-hover:text-primary transition-colors", children: neighborhoodName }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: language === 'fr'
                                                                            ? 'Voir les propriétés'
                                                                            : 'عرض العقارات' })] })] }) }, neighborhood.id));
                                            }) })] }), _jsx("div", { className: "bg-card border rounded-lg p-8 mb-8", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-semibold mb-4", children: language === 'fr' ? 'Annonces Bientôt Disponibles' : 'الإعلانات قريبًا' }), _jsx("p", { className: "text-muted-foreground mb-6", children: language === 'fr'
                                                    ? `Les annonces pour ${cityName} seront bientôt disponibles. Explorez nos quartiers ci-dessus ou recherchez dans toute la ville.`
                                                    : `ستتوفر إعلانات ${cityName} قريبًا. استكشف أحيائنا أعلاه أو ابحث في جميع أنحاء المدينة.` }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsx("a", { href: `/search?city=${cityData.id}`, className: "inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors", children: language === 'fr' ? 'Rechercher des propriétés' : 'البحث عن العقارات' }), _jsx("a", { href: "/add-listing", className: "inline-flex items-center justify-center px-6 py-3 border border-input rounded-lg hover:bg-accent transition-colors", children: language === 'fr' ? 'Publier une annonce' : 'نشر إعلان' })] })] }) }), _jsxs("div", { className: "prose prose-lg max-w-none", children: [_jsx("h2", { className: "text-2xl font-semibold mb-4", children: language === 'fr' ? `Immobilier à ${cityName}` : `العقارات في ${cityName}` }), _jsx("p", { className: "text-muted-foreground", children: language === 'fr'
                                                ? `${cityName} est l'une des villes principales du Maroc, offrant un marché immobilier dynamique avec des opportunités variées dans chaque quartier. Du centre-ville animé aux quartiers résidentiels paisibles, trouvez la propriété qui vous correspond.`
                                                : `${cityName} هي واحدة من المدن الرئيسية في المغرب، وتوفر سوق عقارات ديناميكي مع فرص متنوعة في كل حي.` }), _jsx("h3", { className: "text-xl font-semibold mt-8 mb-3", children: language === 'fr' ? 'Pourquoi choisir TopAffaireImmo ?' : 'لماذا تختار TopAffaireImmo؟' }), _jsxs("ul", { className: "list-disc list-inside space-y-2 text-muted-foreground", children: [_jsx("li", { children: language === 'fr'
                                                        ? 'Couverture complète de tous les quartiers de la ville'
                                                        : 'تغطية شاملة لجميع أحياء المدينة' }), _jsx("li", { children: language === 'fr'
                                                        ? 'Annonces vérifiées et à jour'
                                                        : 'إعلانات موثوقة ومحدثة' }), _jsx("li", { children: language === 'fr'
                                                        ? 'Photos HD et descriptions détaillées'
                                                        : 'صور عالية الدقة ووصف مفصل' }), _jsx("li", { children: language === 'fr'
                                                        ? 'Contact direct avec les propriétaires et agences'
                                                        : 'اتصال مباشر مع المالكين والوكالات' })] })] })] }) }), _jsx(Footer, {}), _jsx(MobileFAB, {})] })] }));
}
