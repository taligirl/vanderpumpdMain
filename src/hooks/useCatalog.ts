// src/hooks/useCatalog.ts
import { useEffect, useState } from 'react';
import { supabase, hasSupabaseConfig as globalHasSupabase } from '../supabaseClient';
import type { Episode } from '../types';

/**
 * Load the shared catalog of episodes.
 * - Tries Supabase first (if configured)
 * - Falls back to /catalog.json
 */
export function useCatalog(hasSupabaseConfig: boolean = globalHasSupabase) {
  const [catalog, setCatalog] = useState<Episode[]>([]);

  useEffect(() => {
    let alive = true;

    (async () => {
      // 1) Try Supabase first (if configured)
      try {
        if (hasSupabaseConfig) {
          const { data, error } = await supabase
            .from('episodes')
            .select('*')
            .order('season', { ascending: true })
            .order('number', { ascending: true });

          if (!error && data && alive) {
            setCatalog(data as Episode[]);
            return; // success; stop here
          }
        }
      } catch {
        // ignore and fall back
      }

      // 2) Fallback: try local /catalog.json in public/
      try {
        const res = await fetch('/catalog.json', { cache: 'no-store' });
        if (res.ok) {
          const j = await res.json();
          if (alive && Array.isArray(j)) {
            setCatalog(j as Episode[]);
          }
        }
      } catch {
        // still nothing; leave catalog as-is
      }
    })();

    return () => {
      alive = false;
    };
  }, [hasSupabaseConfig]);

  return catalog;
}