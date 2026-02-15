import { Search, MapPin, Home, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function SearchHero() {
  const [searchType, setSearchType] = useState<'properties' | 'artisans'>('properties');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchType === 'properties') {
      navigate(`/properties?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/artisans?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handlePopularSearch = (type: 'properties' | 'artisans', query: string) => {
    if (type === 'properties') {
      navigate(`/properties?search=${encodeURIComponent(query)}`);
    } else {
      navigate(`/artisans?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#0A1F2E] via-[#0D2838] to-[#0A1F2E] noise-texture">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#0FC2C0] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#0FC2C0] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0FC2C0] rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Trouvez votre{' '}
              <span className="text-[#0FC2C0] relative inline-block">
                opportunité
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  height="12"
                  viewBox="0 0 200 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 10C50 3 150 3 198 10"
                    stroke="#0FC2C0"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <br />
              idéale au Maroc
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
              La plateforme premium pour l'immobilier et les services professionnels vérifiés
            </p>
          </div>

          {/* Search Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20 shadow-2xl">
            <Tabs
              value={searchType}
              onValueChange={(value) => setSearchType(value as 'properties' | 'artisans')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-transparent gap-2 mb-4">
                <TabsTrigger
                  value="properties"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#0A1F2E] text-gray-300 rounded-lg"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Propriétés
                </TabsTrigger>
                <TabsTrigger
                  value="artisans"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#0A1F2E] text-gray-300 rounded-lg"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Artisans
                </TabsTrigger>
              </TabsList>

              <div className="bg-white rounded-xl p-3 shadow-lg">
                <div className="flex flex-col md:flex-row gap-3">
                  {/* Location Input */}
                  <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <Input
                      placeholder={searchType === 'properties' ? 'Ville ou quartier...' : 'Zone d\'intervention...'}
                      className="border-0 bg-transparent focus-visible:ring-0 p-0 text-gray-900 placeholder:text-gray-500"
                    />
                  </div>

                  {/* Keyword Input */}
                  <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3">
                    <Search className="h-5 w-5 text-gray-400" />
                    <Input
                      placeholder={searchType === 'properties' ? 'Type de bien...' : 'Service recherché...'}
                      className="border-0 bg-transparent focus-visible:ring-0 p-0 text-gray-900 placeholder:text-gray-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>

                  {/* Search Button */}
                  <Button
                    size="lg"
                    onClick={handleSearch}
                    className="bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white font-semibold px-8 h-[52px] shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                  >
                    <Search className="h-5 w-5 md:mr-2" />
                    <span className="hidden md:inline">Rechercher</span>
                  </Button>
                </div>
              </div>
            </Tabs>
          </div>

          {/* Popular Searches */}
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <span className="text-gray-400">Recherches populaires:</span>
            <button 
              onClick={() => handlePopularSearch('properties', 'Casablanca')} 
              className="text-[#0FC2C0] hover:underline"
            >
              Appartement Casablanca
            </button>
            <span className="text-gray-600">•</span>
            <button 
              onClick={() => handlePopularSearch('properties', 'Marrakech')} 
              className="text-[#0FC2C0] hover:underline"
            >
              Villa Marrakech
            </button>
            <span className="text-gray-600">•</span>
            <button 
              onClick={() => handlePopularSearch('artisans', 'Plombier Rabat')} 
              className="text-[#0FC2C0] hover:underline"
            >
              Plombier Rabat
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
