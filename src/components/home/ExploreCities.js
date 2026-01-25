import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
const cities = [
    {
        name: "Agadir",
        nameAr: "أكادير",
        slug: "agadir",
        image: "/cities/placeholder.jpg",
    },
    {
        name: "Casablanca",
        nameAr: "الدار البيضاء",
        slug: "casablanca",
        image: "/cities/placeholder.jpg",
    },
    {
        name: "Dar Bouazza",
        nameAr: "دار بوعزة",
        slug: "dar-bouazza",
        image: "/cities/placeholder.jpg",
    },
    {
        name: "Fès",
        nameAr: "فاس",
        slug: "fes",
        image: "/cities/placeholder.jpg",
    },
];
export default function ExploreCities() {
    const { isRTL } = useLanguage();
    return (_jsx("section", { className: `py-16 md:py-24 bg-background noise-texture ${isRTL ? 'rtl' : 'ltr'}`, children: _jsxs("div", { className: "container", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h2", { className: "font-display text-3xl md:text-4xl font-semibold mb-3", children: isRTL ? 'استكشف حسب المدينة' : 'Explore by City' }), _jsx("p", { className: "text-muted-foreground max-w-2xl mx-auto", children: isRTL
                                ? 'اكتشف العقارات في المدن الرئيسية بالمغرب'
                                : 'Découvrez les propriétés dans les principales villes du Maroc' })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: cities.map((city) => (_jsx(Link, { to: `/ville/${city.slug}`, className: "group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300", children: _jsxs("div", { className: "relative aspect-[4/3] overflow-hidden", children: [_jsx("img", { src: city.image, alt: isRTL ? city.nameAr : city.name, className: "w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" }), _jsx("div", { className: "absolute bottom-0 left-0 right-0 p-6", children: _jsx("h3", { className: "text-white font-display text-xl md:text-2xl font-semibold", children: isRTL ? city.nameAr : city.name }) })] }) }, city.slug))) })] }) }));
}
