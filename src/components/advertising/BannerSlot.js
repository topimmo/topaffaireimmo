import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
export default function BannerSlot({ page, position, className = '', adSenseFallback }) {
    const [activeBanner, setActiveBanner] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetchActiveBanner();
    }, [page, position]);
    const fetchActiveBanner = async () => {
        setLoading(true);
        const now = new Date().toISOString();
        const { data } = await supabase
            .from('banner_requests')
            .select(`
        id,
        banner_image_url,
        target_url,
        company_name,
        slot:banner_slots!inner(page, position)
      `)
            .eq('status', 'active')
            .eq('slot.page', page)
            .eq('slot.position', position)
            .lte('start_date', now)
            .gte('end_date', now)
            .limit(1)
            .single();
        if (data) {
            setActiveBanner(data);
        }
        else {
            setActiveBanner(null);
        }
        setLoading(false);
    };
    if (loading) {
        return null;
    }
    // If there's an active direct banner, show it
    if (activeBanner) {
        return (_jsx("div", { className: `banner-slot ${className}`, children: _jsx("a", { href: activeBanner.target_url, target: "_blank", rel: "noopener noreferrer sponsored", className: "block", children: _jsx("img", { src: activeBanner.banner_image_url, alt: activeBanner.company_name, className: "w-full h-auto rounded-lg" }) }) }));
    }
    // Fallback to AdSense if provided
    if (adSenseFallback) {
        return _jsx("div", { className: `banner-slot ${className}`, children: adSenseFallback });
    }
    return null;
}
