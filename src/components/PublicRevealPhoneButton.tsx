/**
 * PublicRevealPhoneButton Component
 * 
 * Public phone reveal flow - NO authentication required.
 * Calls secure Edge Function endpoint with rate limiting and analytics.
 * 
 * Features:
 * - Works for anonymous visitors
 * - Rate limiting (10 reveals/minute per IP+UA)
 * - Analytics tracking (client-side events)
 * - Masked phone display initially
 * - Security: Phone fetched from backend on click, not in HTML
 */

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Phone, Lock, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { maskPhoneNumber } from '@/lib/phoneUtils';

interface PublicRevealPhoneButtonProps {
  entityType: 'listing' | 'service';
  entityId: string;
  entityName?: string;
  source?: 'immobilier' | 'services';
  // Optional: Show masked phone initially (for UX)
  maskedPhone?: string;
}

interface RevealResponse {
  success: boolean;
  phone?: string;
  whatsapp?: string;
  email?: string;
  businessName?: string;
  error?: string;
  message?: string;
}

export default function PublicRevealPhoneButton({
  entityType,
  entityId,
  entityName,
  source = 'immobilier',
  maskedPhone,
}: PublicRevealPhoneButtonProps) {
  const { isRTL, language } = useLanguage();
  
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [contactInfo, setContactInfo] = useState<RevealResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track analytics event
  const trackAnalytics = (eventName: string, metadata?: Record<string, any>) => {
    // Client-side analytics tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, {
        entity_type: entityType,
        entity_id: entityId,
        source: source,
        language: language,
        ...metadata,
      });
    }
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('[Analytics]', eventName, { entityType, entityId, source, ...metadata });
    }
  };

  const handleRevealClick = async () => {
    // Track click event immediately
    trackAnalytics('phone_reveal_clicked', {
      entity_name: entityName,
    });

    setLoading(true);
    setError(null);

    try {
      // Get Supabase URL and anon key from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }

      // Call Edge Function endpoint
      const response = await fetch(`${supabaseUrl}/functions/v1/reveal-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          entityType,
          entityId,
          metadata: {
            referrer: typeof document !== 'undefined' ? document.referrer : undefined,
            pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
            language: language,
            source: source,
          },
        }),
      });

      const data: RevealResponse = await response.json();

      if (!response.ok) {
        // Handle rate limit
        if (response.status === 429) {
          setError(data.message || 'Rate limit exceeded');
          toast.error(
            isRTL 
              ? 'تم تجاوز الحد الأقصى للطلبات. يرجى الانتظار قليلاً.'
              : 'Trop de demandes. Veuillez patienter.'
          );
          trackAnalytics('phone_reveal_blocked', {
            reason: 'rate_limit',
          });
          return;
        }

        // Handle other errors
        throw new Error(data.error || data.message || 'Failed to reveal phone');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to reveal phone');
      }

      // Success!
      setContactInfo(data);
      setRevealed(true);
      
      toast.success(
        isRTL 
          ? 'تم عرض معلومات الاتصال'
          : 'Coordonnées affichées'
      );

      trackAnalytics('phone_reveal_success', {
        has_phone: !!data.phone,
        has_whatsapp: !!data.whatsapp,
        has_email: !!data.email,
      });

    } catch (err) {
      console.error('Error revealing phone:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      toast.error(
        isRTL 
          ? 'فشل عرض معلومات الاتصال'
          : 'Échec de l\'affichage des coordonnées'
      );

      trackAnalytics('phone_reveal_error', {
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // If revealed, show contact information
  if (revealed && contactInfo) {
    return (
      <div className="space-y-3">
        {contactInfo.phone && (
          <a
            href={`tel:${contactInfo.phone}`}
            className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Phone className="h-5 w-5" />
            <div className="flex flex-col">
              <span className="font-semibold">{contactInfo.phone}</span>
              {contactInfo.businessName && (
                <span className="text-xs opacity-90">{contactInfo.businessName}</span>
              )}
            </div>
          </a>
        )}
        
        {contactInfo.whatsapp && (
          <a
            href={`https://wa.me/${contactInfo.whatsapp.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            <span className="font-medium">WhatsApp</span>
          </a>
        )}
        
        {contactInfo.email && (
          <a
            href={`mailto:${contactInfo.email}`}
            className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">{contactInfo.email}</span>
          </a>
        )}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">
            {isRTL ? 'خطأ في عرض الرقم' : 'Erreur lors de l\'affichage'}
          </span>
        </div>
        <Button
          onClick={handleRevealClick}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          {isRTL ? 'إعادة المحاولة' : 'Réessayer'}
        </Button>
      </div>
    );
  }

  // Show reveal button
  return (
    <div className="space-y-2">
      <Button
        onClick={handleRevealClick}
        className="flex items-center gap-2 w-full"
        variant="default"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {isRTL ? 'جاري التحميل...' : 'Chargement...'}
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            {isRTL ? 'عرض رقم الهاتف' : 'Afficher le numéro'}
          </>
        )}
      </Button>
      
      {maskedPhone && (
        <p className="text-sm text-muted-foreground text-center">
          {maskPhoneNumber(maskedPhone)}
        </p>
      )}
      
      <p className="text-xs text-muted-foreground">
        {isRTL 
          ? 'انقر للكشف عن معلومات الاتصال - مجاني 100٪'
          : 'Cliquez pour révéler les coordonnées - 100% gratuit'}
      </p>
    </div>
  );
}
