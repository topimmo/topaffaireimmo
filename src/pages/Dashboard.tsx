import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';

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

export default function Dashboard() {
  const { t, language, isRTL } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: '/dashboard' } });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  const fetchProperties = async () => {
    setLoading(true);
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
      .eq('owner_id', user!.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProperties(data as unknown as Property[]);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', deleteId);

    if (!error) {
      setProperties((prev) => prev.filter((p) => p.id !== deleteId));
    }

    setDeleteId(null);
    setDeleting(false);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: isRTL ? 'مسودة' : 'Brouillon',
      pending: t('dashboard.pending'),
      approved: isRTL ? 'تمت الموافقة' : 'Approuvé',
      published: isRTL ? 'تمت الموافقة' : 'Approuvé', // Show "Approved" for published listings in advertiser view
      rejected: t('dashboard.rejected'),
      archived: isRTL ? 'مؤرشف' : 'Archivé',
      inactive: t('dashboard.inactive'),
    };
    return labels[status] || status;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-5xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-semibold text-foreground">
                {t('dashboard.title')}
              </h1>
              {user && (
                <p className="text-muted-foreground mt-1">
                  {isRTL ? 'مرحباً' : 'Bienvenue'}, {user.email}
                </p>
              )}
            </div>
            <Button asChild>
              <Link to="/add-listing">
                <Plus className="h-4 w-4" />
                {t('dashboard.addNew')}
              </Link>
            </Button>
          </div>

          {/* Listings */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : properties.length === 0 ? (
            <div className="bg-white rounded-2xl border p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Home className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                {t('dashboard.noListings')}
              </h2>
              <p className="text-muted-foreground mb-6">{t('dashboard.createFirst')}</p>
              <Button asChild>
                <Link to="/add-listing">
                  <Plus className="h-4 w-4" />
                  {t('dashboard.addNew')}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {properties.map((property) => {
                const Icon = propertyIcons[property.property_type] || Building;
                const title = language === 'ar' ? property.title_ar : property.title_fr;
                const cityName =
                  language === 'ar' ? property.city?.name_ar : property.city?.name_fr;

                return (
                  <div
                    key={property.id}
                    className="bg-white rounded-xl border p-4 sm:p-6 flex flex-col sm:flex-row gap-4"
                  >
                    {/* Image */}
                    <div className="w-full sm:w-40 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {property.images?.[0] ? (
                        <img
                          src={property.images[0]}
                          alt={title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge
                          variant="secondary"
                          className={cn('font-normal', statusColors[property.status])}
                        >
                          {getStatusLabel(property.status)}
                        </Badge>
                        <Badge variant="outline" className="font-normal">
                          {property.transaction_type === 'sale'
                            ? t('property.forSale')
                            : t('property.forRent')}
                        </Badge>
                      </div>

                      <h3 className="font-display text-lg font-semibold text-foreground truncate">
                        {title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">{cityName}</p>

                      <p className="font-mono-price text-lg font-semibold text-primary">
                        {formatPrice(property.price)} MAD
                        {property.transaction_type === 'rent' && (
                          <span className="text-sm font-normal text-muted-foreground">
                            {t('property.perMonth')}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2 sm:gap-3 sm:items-end justify-end">
                      {/* Edit button - disabled when locked */}
                      {(['draft', 'rejected'].includes(property.status)) ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild 
                          className="min-w-[100px] sm:w-28 gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Link to={`/edit-listing/${property.id}`}>
                            <Edit className="h-4 w-4" />
                            <span>{t('dashboard.edit')}</span>
                          </Link>
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled 
                          className="min-w-[100px] sm:w-28 gap-2 opacity-50 cursor-not-allowed"
                          title={isRTL ? 'الإعلان مقفل - اتصل بالدعم' : 'Annonce verrouillée - contactez le support'}
                        >
                          <Edit className="h-4 w-4" />
                          <span>{t('dashboard.edit')}</span>
                        </Button>
                      )}
                      
                      {/* Delete button - only for draft/rejected */}
                      {(['draft', 'rejected'].includes(property.status)) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(property.id)}
                          className="min-w-[120px] sm:w-28 gap-2 text-destructive border-destructive hover:bg-destructive hover:text-white transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>{t('dashboard.delete')}</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="min-w-[120px] sm:w-28 gap-2 opacity-50 cursor-not-allowed"
                          title={isRTL ? 'لا يمكن الحذف' : 'Suppression non autorisée'}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>{t('dashboard.delete')}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('common.confirm')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? 'هل أنت متأكد أنك تريد حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.'
                : 'Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('dashboard.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
