import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ArtisanCard } from '@/components/cards/ArtisanCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { SlidersHorizontal, X, Star, Search } from 'lucide-react';
import { useArtisans, type ArtisanFilters, type ArtisanProfile } from '@/hooks/useArtisans';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';

interface City {
  id: number;
  name_fr: string;
}

interface ServiceCategory {
  id: string;
  name_fr: string;
  slug: string;
}

interface FilterSidebarProps {
  categories: ServiceCategory[];
  cities: City[];
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: any) => void;
  onReset: () => void;
  onApply: () => void;
}

interface FilterState {
  selectedCategory: string;
  selectedCity: string;
  minRating: number | null;
  availableOnly: boolean;
  verifiedOnly: boolean;
  searchTerm: string;
}

function FilterSidebar({ categories, cities, filters, onFilterChange, onReset, onApply }: FilterSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Services */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Services</Label>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox 
                id={category.id}
                checked={filters.selectedCategory === category.id}
                onCheckedChange={(checked) => onFilterChange('selectedCategory', checked ? category.id : '')}
              />
              <label
                htmlFor={category.id}
                className="text-sm text-gray-300 cursor-pointer"
              >
                {category.name_fr}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Zone d'intervention</Label>
        <Select value={filters.selectedCity} onValueChange={(val) => onFilterChange('selectedCity', val)}>
          <SelectTrigger className="bg-[#1B2F3C] border-[#2A3F4C] text-white">
            <SelectValue placeholder="Toutes les villes" />
          </SelectTrigger>
          <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
            <SelectItem value="all" className="text-white">Toutes les villes</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id.toString()} className="text-white">
                {city.name_fr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rating */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Évaluation minimum</Label>
        <div className="space-y-2">
          {[5, 4, 3].map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox 
                id={`rating-${rating}`}
                checked={filters.minRating === rating}
                onCheckedChange={(checked) => onFilterChange('minRating', checked ? rating : null)}
              />
              <label
                htmlFor={`rating-${rating}`}
                className="text-sm text-gray-300 cursor-pointer flex items-center gap-1"
              >
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
                <span className="ml-1">et plus</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Verified */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Statut</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="verified"
              checked={filters.verifiedOnly}
              onCheckedChange={(checked) => onFilterChange('verifiedOnly', checked)}
            />
            <label htmlFor="verified" className="text-sm text-gray-300 cursor-pointer">
              Profils vérifiés uniquement
            </label>
          </div>
        </div>
      </div>

      {/* Search by name */}
      <div className="space-y-3">
        <Label className="text-white font-semibold">Rechercher par nom</Label>
        <Input
          placeholder="Nom de l'artisan..."
          value={filters.searchTerm}
          onChange={(e) => onFilterChange('searchTerm', e.target.value)}
          className="bg-[#1B2F3C] border-[#2A3F4C] text-white placeholder:text-gray-500"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-[#2A3F4C]">
        <Button
          variant="outline"
          onClick={onReset}
          className="flex-1 border-[#2A3F4C] text-gray-300 hover:bg-[#0A1F2E] hover:text-white"
        >
          Réinitialiser
        </Button>
        <Button onClick={onApply} className="flex-1 bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white">
          Appliquer
        </Button>
      </div>
    </div>
  );
}

function ArtisanCardSkeleton() {
  return (
    <div className="bg-[#1B2F3C] border border-[#2A3F4C] rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function transformArtisanToCardProps(artisan: ArtisanProfile) {
  // Get services from artisan_services (subcategories)
  const services = artisan.artisan_services?.map(s => s.service_subcategory?.name_fr).filter(Boolean) || [];
  const rating = artisan.profiles?.rating || 0;
  const reviewCount = artisan.profiles?.completed_jobs || 0;
  
  return {
    id: artisan.id,
    name: artisan.business_name,
    avatar: artisan.profiles?.avatar_url || '',
    services: services,
    location: artisan.city?.name_fr || 'Non spécifié',
    rating: undefined, // Rating not available - will be hidden in card
    reviewCount: 0,
    isVerified: artisan.is_verified,
    isAvailable: true,
    yearsExperience: undefined,
  };
}

export default function ArtisansPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [filterState, setFilterState] = useState<FilterState>({
    selectedCategory: '',
    selectedCity: 'all',
    minRating: null,
    availableOnly: false,
    verifiedOnly: false,
    searchTerm: '',
  });
  const [appliedFilters, setAppliedFilters] = useState<ArtisanFilters>({});
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { artisans, loading, error } = useArtisans(appliedFilters);

  // Fetch categories and cities
  useEffect(() => {
    const fetchData = async () => {
      const [categoriesRes, citiesRes] = await Promise.all([
        supabase.from('service_categories').select('id, name_fr, slug').order('name_fr'),
        supabase.from('cities').select('id, name_fr').order('name_fr'),
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (citiesRes.data) setCities(citiesRes.data);
    };
    fetchData();
  }, []);

  // Debounce searchTerm updates (500 ms) and enforce min length >= 2
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    const term = filterState.searchTerm;

    searchDebounceRef.current = setTimeout(() => {
      setAppliedFilters(prev => {
        if (!term || term.length < 2) {
          // Remove searchTerm from applied filters
          const { searchTerm: _removed, ...rest } = prev;
          return rest;
        }
        return { ...prev, searchTerm: term };
      });
    }, 500);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [filterState.searchTerm]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilterState(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    const filters: ArtisanFilters = {};
    
    if (filterState.selectedCategory) {
      filters.serviceCategoryId = filterState.selectedCategory;
    }
    if (filterState.selectedCity !== 'all') {
      filters.cityId = parseInt(filterState.selectedCity);
    }
    if (filterState.verifiedOnly) {
      filters.isVerified = true;
    }
    if (filterState.minRating) {
      filters.minRating = filterState.minRating;
    }
    if (filterState.searchTerm) {
      filters.searchTerm = filterState.searchTerm;
    }

    setAppliedFilters(filters);
  };

  const handleReset = () => {
    setFilterState({
      selectedCategory: '',
      selectedCity: 'all',
      minRating: null,
      availableOnly: false,
      verifiedOnly: false,
      searchTerm: '',
    });
    setAppliedFilters({});
  };

  return (
    <div className="min-h-screen bg-[#0A1F2E]">
      <Header />

      <main className="container mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Artisans professionnels
            </h1>
            <p className="text-gray-400">
              {loading ? 'Chargement...' : `${artisans.length} artisan${artisans.length !== 1 ? 's' : ''} trouvé${artisans.length !== 1 ? 's' : ''}`}
            </p>
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
                  categories={categories}
                  cities={cities}
                  filters={filterState}
                  onFilterChange={handleFilterChange}
                  onReset={handleReset}
                  onApply={handleApply}
                />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24 bg-[#1B2F3C] rounded-xl p-6 border border-[#2A3F4C]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Filtres</h2>
              </div>
              <FilterSidebar
                categories={categories}
                cities={cities}
                filters={filterState}
                onFilterChange={handleFilterChange}
                onReset={handleReset}
                onApply={handleApply}
              />
            </div>
          </aside>

          {/* Artisans Grid */}
          <div className="flex-1">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-red-400">Erreur: {error}</p>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ArtisanCardSkeleton key={i} />
                ))}
              </div>
            ) : artisans.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Aucun artisan trouvé
                </h3>
                <p className="text-gray-400 mb-6">
                  Essayez de modifier vos critères de recherche
                </p>
                <Button onClick={handleReset} className="bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white">
                  Réinitialiser les filtres
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {artisans.map((artisan) => (
                  <Link key={artisan.id} to={`/artisans/${artisan.id}`}>
                    <ArtisanCard {...transformArtisanToCardProps(artisan)} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
