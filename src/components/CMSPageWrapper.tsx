/**
 * CMSPageWrapper component
 * Wraps a page component and loads content from CMS if available
 */

import { ReactNode } from 'react';
import { useCMSPage } from '@/hooks/useCMSPage';
import { Loader2 } from 'lucide-react';

interface CMSPageWrapperProps {
  slug: string;
  defaultTitle: { fr: string; ar: string };
  children: ReactNode;
  className?: string;
}

export function CMSPageWrapper({
  slug,
  defaultTitle,
  children,
  className = '',
}: CMSPageWrapperProps) {
  const { content, loading, fromCMS } = useCMSPage(
    slug,
    defaultTitle,
    { fr: '', ar: '' }
  );

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (fromCMS && content.content) {
    return (
      <div className={`container mx-auto px-4 max-w-4xl ${className}`}>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
          {content.title}
        </h1>
        <div
          className="prose prose-lg max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: content.content.replace(/\n/g, '<br/>') }}
        />
      </div>
    );
  }

  // Fallback to children (original content)
  return <>{children}</>;
}
