// src/hooks/useEpisodesCatalog.ts
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Episode } from '../types';

export function useEpisodesCatalog(hasSupabaseConfig: boolean) {
  const [catalog, setCatalog] = useState<Episode[]>([]);
  const episodes = catalog;

  useEffect(() => {
    let alive = true;

    (async () => {
      // 1) Try Supabase if configured
      try {
        if (hasSupabaseConfig) {
          const { data, error } = await supabase
            .from('episodes')
            .select('*')
            .order('season', { ascending: true })
            .order('number', { ascending: true });

          if (!error && data && alive) {
            setCatalog(data as Episode[]);
            return; // success
          }
        }
      } catch {
        // ignore and fall through to local fallback
      }

      // 2) Fallback to local /catalog.json
      try {
        const res = await fetch('/catalog.json', { cache: 'no-store' });
        if (!res.ok) return;
        const j = await res.json();
        if (alive && Array.isArray(j)) {
          setCatalog(j as Episode[]);
        }
      } catch {
        // still nothing; leave catalog as-is
      }
    })();

    return () => {
      alive = false;
    };
  }, [hasSupabaseConfig]);

  return { catalog, episodes };
}