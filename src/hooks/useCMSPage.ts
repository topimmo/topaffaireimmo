/**
 * useCMSPage hook
 * Fetches page content from site_pages table with fallback to default content
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';

interface CMSPageContent {
  title: string;
  content: string;
  metaDescription?: string;
}

interface CMSPageData {
  id: string;
  slug: string;
  title_fr: string;
  title_ar: string;
  content_fr: string;
  content_ar: string;
  meta_description_fr?: string;
  meta_description_ar?: string;
  is_published: boolean;
}

/**
 * Hook to fetch CMS page content by slug
 * @param slug - Page slug (e.g., 'about', 'privacy', 'terms')
 * @param defaultTitle - Fallback title if CMS content not found
 * @param defaultContent - Fallback content if CMS content not found
 * @returns Object with page content and loading state
 */
export function useCMSPage(
  slug: string,
  defaultTitle: { fr: string; ar: string },
  defaultContent: { fr: string; ar: string }
): {
  content: CMSPageContent;
  loading: boolean;
  fromCMS: boolean;
} {
  const { language } = useLanguage();
  const [content, setContent] = useState<CMSPageContent>({
    title: language === 'ar' ? defaultTitle.ar : defaultTitle.fr,
    content: language === 'ar' ? defaultContent.ar : defaultContent.fr,
  });
  const [loading, setLoading] = useState(true);
  const [fromCMS, setFromCMS] = useState(false);

  useEffect(() => {
    fetchCMSContent();
  }, [slug, language]);

  const fetchCMSContent = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('site_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) {
        // If no CMS content found, use default
        if (error.code === 'PGRST116') {
          console.info(`No CMS content for slug "${slug}", using default content`);
          setContent({
            title: language === 'ar' ? defaultTitle.ar : defaultTitle.fr,
            content: language === 'ar' ? defaultContent.ar : defaultContent.fr,
          });
          setFromCMS(false);
        } else {
          console.error('Error fetching CMS page:', error);
          // Fallback to default on error
          setContent({
            title: language === 'ar' ? defaultTitle.ar : defaultTitle.fr,
            content: language === 'ar' ? defaultContent.ar : defaultContent.fr,
          });
          setFromCMS(false);
        }
      } else if (data) {
        // Use CMS content
        const cmsData = data as CMSPageData;
        setContent({
          title: language === 'ar' ? cmsData.title_ar : cmsData.title_fr,
          content: language === 'ar' ? cmsData.content_ar : cmsData.content_fr,
          metaDescription:
            language === 'ar'
              ? cmsData.meta_description_ar || undefined
              : cmsData.meta_description_fr || undefined,
        });
        setFromCMS(true);
      }
    } catch (error) {
      console.error('Exception fetching CMS page:', error);
      // Fallback to default on exception
      setContent({
        title: language === 'ar' ? defaultTitle.ar : defaultTitle.fr,
        content: language === 'ar' ? defaultContent.ar : defaultContent.fr,
      });
      setFromCMS(false);
    } finally {
      setLoading(false);
    }
  };

  return { content, loading, fromCMS };
}
