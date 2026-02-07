// Guides Listing Page - SEO educational content hub
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { BookOpen, ArrowRight, TrendingUp, Home, FileText, DollarSign } from 'lucide-react';
import SEO from '@/components/SEO';

interface GuidePreview {
  id: string;
  slug: string;
  title_fr: string;
  meta_description_fr: string | null;
  updated_at: string;
}

export default function GuidesPage() {
  const [guides, setGuides] = useState<GuidePreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGuides() {
      try {
        const { data, error } = await supabase
          .from('site_pages')
          .select('id, slug, title_fr, meta_description_fr, updated_at')
          .eq('is_published', true)
          .like('slug', '%-%-%-%') // Match guide slugs with multiple hyphens
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setGuides(data);
      } catch (err) {
        console.error('Error fetching guides:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchGuides();
  }, []);

  // Structured data for FAQPage
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Comment acheter un appartement au Maroc ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pour acheter un appartement au Maroc, suivez ces étapes : définir votre budget, obtenir un financement bancaire, rechercher votre bien, visiter les propriétés, vérifier les documents légaux (titre foncier), négocier le prix, signer le compromis de vente, et finaliser chez le notaire."
        }
      },
      {
        "@type": "Question",
        "name": "Quels sont les frais d'achat immobilier au Maroc ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Les frais d'achat au Maroc incluent : frais de notaire (2-3%), droits d'enregistrement (1,5%), frais d'agence (2-3% si applicable). Au total, prévoyez environ 6-9% du prix d'achat en frais additionnels."
        }
      },
      {
        "@type": "Question",
        "name": "Quelle est la rentabilité locative au Maroc ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "La rentabilité locative au Maroc varie de 4% à 8% brut selon la ville et le type de bien. Casablanca offre 5-6%, Marrakech 6-8% (location saisonnière jusqu'à 12%), et Rabat 4-6%."
        }
      },
      {
        "@type": "Question",
        "name": "Vaut-il mieux acheter ou louer au Maroc ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Acheter est préférable si vous restez plus de 7 ans, avez un emploi stable et un apport de 20-30%. Louer est mieux si vous avez besoin de flexibilité, restez moins de 5 ans, ou préférez investir votre capital ailleurs."
        }
      },
      {
        "@type": "Question",
        "name": "Quels sont les droits du locataire au Maroc ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Le locataire a droit à un logement décent, un bail écrit, une protection contre l'expulsion abusive, le renouvellement prioritaire du bail, et peut recevoir des visiteurs. Le propriétaire ne peut augmenter le loyer que de 10% maximum tous les 3 ans."
        }
      }
    ]
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": "https://www.topaffaireimmo.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Guides Immobilier",
        "item": "https://www.topaffaireimmo.com/guides"
      }
    ]
  };

  // Featured guides
  const featuredGuides = [
    {
      slug: 'comment-acheter-appartement-maroc',
      title: 'Comment Acheter un Appartement au Maroc',
      description: 'Guide complet : étapes, documents, budget, conseils et pièges à éviter',
      icon: Home,
      color: 'bg-blue-500'
    },
    {
      slug: 'comment-vendre-bien-immobilier-maroc',
      title: 'Comment Vendre un Bien Immobilier',
      description: 'Stratégies pour vendre rapidement et au meilleur prix',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      slug: 'location-droits-devoirs-maroc',
      title: 'Location : Droits et Devoirs (حقوق وواجبات)',
      description: 'Loi location Maroc, contrat de bail, caution, résolution conflits',
      icon: FileText,
      color: 'bg-purple-500'
    },
    {
      slug: 'investissement-immobilier-maroc',
      title: 'Investissement Immobilier au Maroc',
      description: 'Rentabilité, meilleures villes, calculs, fiscalité, conseils experts',
      icon: DollarSign,
      color: 'bg-orange-500'
    },
    {
      slug: 'acheter-ou-louer-maroc',
      title: 'Acheter ou Louer : Que Choisir ?',
      description: 'Comparatif complet, calculs, avantages/inconvénients selon profil',
      icon: BookOpen,
      color: 'bg-indigo-500'
    }
  ];

  return (
    <>
      <SEO
        title="Guides Immobilier Maroc | Achat, Vente, Location, Investissement"
        description="Guides complets pour l'immobilier au Maroc : Comment acheter, vendre, louer, investir. Droits et devoirs, fiscalité, rentabilité. Conseils d'experts 2026."
        canonical="/guides"
        structuredData={[faqSchema, breadcrumbSchema]}
      />

      <div className="bg-gray-50 min-h-screen">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Guides Immobilier Maroc
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
                Tout ce qu'il faut savoir sur l'achat, la vente, la location et l'investissement immobilier au Maroc
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Featured Guides */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Guides Essentiels
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredGuides.map((guide) => {
                const Icon = guide.icon;
                return (
                  <Link
                    key={guide.slug}
                    to={`/guides/${guide.slug}`}
                    className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className={`${guide.color} p-6 text-white`}>
                      <Icon className="h-12 w-12 mb-4" />
                      <h3 className="text-xl font-bold mb-2">
                        {guide.title}
                      </h3>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-600 mb-4">
                        {guide.description}
                      </p>
                      <div className="flex items-center text-primary font-semibold group-hover:translate-x-2 transition-transform">
                        Lire le guide
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* All Guides */}
          {guides.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Tous les Guides
              </h2>
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {guides.map((guide) => (
                    <Link
                      key={guide.id}
                      to={`/guides/${guide.slug}`}
                      className="bg-white rounded-lg border border-gray-200 p-6 hover:border-primary hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <BookOpen className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2 text-gray-900 group-hover:text-primary">
                            {guide.title_fr}
                          </h3>
                          {guide.meta_description_fr && (
                            <p className="text-gray-600 text-sm mb-4">
                              {guide.meta_description_fr.substring(0, 120)}...
                            </p>
                          )}
                          <div className="text-sm text-gray-500">
                            Mis à jour : {new Date(guide.updated_at).toLocaleDateString('fr-MA')}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* FAQ Section */}
          <section className="mt-16 bg-white rounded-xl shadow-md p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Questions Fréquentes sur l'Immobilier au Maroc
            </h2>
            
            <div className="space-y-6">
              {faqSchema.mainEntity.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 pb-6 last:border-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {faq.name}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {faq.acceptedAnswer.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="mt-16 bg-gradient-to-r from-primary to-primary-dark rounded-xl p-8 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">
              Prêt à passer à l'action ?
            </h2>
            <p className="text-lg mb-6 text-blue-100">
              Explorez des milliers d'annonces immobilières vérifiées au Maroc
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/acheter">
                <button className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                  Acheter un bien
                </button>
              </Link>
              <Link to="/louer">
                <button className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                  Louer un bien
                </button>
              </Link>
              <Link to="/add-listing">
                <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition">
                  Publier une annonce
                </button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
