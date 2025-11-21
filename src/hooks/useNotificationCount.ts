// src/hooks/useNotificationCount.ts
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

type MaybeUser = { id: string } | null | undefined;

export function useNotificationCount(
  user: MaybeUser,
  hasSupabaseConfig: boolean
) {
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!hasSupabaseConfig || !user?.id) {
      setNotifCount(0);
      return;
    }

    const LS_KEY = `vp_last_notif_seen_${user.id}`;
    let isMounted = true;

    async function refreshCount() {
      const { data } = await supabase
        .from('notifications')
        .select('id,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      let last = 0;
      try {
        last = Number(localStorage.getItem(LS_KEY) || 0);
      } catch {
        last = 0;
      }

      const c = (data || []).filter((n: any) => {
        const t = n.created_at ? new Date(n.created_at).getTime() : 0;
        return t > last;
      }).length;

      if (!isMounted) return;
      setNotifCount(c);
    }

    // initial + realtime
    refreshCount();

    const ch = supabase
      .channel(`notifs-count:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => refreshCount()
      )
      .subscribe();

    return () => {
      isMounted = false;
      try {
        supabase.removeChannel(ch);
      } catch {
        // ignore
      }
    };
  }, [hasSupabaseConfig, user?.id]);

  return notifCount;
}
