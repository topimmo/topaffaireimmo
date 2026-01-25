import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Phone, Home, Loader2, Users, } from 'lucide-react';
export default function Agencies() {
    const { t, language, isRTL } = useLanguage();
    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchAgencies();
    }, []);
    const fetchAgencies = async () => {
        setLoading(true);
        // Fetch agencies with their listing counts
        const { data: agencyData, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone, agency_name, agency_logo, agency_description_fr, agency_description_ar, agency_cities')
            .eq('user_type', 'agency');
        if (agencyData && !error) {
            // Get listing counts for each agency
            const agenciesWithCounts = await Promise.all(agencyData.map(async (agency) => {
                const { count } = await supabase
                    .from('properties')
                    .select('*', { count: 'exact', head: true })
                    .eq('owner_id', agency.id)
                    .eq('status', 'approved');
                return {
                    ...agency,
                    listing_count: count || 0,
                };
            }));
            setAgencies(agenciesWithCounts);
        }
        setLoading(false);
    };
    const getAgencyDescription = (agency) => {
        if (language === 'ar')
            return agency.agency_description_ar;
        return agency.agency_description_fr;
    };
    return (_jsxs("div", { className: `min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`, children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 pt-24 pb-16", children: _jsxs("div", { className: "container", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h1", { className: "font-display text-3xl md:text-4xl font-semibold text-foreground mb-4", children: t('nav.agencies') }), _jsx("p", { className: "text-muted-foreground max-w-2xl mx-auto", children: isRTL
                                        ? 'اكتشف الوكالات العقارية الموثوقة في المغرب. تصفح قوائمهم وتواصل معهم مباشرة.'
                                        : 'Découvrez les agences immobilières de confiance au Maroc. Parcourez leurs annonces et contactez-les directement.' })] }), loading && (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx(Loader2, { className: "h-10 w-10 animate-spin text-primary" }) })), !loading && agencies.length === 0 && (_jsxs("div", { className: "bg-white rounded-2xl border p-12 text-center", children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4", children: _jsx(Users, { className: "h-8 w-8 text-muted-foreground" }) }), _jsx("h2", { className: "font-display text-xl font-semibold text-foreground mb-2", children: isRTL ? 'لا توجد وكالات مسجلة حتى الآن' : 'Aucune agence enregistrée pour le moment' }), _jsx("p", { className: "text-muted-foreground", children: isRTL
                                        ? 'كن أول وكالة تنضم إلى منصتنا!'
                                        : 'Soyez la première agence à rejoindre notre plateforme!' })] })), !loading && agencies.length > 0 && (_jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6", children: agencies.map((agency) => (_jsxs("div", { className: "bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow", children: [_jsx("div", { className: "aspect-[3/1] bg-gradient-to-br from-primary/10 to-secondary/10 relative flex items-center justify-center", children: agency.agency_logo ? (_jsx("img", { src: agency.agency_logo, alt: agency.agency_name || agency.full_name || '', className: "w-full h-full object-cover" })) : (_jsx(Building2, { className: "h-16 w-16 text-primary/40" })) }), _jsxs("div", { className: "p-5", children: [_jsx("h3", { className: "font-display text-xl font-semibold text-foreground mb-2", children: agency.agency_name || agency.full_name || agency.email }), getAgencyDescription(agency) && (_jsx("p", { className: "text-sm text-muted-foreground mb-4 line-clamp-2", children: getAgencyDescription(agency) })), agency.agency_cities && agency.agency_cities.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-2 mb-4", children: agency.agency_cities.map((city, index) => (_jsxs(Badge, { variant: "outline", className: "text-xs", children: [_jsx(MapPin, { className: "h-3 w-3 mr-1" }), city] }, index))) })), _jsx("div", { className: "flex items-center gap-4 text-sm text-muted-foreground mb-4", children: _jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Home, { className: "h-4 w-4" }), _jsx("strong", { className: "text-foreground", children: agency.listing_count }), isRTL ? 'إعلان' : 'annonces'] }) }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { asChild: true, className: "flex-1", children: _jsx(Link, { to: `/search?owner=${agency.id}`, children: isRTL ? 'عرض الإعلانات' : 'Voir les annonces' }) }), agency.phone && (_jsx(Button, { variant: "outline", size: "icon", asChild: true, children: _jsx("a", { href: `tel:${agency.phone}`, children: _jsx(Phone, { className: "h-4 w-4" }) }) }))] })] })] }, agency.id))) }))] }) }), _jsx(Footer, {})] }));
}
