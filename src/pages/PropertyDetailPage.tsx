import { useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const propertyImages = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80',
  'https://images.unsplash.com/photo-1502672260066-6bc054ba9c75?w=1200&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
];

export default function PropertyDetailPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(false);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % propertyImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + propertyImages.length) % propertyImages.length);
  };

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
          <span className="text-white">Appartement moderne avec vue mer</span>
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
                <Badge className="bg-[#0FC2C0] text-white font-semibold">Vente</Badge>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold">
                  ⭐ Premium
                </Badge>
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
                      Appartement moderne avec vue mer
                    </h1>
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <Eye className="h-4 w-4" />
                      1,247
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="h-5 w-5 text-[#0FC2C0]" />
                    <span>Ain Diab, Casablanca</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-[#0FC2C0]">2,500,000 DH</span>
                  </div>
                </div>

                <Separator className="bg-[#2A3F4C]" />

                {/* Key Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0A1F2E]">
                    <div className="p-2 rounded-lg bg-[#0FC2C0]/20">
                      <Bed className="h-5 w-5 text-[#0FC2C0]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Chambres</p>
                      <p className="font-semibold text-white">3</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0A1F2E]">
                    <div className="p-2 rounded-lg bg-[#0FC2C0]/20">
                      <Bath className="h-5 w-5 text-[#0FC2C0]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Salles de bain</p>
                      <p className="font-semibold text-white">2</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0A1F2E]">
                    <div className="p-2 rounded-lg bg-[#0FC2C0]/20">
                      <Square className="h-5 w-5 text-[#0FC2C0]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Surface</p>
                      <p className="font-semibold text-white">140 m²</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0A1F2E]">
                    <div className="p-2 rounded-lg bg-[#0FC2C0]/20">
                      <Car className="h-5 w-5 text-[#0FC2C0]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Parking</p>
                      <p className="font-semibold text-white">1</p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-[#2A3F4C]" />

                {/* Description */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-3">Description</h2>
                  <p className="text-gray-300 leading-relaxed">
                    Superbe appartement moderne de 140 m² situé dans le prestigieux quartier d'Ain Diab à Casablanca. 
                    Offrant une vue imprenable sur la mer, cet appartement lumineux comprend 3 chambres spacieuses, 
                    2 salles de bain élégantes, un salon-séjour ouvert, et une cuisine équipée haut de gamme. 
                    Finitions premium, climatisation centrale, et parking sécurisé inclus. Proximité immédiate des 
                    plages, restaurants, et commerces.
                  </p>
                </div>

                <Separator className="bg-[#2A3F4C]" />

                {/* Features */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-4">Caractéristiques</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      'Vue mer panoramique',
                      'Climatisation centrale',
                      'Cuisine équipée',
                      'Parking sécurisé',
                      'Ascenseur',
                      'Concierge 24/7',
                      'Balcon spacieux',
                      'Double vitrage',
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-[#0FC2C0]" />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-[#2A3F4C]" />

                {/* Additional Info */}
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Home className="h-4 w-4 text-gray-400" />
                    <span>Type: Appartement</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Publié: Il y a 2 jours</span>
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
                      MA
                    </div>
                    <div>
                      <p className="font-semibold text-white">Mohamed Alami</p>
                      <p className="text-sm text-gray-400">Agent immobilier</p>
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
                    
                    {showPhone ? (
                      <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-[#0FC2C0]/10 border border-[#0FC2C0]/30 animate-in slide-in-from-top-2 fade-in duration-300">
                        <Phone className="h-5 w-5 text-[#0FC2C0]" />
                        <span className="font-semibold text-[#0FC2C0]">+212 6 12 34 56 78</span>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setShowPhone(true)}
                        variant="outline"
                        className="w-full border-[#0FC2C0] text-[#0FC2C0] hover:bg-[#0FC2C0] hover:text-white"
                      >
                        <Phone className="h-5 w-5 mr-2" />
                        Afficher le numéro
                      </Button>
                    )}

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
          <Button
            onClick={() => setShowPhone(!showPhone)}
            variant="outline"
            className="flex-1 border-[#0FC2C0] text-[#0FC2C0] hover:bg-[#0FC2C0] hover:text-white min-h-[48px]"
          >
            <Phone className="h-5 w-5 mr-2" />
            {showPhone ? '+212 6 12 34 56 78' : 'Appeler'}
          </Button>
          <Button className="flex-1 bg-[#25D366] hover:bg-[#20BA5A] text-white min-h-[48px]">
            <MessageSquare className="h-5 w-5 mr-2" />
            WhatsApp
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
