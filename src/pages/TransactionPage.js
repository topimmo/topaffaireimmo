import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useParams, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import SEO from '../components/SEO';
import { TRANSACTION_TYPES, PROPERTY_TYPES, MOROCCO_CITIES, getCanonicalUrl } from '../lib/seo';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MobileFAB from '../components/layout/MobileFAB';
/**
 * SEO Landing Page for Real Estate Transactions
 * Handles URLs like:
 * - /acheter, /louer
 * - /acheter-appartement, /louer-villa
 * - /acheter-casablanca, /louer-rabat
 * - /acheter-appartement-casablanca
 */
export default function TransactionPage() {
    const params = useParams();
    const { language, t } = useLanguage();
    const [fullSlug, setFullSlug] = useState('');
    useEffect(() => {
        // Extract slug from current path (client-side only)
        if (typeof window !== 'undefined') {
            const pathParts = window.location.pathname.split('/').filter(Boolean);
            setFullSlug(pathParts[0] || '');
        }
    }, []);
    // Parse the slug to extract transaction, property type, city, neighborhood
    const parts = fullSlug.toLowerCase().split('-');
    // First part is always transaction type
    const transactionSlug = parts[0];
    const transaction = TRANSACTION_TYPES.find(t => t.slug === transactionSlug);
    if (!transaction) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    // Try to find property type
    let propertyType = null;
    let propertyTypeIndex = -1;
    if (parts.length > 1) {
        propertyType = PROPERTY_TYPES.find(p => p.slug === parts[1]);
        if (propertyType)
            propertyTypeIndex = 1;
    }
    // Try to find city
    let city = null;
    let cityIndex = -1;
    const citySearchIndex = propertyTypeIndex > 0 ? propertyTypeIndex + 1 : 1;
    if (parts.length > citySearchIndex) {
        city = MOROCCO_CITIES.find(c => c.slug === parts[citySearchIndex]);
        if (city)
            cityIndex = citySearchIndex;
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
    }
    else if (cityName) {
        title += ` ${cityName}`;
    }
    else {
        title += ` Maroc`;
    }
    title += ` | TopAffaireImmo`;
    const transactionVerb = transaction.id === 'sale' ? 'à vendre' : 'à louer';
    let description = `Découvrez les meilleures ${propertyTypeName.toLowerCase()} ${transactionVerb}`;
    if (neighborhood && cityName) {
        description += ` à ${neighborhood}, ${cityName}`;
    }
    else if (cityName) {
        description += ` à ${cityName}`;
    }
    else {
        description += ` au Maroc`;
    }
    description += `. Annonces vérifiées, photos HD, prix transparents et contact direct avec les propriétaires.`;
    // Enhanced structured data with BreadcrumbList
    const structuredData = [
        {
            "@context": "https://schema.org",
            "@type": "SearchResultsPage",
            "name": title,
            "description": description,
            "url": getCanonicalUrl(`/${fullSlug}`),
            "about": {
                "@type": "Offer",
                "priceCurrency": "MAD",
                "itemOffered": {
                    "@type": "RealEstateListing",
                    "name": propertyTypeName,
                    "category": propertyType?.name_fr || "Propriété"
                },
                "areaServed": city ? {
                    "@type": "City",
                    "name": city.name_fr,
                    "alternateName": city.name_ar,
                    "addressCountry": "MA"
                } : {
                    "@type": "Country",
                    "name": "Morocco",
                    "alternateName": "المغرب"
                }
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
                    "item": getCanonicalUrl("/")
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": transactionName,
                    "item": getCanonicalUrl(`/${transaction.slug}`)
                },
                ...(propertyType ? [{
                        "@type": "ListItem",
                        "position": 3,
                        "name": propertyTypeName,
                        "item": getCanonicalUrl(`/${transaction.slug}-${propertyType.slug}`)
                    }] : []),
                ...(city ? [{
                        "@type": "ListItem",
                        "position": propertyType ? 4 : 3,
                        "name": cityName,
                        "item": getCanonicalUrl(`/${fullSlug}`)
                    }] : [])
            ]
        }
    ];
    return (_jsxs(_Fragment, { children: [_jsx(SEO, { title: title, description: description, keywords: `${propertyTypeName} ${transactionVerb}, immobilier ${cityName || 'Maroc'}, ${transactionName}`, canonical: `/${fullSlug}`, structuredData: structuredData }), _jsxs("div", { className: "min-h-screen flex flex-col bg-background", children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 container mx-auto px-4 py-8", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "mb-8", children: [_jsxs("h1", { className: "text-3xl md:text-4xl font-bold mb-4", children: [propertyTypeName, " ", transactionName, neighborhood && cityName && ` - ${neighborhood}, ${cityName}`, !neighborhood && cityName && ` - ${cityName}`, !cityName && ` au Maroc`] }), _jsx("p", { className: "text-lg text-muted-foreground", children: language === 'fr'
                                                ? `Trouvez votre ${propertyTypeName.toLowerCase()} idéal ${transactionVerb}`
                                                : `ابحث عن ${propertyTypeName} المثالي` })] }), _jsx("div", { className: "bg-card border rounded-lg p-8 mb-8", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-semibold mb-4", children: language === 'fr' ? 'Page en préparation' : 'الصفحة قيد الإعداد' }), _jsx("p", { className: "text-muted-foreground mb-6", children: language === 'fr'
                                                    ? 'Cette page SEO est en cours de préparation pour le lancement officiel. Les annonces correspondantes seront bientôt disponibles.'
                                                    : 'هذه الصفحة قيد الإعداد للإطلاق الرسمي. ستتوفر الإعلانات المقابلة قريبًا.' }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsx("a", { href: "/search", className: "inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors", children: language === 'fr' ? 'Rechercher des propriétés' : 'البحث عن العقارات' }), _jsx("a", { href: "/add-listing", className: "inline-flex items-center justify-center px-6 py-3 border border-input rounded-lg hover:bg-accent transition-colors", children: language === 'fr' ? 'Publier une annonce' : 'نشر إعلان' })] })] }) }), _jsxs("div", { className: "prose prose-lg max-w-none", children: [_jsx("h2", { className: "text-2xl font-semibold mb-4", children: language === 'fr'
                                                ? `Pourquoi ${transactionName.toLowerCase()} avec TopAffaireImmo ?`
                                                : `لماذا ${transactionName} مع TopAffaireImmo؟` }), _jsxs("ul", { className: "list-disc list-inside space-y-2 text-muted-foreground", children: [_jsx("li", { children: language === 'fr'
                                                        ? 'Annonces vérifiées et de qualité'
                                                        : 'إعلانات موثوقة وذات جودة' }), _jsx("li", { children: language === 'fr'
                                                        ? 'Photos HD et visites virtuelles'
                                                        : 'صور عالية الدقة وجولات افتراضية' }), _jsx("li", { children: language === 'fr'
                                                        ? 'Contact direct avec les propriétaires'
                                                        : 'اتصال مباشر مع المالكين' }), _jsx("li", { children: language === 'fr'
                                                        ? 'Prix transparents sans frais cachés'
                                                        : 'أسعار شفافة بدون رسوم خفية' })] })] })] }) }), _jsx(Footer, {}), _jsx(MobileFAB, {})] })] }));
}
