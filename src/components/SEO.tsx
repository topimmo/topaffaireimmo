import { useEffect } from 'react';
import { getCanonicalUrl, shouldAllowIndexing } from '../lib/seo';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  structuredData?: object | object[];
}

/**
 * SEO component for dynamic meta tag management
 * Updates document head with SEO-optimized meta tags
 * Morocco-focused real estate platform
 */
export function useSEO(props: SEOProps) {
  useEffect(() => {
    const {
      title = 'TopAffaireImmo - Trouvez votre propriété parfaite au Maroc',
      description = 'TopAffaireImmo est la plateforme immobilière de référence au Maroc. Trouvez des appartements, maisons, villas et propriétés commerciales à vendre ou à louer.',
      keywords = 'immobilier Maroc, propriété Maroc, appartements Maroc, vente Maroc, location Maroc, Casablanca, Rabat, Marrakech',
      canonical,
      ogTitle,
      ogDescription,
      ogImage = 'https://topaffaireimmo.vercel.app/og-image.jpg',
      ogType = 'website',
      noindex = false,
      structuredData,
    } = props;

    // Update document title
    document.title = title;

    // Helper to update or create meta tag
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${name}"]`);
      
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      
      tag.setAttribute('content', content);
    };

    // Helper to update link tag
    const updateLinkTag = (rel: string, href: string) => {
      let tag = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      
      if (!tag) {
        tag = document.createElement('link');
        tag.rel = rel;
        document.head.appendChild(tag);
      }
      
      tag.href = href;
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    
    // Robots meta tag
    const allowIndexing = !noindex && shouldAllowIndexing();
    const robotsContent = allowIndexing 
      ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
      : 'noindex, nofollow';
    updateMetaTag('robots', robotsContent);

    // Canonical URL
    let canonicalUrl: string;
    if (canonical) {
      canonicalUrl = getCanonicalUrl(canonical);
    } else if (typeof window !== 'undefined') {
      canonicalUrl = getCanonicalUrl(window.location.pathname);
    } else {
      canonicalUrl = getCanonicalUrl('/');
    }
    updateLinkTag('canonical', canonicalUrl);

    // Open Graph tags
    updateMetaTag('og:title', ogTitle || title, true);
    updateMetaTag('og:description', ogDescription || description, true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:type', ogType, true);
    updateMetaTag('og:url', canonicalUrl, true);
    updateMetaTag('og:locale', 'fr_MA', true);
    updateMetaTag('og:locale:alternate', 'ar_MA', true);
    updateMetaTag('og:site_name', 'TopAffaireImmo', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', ogTitle || title);
    updateMetaTag('twitter:description', ogDescription || description);
    updateMetaTag('twitter:image', ogImage);

    // Geographic tags for Morocco
    updateMetaTag('geo.region', 'MA');
    updateMetaTag('geo.placename', 'Morocco');

    // Hreflang tags
    const hreflangFr = document.querySelector('link[hreflang="fr-MA"]') as HTMLLinkElement;
    const hreflangAr = document.querySelector('link[hreflang="ar-MA"]') as HTMLLinkElement;
    
    if (!hreflangFr) {
      const linkFr = document.createElement('link');
      linkFr.rel = 'alternate';
      linkFr.hreflang = 'fr-MA';
      linkFr.href = canonicalUrl;
      document.head.appendChild(linkFr);
    } else {
      hreflangFr.href = canonicalUrl;
    }

    if (!hreflangAr) {
      const linkAr = document.createElement('link');
      linkAr.rel = 'alternate';
      linkAr.hreflang = 'ar-MA';
      linkAr.href = canonicalUrl;
      document.head.appendChild(linkAr);
    } else {
      hreflangAr.href = canonicalUrl;
    }

    // Structured data (JSON-LD)
    if (structuredData) {
      let scriptTag = document.querySelector('script[data-type="structured-data"]');
      
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        scriptTag.setAttribute('data-type', 'structured-data');
        document.head.appendChild(scriptTag);
      }
      
      scriptTag.textContent = JSON.stringify(structuredData);
    }

    // Cleanup function
    return () => {
      // Note: We don't remove tags on unmount to avoid flickering
      // The next component will update them
    };
  }, [props]);
}

/**
 * SEO component wrapper
 */
export default function SEO(props: SEOProps) {
  useSEO(props);
  return null;
}
