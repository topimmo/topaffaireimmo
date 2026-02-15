import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { AdSlot } from '@/components/shared/AdSlot';
import {
  MapPin,
  Bed,
  Bath,
  Square,
  Car,
  Home,
  Calendar,
  Eye,
  Heart,
  Share2,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProperty } from '@/hooks/useProperties';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { property, loading, error } = useProperty(id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(false);

  // Get property images, with fallback
  const propertyImages = property?.images && property.images.length > 0 
    ? property.images 
    : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80'];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % propertyImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + propertyImages.length) % propertyImages.length);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1F2E]">
        <Header />
        <main className="container mx-auto px-4 md:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 text-[#0FC2C0] animate-spin mx-auto" />
              <p className="text-gray-400">Chargement de la propriété...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show error state
  if (error || !property) {
    return (
      <div className="min-h-screen bg-[#0A1F2E]">
        <Header />
        <main className="container mx-auto px-4 md:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="bg-[#1B2F3C] border-[#2A3F4C] max-w-md w-full">
              <CardContent className="p-8 text-center space-y-4">
                <AlertCircle className="h-16 w-16 text-red-400 mx-auto" />
                <h2 className="text-2xl font-bold text-white">Propriété introuvable</h2>
                <p className="text-gray-400">
                  {error || 'Cette propriété n\'existe pas ou a été supprimée.'}
                </p>
                <Button 
                  onClick={() => navigate('/properties')} 
                  className="bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white"
                >
                  Retour aux annonces
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Format property data
  const propertyTitle = property.title_fr || 'Sans titre';
  const location = [property.neighborhood?.name_fr, property.city?.name_fr].filter(Boolean).join(', ') || 'Localisation non spécifiée';
  const price = property.price?.toLocaleString('fr-MA') || '0';
  const transactionTypeLabel = property.transaction_type === 'sale' ? 'Vente' : 'Location';
  const propertyTypeLabel = property.property_type || 'Non spécifié';
  const description = property.description_fr || 'Aucune description disponible.';
  
  // Parse features from Json type to string array
  let features: string[] = [];
  if (property.features) {
    if (Array.isArray(property.features)) {
      features = property.features.filter((f): f is string => typeof f === 'string');
    }
  }
  
  const viewsCount = property.views_count || 0;
  const createdDate = property.created_at ? new Date(property.created_at) : null;
  const relativeTime = createdDate ? getRelativeTime(createdDate) : 'Date inconnue';
  
  // Owner info
  const ownerName = property.owner?.full_name || property.owner?.agency_name || 'Annonceur';
  const ownerInitials = getInitials(ownerName);
  const ownerPhone = property.owner?.phone || '';
  
  return (
    <div className="min-h-screen bg-[#0A1F2E]">
      <Header />

      <main className="container mx-auto px-4 md:px-8 py-8 pb-24 lg:pb-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <a href="/" className="hover:text-[#0FC2C0]">Accueil</a>
          <span>/</span>
          <a href="/properties" className="hover:text-[#0FC2C0]">Propriétés</a>
          <span>/</span>
          <span className="text-white">{propertyTitle}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#1B2F3C] group">
              <img
                src={propertyImages[currentImageIndex]}
                alt="Property"
                className="w-full h-full object-cover"
              />

              {/* Navigation */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge className="bg-[#0FC2C0] text-white font-semibold">{transactionTypeLabel}</Badge>
                {property.featured && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold">
                    ⭐ Premium
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="absolute top-4 right-4 flex gap-2">
                <Button size="icon" className="bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button size="icon" className="bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm">
                {currentImageIndex + 1} / {propertyImages.length}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-4">
              {propertyImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    'aspect-video rounded-lg overflow-hidden border-2 transition-all',
                    currentImageIndex === index
                      ? 'border-[#0FC2C0] ring-2 ring-[#0FC2C0]/30'
                      : 'border-[#2A3F4C] hover:border-[#0FC2C0]/50'
                  )}
                >
                  <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Property Details */}
            <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
              <CardContent className="p-6 space-y-6">
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <h1 className="text-3xl font-bold text-white">
                      {propertyTitle}
                    </h1>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Eye className="h-4 w-4" />
                      {viewsCount.toLocaleString('fr-MA')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="h-5 w-5 text-[#0FC2C0]" />
                    <span>{location}</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-[#0FC2C0]">{price} DH</span>
                  </div>
                </div>

                <Separator className="bg-[#2A3F4C]" />

                {/* Key Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {property.bedrooms !== null && property.bedrooms !== undefined && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0A1F2E]">
                      <div className="p-2 rounded-lg bg-[#0FC2C0]/20">
                        <Bed className="h-5 w-5 text-[#0FC2C0]" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Chambres</p>
                        <p className="font-semibold text-white">{property.bedrooms}</p>
                      </div>
                    </div>
                  )}
                  {property.bathrooms !== null && property.bathrooms !== undefined && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0A1F2E]">
                      <div className="p-2 rounded-lg bg-[#0FC2C0]/20">
                        <Bath className="h-5 w-5 text-[#0FC2C0]" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Salles de bain</p>
                        <p className="font-semibold text-white">{property.bathrooms}</p>
                      </div>
                    </div>
                  )}
                  {property.area !== null && property.area !== undefined && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0A1F2E]">
                      <div className="p-2 rounded-lg bg-[#0FC2C0]/20">
                        <Square className="h-5 w-5 text-[#0FC2C0]" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Surface</p>
                        <p className="font-semibold text-white">{property.area} m²</p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="bg-[#2A3F4C]" />

                {/* Description */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-3">Description</h2>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {description}
                  </p>
                </div>

                {features.length > 0 && (
                  <>
                    <Separator className="bg-[#2A3F4C]" />

                    {/* Features */}
                    <div>
                      <h2 className="text-xl font-bold text-white mb-4">Caractéristiques</h2>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-[#0FC2C0]" />
                            <span className="text-gray-300">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator className="bg-[#2A3F4C]" />

                {/* Additional Info */}
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Home className="h-4 w-4 text-gray-400" />
                    <span>Type: {propertyTypeLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Publié: {relativeTime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Sidebar - Desktop Sticky */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-24">
              <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-bold text-white">Contactez le vendeur</h3>

                  {/* Agent Info */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0A1F2E]">
                    <div className="w-12 h-12 rounded-full bg-[#0FC2C0] flex items-center justify-center text-white font-bold text-lg">
                      {ownerInitials}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{ownerName}</p>
                      <p className="text-sm text-gray-400">
                        {property.owner?.advertiser_type === 'agency' ? 'Agence immobilière' : 
                         property.owner?.advertiser_type === 'developer' ? 'Promoteur' : 
                         'Particulier'}
                      </p>
                    </div>
                  </div>

                  <Separator className="bg-[#2A3F4C]" />

                  {/* Contact Form */}
                  <div className="space-y-3">
                    <Input
                      placeholder="Votre nom"
                      className="bg-[#0A1F2E] border-[#2A3F4C] text-white placeholder:text-gray-500"
                    />
                    <Input
                      type="email"
                      placeholder="Votre email"
                      className="bg-[#0A1F2E] border-[#2A3F4C] text-white placeholder:text-gray-500"
                    />
                    <Input
                      type="tel"
                      placeholder="Votre téléphone"
                      className="bg-[#0A1F2E] border-[#2A3F4C] text-white placeholder:text-gray-500"
                    />
                    <Textarea
                      placeholder="Votre message..."
                      rows={4}
                      className="bg-[#0A1F2E] border-[#2A3F4C] text-white placeholder:text-gray-500"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button className="w-full bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white font-medium">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Envoyer le message
                    </Button>
                    
                    {showPhone && ownerPhone ? (
                      <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-[#0FC2C0]/10 border border-[#0FC2C0]/30 animate-in slide-in-from-top-2 fade-in duration-300">
                        <Phone className="h-5 w-5 text-[#0FC2C0]" />
                        <span className="font-semibold text-[#0FC2C0]">{ownerPhone}</span>
                      </div>
                    ) : ownerPhone ? (
                      <Button
                        onClick={() => setShowPhone(true)}
                        variant="outline"
                        className="w-full border-[#0FC2C0] text-[#0FC2C0] hover:bg-[#0FC2C0] hover:text-white"
                      >
                        <Phone className="h-5 w-5 mr-2" />
                        Afficher le numéro
                      </Button>
                    ) : null}

                    <Button
                      variant="outline"
                      className="w-full border-[#2A3F4C] text-gray-300 hover:bg-[#0A1F2E] hover:text-white"
                    >
                      <Mail className="h-5 w-5 mr-2" />
                      Envoyer un email
                    </Button>
                  </div>

                  {/* WhatsApp */}
                  <Button className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-medium">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Contacter via WhatsApp
                  </Button>
                </CardContent>
              </Card>
              
              {/* Sidebar Ad Slot */}
              <AdSlot variant="sidebar" slotId="property-detail-sidebar" className="mt-4" />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Sheet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1B2F3C] border-t border-[#2A3F4C] p-4 shadow-2xl">
        <div className="flex gap-2">
          {ownerPhone && (
            <Button
              onClick={() => setShowPhone(!showPhone)}
              variant="outline"
              className="flex-1 border-[#0FC2C0] text-[#0FC2C0] hover:bg-[#0FC2C0] hover:text-white min-h-[48px]"
            >
              <Phone className="h-5 w-5 mr-2" />
              {showPhone ? ownerPhone : 'Appeler'}
            </Button>
          )}
          {ownerPhone && (
            <Button className="flex-1 bg-[#25D366] hover:bg-[#20BA5A] text-white min-h-[48px]">
              <MessageSquare className="h-5 w-5 mr-2" />
              WhatsApp
            </Button>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Helper function to get initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Helper function to format relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `Il y a ${months} mois`;
  }
  const years = Math.floor(diffDays / 365);
  return `Il y a ${years} an${years > 1 ? 's' : ''}`;
}
