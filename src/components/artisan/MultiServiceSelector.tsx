import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceCategory {
  id: string;
  name_fr: string;
  name_ar: string;
  slug: string;
}

interface ServiceSubcategory {
  id: string;
  category_id: string;
  name_fr: string;
  name_ar: string;
  slug: string;
}

interface SelectedService {
  category_id: string;
  subcategory_id: string;
  city: string;
}

interface MultiServiceSelectorProps {
  userId: string;
  currentCity: string;
  onServicesChange?: (services: SelectedService[]) => void;
  maxServices?: number;
  className?: string;
}

export default function MultiServiceSelector({
  userId,
  currentCity,
  onServicesChange,
  maxServices = 5,
  className,
}: MultiServiceSelectorProps) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [subcategories, setSubcategories] = useState<ServiceSubcategory[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories and subcategories
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch service categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('service_categories')
          .select('id, name_fr, name_ar, slug')
          .eq('is_active', true)
          .order('name_fr');

        if (categoriesError) throw categoriesError;

        // Fetch service subcategories
        const { data: subcategoriesData, error: subcategoriesError } = await supabase
          .from('service_subcategories')
          .select('id, category_id, name_fr, name_ar, slug')
          .eq('is_active', true)
          .order('name_fr');

        if (subcategoriesError) throw subcategoriesError;

        setCategories(categoriesData || []);
        setSubcategories(subcategoriesData || []);

        // Fetch user's existing services
        const { data: existingServices, error: servicesError } = await supabase
          .from('artisan_services')
          .select('category_id, subcategory_id, city')
          .eq('artisan_id', userId)
          .eq('is_active', true);

        if (servicesError) throw servicesError;

        if (existingServices && existingServices.length > 0) {
          setSelectedServices(existingServices.map(s => ({
            category_id: s.category_id,
            subcategory_id: s.subcategory_id || '',
            city: s.city,
          })));
        }
      } catch (err) {
        console.error('Error fetching services:', err);
        setError(err instanceof Error ? err.message : 'Failed to load services');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Notify parent of changes
  useEffect(() => {
    if (onServicesChange) {
      onServicesChange(selectedServices);
    }
  }, [selectedServices, onServicesChange]);

  const handleToggleSubcategory = (subcategoryId: string, categoryId: string) => {
    const serviceKey = `${categoryId}-${subcategoryId}`;
    const existingIndex = selectedServices.findIndex(
      s => s.category_id === categoryId && s.subcategory_id === subcategoryId
    );

    if (existingIndex >= 0) {
      // Remove service
      setSelectedServices(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      // Check if we've reached the max
      if (selectedServices.length >= maxServices) {
        setError(`Maximum ${maxServices} services allowed`);
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Add service
      setSelectedServices(prev => [
        ...prev,
        {
          category_id: categoryId,
          subcategory_id: subcategoryId,
          city: currentCity,
        },
      ]);
    }
  };

  const handleRemoveService = (index: number) => {
    setSelectedServices(prev => prev.filter((_, i) => i !== index));
  };

  const getSubcategoryName = (subcategoryId: string) => {
    const sub = subcategories.find(s => s.id === subcategoryId);
    return sub?.name_fr || 'Unknown';
  };

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name_fr || 'Unknown';
  };

  const isSelected = (subcategoryId: string, categoryId: string) => {
    return selectedServices.some(
      s => s.category_id === categoryId && s.subcategory_id === subcategoryId
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Selected Services Display */}
      {selectedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Selected Services ({selectedServices.length}/{maxServices})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedServices.map((service, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm"
                >
                  {getCategoryName(service.category_id)} - {getSubcategoryName(service.subcategory_id)}
                  <button
                    onClick={() => handleRemoveService(index)}
                    className="ml-2 hover:text-destructive"
                    aria-label="Remove service"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Services</CardTitle>
          <CardDescription>
            Choose up to {maxServices} services that you offer. Select subcategories within each category.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.map(category => {
            const categorySubcategories = subcategories.filter(
              sub => sub.category_id === category.id
            );

            if (categorySubcategories.length === 0) return null;

            return (
              <div key={category.id} className="space-y-3">
                <h3 className="font-medium text-sm">{category.name_fr}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categorySubcategories.map(subcategory => {
                    const selected = isSelected(subcategory.id, category.id);
                    
                    return (
                      <div
                        key={subcategory.id}
                        className={cn(
                          'flex items-center space-x-2 p-3 rounded-md border transition-colors',
                          selected
                            ? 'bg-primary/5 border-primary'
                            : 'hover:bg-muted/50'
                        )}
                      >
                        <Checkbox
                          id={subcategory.id}
                          checked={selected}
                          onCheckedChange={() =>
                            handleToggleSubcategory(subcategory.id, category.id)
                          }
                          disabled={
                            !selected && selectedServices.length >= maxServices
                          }
                        />
                        <Label
                          htmlFor={subcategory.id}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          {subcategory.name_fr}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Message */}
      {selectedServices.length === maxServices && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You've selected the maximum of {maxServices} services. Remove a service to add a different one.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
