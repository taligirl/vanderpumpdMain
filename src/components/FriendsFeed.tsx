import React from 'react';
import { supabase, hasSupabaseConfig } from '../supabaseClient';
import { useSupabaseAuth } from '../lib/auth';

export function FriendsFeed() {
  const { user } = useSupabaseAuth();
  const [rows, setRows] = React.useState<Array<{id:string, ts?:string, actor:string, owner:string, label:string}>>([]);

  React.useEffect(() => {
    (async () => {
      if (!hasSupabaseConfig || !user?.id) return;

      // who I follow
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      const following = (follows || []).map((f:any) => f.following_id).filter(Boolean);
      if (!following.length) { setRows([]); return; }

      // recent comment notifs by those actors
      const { data: notifs } = await supabase
        .from('notifications')
        .select('id, actor_id, review_id, created_at')
        .in('actor_id', following)
        .in('type', ['reply', 'review_heart'])
        .order('created_at', { ascending:false })
        .limit(50);

      const reviewIds = Array.from(new Set((notifs||[]).map((n:any) => n.review_id).filter(Boolean)));
      const actorIds  = Array.from(new Set((notifs||[]).map((n:any) => n.actor_id)));
      const { data: reviews } = await supabase
        .from('reviews')
        .select('id, user_id')
        .in('id', reviewIds);
      const ownerIds = Array.from(new Set((reviews||[]).map((r:any)=>r.user_id)));
      const allUserIds = Array.from(new Set([...actorIds, ...ownerIds]));
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, display_name, handle')
        .in('id', allUserIds);

      const name = (uid:string) => {
        const p = (profs||[]).find((x:any)=>x.id===uid);
        return p?.display_name || (p?.handle ? '@'+p.handle : uid?.slice(0,6));
      };
      const ownerByReview: Record<string,string> = {};
      (reviews||[]).forEach((r:any)=> { ownerByReview[r.id]=r.user_id; });

      const out = (notifs||[]).map((n:any) => {
        const label = n.type === 'reply' ? 'commented on' : 'hearted';
        return {
          id: n.id,
          ts: n.created_at,
          actor: name(n.actor_id),
          owner: name(ownerByReview[n.review_id] || ''),
          label
        };
      });
      setRows(out);

    })();
  }, [hasSupabaseConfig, user?.id]);

  if (!hasSupabaseConfig) return <p style={{opacity:.8}}>Connect Supabase to see friends’ activity.</p>;
  if (!user) return <p style={{opacity:.8}}>Log in to see friends’ activity.</p>;
 if (!rows.length) return <p style={{opacity:.8}}>Your friends haven’t hearted or commented yet.</p>;

  return (
    <ul style={{listStyle:'none', margin:0, padding:0, display:'grid', gap:10}}>
      {rows.map(r => (
        <li key={r.id} style={{padding:12, border:'1px solid #333', borderRadius:10}}>
        <span><b>{r.actor}</b> {r.label} {r.owner}{r.owner?.endsWith('’s') ? '' : '’s'} review</span>
          {r.ts ? <span style={{opacity:.6, marginLeft:8}}>{new Date(r.ts).toLocaleString()}</span> : null}
        </li>
      ))}
    </ul>
  );
}

export function FeedModeSwitch(){ return null; }
