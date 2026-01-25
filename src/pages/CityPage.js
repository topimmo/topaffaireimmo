import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useParams, Navigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { MOROCCO_CITIES } from '../lib/seo';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MobileFAB from '../components/layout/MobileFAB';
/**
 * City Landing Page
 * SEO-optimized pages for major Moroccan cities
 * Examples: /casablanca, /rabat, /marrakech
 */
export default function CityPage() {
    const { city } = useParams();
    const { language, t } = useLanguage();
    // Find city in our list
    const cityData = MOROCCO_CITIES.find(c => c.slug === city?.toLowerCase());
    // If city not found, redirect to home
    if (!cityData) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    const cityName = language === 'ar' ? cityData.name_ar : cityData.name_fr;
    const pageTitle = `Immobilier ${cityName} - Vente et Location | TopAffaireImmo`;
    const pageDescription = `Découvrez les meilleures offres immobilières à ${cityName}, Maroc. Appartements, villas, maisons et terrains à vendre ou à louer. Annonces vérifiées et prix transparents.`;
    // Enhanced structured data for the city with BreadcrumbList
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
            "containedInPlace": {
                "@type": "Country",
                "name": "Morocco",
                "alternateName": "المغرب"
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
                    "name": cityName,
                    "item": `https://topaffaireimmo.vercel.app/${cityData.slug}`
                }
            ]
        }
    ];
    return (_jsxs(_Fragment, { children: [_jsx(SEO, { title: pageTitle, description: pageDescription, keywords: `immobilier ${cityName}, propriété ${cityName}, appartement ${cityName}, villa ${cityName}, location ${cityName}, vente ${cityName}`, canonical: `/${cityData.slug}`, structuredData: structuredData }), _jsxs("div", { className: "min-h-screen flex flex-col bg-background", children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 container mx-auto px-4 py-8", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "mb-8 text-center", children: [_jsxs("h1", { className: "text-4xl md:text-5xl font-bold mb-4", children: [t('realEstate'), " ", cityName] }), _jsx("p", { className: "text-xl text-muted-foreground", children: language === 'fr'
                                                ? `Trouvez votre propriété idéale à ${cityName}`
                                                : `ابحث عن العقار المثالي في ${cityName}` })] }), _jsxs("div", { className: "bg-card border rounded-lg p-8 text-center", children: [_jsx("h2", { className: "text-2xl font-semibold mb-4", children: language === 'fr' ? 'Bientôt disponible' : 'قريبا' }), _jsx("p", { className: "text-muted-foreground mb-6", children: language === 'fr'
                                                ? `Les annonces pour ${cityName} seront bientôt disponibles. Nous préparons une sélection exceptionnelle de propriétés dans cette ville.`
                                                : `ستتوفر إعلانات ${cityName} قريبًا. نحن نعد مجموعة استثنائية من العقارات في هذه المدينة.` }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center mt-8", children: [_jsx("a", { href: `/search?city=${cityData.id}`, className: "inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors", children: language === 'fr' ? 'Voir toutes les annonces' : 'عرض جميع الإعلانات' }), _jsx("a", { href: "/add-listing", className: "inline-flex items-center justify-center px-6 py-3 border border-input rounded-lg hover:bg-accent transition-colors", children: language === 'fr' ? 'Publier une annonce' : 'نشر إعلان' })] })] }), _jsxs("div", { className: "mt-12 prose prose-lg max-w-none", children: [_jsx("h2", { className: "text-2xl font-semibold mb-4", children: language === 'fr' ? `À propos de ${cityName}` : `حول ${cityName}` }), _jsx("p", { className: "text-muted-foreground", children: language === 'fr'
                                                ? `${cityName} est l'une des villes principales du Maroc, offrant un marché immobilier dynamique avec des opportunités variées pour l'achat et la location de propriétés.`
                                                : `${cityName} هي واحدة من المدن الرئيسية في المغرب، وتوفر سوق عقارات ديناميكي مع فرص متنوعة لشراء وتأجير العقارات.` })] })] }) }), _jsx(Footer, {}), _jsx(MobileFAB, {})] })] }));
}
