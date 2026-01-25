import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
export function useCities() {
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchCities = async () => {
            const { data } = await supabase
                .from('cities')
                .select('*')
                .eq('is_active', true)
                .order('display_order');
            setCities(data || []);
            setLoading(false);
        };
        fetchCities();
    }, []);
    return { cities, loading };
}
export function useNeighborhoods(cityId) {
    const [neighborhoods, setNeighborhoods] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (!cityId) {
            setNeighborhoods([]);
            setLoading(false);
            return;
        }
        const fetchNeighborhoods = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('neighborhoods')
                .select('*')
                .eq('city_id', cityId)
                .order('name_fr');
            setNeighborhoods(data || []);
            setLoading(false);
        };
        fetchNeighborhoods();
    }, [cityId]);
    return { neighborhoods, loading };
}
export function usePropertyTypes() {
    const [propertyTypes, setPropertyTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchTypes = async () => {
            const { data } = await supabase
                .from('property_types')
                .select('*')
                .eq('is_active', true)
                .order('display_order');
            setPropertyTypes(data || []);
            setLoading(false);
        };
        fetchTypes();
    }, []);
    return { propertyTypes, loading };
}
export function useSiteSettings(category) {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchSettings = async () => {
            let query = supabase
                .from('site_settings')
                .select('*')
                .eq('is_public', true);
            if (category) {
                query = query.eq('category', category);
            }
            const { data } = await query;
            const settingsMap = {};
            data?.forEach((setting) => {
                try {
                    settingsMap[setting.key] = JSON.parse(setting.value);
                }
                catch {
                    settingsMap[setting.key] = setting.value;
                }
            });
            setSettings(settingsMap);
            setLoading(false);
        };
        fetchSettings();
    }, [category]);
    return { settings, loading };
}
export function useSiteSetting(key) {
    const [value, setValue] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchSetting = async () => {
            const { data } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', key)
                .single();
            if (data) {
                try {
                    setValue(JSON.parse(data.value));
                }
                catch {
                    setValue(data.value);
                }
            }
            setLoading(false);
        };
        fetchSetting();
    }, [key]);
    return { value, loading };
}
// Combined hook for all reference data (useful for forms)
export function useAllReferenceData() {
    const { cities, loading: citiesLoading } = useCities();
    const { propertyTypes, loading: typesLoading } = usePropertyTypes();
    return {
        cities,
        propertyTypes,
        loading: citiesLoading || typesLoading,
    };
}
// Helper functions for getting localized names
export function getCityName(city, language) {
    if (!city)
        return '';
    return language === 'ar' ? city.name_ar : city.name_fr;
}
export function getNeighborhoodName(neighborhood, language) {
    if (!neighborhood)
        return '';
    return language === 'ar' ? neighborhood.name_ar : neighborhood.name_fr;
}
export function getPropertyTypeName(propertyType, language) {
    if (!propertyType)
        return '';
    return language === 'ar' ? propertyType.name_ar : propertyType.name_fr;
}
