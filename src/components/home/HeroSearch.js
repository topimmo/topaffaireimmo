import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Search, MapPin, Home, Building, Landmark, Trees } from "lucide-react";
const propertyTypes = [
    { value: "apartment", icon: Building },
    { value: "house", icon: Home },
    { value: "villa", icon: Landmark },
    { value: "commercial", icon: Building },
    { value: "land", icon: Trees },
];
export default function HeroSearch() {
    const { t, language, isRTL } = useLanguage();
    const navigate = useNavigate();
    const [cities, setCities] = useState([]);
    const [city, setCity] = useState("");
    const [propertyType, setPropertyType] = useState("");
    const [transactionType, setTransactionType] = useState("sale");
    const [maxPrice, setMaxPrice] = useState("");
    useEffect(() => {
        const fetchCities = async () => {
            // Use fallback cities if Supabase is not configured
            if (!isSupabaseConfigured) {
                setCities([
                    { id: 1, name_fr: 'Casablanca', name_ar: 'الدار البيضاء' },
                    { id: 2, name_fr: 'Rabat', name_ar: 'الرباط' },
                    { id: 3, name_fr: 'Marrakech', name_ar: 'مراكش' },
                    { id: 4, name_fr: 'Tanger', name_ar: 'طنجة' },
                    { id: 5, name_fr: 'Fès', name_ar: 'فاس' },
                    { id: 6, name_fr: 'Agadir', name_ar: 'أكادير' },
                    { id: 7, name_fr: 'Meknès', name_ar: 'مكناس' },
                    { id: 8, name_fr: 'Oujda', name_ar: 'وجدة' },
                    { id: 9, name_fr: 'Kénitra', name_ar: 'القنيطرة' },
                    { id: 10, name_fr: 'Tétouan', name_ar: 'تطوان' },
                    { id: 11, name_fr: 'El Jadida', name_ar: 'الجديدة' },
                    { id: 12, name_fr: 'Safi', name_ar: 'آسفي' },
                    { id: 13, name_fr: 'Mohammedia', name_ar: 'المحمدية' },
                    { id: 14, name_fr: 'Laâyoune', name_ar: 'العيون' },
                    { id: 15, name_fr: 'Dakhla', name_ar: 'الداخلة' },
                ]);
                return;
            }
            try {
                const { data, error } = await supabase
                    .from('cities')
                    .select('id, name_fr, name_ar, is_active')
                    .eq('is_active', true)
                    .order('display_order');
                if (error) {
                    console.error('Error fetching cities:', error);
                    // Use fallback cities on error
                    setCities([
                        { id: 1, name_fr: 'Casablanca', name_ar: 'الدار البيضاء' },
                        { id: 2, name_fr: 'Rabat', name_ar: 'الرباط' },
                        { id: 3, name_fr: 'Marrakech', name_ar: 'مراكش' },
                        { id: 4, name_fr: 'Tanger', name_ar: 'طنجة' },
                        { id: 5, name_fr: 'Fès', name_ar: 'فاس' },
                        { id: 6, name_fr: 'Agadir', name_ar: 'أكادير' },
                    ]);
                    return;
                }
                if (data && data.length > 0) {
                    setCities(data);
                }
                else {
                    // Fallback if no cities returned
                    setCities([
                        { id: 1, name_fr: 'Casablanca', name_ar: 'الدار البيضاء' },
                        { id: 2, name_fr: 'Rabat', name_ar: 'الرباط' },
                        { id: 3, name_fr: 'Marrakech', name_ar: 'مراكش' },
                    ]);
                }
            }
            catch (err) {
                console.error('Exception fetching cities:', err);
                // Use fallback cities on exception
                setCities([
                    { id: 1, name_fr: 'Casablanca', name_ar: 'الدار البيضاء' },
                    { id: 2, name_fr: 'Rabat', name_ar: 'الرباط' },
                    { id: 3, name_fr: 'Marrakech', name_ar: 'مراكش' },
                ]);
            }
        };
        fetchCities();
    }, []);
    const getCityName = (c) => {
        if (language === 'ar')
            return c.name_ar;
        return c.name_fr;
    };
    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (city)
            params.set("city", city);
        if (propertyType)
            params.set("type", propertyType);
        if (transactionType)
            params.set("transaction", transactionType);
        if (maxPrice)
            params.set("maxPrice", maxPrice);
        navigate(`/search?${params.toString()}`);
    };
    return (_jsxs("section", { className: `relative min-h-[85vh] flex items-center justify-center overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsxs("div", { className: "absolute inset-0 z-0", children: [_jsx("img", { src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80", alt: "Beautiful modern home", className: "w-full h-full object-cover" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-foreground/60 via-foreground/40 to-foreground/80" })] }), _jsxs("div", { className: "container relative z-10 pt-20 pb-16 md:pt-24 md:pb-20", children: [_jsxs("div", { className: "max-w-4xl mx-auto text-center mb-10 md:mb-14", children: [_jsxs("h1", { className: "font-display text-4xl md:text-5xl lg:text-6xl font-light text-white mb-6 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700", children: [t('hero.title'), " ", _jsx("span", { className: "font-semibold text-primary", children: t('hero.titleHighlight') })] }), _jsx("p", { className: "text-lg md:text-xl text-white/80 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150", children: t('hero.subtitle') })] }), _jsxs("form", { onSubmit: handleSearch, className: "bg-white/95 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300", children: [_jsxs("div", { className: "flex gap-2 mb-6", children: [_jsx("button", { type: "button", onClick: () => setTransactionType("sale"), className: `px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${transactionType === "sale"
                                            ? "bg-primary text-white shadow-md scale-105"
                                            : "bg-muted text-foreground/70 hover:bg-muted/80"}`, children: t('hero.forSale') }), _jsx("button", { type: "button", onClick: () => setTransactionType("rent"), className: `px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${transactionType === "rent"
                                            ? "bg-primary text-white shadow-md scale-105"
                                            : "bg-muted text-foreground/70 hover:bg-muted/80"}`, children: t('hero.forRent') })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx(MapPin, { className: `absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10` }), _jsxs(Select, { value: city, onValueChange: setCity, children: [_jsx(SelectTrigger, { className: `${isRTL ? 'pr-10' : 'pl-10'} h-12 bg-background border-muted focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`, children: _jsx(SelectValue, { placeholder: t('hero.selectCity') }) }), _jsx(SelectContent, { children: cities.map((c) => (_jsx(SelectItem, { value: c.id.toString(), children: getCityName(c) }, c.id))) })] })] }), _jsxs("div", { className: "relative", children: [_jsx(Home, { className: `absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10` }), _jsxs(Select, { value: propertyType, onValueChange: setPropertyType, children: [_jsx(SelectTrigger, { className: `${isRTL ? 'pr-10' : 'pl-10'} h-12 bg-background border-muted focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all`, children: _jsx(SelectValue, { placeholder: t('hero.propertyType') }) }), _jsx(SelectContent, { children: propertyTypes.map((type) => (_jsx(SelectItem, { value: type.value, children: _jsxs("span", { className: "flex items-center gap-2", children: [_jsx(type.icon, { className: "h-4 w-4" }), t(`property.${type.value}`)] }) }, type.value))) })] })] }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: `absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-muted-foreground font-mono-price text-sm`, children: "MAD" }), _jsx(Input, { type: "number", placeholder: t('hero.maxPrice'), value: maxPrice, onChange: (e) => setMaxPrice(e.target.value), className: `${isRTL ? 'pr-12' : 'pl-12'} h-12 bg-background border-muted focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all` })] }), _jsxs(Button, { type: "submit", size: "lg", className: "h-12 text-base font-medium shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]", children: [_jsx(Search, { className: `h-5 w-5 ${isRTL ? 'ml-2' : 'mr-2'}` }), t('hero.search')] })] })] }), _jsxs("div", { className: "flex flex-wrap justify-center gap-8 md:gap-12 mt-10 md:mt-14 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "font-display text-3xl md:text-4xl font-semibold text-white", children: "5,000+" }), _jsx("p", { className: "text-white/60 text-sm mt-1", children: isRTL ? 'عقارات مدرجة' : 'Propriétés listées' })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "font-display text-3xl md:text-4xl font-semibold text-white", children: "200+" }), _jsx("p", { className: "text-white/60 text-sm mt-1", children: isRTL ? 'وكالات شريكة' : 'Agences partenaires' })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "font-display text-3xl md:text-4xl font-semibold text-white", children: "50+" }), _jsx("p", { className: "text-white/60 text-sm mt-1", children: isRTL ? 'مدن مغطاة' : 'Villes couvertes' })] })] })] })] }));
}
