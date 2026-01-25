import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Bed, Bath, Square, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
export default function PropertyCard({ property, className, size = "default", }) {
    const { t, language, isRTL } = useLanguage();
    const formatPrice = (price) => {
        return new Intl.NumberFormat("fr-MA", {
            style: "decimal",
            maximumFractionDigits: 0,
        }).format(price);
    };
    const displayTitle = language === 'ar' && property.titleAr ? property.titleAr : property.title;
    const displayCity = language === 'ar' && property.cityAr ? property.cityAr : property.city;
    const displayNeighborhood = language === 'ar' && property.neighborhoodAr ? property.neighborhoodAr : property.neighborhood;
    return (_jsxs(Link, { to: `/property/${property.id}`, className: cn("group block bg-white rounded-xl border border-muted overflow-hidden transition-all duration-300 hover:-translate-y-1", "shadow-[0_2px_4px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.06)]", "hover:shadow-[0_4px_8px_rgba(0,0,0,0.06),0_16px_32px_rgba(0,0,0,0.1)]", className), children: [_jsxs("div", { className: cn("relative overflow-hidden", size === "large" ? "aspect-[4/3]" : "aspect-[16/10]"), children: [_jsx("img", { src: property.image, alt: property.title, className: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" }), _jsxs("div", { className: `absolute top-3 ${isRTL ? 'right-3' : 'left-3'} flex gap-2`, children: [property.featured && (_jsx(Badge, { className: "bg-secondary text-secondary-foreground font-medium", children: isRTL ? 'مميز' : 'À la une' })), _jsx(Badge, { variant: "outline", className: "bg-white/90 backdrop-blur-sm text-foreground border-0", children: property.type })] }), _jsx("button", { onClick: (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }, className: `absolute top-3 ${isRTL ? 'left-3' : 'right-3'} p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors group/fav`, children: _jsx(Heart, { className: "h-4 w-4 text-foreground/70 group-hover/fav:text-primary transition-colors" }) }), _jsx("div", { className: `absolute bottom-3 ${isRTL ? 'right-3' : 'left-3'}`, children: _jsxs("p", { className: "font-mono-price text-xl md:text-2xl font-semibold text-white drop-shadow-lg", children: [formatPrice(property.price), " ", _jsx("span", { className: "text-sm font-normal", children: "MAD" }), property.priceType === "rent" && (_jsx("span", { className: "text-sm font-normal", children: t('property.perMonth') }))] }) })] }), _jsxs("div", { className: "p-4 md:p-5", children: [_jsx("h3", { className: cn("font-display font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors", size === "large" ? "text-xl" : "text-lg"), children: displayTitle }), _jsxs("div", { className: "flex items-center gap-1.5 mt-2 text-muted-foreground", children: [_jsx(MapPin, { className: "h-4 w-4 flex-shrink-0" }), _jsxs("p", { className: "text-sm line-clamp-1", children: [displayNeighborhood && (_jsxs(_Fragment, { children: [_jsx("span", { className: "font-medium text-foreground", children: displayNeighborhood }), _jsx("span", { className: "mx-1.5", children: "\u2022" })] })), displayCity] })] }), _jsxs("div", { className: "flex items-center gap-4 mt-4 pt-4 border-t border-muted", children: [property.bedrooms !== undefined && (_jsxs("div", { className: "flex items-center gap-1.5 text-sm text-muted-foreground", children: [_jsx(Bed, { className: "h-4 w-4" }), _jsx("span", { children: property.bedrooms })] })), property.bathrooms !== undefined && (_jsxs("div", { className: "flex items-center gap-1.5 text-sm text-muted-foreground", children: [_jsx(Bath, { className: "h-4 w-4" }), _jsx("span", { children: property.bathrooms })] })), _jsxs("div", { className: "flex items-center gap-1.5 text-sm text-muted-foreground", children: [_jsx(Square, { className: "h-4 w-4" }), _jsxs("span", { children: [property.area, " m\u00B2"] })] })] })] })] }));
}
