import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { BannerRequest, BannerSlot } from '@/types/supabase';

export interface BannerWithSlot extends BannerRequest {
  slot?: BannerSlot | null;
  id: string;
  impressions: number | null;
  clicks: number | null;
}

export function useBannerSlots() {
  const [slots, setSlots] = useState<BannerSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('banner_slots')
        .select('*')
        .eq('is_active', true)
        .order('id');

      if (error) setError(error.message);
      setSlots(data || []);
      setLoading(false);
    };

    fetchSlots();
  }, []);

  return { slots, loading, error };
}

export function useActiveBanners(page?: string, position?: string) {
  const [banners, setBanners] = useState<BannerWithSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBanners = async () => {
      setLoading(true);
      setError(null);

      const now = new Date().toISOString();

      // IMPORTANT: inner join باش نقدروا نفلتروا على slot fields
      let query = supabase
        .from('banner_requests')
        .select(
          `
            *,
            slot:banner_slots!inner(*)
          `
        )
        .eq('status', 'active')
        .lte('start_date', now)
        // ✅ end_date: إلا كانت NULL ولا >= now
        .or(`end_date.is.null,end_date.gte.${now}`);

      if (page) query = query.eq('slot.page', page);
      if (position) query = query.eq('slot.position', position);

      const { data, error } = await query;

      if (error) setError(error.message);
      setBanners((data as BannerWithSlot[]) || []);
      setLoading(false);
    };

    fetchBanners();
  }, [page, position]);

  return { banners, loading, error };
}

export function useBannerBySlot(slotCode: string) {
  const [banner, setBanner] = useState<BannerWithSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBanner = async () => {
      setLoading(true);
      setError(null);

      console.log('--- useBannerBySlot START ---');
      console.log('SLOT CODE:', slotCode);

      // 1) جيب slot (يمكن ما يكونش)
      const { data: slot, error: slotErr } = await supabase
        .from('banner_slots')
        .select('*')
        .eq('code', slotCode)
        .maybeSingle(); // ✅ بدل single

      console.log('SLOT:', slot);
      console.log('SLOT ERROR:', slotErr);

      if (slotErr) {
        setError(slotErr.message);
        setLoading(false);
        console.log('STOP: slotErr', slotErr.message);
        return;
      }

      if (!slot) {
        // ماكاينش slot بهذا code => ماشي خطأ ضروري
        setBanner(null);
        setLoading(false);
        console.log('STOP: no slot found for code:', slotCode);
        return;
      }

      const now = new Date().toISOString();

      // 2) جيب active banner لهذا slot (يمكن 0 rows => null)
      const { data: bannerData, error: bannerErr } = await supabase
        .from('banner_requests')
        .select(
          `
            *,
            slot:banner_slots(*)
          `
        )
        .eq('slot_id', slot.id)
        .eq('status', 'active')
        .lte('start_date', now)
        // ✅ end_date: إلا كانت NULL ولا >= now
        .or(`end_date.is.null,end_date.gte.${now}`)
        .maybeSingle(); // ✅ بدل single

      console.log('BANNER DATA:', bannerData);
      console.log('BANNER ERROR:', bannerErr);

      if (bannerErr) {
        setError(bannerErr.message);
        setLoading(false);
        console.log('STOP: bannerErr', bannerErr.message);
        return;
      }

      if (!bannerData) {
        console.log('NO ACTIVE BANNER FOR SLOT:', { slotId: slot.id, slotCode });
      }

      setBanner((bannerData as BannerWithSlot) || null);
      setLoading(false);

      console.log('--- useBannerBySlot END ---');
    };

    if (slotCode) fetchBanner();
    else {
      setBanner(null);
      setLoading(false);
      console.log('STOP: empty slotCode');
    }
  }, [slotCode]);

  // Track impression (غير إلا كان banner كاين)
  const trackImpression = useCallback(async () => {
    if (!banner?.id) return;

    const next = (banner.impressions ?? 0) + 1;

    const { error } = await supabase
      .from('banner_requests')
      .update({ impressions: next })
      .eq('id', banner.id);

    if (!error) {
      setBanner(prev => (prev ? { ...prev, impressions: next } : prev));
    }
  }, [banner]);

  // Track click
  const trackClick = useCallback(async () => {
    if (!banner?.id) return;

    const next = (banner.clicks ?? 0) + 1;

    const { error } = await supabase
      .from('banner_requests')
      .update({ clicks: next })
      .eq('id', banner.id);

    if (!error) {
      setBanner(prev => (prev ? { ...prev, clicks: next } : prev));
    }
  }, [banner]);

  return { banner, loading, error, trackImpression, trackClick };
}

export function useMyBannerRequests() {
  const [requests, setRequests] = useState<BannerWithSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr) setError(userErr.message);

    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('banner_requests')
      .select(`*, slot:banner_slots(*)`)
      .eq('advertiser_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) setError(error.message);
    setRequests((data as BannerWithSlot[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, error, refetch: fetchRequests };
}

export function useAllBannerRequests(status?: string) {
  const [requests, setRequests] = useState<BannerWithSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('banner_requests')
      .select(
        `
          *,
          slot:banner_slots(*),
          advertiser:profiles(id, email, full_name, company_name)
        `
      )
      .order('created_at', { ascending: false });

    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error } = await query.limit(200);

    if (error) setError(error.message);
    setRequests((data as BannerWithSlot[]) || []);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return { requests, loading, error, refetch: fetchRequests };
}
