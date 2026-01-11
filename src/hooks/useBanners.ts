import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { BannerRequest, BannerSlot } from '@/types/supabase';

export interface BannerWithSlot extends BannerRequest {
  slot?: BannerSlot;
  id: string;
  impressions: number | null;
  clicks: number | null;
}

export function useBannerSlots() {
  const [slots, setSlots] = useState<BannerSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlots = async () => {
      const { data } = await supabase
        .from('banner_slots')
        .select('*')
        .eq('is_active', true)
        .order('id');

      setSlots(data || []);
      setLoading(false);
    };

    fetchSlots();
  }, []);

  return { slots, loading };
}

export function useActiveBanners(page?: string, position?: string) {
  const [banners, setBanners] = useState<BannerWithSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      let query = supabase
        .from('banner_requests')
        .select(`
          *,
          slot:banner_slots(*)
        `)
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString());

      if (page) {
        query = query.eq('slot.page', page);
      }
      if (position) {
        query = query.eq('slot.position', position);
      }

      const { data } = await query;

      setBanners(data as BannerWithSlot[] || []);
      setLoading(false);
    };

    fetchBanners();
  }, [page, position]);

  return { banners, loading };
}

export function useBannerBySlot(slotCode: string) {
  const [banner, setBanner] = useState<BannerWithSlot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanner = async () => {
      // First get the slot
      const { data: slot } = await supabase
        .from('banner_slots')
        .select('id')
        .eq('code', slotCode)
        .single();

      if (!slot) {
        setLoading(false);
        return;
      }

      // Get active banner for this slot
      const { data: banner } = await supabase
        .from('banner_requests')
        .select(`
          *,
          slot:banner_slots(*)
        `)
        .eq('slot_id', slot.id)
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .single();

      setBanner(banner as BannerWithSlot || null);
      setLoading(false);
    };

    fetchBanner();
  }, [slotCode]);

  // Track impression
  const trackImpression = useCallback(async () => {
    if (!banner || !('id' in banner)) return;
    
    await supabase
      .from('banner_requests')
      .update({ impressions: ((banner as BannerWithSlot).impressions || 0) + 1 })
      .eq('id', (banner as BannerWithSlot).id);
  }, [banner]);

  // Track click
  const trackClick = useCallback(async () => {
    if (!banner || !('id' in banner)) return;
    
    await supabase
      .from('banner_requests')
      .update({ clicks: ((banner as BannerWithSlot).clicks || 0) + 1 })
      .eq('id', (banner as BannerWithSlot).id);
  }, [banner]);

  return { banner, loading, trackImpression, trackClick };
}

export function useMyBannerRequests() {
  const [requests, setRequests] = useState<BannerWithSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('banner_requests')
      .select(`
        *,
        slot:banner_slots(*)
      `)
      .eq('advertiser_id', user.id)
      .order('created_at', { ascending: false });

    setRequests(data as BannerWithSlot[] || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, refetch: fetchRequests };
}

export function useAllBannerRequests(status?: string) {
  const [requests, setRequests] = useState<BannerWithSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    let query = supabase
      .from('banner_requests')
      .select(`
        *,
        slot:banner_slots(*),
        advertiser:profiles(id, email, full_name, company_name)
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data } = await query;

    setRequests(data as BannerWithSlot[] || []);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, refetch: fetchRequests };
}
