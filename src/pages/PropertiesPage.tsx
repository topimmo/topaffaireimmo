import { useState, Fragment, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PropertyCard } from '@/components/cards/PropertyCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SlidersHorizontal, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AdSlot } from '@/components/shared/AdSlot';
import { EmptyState } from '@/components/shared/EmptyState';
import { useProperties } from '@/hooks/useProperties';
import { useCities, usePropertyTypes } from '@/hooks/useReferenceData';
import type { PropertyFilters } from '@/hooks/useProperties';

function PropertyListingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-[#1B2F3C] rounded-lg p-4 space-y-3">
          <Skeleton className="h-48 w-full bg-[#2A3F4C]" />
          <Skeleton className="h-6 w-3/4 bg-[#2A3F4C]" />
          <Skeleton className="h-4 w-1/2 bg-[#2A3F4C]" />
        </div>
      ))}
    </div>
  );
}

interface FilterSidebarProps {
  filters: PropertyFilters;
  onFilterChange: (filters: PropertyFilters) => void;
  onReset: () => void;
}

function FilterSidebar({ filters, onFilterChange, onReset }: FilterSidebarProps) {
  const { cities } = useCities();
  const { propertyTypes } = usePropertyTypes();
  
  const [budget, setBudget] = useState([filters.min_price || 0, filters.max_price || 10000000]);
  const [surface, setSurface] = useState([filters.min_area || 0, filters.max_area || 500]);

  const handleApply = () => {
    onFilterChange({
      ...filters,
      min_price: budget[0] > 0 ? budget[0] : undefined,
      max_price: budget[1] < 10000000 ? budget[1] : undefined,
      min_area: surface[0] > 0 ? surface[0] : undefined,
      max_area: surface[1] < 500 ? surface[1] : undefined,
    });
  };

  const handleReset = () => {
    setBudget([0, 10000000]);
    setSurface([0, 500]);
    onReset();
  };

  return (
    <div className="space-y-6">
      {/* Transaction Type */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Type de transaction</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="sale"
              checked={filters.transaction_type === 'sale'}
              onCheckedChange={(checked) => {
                onFilterChange({
                  ...filters,
                  transaction_type: checked ? 'sale' : undefined,
                });
              }}
            />
            <label htmlFor="sale" className="text-sm text-gray-300 cursor-pointer">Vente</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rent"
              checked={filters.transaction_type === 'rent'}
              onCheckedChange={(checked) => {
                onFilterChange({
                  ...filters,
                  transaction_type: checked ? 'rent' : undefined,
                });
              }}
            />
            <label htmlFor="rent" className="text-sm text-gray-300 cursor-pointer">Location</label>
          </div>
        </div>
      </div>

      {/* Property Type */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Type de bien</Label>
        <Select
          value={filters.property_type || ''}
          onValueChange={(value) => {
            onFilterChange({
              ...filters,
              property_type: value || undefined,
            });
          }}
        >
          <SelectTrigger className="bg-[#1B2F3C] border-[#2A3F4C] text-white">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
            <SelectItem value="" className="text-white">Tous les types</SelectItem>
            {propertyTypes.map((type) => (
              <SelectItem key={type.id} value={type.code} className="text-white">
                {type.name_fr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Budget Range */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Budget (DH)</Label>
        <div className="space-y-4">
          <Slider
            value={budget}
            onValueChange={setBudget}
            max={10000000}
            step={100000}
            className="[&_[role=slider]]:bg-[#0FC2C0] [&_[role=slider]]:border-[#0FC2C0]"
          />
          <div className="flex items-center gap-2 text-sm">
            <Input
              type="number"
              value={budget[0]}
              onChange={(e) => setBudget([Number(e.target.value), budget[1]])}
              className="bg-[#1B2F3C] border-[#2A3F4C] text-white"
            />
            <span className="text-gray-400">-</span>
            <Input
              type="number"
              value={budget[1]}
              onChange={(e) => setBudget([budget[0], Number(e.target.value)])}
              className="bg-[#1B2F3C] border-[#2A3F4C] text-white"
            />
          </div>
        </div>
      </div>

      {/* Surface */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Surface (m²)</Label>
        <div className="space-y-4">
          <Slider
            value={surface}
            onValueChange={setSurface}
            max={500}
            step={10}
            className="[&_[role=slider]]:bg-[#0FC2C0] [&_[role=slider]]:border-[#0FC2C0]"
          />
          <div className="flex items-center gap-2 text-sm">
            <Input
              type="number"
              value={surface[0]}
              onChange={(e) => setSurface([Number(e.target.value), surface[1]])}
              className="bg-[#1B2F3C] border-[#2A3F4C] text-white"
            />
            <span className="text-gray-400">-</span>
            <Input
              type="number"
              value={surface[1]}
              onChange={(e) => setSurface([surface[0], Number(e.target.value)])}
              className="bg-[#1B2F3C] border-[#2A3F4C] text-white"
            />
          </div>
        </div>
      </div>

      {/* Rooms */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Chambres</Label>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((num) => (
            <Button
              key={num}
              variant="outline"
              className={`border-[#2A3F4C] text-gray-300 hover:bg-[#0FC2C0] hover:text-white hover:border-[#0FC2C0] ${
                filters.bedrooms === num ? 'bg-[#0FC2C0] text-white border-[#0FC2C0]' : ''
              }`}
              onClick={() => {
                onFilterChange({
                  ...filters,
                  bedrooms: filters.bedrooms === num ? undefined : num,
                });
              }}
            >
              {num}+
            </Button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Ville</Label>
        <Select
          value={filters.city_id?.toString() || ''}
          onValueChange={(value) => {
            onFilterChange({
              ...filters,
              city_id: value ? Number(value) : undefined,
            });
          }}
        >
          <SelectTrigger className="bg-[#1B2F3C] border-[#2A3F4C] text-white">
            <SelectValue placeholder="Toutes les villes" />
          </SelectTrigger>
          <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
            <SelectItem value="" className="text-white">Toutes les villes</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id.toString()} className="text-white">
                {city.name_fr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-[#2A3F4C]">
        <Button
          variant="outline"
          className="flex-1 border-[#2A3F4C] text-gray-300 hover:bg-[#0A1F2E] hover:text-white"
          onClick={handleReset}
        >
          Réinitialiser
        </Button>
        <Button
          className="flex-1 bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white"
          onClick={handleApply}
        >
          Appliquer
        </Button>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  const [filters, setFilters] = useState<PropertyFilters>({
    page: 1,
    limit: 12,
  });
  const [sortBy, setSortBy] = useState('recent');

  // Fetch properties with current filters
  const { properties, loading, error, count } = useProperties(filters);

  // Transform properties to match PropertyCard format
  const transformedProperties = useMemo(() => {
    return properties.map((property) => {
      const cityName = property.city?.name_fr || '';
      const neighborhoodName = property.neighborhood?.name_fr || '';
      const location = neighborhoodName
        ? `${neighborhoodName}, ${cityName}`
        : cityName;

      // Get first image from images array or use a placeholder
      const image = property.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80';

      return {
        id: property.id || '',
        title: property.title_fr || 'Sans titre',
        price: property.price || 0,
        location,
        type: property.property_type || 'Bien',
        status: (property.transaction_type || 'sale') as 'sale' | 'rent',
        image,
        bedrooms: property.bedrooms || undefined,
        bathrooms: property.bathrooms || undefined,
        surface: property.area || 0,
        isBoosted: property.featured || false,
        views: property.views_count || 0,
      };
    });
  }, [properties]);

  const handleFilterChange = (newFilters: PropertyFilters) => {
    setFilters({ ...newFilters, page: 1 }); // Reset to page 1 on filter change
  };

  const handleReset = () => {
    setFilters({ page: 1, limit: 12 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    // Note: Sorting is not yet implemented in the backend, 
    // but we keep the UI for future implementation
  };

  const totalPages = Math.ceil(count / (filters.limit || 12));
  const currentPage = filters.page || 1;

  return (
    <div className="min-h-screen bg-[#0A1F2E]">
      <Header />
      
      <main className="container mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Propriétés disponibles</h1>
            <p className="text-gray-400">{count} résultats trouvés</p>
          </div>

          {/* Mobile Filter */}
          <Sheet>
            <SheetTrigger asChild>
              <Button className="lg:hidden bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white">
                <SlidersHorizontal className="h-5 w-5 mr-2" />
                Filtres
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-[#0A1F2E] border-[#1B2F3C] w-80">
              <SheetHeader>
                <SheetTitle className="text-white">Filtres</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)] mt-6">
                <FilterSidebar 
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onReset={handleReset}
                />
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Sort */}
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="hidden lg:flex w-48 bg-[#1B2F3C] border-[#2A3F4C] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
              <SelectItem value="recent" className="text-white">Plus récent</SelectItem>
              <SelectItem value="price-asc" className="text-white">Prix croissant</SelectItem>
              <SelectItem value="price-desc" className="text-white">Prix décroissant</SelectItem>
              <SelectItem value="surface" className="text-white">Surface</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24 bg-[#1B2F3C] rounded-xl p-6 border border-[#2A3F4C]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Filtres</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-400 hover:text-white"
                  onClick={handleReset}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <FilterSidebar 
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleReset}
              />
            </div>
          </aside>

          {/* Properties Grid */}
          <div className="flex-1">
            {loading ? (
              <PropertyListingSkeleton />
            ) : error ? (
              <EmptyState
                variant="server-error"
                title="Erreur de chargement"
                description={error}
              />
            ) : transformedProperties.length === 0 ? (
              <EmptyState
                variant="no-results"
                title="Aucune propriété trouvée"
                description="Essayez de modifier vos critères de recherche"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {transformedProperties.map((property, index) => (
                  <Fragment key={property.id}>
                    <PropertyCard {...property} />
                    {/* In-feed ad every 6 cards on desktop */}
                    {(index + 1) % 6 === 0 && index !== transformedProperties.length - 1 && (
                      <div className="hidden md:block col-span-full">
                        <AdSlot variant="infeed" slotId={`properties-infeed-${index}`} />
                      </div>
                    )}
                    {/* In-feed ad every 4 cards on mobile */}
                    {(index + 1) % 4 === 0 && index !== transformedProperties.length - 1 && (
                      <div className="md:hidden col-span-full">
                        <AdSlot variant="infeed" slotId={`properties-infeed-mobile-${index}`} />
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && transformedProperties.length > 0 && totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <Button
                  variant="outline"
                  className="border-[#2A3F4C] text-gray-300 hover:bg-[#1B2F3C]"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'default' : 'outline'}
                      className={
                        page === currentPage
                          ? 'bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white'
                          : 'border-[#2A3F4C] text-gray-300 hover:bg-[#1B2F3C]'
                      }
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  className="border-[#2A3F4C] text-gray-300 hover:bg-[#1B2F3C]"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
