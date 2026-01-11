import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { City, Neighborhood, PropertyType, SiteSetting } from '@/types/supabase';

export function useCities() {
  const [cities, setCities] = useState<City[]>([]);
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

export function useNeighborhoods(cityId?: number) {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
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
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
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

export function useSiteSettings(category?: string) {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
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

      const settingsMap: Record<string, unknown> = {};
      data?.forEach((setting: SiteSetting) => {
        try {
          settingsMap[setting.key] = JSON.parse(setting.value as string);
        } catch {
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

export function useSiteSetting(key: string) {
  const [value, setValue] = useState<unknown>(null);
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
          setValue(JSON.parse(data.value as string));
        } catch {
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
export function getCityName(city: City | undefined, language: 'fr' | 'ar'): string {
  if (!city) return '';
  return language === 'ar' ? city.name_ar : city.name_fr;
}

export function getNeighborhoodName(neighborhood: Neighborhood | undefined, language: 'fr' | 'ar'): string {
  if (!neighborhood) return '';
  return language === 'ar' ? neighborhood.name_ar : neighborhood.name_fr;
}

export function getPropertyTypeName(propertyType: PropertyType | undefined, language: 'fr' | 'ar'): string {
  if (!propertyType) return '';
  return language === 'ar' ? propertyType.name_ar : propertyType.name_fr;
}
