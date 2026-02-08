// Guide Page - Display SEO educational guides from site_pages CMS
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Calendar, BookOpen, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';

interface GuideData {
  id: string;
  slug: string;
  title_fr: string;
  title_ar: string;
  content_fr: string;
  content_ar: string;
  meta_description_fr: string | null;
  meta_description_ar: string | null;
  created_at: string;
  updated_at: string;
}

export default function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const [guide, setGuide] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'fr' | 'ar'>('fr');

  useEffect(() => {
    async function fetchGuide() {
      if (!slug) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('site_pages')
          .select('*')
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (error) throw error;
        if (data) {
          setGuide(data);
        } else {
          setError('Guide not found');
        }
      } catch (err) {
        console.error('Error fetching guide:', err);
        setError('Failed to load guide');
      } finally {
        setLoading(false);
      }
    }

    fetchGuide();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Guide introuvable</h1>
          <p className="text-gray-600 mb-6">{error || 'Ce guide n\'existe pas'}</p>
          <Link to="/guides">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux guides
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const title = language === 'fr' ? guide.title_fr : guide.title_ar;
  const content = language === 'fr' ? guide.content_fr : guide.content_ar;
  const metaDescription = language === 'fr' ? guide.meta_description_fr : guide.meta_description_ar;

  // JSON-LD structured data for Article
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": metaDescription || title,
    "author": {
      "@type": "Organization",
      "name": "TopAffaireImmo"
    },
    "publisher": {
      "@type": "Organization",
      "name": "TopAffaireImmo",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.topaffaireimmo.com/logo.png"
      }
    },
    "datePublished": guide.created_at,
    "dateModified": guide.updated_at,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.topaffaireimmo.com/guides/${slug}`
    },
    "image": `https://www.topaffaireimmo.com/og-image.jpg`,
    "inLanguage": language === 'fr' ? 'fr-MA' : 'ar-MA'
  };

  // Breadcrumb Schema
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
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": title,
        "item": `https://www.topaffaireimmo.com/guides/${slug}`
      }
    ]
  };

  return (
    <>
      <SEO
        title={`${title} | TopAffaireImmo`}
        description={metaDescription || title}
        canonical={`/guides/${slug}`}
        structuredData={[articleSchema, breadcrumbSchema]}
        ogType="article"
      />

      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
              <Link to="/" className="hover:text-primary">Accueil</Link>
              <span>/</span>
              <Link to="/guides" className="hover:text-primary">Guides</Link>
              <span>/</span>
              <span className="text-gray-900">{title}</span>
            </nav>

            {/* Language Toggle */}
            <div className="flex items-center justify-between mb-6">
              <Link to="/guides">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Tous les guides
                </Button>
              </Link>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLanguage('fr')}
                  className={`px-3 py-1 rounded ${
                    language === 'fr'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Français
                </button>
                <button
                  onClick={() => setLanguage('ar')}
                  className={`px-3 py-1 rounded ${
                    language === 'ar'
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Mis à jour : {new Date(guide.updated_at).toLocaleDateString('fr-MA')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Guide complet</span>
              </div>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: title,
                      text: metaDescription || title,
                      url: window.location.href,
                    });
                  }
                }}
                className="flex items-center gap-2 hover:text-primary"
              >
                <Share2 className="h-4 w-4" />
                <span>Partager</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <article className="max-w-4xl mx-auto px-4 py-12">
          <div className={`prose prose-lg max-w-none ${
            language === 'ar' ? 'prose-rtl' : ''
          }`}>
            {/* Render markdown content as HTML */}
            <div
              dangerouslySetInnerHTML={{
                __html: content
                  .replace(/^# /gm, '<h1 class="text-3xl font-bold text-gray-900 mt-8 mb-4">')
                  .replace(/^## /gm, '<h2 class="text-2xl font-bold text-gray-900 mt-8 mb-4 border-b-2 border-gray-200 pb-2">')
                  .replace(/^### /gm, '<h3 class="text-xl font-semibold text-gray-900 mt-6 mb-3">')
                  .replace(/\n\n/g, '</p><p class="text-gray-700 leading-relaxed mb-4">')
                  .replace(/^- /gm, '<li>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/_(.*?)_/g, '<em>$1</em>')
                  .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary hover:underline font-medium">$1</a>')
              }}
            />
          </div>

          {/* CTA Section */}
          <div className="mt-12 bg-gradient-to-r from-primary to-primary-dark rounded-lg p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">
              Prêt à trouver votre propriété idéale ?
            </h2>
            <p className="text-lg mb-6">
              Explorez des milliers d'annonces vérifiées sur TopAffaireImmo
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/acheter">
                <Button variant="secondary" size="lg">
                  Acheter un bien
                </Button>
              </Link>
              <Link to="/louer">
                <Button variant="secondary" size="lg">
                  Louer un bien
                </Button>
              </Link>
            </div>
          </div>

          {/* Related Guides */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Guides recommandés
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link 
                to="/guides/comment-acheter-appartement-maroc"
                className="p-6 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition"
              >
                <h3 className="font-semibold text-lg mb-2">
                  Comment acheter un appartement au Maroc
                </h3>
                <p className="text-gray-600 text-sm">
                  Guide complet avec toutes les étapes d'achat
                </p>
              </Link>
              
              <Link 
                to="/guides/comment-vendre-bien-immobilier-maroc"
                className="p-6 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition"
              >
                <h3 className="font-semibold text-lg mb-2">
                  Comment vendre un bien immobilier
                </h3>
                <p className="text-gray-600 text-sm">
                  Stratégies pour vendre rapidement et au meilleur prix
                </p>
              </Link>
              
              <Link 
                to="/guides/investissement-immobilier-maroc"
                className="p-6 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition"
              >
                <h3 className="font-semibold text-lg mb-2">
                  Investissement immobilier au Maroc
                </h3>
                <p className="text-gray-600 text-sm">
                  Rentabilité, villes, et conseils d'expert
                </p>
              </Link>
              
              <Link 
                to="/guides/acheter-ou-louer-maroc"
                className="p-6 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition"
              >
                <h3 className="font-semibold text-lg mb-2">
                  Acheter ou louer : que choisir ?
                </h3>
                <p className="text-gray-600 text-sm">
                  Comparatif complet pour prendre la bonne décision
                </p>
              </Link>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
