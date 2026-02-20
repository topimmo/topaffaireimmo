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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AdSlot } from '@/components/shared/AdSlot';
import { useArtisan } from '@/hooks/useArtisans';
import {
  MapPin, Phone, Star, BadgeCheck, Calendar, MessageSquare, Mail, Eye,
  Share2, ChevronLeft, ChevronRight, Clock, Award, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const galleryImages = [
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80',
  'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80',
];

const reviews = [
  { name: 'Ahmed B.', rating: 5, comment: 'Excellent travail, rapide et professionnel. Je recommande vivement !', date: 'Il y a 2 jours', verified: true },
  { name: 'Sara M.', rating: 5, comment: 'Très satisfaite du résultat. Ponctuel et propre.', date: 'Il y a 1 semaine', verified: true },
  { name: 'Khalid R.', rating: 4, comment: 'Bon service dans l\'ensemble, petit retard mais travail de qualité.', date: 'Il y a 2 semaines', verified: false },
];

function ProfileHeaderSkeleton() {
  return (
    <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-3 w-full">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ArtisanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { artisan, loading, error } = useArtisan(id || '');
  const [showPhone, setShowPhone] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1F2E]">
        <Header />
        <main className="container mx-auto px-4 md:px-8 py-8 pb-24 lg:pb-8">
          <Skeleton className="h-6 w-64 mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <ProfileHeaderSkeleton />
              <Skeleton className="h-96 rounded-xl" />
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-96 rounded-xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !artisan) {
    return (
      <div className="min-h-screen bg-[#0A1F2E]">
        <Header />
        <main className="container mx-auto px-4 md:px-8 py-16">
          <Card className="bg-[#1B2F3C] border-[#2A3F4C] max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Artisan introuvable</h2>
              <p className="text-gray-400 mb-6">
                {error || "Cet artisan n'existe pas ou a été supprimé."}
              </p>
              <Button 
                onClick={() => navigate('/artisans')}
                className="bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white"
              >
                Retour à la liste
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Get services from artisan_services (subcategories)
  const services = artisan.artisan_services?.map(s => s.service_subcategory?.name_fr).filter(Boolean) || [];
  const displayServices = services.length > 0 ? services : [artisan.service_category?.name_fr || 'Service'];
  const rating = artisan.profiles?.rating || 0;
  const completedJobs = artisan.profiles?.completed_jobs || 0;
  const avatarUrl = artisan.profiles?.avatar_url || '';
  const initials = artisan.business_name
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AR';

  return (
    <div className="min-h-screen bg-[#0A1F2E]">
      <Header />

      <main className="container mx-auto px-4 md:px-8 py-8 pb-24 lg:pb-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <a href="/" className="hover:text-[#0FC2C0]">Accueil</a><span>/</span>
          <a href="/artisans" className="hover:text-[#0FC2C0]">Artisans</a><span>/</span>
          <span className="text-white">{artisan.business_name}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Header */}
            <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <Avatar className="h-24 w-24 ring-2 ring-[#0FC2C0]">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-[#0FC2C0] text-white text-2xl">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-2xl md:text-3xl font-bold text-white">{artisan.business_name}</h1>
                      {artisan.is_verified && (
                        <div className="flex items-center gap-1 bg-[#0FC2C0]/15 px-2 py-0.5 rounded-full">
                          <BadgeCheck className="h-4 w-4 text-[#0FC2C0]" />
                          <span className="text-xs text-[#0FC2C0] font-medium">Vérifié</span>
                        </div>
                      )}
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Disponible</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {artisan.city?.name_fr || 'Non spécifié'}
                      </span>
                    </div>
                    {rating !== undefined && rating > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star 
                              key={i} 
                              className={cn(
                                "h-4 w-4",
                                i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-600"
                              )} 
                            />
                          ))}
                        </div>
                        <span className="font-bold text-white">{rating.toFixed(1)}</span>
                        <span className="text-sm text-gray-400">({completedJobs} avis)</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {displayServices.map(s => (
                        <Badge key={s} variant="outline" className="bg-[#0FC2C0]/10 border-[#0FC2C0]/30 text-[#0FC2C0] text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" className="border-[#2A3F4C] text-gray-400 hover:text-white">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gallery */}
            <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">Galerie de travaux</h2>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-[#0A1F2E] group mb-3">
                  <img src={galleryImages[currentImage]} alt="Work" className="w-full h-full object-cover" />
                  <button onClick={() => setCurrentImage(p => (p - 1 + galleryImages.length) % galleryImages.length)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={() => setCurrentImage(p => (p + 1) % galleryImages.length)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-black/50 text-white text-xs">
                    {currentImage + 1}/{galleryImages.length}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {galleryImages.map((img, i) => (
                    <button key={i} onClick={() => setCurrentImage(i)} className={cn('aspect-video rounded-lg overflow-hidden border-2', i === currentImage ? 'border-[#0FC2C0]' : 'border-[#2A3F4C]')}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ad Slot */}
            <AdSlot variant="banner" slotId="artisan-detail-mid" />

            {/* About */}
            <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-white mb-3">À propos</h2>
                <p className="text-gray-300 leading-relaxed">
                  {artisan.description_fr || `${artisan.business_name} est un professionnel spécialisé dans ${artisan.service_category?.name_fr}. Contactez-nous pour plus d'informations sur nos services.`}
                </p>
                {(completedJobs !== undefined && completedJobs > 0) || (rating !== undefined && rating > 0) ? (
                  <div className="grid sm:grid-cols-3 gap-4 mt-6">
                    {completedJobs !== undefined && completedJobs > 0 && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0A1F2E]">
                        <Award className="h-5 w-5 text-[#0FC2C0]" />
                        <div>
                          <p className="text-sm text-gray-400">Projets complétés</p>
                          <p className="font-semibold text-white">{completedJobs}</p>
                        </div>
                      </div>
                    )}
                    {rating !== undefined && rating > 0 && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0A1F2E]">
                        <Star className="h-5 w-5 text-[#0FC2C0]" />
                        <div>
                          <p className="text-sm text-gray-400">Note moyenne</p>
                          <p className="font-semibold text-white">{rating.toFixed(1)}/5</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {/* Reviews */}
            {completedJobs !== undefined && completedJobs > 0 && rating !== undefined && (
              <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Avis clients</h2>
                    <Badge className="bg-amber-500/20 text-amber-400">{rating.toFixed(1)} ★ ({completedJobs})</Badge>
                  </div>

                  <div className="space-y-4">
                    {reviews.map((review, i) => (
                      <div key={i} className="p-4 rounded-lg bg-[#0A1F2E]">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#0FC2C0]/20 flex items-center justify-center text-[#0FC2C0] font-bold text-sm">{review.name.charAt(0)}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">{review.name}</span>
                                {review.verified && <Badge className="bg-green-500/20 text-green-400 text-[10px]">Vérifié</Badge>}
                              </div>
                              <div className="flex gap-0.5 mt-0.5">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <Star key={s} className={cn('h-3 w-3', s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-600')} />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">{review.date}</span>
                        </div>
                        <p className="text-sm text-gray-300 ml-11">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contact Sidebar */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-bold text-white">Contacter</h3>
                  <div className="space-y-3">
                    <Input placeholder="Votre nom" className="bg-[#0A1F2E] border-[#2A3F4C] text-white placeholder:text-gray-500" />
                    <Input type="tel" placeholder="Votre téléphone" className="bg-[#0A1F2E] border-[#2A3F4C] text-white placeholder:text-gray-500" />
                    <Textarea placeholder="Décrivez votre besoin..." rows={3} className="bg-[#0A1F2E] border-[#2A3F4C] text-white placeholder:text-gray-500" />
                  </div>
                  <div className="space-y-2">
                    <Button className="w-full bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white">
                      <MessageSquare className="h-4 w-4 mr-2" />Envoyer
                    </Button>
                    {showPhone ? (
                      <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-[#0FC2C0]/10 border border-[#0FC2C0]/30 animate-in slide-in-from-top-2 fade-in">
                        <Phone className="h-4 w-4 text-[#0FC2C0]" />
                        <span className="font-semibold text-[#0FC2C0]">{artisan.phone}</span>
                      </div>
                    ) : (
                      <Button onClick={() => setShowPhone(true)} variant="outline" className="w-full border-[#0FC2C0] text-[#0FC2C0] hover:bg-[#0FC2C0] hover:text-white">
                        <Phone className="h-4 w-4 mr-2" />Afficher le numéro
                      </Button>
                    )}
                    {artisan.whatsapp && (
                      <Button 
                        onClick={() => window.open(`https://wa.me/${artisan.whatsapp}`, '_blank')}
                        className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />WhatsApp
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ad Slot */}
              <AdSlot variant="sidebar" slotId="artisan-detail-sidebar" />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Sheet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1B2F3C] border-t border-[#2A3F4C] p-4 shadow-2xl">
        <div className="flex gap-2">
          <Button onClick={() => setShowPhone(!showPhone)} variant="outline" className="flex-1 border-[#0FC2C0] text-[#0FC2C0] hover:bg-[#0FC2C0] hover:text-white min-h-[48px]">
            <Phone className="h-5 w-5 mr-2" />
            {showPhone ? artisan.phone : 'Appeler'}
          </Button>
          {artisan.whatsapp && (
            <Button 
              onClick={() => window.open(`https://wa.me/${artisan.whatsapp}`, '_blank')}
              className="flex-1 bg-[#25D366] hover:bg-[#20BA5A] text-white min-h-[48px]"
            >
              <MessageSquare className="h-5 w-5 mr-2" />WhatsApp
            </Button>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
