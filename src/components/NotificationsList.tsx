import React from 'react';
import { supabase, hasSupabaseConfig } from '../supabaseClient';

export type NotificationItem = {
  id: string;
  user_id: string;      // who should be notified
  actor_id: string;     // who did the thing
  type: 'reply' | 'thumb_up';
  review_id?: string | null;
  comment_id?: string | null;
  created_at?: string;  // server default now()
  meta?: any | null;    // optional, safe to ignore
};

export function NotificationsList({ userId, onCount }: { userId: string | null; onCount: (n:number)=>void }) {
  const [items, setItems] = React.useState<NotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const LS_KEY = userId ? `vp_last_notif_seen_${userId}` : null;

  async function fetchNotifs() {
    if (!hasSupabaseConfig || !userId) { setItems([]); onCount(0); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('id,user_id,actor_id,type,review_id,created_at,meta')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('notifications load error', error);
      setItems([]);
      setLoading(false);
      return;
    }

    const rows = (data || []) as NotificationItem[];
    setItems(rows);

    // unseen count using "last read" timestamp in localStorage
    if (LS_KEY) {
      let last = 0;
      try { last = Number(localStorage.getItem(LS_KEY) || 0); } catch { last = 0; }
      const unseen = rows.filter(n => {
        const t = n.created_at ? new Date(n.created_at).getTime() : 0;
        return t > last;
      }).length;
      onCount(unseen);
    }
    setLoading(false);
  }

  // initial load + realtime subscribe to INSERTs
  React.useEffect(() => {
    fetchNotifs();
    if (!hasSupabaseConfig || !userId) return;

    const ch = supabase
      .channel(`notifs:${userId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setItems(prev => [payload.new as NotificationItem, ...prev]);
          onCount(prev => (typeof prev === 'number' ? prev + 1 : 1));
        }
      )
      .subscribe();

    return () => { try { supabase.removeChannel(ch); } catch {} };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSupabaseConfig, userId]);

  function markAllRead() {
    if (!LS_KEY) return;
    try { localStorage.setItem(LS_KEY, String(Date.now())); } catch {}
    onCount(0);
  }

  if (!hasSupabaseConfig) {
    return <p style={{opacity:.8}}>Connect Supabase to enable notifications.</p>;
  }
  if (!userId) {
    return <p style={{opacity:.8}}>Log in to see your notifications.</p>;
  }

  return (
    <div style={{display:'grid', gap:12}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h3 style={{margin:0}}>Notifications</h3>
        <button type="button" className="clear-btn" onClick={markAllRead}>Mark all read</button>
      </div>
      {loading ? <p style={{opacity:.8}}>Loading…</p> : null}
      {(!items || items.length===0) && !loading ? (
        <p style={{opacity:.8}}>No notifications yet.</p>
      ) : (
        <ul style={{listStyle:'none', padding:0, margin:0, display:'grid', gap:10}}>
          {items.map(n => (
            <li key={n.id} style={{padding:12, border:'1px solid #2b2b2b', borderRadius:10}}>
              <div style={{fontSize:14}}>
                {n.type === 'reply' ? '💬  New reply' : n.type === 'thumb_up' ? '👍  Your comment got a like' : '🔔  Activity'}
              </div>
              <div style={{opacity:.8, fontSize:12, marginTop:4}}>
                {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
              </div>
              {n.meta ? (
                <pre style={{marginTop:6, fontSize:11, opacity:.7, whiteSpace:'pre-wrap'}}>
                  {JSON.stringify(n.meta, null, 2)}
                </pre>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
