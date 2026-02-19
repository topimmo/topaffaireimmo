import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { City, Neighborhood, PropertyType, SiteSetting } from '@/types/supabase';

export function useCities() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCities = async () => {
      const { data, error: fetchError } = await supabase
        .from('cities')
        .select('id,name_fr,name_ar')
        .order('name_fr', { ascending: true });

      if (fetchError) {
        console.error('Error fetching cities:', fetchError);
        toast.error('Impossible de charger la liste des villes');
        setError(fetchError.message);
        setCities([]);
      } else {
        setCities((data as City[]) || []);
        setError(null);
      }
      setLoading(false);
    };

    fetchCities();
  }, []);

  return { cities, loading, error };
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
      const { data, error } = await supabase
        .from('neighborhoods')
        .select('*')
        .eq('city_id', cityId)
        .order('name_fr');

      if (error) {
        console.error('Error fetching neighborhoods:', error);
        // Handle errors gracefully - set empty array
        setNeighborhoods([]);
      } else {
        setNeighborhoods(data || []);
      }
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
      const { data, error } = await supabase
        .from('property_types')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) {
        console.error('Error fetching property types:', error);
        // Handle errors gracefully - set empty array
        setPropertyTypes([]);
      } else {
        setPropertyTypes(data || []);
      }
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
        .select('key, value')
        .eq('is_public', true);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching site settings:', error);
        // Handle errors gracefully - set empty object
        setSettings({});
      } else {
        const settingsMap: Record<string, unknown> = {};
        data?.forEach((setting: Pick<SiteSetting, 'key' | 'value'>) => {
          try {
            // If value is already parsed JSON, use it directly
            settingsMap[setting.key] = typeof setting.value === 'string' 
              ? JSON.parse(setting.value) 
              : setting.value;
          } catch {
            settingsMap[setting.key] = setting.value;
          }
        });

        setSettings(settingsMap);
      }
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
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          // PGRST116 = no rows returned
          console.error(`Error fetching setting '${key}':`, error);
        }
        setValue(null);
      } else if (data) {
        try {
          // If value is already parsed JSON, use it directly
          setValue(typeof data.value === 'string' ? JSON.parse(data.value) : data.value);
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
