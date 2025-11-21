import { useEffect } from 'react';
import { supabase, hasSupabaseConfig as globalHasSupabaseConfig } from '../supabaseClient';
import { REVIEW_HEART } from '../lib/constants';

/**
 * Keeps any rr-heart-count-* spans in sync with Supabase review_reactions.
 * Call this once in App with your hasSupabaseConfig flag.
 */
export function useReviewReactionsRealtime(hasSupabaseConfig: boolean) {
  useEffect(() => {
    // Prefer the passed flag, but fall back to global if needed
    const enabled = hasSupabaseConfig ?? globalHasSupabaseConfig;
    if (!enabled) return;

    async function refreshVisible() {
      const nodes = Array.from(
        document.querySelectorAll('span[id^="rr-heart-count-"]')
      ) as HTMLSpanElement[];

      if (!nodes.length) return;

      const ids = [...new Set(
        nodes
          .map((n) => n.id.replace('rr-heart-count-', ''))
          .filter(Boolean)
      )];

      for (const id of ids) {
        try {
          const { count } = await supabase
            .from('review_reactions')
            .select('id', { count: 'exact' })
            .eq('review_id', id)
            .eq('emoji', REVIEW_HEART)
            .limit(1);

          const el = document.getElementById(`rr-heart-count-${id}`);
          if (el) {
            el.textContent = String(count ?? 0);
          }
        } catch {
          // ignore individual failures
        }
      }
    }

    // initial load
    refreshVisible();

    // realtime channel
    const ch = supabase
      .channel('rr:all')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'review_reactions' },
        refreshVisible
      )
      .subscribe();

    // periodic refresh as a backup
    const int = setInterval(refreshVisible, 10000);

    return () => {
      try {
        supabase.removeChannel(ch);
      } catch {
        // ignore
      }
      clearInterval(int);
    };
  }, [hasSupabaseConfig]);
}
