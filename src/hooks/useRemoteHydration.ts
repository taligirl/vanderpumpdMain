// src/hooks/useRemoteHydration.ts
import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getCurrentUser } from '../lib/auth';

type CustomCollection = {
  id: string;
  name: string;
  keywords: string[];
  description?: string;
  episodeIds: string[];
};

type UseRemoteHydrationArgs = {
  hasSupabaseConfig: boolean;
  setRatings: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setFavs: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setCollections: React.Dispatch<React.SetStateAction<CustomCollection[]>>;
  setWatchCounts: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setWatchDates: React.Dispatch<
    React.SetStateAction<Record<string, string[]>>
  >;
  setWatchedAt: React.Dispatch<React.SetStateAction<Record<string, number>>>;
};

export function useRemoteHydration({
  hasSupabaseConfig,
  setRatings,
  setFavs,
  setCollections,
  setWatchCounts,
  setWatchDates,
  setWatchedAt,
}: UseRemoteHydrationArgs) {
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!hasSupabaseConfig || cancelled) return;
      const u = await getCurrentUser();
      if (!u || cancelled) return;

      const [ratingsRes, favsRes, collectionsRes, watchRes] = await Promise.all([
        supabase.from('ratings').select('ep_id, stars').eq('user_id', u.id),
        supabase.from('favorites').select('ep_id').eq('user_id', u.id),
        supabase
          .from('collections')
          .select('id, name, keywords, description')
          .eq('owner_id', u.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('watch_events')
          .select('ep_id, watched_on')
          .eq('event', 'watch')
          .eq('user_id', u.id)
          .order('watched_on', { ascending: false }),
      ]);

      if (cancelled) return;

      const rmap: Record<string, number> = {};
      (ratingsRes.data || []).forEach((row: any) => {
        rmap[row.ep_id] = row.stars;
      });
      setRatings(rmap);

      const fmap: Record<string, boolean> = {};
      (favsRes.data || []).forEach((row: any) => {
        fmap[row.ep_id] = true;
      });
      setFavs(fmap);

      const counts: Record<string, number> = {};
      const dates: Record<string, string[]> = {};
      const wmap: Record<string, number> = {};

      (watchRes.data || []).forEach((row: any) => {
        const ep = row.ep_id;
        const d = String(row.watched_on || '').slice(0, 10);
        if (!ep || !d) return;

        counts[ep] = (counts[ep] || 0) + 1;
        (dates[ep] ||= []).push(d);
      });

      Object.keys(dates).forEach((ep) => {
        dates[ep].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
        wmap[ep] = new Date(dates[ep][0]).getTime();
      });

      setWatchCounts(counts);
      setWatchDates(dates);
      setWatchedAt(wmap);

      const base = (collectionsRes.data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        keywords: c.keywords || [],
        description: c.description || '',
        episodeIds: [] as string[],
      }));

      if (!base.length) {
        setCollections([]);
        return;
      }

      const ids = base.map((c) => c.id);
      const { data: items } = await supabase
        .from('collection_items')
        .select('collection_id, ep_id')
        .in('collection_id', ids);

      const byId = new Map(base.map((c) => [c.id, c]));
      (items || []).forEach((it: any) => {
        const col = byId.get(it.collection_id);
        if (col && !col.episodeIds.includes(it.ep_id)) {
          col.episodeIds.push(it.ep_id);
        }
      });
      setCollections(Array.from(byId.values()));
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [
    hasSupabaseConfig,
    setRatings,
    setFavs,
    setCollections,
    setWatchCounts,
    setWatchDates,
    setWatchedAt,
  ]);
}
