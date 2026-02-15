import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AdSlot } from '@/components/shared/AdSlot';
import {
  MapPin, Phone, Star, BadgeCheck, Calendar, MessageSquare, Mail, Eye,
  Share2, ChevronLeft, ChevronRight, Clock, Award
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

export default function ArtisanDetailPage() {
  const [showPhone, setShowPhone] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  return (
    <div className="min-h-screen bg-[#0A1F2E]">
      <Header />

      <main className="container mx-auto px-4 md:px-8 py-8 pb-24 lg:pb-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <a href="/" className="hover:text-[#0FC2C0]">Accueil</a><span>/</span>
          <a href="/artisans" className="hover:text-[#0FC2C0]">Artisans</a><span>/</span>
          <span className="text-white">Mohamed El Alami</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Header */}
            <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <Avatar className="h-24 w-24 ring-2 ring-[#0FC2C0]">
                    <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" />
                    <AvatarFallback className="bg-[#0FC2C0] text-white text-2xl">MA</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-2xl md:text-3xl font-bold text-white">Mohamed El Alami</h1>
                      <div className="flex items-center gap-1 bg-[#0FC2C0]/15 px-2 py-0.5 rounded-full">
                        <BadgeCheck className="h-4 w-4 text-[#0FC2C0]" />
                        <span className="text-xs text-[#0FC2C0] font-medium">Vérifié</span>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Disponible</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />Casablanca et environs</span>
                      <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />12 ans d'expérience</span>
                      <span className="flex items-center gap-1"><Eye className="h-4 w-4" />3,247 vues</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="font-bold text-white">4.9</span>
                      <span className="text-sm text-gray-400">(127 avis)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['Plomberie', 'Sanitaire', 'Chauffage'].map(s => (
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
                  Plombier professionnel avec plus de 12 ans d'expérience dans la région de Casablanca. 
                  Spécialisé dans les installations sanitaires, le chauffage central, et les réparations d'urgence. 
                  Je m'engage à fournir un service de qualité, ponctuel et à des prix compétitifs. 
                  Disponible 7j/7 pour les urgences.
                </p>
                <div className="grid sm:grid-cols-3 gap-4 mt-6">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0A1F2E]">
                    <Award className="h-5 w-5 text-[#0FC2C0]" />
                    <div>
                      <p className="text-sm text-gray-400">Expérience</p>
                      <p className="font-semibold text-white">12 ans</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0A1F2E]">
                    <Clock className="h-5 w-5 text-[#0FC2C0]" />
                    <div>
                      <p className="text-sm text-gray-400">Temps de réponse</p>
                      <p className="font-semibold text-white">&lt; 1 heure</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0A1F2E]">
                    <Star className="h-5 w-5 text-[#0FC2C0]" />
                    <div>
                      <p className="text-sm text-gray-400">Taux satisfaction</p>
                      <p className="font-semibold text-white">98%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Avis clients</h2>
                  <Badge className="bg-amber-500/20 text-amber-400">4.9 ★ (127)</Badge>
                </div>

                {/* Rating Breakdown */}
                <div className="space-y-2 mb-6">
                  {[5, 4, 3, 2, 1].map(r => {
                    const counts: Record<number, number> = { 5: 95, 4: 22, 3: 8, 2: 1, 1: 1 };
                    return (
                      <div key={r} className="flex items-center gap-3">
                        <span className="text-sm text-gray-400 w-3">{r}</span>
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <div className="flex-1 h-1.5 bg-[#0A1F2E] rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(counts[r] / 127) * 100}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-6 text-right">{counts[r]}</span>
                      </div>
                    );
                  })}
                </div>

                <Separator className="bg-[#2A3F4C] mb-6" />

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
                        <span className="font-semibold text-[#0FC2C0]">+212 6 12 34 56 78</span>
                      </div>
                    ) : (
                      <Button onClick={() => setShowPhone(true)} variant="outline" className="w-full border-[#0FC2C0] text-[#0FC2C0] hover:bg-[#0FC2C0] hover:text-white">
                        <Phone className="h-4 w-4 mr-2" />Afficher le numéro
                      </Button>
                    )}
                    <Button className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white">
                      <MessageSquare className="h-4 w-4 mr-2" />WhatsApp
                    </Button>
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
            {showPhone ? '+212 6 12 34' : 'Appeler'}
          </Button>
          <Button className="flex-1 bg-[#25D366] hover:bg-[#20BA5A] text-white min-h-[48px]">
            <MessageSquare className="h-5 w-5 mr-2" />WhatsApp
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
