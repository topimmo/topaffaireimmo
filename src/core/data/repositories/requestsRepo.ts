/**
 * Requests Repository
 * Data access layer for service request operations
 */

import { supabase } from '@/lib/supabase';
import type { ServiceRequest } from '@/features/services/domain/types';

export async function getAllServiceRequests(): Promise<ServiceRequest[]> {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[requestsRepo] Error fetching service requests:', error);
    return [];
  }

  return data || [];
}

export async function getServiceRequestsByUser(userId: string): Promise<ServiceRequest[]> {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[requestsRepo] Error fetching user service requests:', error);
    return [];
  }

  return data || [];
}

export async function getServiceRequestsByArtisan(artisanId: string): Promise<ServiceRequest[]> {
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('assigned_artisan_id', artisanId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[requestsRepo] Error fetching artisan service requests:', error);
    return [];
  }

  return data || [];
}

export async function assignServiceRequest(
  requestId: string,
  artisanId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('service_requests')
    .update({
      assigned_artisan_id: artisanId,
      status: 'assigned',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    console.error('[requestsRepo] Error assigning service request:', error);
    return false;
  }

  return true;
}

export async function updateServiceRequestStatus(
  requestId: string,
  status: ServiceRequest['status']
): Promise<boolean> {
  const { error } = await supabase
    .from('service_requests')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    console.error('[requestsRepo] Error updating service request status:', error);
    return false;
  }

  return true;
}
