/**
 * Lead Tracking Utilities
 * 
 * Provides functions for tracking property views, contact clicks, and lead submissions.
 * Critical for analytics, ROI measurement, and future monetization.
 */

import { supabase } from './supabase';
import type { PropertyView, PropertyContactClick, PropertyLead } from '@/types/supabase';

/**
 * Generate a session ID for the current browser session
 * Used to deduplicate views and clicks from the same session
 */
function getSessionId(): string {
  const key = 'topaffaire_session_id';
  let sessionId = sessionStorage.getItem(key);
  
  if (!sessionId) {
    // Generate a random session ID
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}

/**
 * Get client IP address (best effort)
 * Note: This won't work in production due to CORS, but we can get it server-side
 */
async function getClientIP(): Promise<string | null> {
  try {
    // In production, this would be handled by edge functions or server-side
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Track a property view
 * Call this when a user lands on a property details page
 * 
 * @param propertyId - UUID of the property being viewed
 * @returns Success status
 */
export async function trackPropertyView(propertyId: string): Promise<boolean> {
  try {
    const sessionId = getSessionId();
    const ipAddress = await getClientIP();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const viewData: Omit<PropertyView, 'id' | 'created_at'> = {
      property_id: propertyId,
      user_id: user?.id || null,
      ip_address: ipAddress,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
      session_id: sessionId,
    };
    
    const { error } = await supabase
      .from('property_views')
      .insert(viewData);
    
    if (error) {
      console.error('Error tracking property view:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception tracking property view:', error);
    return false;
  }
}

/**
 * Track a contact click
 * Call this when a user clicks phone, WhatsApp, or email button
 * 
 * @param propertyId - UUID of the property
 * @param contactType - Type of contact: 'phone' | 'whatsapp' | 'email'
 * @returns Success status
 */
export async function trackContactClick(
  propertyId: string,
  contactType: 'phone' | 'whatsapp' | 'email'
): Promise<boolean> {
  try {
    const sessionId = getSessionId();
    const ipAddress = await getClientIP();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const clickData: Omit<PropertyContactClick, 'id' | 'created_at'> = {
      property_id: propertyId,
      contact_type: contactType,
      user_id: user?.id || null,
      ip_address: ipAddress,
      session_id: sessionId,
    };
    
    const { error } = await supabase
      .from('property_contact_clicks')
      .insert(clickData);
    
    if (error) {
      console.error('Error tracking contact click:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception tracking contact click:', error);
    return false;
  }
}

/**
 * Submit a lead form
 * Call this when a user submits a contact form for a property
 * 
 * @param leadData - Lead information
 * @returns Created lead ID or null on error
 */
export async function submitPropertyLead(
  leadData: Omit<PropertyLead, 'id' | 'created_at' | 'updated_at' | 'contacted_at'>
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('property_leads')
      .insert(leadData)
      .select('id')
      .single();
    
    if (error) {
      console.error('Error submitting lead:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('Exception submitting lead:', error);
    return null;
  }
}

/**
 * Get analytics for a property (for property owners)
 * 
 * @param propertyId - UUID of the property
 * @returns Analytics data
 */
export async function getPropertyAnalytics(propertyId: string) {
  try {
    const [viewsResult, clicksResult, leadsResult] = await Promise.all([
      // Total views
      supabase
        .from('property_views')
        .select('id', { count: 'exact', head: true })
        .eq('property_id', propertyId),
      
      // Contact clicks by type
      supabase
        .from('property_contact_clicks')
        .select('contact_type')
        .eq('property_id', propertyId),
      
      // Leads
      supabase
        .from('property_leads')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false }),
    ]);
    
    // Count clicks by type
    const clicksByType = {
      phone: 0,
      whatsapp: 0,
      email: 0,
    };
    
    clicksResult.data?.forEach(click => {
      if (click.contact_type in clicksByType) {
        clicksByType[click.contact_type as keyof typeof clicksByType]++;
      }
    });
    
    return {
      views: viewsResult.count || 0,
      clicks: {
        total: clicksResult.data?.length || 0,
        phone: clicksByType.phone,
        whatsapp: clicksByType.whatsapp,
        email: clicksByType.email,
      },
      leads: leadsResult.data || [],
      leadsCount: leadsResult.data?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching property analytics:', error);
    return {
      views: 0,
      clicks: { total: 0, phone: 0, whatsapp: 0, email: 0 },
      leads: [],
      leadsCount: 0,
    };
  }
}

/**
 * Get recent views with deduplication (last 7 days)
 * Deduplicates by session_id to get unique visitors
 * 
 * @param propertyId - UUID of the property
 * @returns Unique visitor count
 */
export async function getUniqueVisitors(propertyId: string): Promise<number> {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data, error } = await supabase
      .from('property_views')
      .select('session_id')
      .eq('property_id', propertyId)
      .gte('created_at', sevenDaysAgo.toISOString());
    
    if (error) {
      console.error('Error fetching unique visitors:', error);
      return 0;
    }
    
    // Count unique session IDs
    const uniqueSessions = new Set(data?.map(v => v.session_id).filter(Boolean));
    return uniqueSessions.size;
  } catch (error) {
    console.error('Exception fetching unique visitors:', error);
    return 0;
  }
}

/**
 * Update lead status (for property owners)
 * 
 * @param leadId - UUID of the lead
 * @param status - New status
 * @param notes - Optional notes
 * @returns Success status
 */
export async function updateLeadStatus(
  leadId: string,
  status: PropertyLead['status'],
  notes?: string
): Promise<boolean> {
  try {
    const updateData: any = { status };
    
    if (notes) {
      updateData.advertiser_notes = notes;
    }
    
    if (status === 'contacted') {
      updateData.contacted_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('property_leads')
      .update(updateData)
      .eq('id', leadId);
    
    if (error) {
      console.error('Error updating lead status:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception updating lead status:', error);
    return false;
  }
}
