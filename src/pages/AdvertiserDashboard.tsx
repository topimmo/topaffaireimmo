/**
 * Advertiser Dashboard
 * 
 * Dashboard for real estate advertisers (owners, brokers, agencies)
 * Shows property listings with management tools
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Edit,
  Trash2,
  Home,
  Building,
  Landmark,
  Trees,
  Store,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { cn, isValidUuid } from '@/lib/utils';
import { toast } from 'sonner';

interface Property {
  id: string;
  transaction_type: string;
  property_type: string;
  title_fr: string;
  title_ar: string;
  price: number;
  status: string;
  images: string[];
  created_at: string;
  city: {
    name_fr: string;
    name_ar: string;
  };
}

const propertyIcons: Record<string, typeof Building> = {
  apartment: Building,
  house: Home,
  villa: Landmark,
  commercial: Store,
  land: Trees,
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-slate-100 text-slate-600',
  inactive: 'bg-gray-100 text-gray-800',
};

export default function AdvertiserDashboard() {
  const { t, language, isRTL } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: '/dashboard/advertiser' } });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    if (!user?.id || !isValidUuid(user.id)) {
      console.warn('⚠️ [AdvertiserDashboard] Cannot fetch properties - user not loaded');
      setLoading(false);
      return;
    }

    console.log(`🔍 [AdvertiserDashboard] Fetching properties for user: ${user.id}`);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          id,
          transaction_type,
          property_type,
          title_fr,
          title_ar,
          price,
          status,
          images,
          created_at,
          city:cities(name_fr, name_ar)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [AdvertiserDashboard] Error fetching properties:', error);
        throw error;
      }

      console.log(`✅ [AdvertiserDashboard] Fetched ${data?.length || 0} properties`);
      setProperties(data || []);
    } catch (error) {
      console.error('❌ [AdvertiserDashboard] Error:', error);
      toast.error(
        isRTL
          ? 'تعذر تحميل الإعلانات'
          : 'Erreur lors du chargement des annonces'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', deleteId)
        .eq('owner_id', user?.id);

      if (error) throw error;

      toast.success(
        isRTL
          ? 'تم حذف الإعلان بنجاح'
          : 'Annonce supprimée avec succès'
      );
      
      setProperties(properties.filter((p) => p.id !== deleteId));
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error(
        isRTL
          ? 'تعذر حذف الإعلان'
          : 'Erreur lors de la suppression'
      );
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const copy = {
    title: isRTL ? 'لوحة تحكم المعلن' : 'Tableau de bord annonceur',
    addListing: isRTL ? 'إضافة إعلان جديد' : 'Ajouter une annonce',
    myListings: isRTL ? 'إعلاناتي' : 'Mes annonces',
    noListings: isRTL ? 'لا توجد إعلانات بعد' : 'Aucune annonce pour le moment',
    addFirst: isRTL ? 'أضف أول إعلان لك' : 'Ajoutez votre première annonce',
    edit: isRTL ? 'تعديل' : 'Modifier',
    delete: isRTL ? 'حذف' : 'Supprimer',
    deleteConfirm: isRTL ? 'هل أنت متأكد؟' : 'Êtes-vous sûr ?',
    deleteDesc: isRTL
      ? 'سيتم حذف هذا الإعلان نهائياً.'
      : 'Cette annonce sera supprimée définitivement.',
    cancel: isRTL ? 'إلغاء' : 'Annuler',
    confirm: isRTL ? 'تأكيد' : 'Confirmer',
    price: isRTL ? 'السعر' : 'Prix',
    dh: isRTL ? 'درهم' : 'DH',
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 pt-20 pb-16">
        <div className={`container px-4 md:px-6 py-8 ${isRTL ? 'rtl' : 'ltr'}`}>
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">{copy.title}</h1>
              <p className="text-muted-foreground">
                {properties.length} {copy.myListings.toLowerCase()}
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/add-listing">
                <Plus className={cn('h-5 w-5', isRTL ? 'ml-2' : 'mr-2')} />
                {copy.addListing}
              </Link>
            </Button>
          </div>

          {/* Properties Grid */}
          {properties.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <AlertTriangle className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{copy.noListings}</h3>
              <p className="mb-6 text-muted-foreground">{copy.addFirst}</p>
              <Button asChild>
                <Link to="/add-listing">
                  <Plus className={cn('h-4 w-4', isRTL ? 'ml-2' : 'mr-2')} />
                  {copy.addListing}
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => {
                const Icon = propertyIcons[property.property_type] || Building;
                const title = language === 'ar' ? property.title_ar : property.title_fr;
                const cityName = language === 'ar' ? property.city?.name_ar : property.city?.name_fr;
                const imageUrl = Array.isArray(property.images) 
                  ? property.images[0] 
                  : null;

                return (
                  <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {imageUrl && (
                      <div className="aspect-video w-full overflow-hidden bg-muted">
                        <img
                          src={imageUrl}
                          alt={title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
                            <CardDescription className="mt-1">{cityName}</CardDescription>
                          </div>
                        </div>
                        <Badge className={cn('shrink-0', statusColors[property.status])}>
                          {property.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-lg">
                          {property.price.toLocaleString()} {copy.dh}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link to={`/edit-listing/${property.id}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteId(property.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteConfirm}</AlertDialogTitle>
            <AlertDialogDescription>{copy.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className={cn('h-4 w-4 animate-spin', isRTL ? 'ml-2' : 'mr-2')} />}
              {copy.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
