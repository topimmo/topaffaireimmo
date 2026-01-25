import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AdBanner from "@/components/home/AdBanner";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage, } from "@/components/ui/breadcrumb";
import { MapPin, Bed, Bath, Square, Phone, MessageCircle, Heart, Share2, ChevronLeft, ChevronRight, Calendar, User, Building2, } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOROCCO_CITIES, slugify } from "@/lib/seo";
// Mock property data
const propertyData = {
    id: "1",
    title: "Luxury Penthouse with Ocean View",
    description: `This stunning penthouse offers panoramic views of the Atlantic Ocean and the Casablanca skyline. 
  
  Located in the prestigious Corniche district, this property features modern architecture with premium finishes throughout. The open-plan living area flows seamlessly onto a spacious terrace, perfect for entertaining or simply enjoying the coastal breeze.
  
  Key Features:
  • Floor-to-ceiling windows throughout
  • Italian marble flooring
  • State-of-the-art kitchen with premium appliances
  • Master suite with walk-in closet and spa bathroom
  • Private rooftop terrace with infinity pool
  • Two secure parking spaces
  • 24/7 concierge service`,
    price: 4500000,
    priceType: "sale",
    type: "Apartment",
    city: "Casablanca",
    neighborhood: "Aïn Diab",
    address: "Corniche Ain Diab, Boulevard de la Corniche",
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    yearBuilt: 2022,
    featured: true,
    images: [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
    ],
    agent: {
        name: "Sarah El Mansouri",
        company: "Premium Real Estate",
        phone: "+212 6XX XX XX XX",
        type: "agency",
    },
};
export default function PropertyDetails() {
    const { id } = useParams();
    const [currentImage, setCurrentImage] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    // In production, fetch property by id
    const property = propertyData;
    const formatPrice = (price) => {
        return new Intl.NumberFormat("fr-MA", {
            style: "decimal",
            maximumFractionDigits: 0,
        }).format(price);
    };
    const nextImage = () => {
        setCurrentImage((prev) => (prev + 1) % property.images.length);
    };
    const prevImage = () => {
        setCurrentImage((prev) => prev === 0 ? property.images.length - 1 : prev - 1);
    };
    // Generate SEO metadata
    const seoTitle = `${property.title} - ${property.neighborhood ? property.neighborhood + ', ' : ''}${property.city} | TopAffaireImmo`;
    const seoDescription = `${property.type} ${property.priceType === 'sale' ? 'à vendre' : 'à louer'} à ${property.neighborhood ? property.neighborhood + ', ' : ''}${property.city}. ${property.bedrooms} chambres, ${property.area}m². Prix: ${formatPrice(property.price)} MAD.`;
    // Price validity period in days
    const PRICE_VALIDITY_DAYS = 90;
    const priceValidUntil = new Date(Date.now() + PRICE_VALIDITY_DAYS * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    // Get proper city slug for URLs
    const cityData = MOROCCO_CITIES.find(c => c.name_fr.toLowerCase() === property.city.toLowerCase());
    const citySlug = cityData?.slug || slugify(property.city);
    const neighborhoodSlug = property.neighborhood ? slugify(property.neighborhood) : '';
    // Enhanced structured data for property with comprehensive schemas
    const structuredData = [
        {
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            "@id": `https://topaffaireimmo.vercel.app/property/${property.id}`,
            "name": property.title,
            "description": property.description,
            "url": `https://topaffaireimmo.vercel.app/property/${property.id}`,
            "offers": {
                "@type": "Offer",
                "price": property.price,
                "priceCurrency": "MAD",
                "availability": "https://schema.org/InStock",
                "priceValidUntil": priceValidUntil,
                "seller": {
                    "@type": property.agent.type === "agency" ? "RealEstateAgent" : "Person",
                    "name": property.agent.name,
                    "telephone": property.agent.phone
                }
            },
            "address": {
                "@type": "PostalAddress",
                "streetAddress": property.address,
                "addressLocality": property.neighborhood || property.city,
                "addressRegion": property.city,
                "addressCountry": "MA"
            },
            "geo": {
                "@type": "Place",
                "name": property.neighborhood ? `${property.neighborhood}, ${property.city}` : property.city,
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": property.city,
                    "addressCountry": "MA"
                }
            },
            "numberOfRooms": property.bedrooms,
            "numberOfBathroomsTotal": property.bathrooms,
            "floorSize": {
                "@type": "QuantitativeValue",
                "value": property.area,
                "unitCode": "MTK",
                "unitText": "m²"
            },
            "datePosted": new Date().toISOString(),
            "image": property.images.map((img, index) => ({
                "@type": "ImageObject",
                "url": img,
                "name": `${property.title} - Image ${index + 1}`
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
                    "name": property.city,
                    "item": `https://topaffaireimmo.vercel.app/immobilier/${citySlug}`
                },
                ...(property.neighborhood && neighborhoodSlug ? [{
                        "@type": "ListItem",
                        "position": 3,
                        "name": property.neighborhood,
                        "item": `https://topaffaireimmo.vercel.app/immobilier/${citySlug}/${neighborhoodSlug}`
                    }] : []),
                {
                    "@type": "ListItem",
                    "position": property.neighborhood ? 4 : 3,
                    "name": property.title
                }
            ]
        }
    ];
    return (_jsxs(_Fragment, { children: [_jsx(SEO, { title: seoTitle, description: seoDescription, ogImage: property.images[0], ogType: "product", structuredData: structuredData, canonical: `/property/${property.id}` }), _jsxs("div", { className: "min-h-screen flex flex-col bg-background", children: [_jsx(Header, {}), _jsxs("main", { className: "flex-1 pt-20", children: [_jsx("section", { className: "container pt-6 pb-4", children: _jsx(Breadcrumb, { children: _jsxs(BreadcrumbList, { children: [_jsx(BreadcrumbItem, { children: _jsx(BreadcrumbLink, { href: "/", children: "Accueil" }) }), _jsx(BreadcrumbSeparator, { children: _jsx(ChevronRight, { className: "h-4 w-4" }) }), _jsx(BreadcrumbItem, { children: _jsx(BreadcrumbLink, { href: "/search", children: "Immobilier" }) }), _jsx(BreadcrumbSeparator, { children: _jsx(ChevronRight, { className: "h-4 w-4" }) }), _jsx(BreadcrumbItem, { children: _jsx(BreadcrumbLink, { href: `/immobilier/${citySlug}`, children: property.city }) }), property.neighborhood && neighborhoodSlug && (_jsxs(_Fragment, { children: [_jsx(BreadcrumbSeparator, { children: _jsx(ChevronRight, { className: "h-4 w-4" }) }), _jsx(BreadcrumbItem, { children: _jsx(BreadcrumbLink, { href: `/immobilier/${citySlug}/${neighborhoodSlug}`, children: property.neighborhood }) })] })), _jsx(BreadcrumbSeparator, { children: _jsx(ChevronRight, { className: "h-4 w-4" }) }), _jsx(BreadcrumbItem, { children: _jsx(BreadcrumbPage, { children: property.title }) })] }) }) }), _jsx("section", { className: "relative bg-foreground", children: _jsxs("div", { className: "relative h-[50vh] md:h-[70vh] overflow-hidden", children: [_jsx("img", { src: property.images[currentImage], alt: property.title, className: "w-full h-full object-cover" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" }), _jsx("button", { onClick: prevImage, className: "absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 hover:bg-white transition-colors shadow-lg", children: _jsx(ChevronLeft, { className: "h-6 w-6" }) }), _jsx("button", { onClick: nextImage, className: "absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 hover:bg-white transition-colors shadow-lg", children: _jsx(ChevronRight, { className: "h-6 w-6" }) }), _jsx("div", { className: "absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2", children: property.images.map((_, index) => (_jsx("button", { onClick: () => setCurrentImage(index), className: cn("w-16 h-12 rounded-lg overflow-hidden border-2 transition-all", currentImage === index
                                                    ? "border-white scale-110"
                                                    : "border-transparent opacity-70 hover:opacity-100"), children: _jsx("img", { src: property.images[index], alt: `Thumbnail ${index + 1}`, className: "w-full h-full object-cover" }) }, index))) }), _jsxs("div", { className: "absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/60 text-white text-sm", children: [currentImage + 1, " / ", property.images.length] })] }) }), _jsx("section", { className: "container py-8 md:py-12", children: _jsxs("div", { className: "grid lg:grid-cols-3 gap-8", children: [_jsxs("div", { className: "lg:col-span-2 space-y-8", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex flex-wrap gap-2 mb-4", children: [property.featured && (_jsx(Badge, { className: "bg-secondary text-secondary-foreground", children: "Featured" })), _jsx(Badge, { variant: "outline", children: property.type }), _jsx(Badge, { variant: "outline", children: property.priceType === "sale" ? "For Sale" : "For Rent" })] }), _jsx("h1", { className: "font-display text-3xl md:text-4xl font-semibold text-foreground mb-4", children: property.title }), _jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [_jsx(MapPin, { className: "h-5 w-5" }), _jsxs("p", { className: "text-lg", children: [property.neighborhood && (_jsxs(_Fragment, { children: [_jsx("span", { className: "font-semibold text-foreground", children: property.neighborhood }), _jsx("span", { className: "mx-2", children: "\u2022" })] })), property.city] })] })] }), _jsx("div", { className: "bg-white rounded-xl border p-6", children: _jsxs("p", { className: "font-mono-price text-3xl md:text-4xl font-semibold text-primary", children: [formatPrice(property.price), " ", _jsx("span", { className: "text-lg font-normal text-muted-foreground", children: "MAD" }), property.priceType === "rent" && (_jsx("span", { className: "text-lg font-normal text-muted-foreground", children: "/month" }))] }) }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-4", children: "Property Features" }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-6", children: [property.bedrooms && (_jsxs("div", { className: "text-center p-4 bg-muted/50 rounded-lg", children: [_jsx(Bed, { className: "h-6 w-6 mx-auto text-primary mb-2" }), _jsx("p", { className: "font-semibold", children: property.bedrooms }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Bedrooms" })] })), property.bathrooms && (_jsxs("div", { className: "text-center p-4 bg-muted/50 rounded-lg", children: [_jsx(Bath, { className: "h-6 w-6 mx-auto text-primary mb-2" }), _jsx("p", { className: "font-semibold", children: property.bathrooms }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Bathrooms" })] })), _jsxs("div", { className: "text-center p-4 bg-muted/50 rounded-lg", children: [_jsx(Square, { className: "h-6 w-6 mx-auto text-primary mb-2" }), _jsxs("p", { className: "font-semibold", children: [property.area, " m\u00B2"] }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Living Area" })] }), property.yearBuilt && (_jsxs("div", { className: "text-center p-4 bg-muted/50 rounded-lg", children: [_jsx(Calendar, { className: "h-6 w-6 mx-auto text-primary mb-2" }), _jsx("p", { className: "font-semibold", children: property.yearBuilt }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Year Built" })] }))] })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6", children: [_jsx("h2", { className: "font-display text-xl font-semibold mb-4", children: "Description" }), _jsx("div", { className: "prose prose-neutral max-w-none", children: property.description.split("\n").map((paragraph, index) => (_jsx("p", { className: "text-muted-foreground", children: paragraph }, index))) })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "icon", className: "h-12 w-12", onClick: () => setIsFavorite(!isFavorite), children: _jsx(Heart, { className: cn("h-5 w-5", isFavorite && "fill-primary text-primary") }) }), _jsx(Button, { variant: "outline", size: "icon", className: "h-12 w-12", children: _jsx(Share2, { className: "h-5 w-5" }) })] }), _jsxs("div", { className: "bg-white rounded-xl border p-6 sticky top-24", children: [_jsx("h3", { className: "font-display text-lg font-semibold mb-4", children: "Contact Agent" }), _jsxs("div", { className: "flex items-center gap-4 mb-6", children: [_jsx("div", { className: "w-14 h-14 rounded-full bg-muted flex items-center justify-center", children: _jsx(User, { className: "h-6 w-6 text-muted-foreground" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-semibold", children: property.agent.name }), _jsxs("div", { className: "flex items-center gap-1.5 text-sm text-muted-foreground", children: [_jsx(Building2, { className: "h-4 w-4" }), property.agent.company] }), _jsx("div", { className: "mt-1", children: _jsx(Badge, { variant: "secondary", className: "text-xs", children: property.agent.type === 'owner' ? 'Propriétaire' :
                                                                                    property.agent.type === 'broker' ? 'Courtier' :
                                                                                        'Agence' }) })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs(Button, { className: "w-full gap-2", size: "lg", children: [_jsx(Phone, { className: "h-5 w-5" }), "Call Now"] }), _jsxs(Button, { variant: "outline", className: "w-full gap-2 text-green-600 border-green-600 hover:bg-green-50", size: "lg", children: [_jsx(MessageCircle, { className: "h-5 w-5" }), "WhatsApp"] })] }), _jsx("p", { className: "text-xs text-muted-foreground text-center mt-4", children: "Available 9AM - 7PM, Mon - Sat" })] })] })] }) }), _jsx(AdBanner, { page: "property", position: "before_footer", className: "bg-muted/30" })] }), _jsx(Footer, {})] })] }));
}
