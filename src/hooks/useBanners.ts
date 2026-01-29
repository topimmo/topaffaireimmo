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
      const { data, error } = await supabase
        .from('banner_slots')
        .select('*')
        .eq('is_active', true)
        .order('id');

      if (error) console.error('fetchSlots error:', error);

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
      setLoading(true);

      let query = supabase
        .from('banner_requests')
        // ✅ inner join باش نقدر نفلتر على banner_slots
        .select(`*, slot:banner_slots!inner(*)`)
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString());

      // ✅ فلترة صحيحة على جدول banner_slots
      if (page) {
        query = query.eq('banner_slots.page', page);
      }
      if (position) {
        query = query.eq('banner_slots.position', position);
      }

      const { data, error } = await query;

      if (error) console.error('fetchBanners error:', error);

      setBanners((data as BannerWithSlot[]) || []);
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
      setLoading(true);

      // ✅ maybeSingle بدل single باش ما يطيحش فحالة 0 rows
      const { data: slot, error: slotError } = await supabase
        .from('banner_slots')
        .select('id')
        .eq('code', slotCode)
        .maybeSingle();

      if (slotError) console.error('slotError:', slotError);

      if (!slot) {
        setBanner(null);
        setLoading(false);
        return;
      }

      // ✅ maybeSingle + limit(1) + order باش نتفادى PGST116 (0 أو بزاف rows)
      const { data: foundBanner, error: bannerError } = await supabase
        .from('banner_requests')
        .select(`*, slot:banner_slots(*)`)
        .eq('slot_id', slot.id)
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (bannerError) console.error('bannerError:', bannerError);

      setBanner((foundBanner as BannerWithSlot) || null);
      setLoading(false);
    };

    fetchBanner();
  }, [slotCode]);

  // Track impression
  const trackImpression = useCallback(async () => {
    if (!banner?.id) return;

    const nextImpressions = (banner.impressions || 0) + 1;

    const { error } = await supabase
      .from('banner_requests')
      .update({ impressions: nextImpressions })
      .eq('id', banner.id);

    if (error) console.error('trackImpression error:', error);
  }, [banner]);

  // Track click
  const trackClick = useCallback(async () => {
    if (!banner?.id) return;

    const nextClicks = (banner.clicks || 0) + 1;

    const { error } = await supabase
      .from('banner_requests')
      .update({ clicks: nextClicks })
      .eq('id', banner.id);

    if (error) console.error('trackClick error:', error);
  }, [banner]);

  return { banner, loading, trackImpression, trackClick };
}

export function useMyBannerRequests() {
  const [requests, setRequests] = useState<BannerWithSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) console.error('getUser error:', userError);

    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('banner_requests')
      .select(`*, slot:banner_slots(*)`)
      .eq('advertiser_id', user.id)
      .order('created_at', { ascending: false });

    if (error) console.error('fetchMyBannerRequests error:', error);

    setRequests((data as BannerWithSlot[]) || []);
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
    setLoading(true);

    let query = supabase
      .from('banner_requests')
      .select(`*, slot:banner_slots(*), advertiser:profiles(id, email, full_name, company_name)`)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) console.error('fetchAllBannerRequests error:', error);

    setRequests((data as BannerWithSlot[]) || []);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, refetch: fetchRequests };
}
