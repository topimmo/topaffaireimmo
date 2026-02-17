import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useCities, useNeighborhoods, usePropertyTypes } from '@/hooks/useReferenceData';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Home, Loader2, ArrowLeft } from 'lucide-react';

export default function CreatePropertyPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { cities, loading: citiesLoading } = useCities();
  const { propertyTypes, loading: typesLoading } = usePropertyTypes();

  // Form state
  const [formData, setFormData] = useState({
    title_fr: '',
    description_fr: '',
    transaction_type: 'sale' as 'sale' | 'rent',
    property_type: '',
    city_id: '',
    neighborhood_id: '',
    price: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    contact_phone: '',
    contact_email: '',
    contact_whatsapp: '',
  });

  const [selectedCityId, setSelectedCityId] = useState<number | undefined>();
  const { neighborhoods, loading: neighborhoodsLoading } = useNeighborhoods(selectedCityId);
  const [submitting, setSubmitting] = useState(false);

  const handleCityChange = (value: string) => {
    const cityId = parseInt(value);
    setSelectedCityId(cityId);
    setFormData(prev => ({ ...prev, city_id: value, neighborhood_id: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Vous devez être connecté pour créer une annonce');
      navigate('/login');
      return;
    }

    // Basic validation
    if (!formData.title_fr || !formData.property_type || !formData.city_id || !formData.price) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);

    try {
      const propertyData = {
        owner_id: user.id,
        title_fr: formData.title_fr,
        description_fr: formData.description_fr || null,
        transaction_type: formData.transaction_type,
        property_type: formData.property_type,
        city_id: parseInt(formData.city_id),
        neighborhood_id: formData.neighborhood_id ? parseInt(formData.neighborhood_id) : null,
        price: parseFloat(formData.price),
        area: formData.area ? parseFloat(formData.area) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        contact_phone: formData.contact_phone || null,
        contact_email: formData.contact_email || null,
        contact_whatsapp: formData.contact_whatsapp || null,
        status: 'draft', // Start as draft
        advertiser_type: profile?.advertiser_type || 'individual',
        title_ar: '', // Leave empty - user can edit later
      };

      const { data, error } = await supabase
        .from('properties')
        .insert([propertyData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Annonce créée avec succès!');
      navigate('/dashboard/advertiser');
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error('Erreur lors de la création de l\'annonce');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A1F2E]">
        <Header />
        <main className="container mx-auto px-4 md:px-8 py-8">
          <Card className="bg-[#1B2F3C] border-[#2A3F4C] max-w-md mx-auto">
            <CardContent className="p-8 text-center space-y-4">
              <Home className="h-16 w-16 text-gray-600 mx-auto" />
              <h2 className="text-2xl font-bold text-white">Connexion requise</h2>
              <p className="text-gray-400">
                Vous devez être connecté pour créer une annonce.
              </p>
              <Button 
                onClick={() => navigate('/login')} 
                className="bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white"
              >
                Se connecter
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const loading = citiesLoading || typesLoading;

  return (
    <div className="min-h-screen bg-[#0A1F2E]">
      <Header />

      <main className="container mx-auto px-4 md:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard/advertiser')}
              className="text-gray-400 hover:text-white mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au tableau de bord
            </Button>
            <h1 className="text-3xl font-bold text-white mb-2">Créer une annonce</h1>
            <p className="text-gray-400">Remplissez les informations de votre propriété</p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="bg-[#1B2F3C] border-[#2A3F4C]">
              <CardHeader>
                <CardTitle className="text-white">Informations de base</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">
                    Titre de l'annonce <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title_fr}
                    onChange={(e) => setFormData({ ...formData, title_fr: e.target.value })}
                    placeholder="Ex: Appartement moderne avec vue sur mer"
                    className="bg-[#0A1F2E] border-[#2A3F4C] text-white"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description_fr}
                    onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
                    placeholder="Décrivez votre propriété..."
                    rows={5}
                    className="bg-[#0A1F2E] border-[#2A3F4C] text-white"
                  />
                </div>

                {/* Transaction Type */}
                <div className="space-y-2">
                  <Label htmlFor="transaction_type" className="text-white">
                    Type de transaction <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={formData.transaction_type}
                    onValueChange={(value) => setFormData({ ...formData, transaction_type: value as 'sale' | 'rent' })}
                  >
                    <SelectTrigger className="bg-[#0A1F2E] border-[#2A3F4C] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
                      <SelectItem value="sale" className="text-white">Vente</SelectItem>
                      <SelectItem value="rent" className="text-white">Location</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Property Type */}
                <div className="space-y-2">
                  <Label htmlFor="property_type" className="text-white">
                    Type de propriété <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={formData.property_type}
                    onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="bg-[#0A1F2E] border-[#2A3F4C] text-white">
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
                      {propertyTypes.map((type) => (
                        <SelectItem key={type.id} value={type.code} className="text-white">
                          {type.name_fr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-white">
                    Ville <span className="text-red-400">*</span>
                  </Label>
                  <Select
                    value={formData.city_id}
                    onValueChange={handleCityChange}
                    disabled={loading}
                  >
                    <SelectTrigger className="bg-[#0A1F2E] border-[#2A3F4C] text-white">
                      <SelectValue placeholder="Sélectionnez une ville" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id.toString()} className="text-white">
                          {city.name_fr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Neighborhood */}
                {selectedCityId && (
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood" className="text-white">
                      Quartier
                    </Label>
                    <Select
                      value={formData.neighborhood_id}
                      onValueChange={(value) => setFormData({ ...formData, neighborhood_id: value })}
                      disabled={neighborhoodsLoading}
                    >
                      <SelectTrigger className="bg-[#0A1F2E] border-[#2A3F4C] text-white">
                        <SelectValue placeholder="Sélectionnez un quartier (optionnel)" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1B2F3C] border-[#2A3F4C]">
                        {neighborhoods.map((neighborhood) => (
                          <SelectItem key={neighborhood.id} value={neighborhood.id.toString()} className="text-white">
                            {neighborhood.name_fr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-white">
                    Prix (DH) <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Ex: 1500000"
                    className="bg-[#0A1F2E] border-[#2A3F4C] text-white"
                    required
                  />
                </div>

                {/* Area */}
                <div className="space-y-2">
                  <Label htmlFor="area" className="text-white">
                    Surface (m²)
                  </Label>
                  <Input
                    id="area"
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="Ex: 120"
                    className="bg-[#0A1F2E] border-[#2A3F4C] text-white"
                  />
                </div>

                {/* Bedrooms and Bathrooms */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms" className="text-white">
                      Chambres
                    </Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      placeholder="Ex: 3"
                      className="bg-[#0A1F2E] border-[#2A3F4C] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bathrooms" className="text-white">
                      Salles de bain
                    </Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      placeholder="Ex: 2"
                      className="bg-[#0A1F2E] border-[#2A3F4C] text-white"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="pt-4 border-t border-[#2A3F4C]">
                  <h3 className="text-white font-semibold mb-4">Informations de contact</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact_phone" className="text-white">
                        Téléphone
                      </Label>
                      <Input
                        id="contact_phone"
                        type="tel"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                        placeholder="Ex: +212 6 12 34 56 78"
                        className="bg-[#0A1F2E] border-[#2A3F4C] text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_email" className="text-white">
                        Email
                      </Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        placeholder="Ex: contact@example.com"
                        className="bg-[#0A1F2E] border-[#2A3F4C] text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_whatsapp" className="text-white">
                        WhatsApp
                      </Label>
                      <Input
                        id="contact_whatsapp"
                        type="tel"
                        value={formData.contact_whatsapp}
                        onChange={(e) => setFormData({ ...formData, contact_whatsapp: e.target.value })}
                        placeholder="Ex: +212 6 12 34 56 78"
                        className="bg-[#0A1F2E] border-[#2A3F4C] text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard/advertiser')}
                    className="flex-1 border-[#2A3F4C] text-gray-300 hover:bg-[#0A1F2E]"
                    disabled={submitting}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#0FC2C0] hover:bg-[#0DA9A7] text-white"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      'Créer l\'annonce'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
