/**
 * Analytics Tracking Utility (Privacy-Safe)
 * Track user behavior without storing personal data
 * All events are aggregated and anonymized
 */

import { supabase } from './supabase';
import logger from './logger';

/**
 * Event types for analytics
 */
export type AnalyticsEvent = 'listing_view' | 'profile_view' | 'phone_reveal' | 'search';

/**
 * Generate anonymous session ID
 * Stored in sessionStorage (not localStorage) for privacy
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  try {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  } catch (error) {
    // SessionStorage not available - return empty string
    return '';
  }
}

/**
 * Track analytics event (privacy-safe)
 * @param eventType - Type of event
 * @param entityId - ID of the entity (listing, profile, etc.) - NOT user ID
 * @param metadata - Additional context (no personal data)
 */
export async function trackEvent(
  eventType: AnalyticsEvent,
  entityId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    if (!supabase) return;

    // Get anonymous session ID
    const sessionId = getSessionId();

    // Ensure no personal data in metadata
    const safeMetadata = metadata ? sanitizeMetadata(metadata) : {};

    // Track event
    await supabase.rpc('track_analytics_event', {
      p_event_type: eventType,
      p_entity_id: entityId || null,
      p_metadata: safeMetadata,
      p_session_id: sessionId || null,
    });

    // Log in development
    if (import.meta.env.DEV) {
      console.log(
        `📊 [Analytics] ${eventType}`,
        entityId ? `entity:${entityId}` : '',
        safeMetadata
      );
    }
  } catch (error) {
    // Silently fail - don't let analytics crash the app
    if (import.meta.env.DEV) {
      logger.debug('Analytics', 'Failed to track event', { eventType, error });
    }
  }
}

/**
 * Sanitize metadata to ensure no personal data
 * Remove any fields that might contain personal information
 */
function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  // Block both camelCase and snake_case variants of sensitive fields
  const blockedFields = [
    'email', 'phone', 'name', 'address',
    'user_id', 'userId',
    'session_id', 'sessionId',
    'ip_address', 'ipAddress',
    'password', 'token', 'ip', 'location'
  ];

  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    
    // Skip blocked fields
    if (blockedFields.some(blocked => lowerKey.includes(blocked))) {
      continue;
    }

    // Only allow primitive types and simple objects
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      sanitized[key] = value;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Recursively sanitize nested objects (shallow only)
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
    }
  }

  return sanitized;
}

/**
 * Track listing view
 */
export async function trackListingView(listingId: string, metadata?: Record<string, unknown>): Promise<void> {
  await trackEvent('listing_view', listingId, metadata);
}

/**
 * Track profile view
 */
export async function trackProfileView(profileId: string, metadata?: Record<string, unknown>): Promise<void> {
  await trackEvent('profile_view', profileId, metadata);
}

/**
 * Track phone reveal
 */
export async function trackPhoneReveal(entityId: string, entityType: 'listing' | 'profile'): Promise<void> {
  await trackEvent('phone_reveal', entityId, { entityType });
}

/**
 * Track search usage
 */
export async function trackSearch(metadata: Record<string, unknown>): Promise<void> {
  await trackEvent('search', undefined, metadata);
}

/**
 * Get analytics summary (admin only)
 * This would be called from the admin dashboard
 */
export async function getAnalyticsSummary(
  eventType?: AnalyticsEvent,
  startDate?: Date,
  endDate?: Date
): Promise<{
  total: number;
  byDay: Array<{ date: string; count: number }>;
  topEntities: Array<{ entity_id: string; count: number }>;
} | null> {
  try {
    if (!supabase) return null;

    const query = supabase
      .from('analytics_events')
      .select('*', { count: 'exact' });

    if (eventType) {
      query.eq('event_type', eventType);
    }

    if (startDate) {
      query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query.lte('created_at', endDate.toISOString());
    }

    const { data, count, error } = await query;

    if (error) throw error;

    // Aggregate by day (client-side for simplicity)
    const byDay: Record<string, number> = {};
    const entityCounts: Record<string, number> = {};

    if (data) {
      data.forEach((event) => {
        const date = new Date(event.created_at).toISOString().split('T')[0];
        byDay[date] = (byDay[date] || 0) + 1;

        if (event.entity_id) {
          entityCounts[event.entity_id] = (entityCounts[event.entity_id] || 0) + 1;
        }
      });
    }

    return {
      total: count || 0,
      byDay: Object.entries(byDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topEntities: Object.entries(entityCounts)
        .map(([entity_id, count]) => ({ entity_id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10), // Top 10 entities
    };
  } catch (error) {
    logger.error('Analytics', 'Failed to get analytics summary', error);
    return null;
  }
}

/**
 * Initialize analytics tracking
 * Call this once when the app loads
 */
export function initializeAnalytics(): void {
  if (typeof window === 'undefined') return;

  // Initialize session ID
  getSessionId();

  if (import.meta.env.DEV) {
    console.log('📊 [Analytics] Initialized (privacy-safe mode)');
  }
}
