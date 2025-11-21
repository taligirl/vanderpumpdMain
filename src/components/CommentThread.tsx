import React from 'react';
import { supabase, hasSupabaseConfig } from '../supabaseClient';
import { requireAuth } from '../lib/auth';
import { pushToast } from './Toast';

/* ---------------- Comments types/consts (scoped to this module) ---------------- */

type CommentNode = {
  id: string;
  review_id: string;
  parent_id: string | null;
  user_id: string;
  text: string;
  created_at: string;
};

const COMMENTS_PAGE = 20; // per parent branch page size
const PKEY = (pid: string | null) => (pid ?? 'root');

/* ---------------- Hook: load + mutate threaded comments ------------------------ */

function useCommentTree(reviewId: string) {
  const [byParent, setByParent] = React.useState<Record<string, CommentNode[]>>({});
  const [hasMore, setHasMore] = React.useState<Record<string, boolean>>({});
  const [open, setOpen] = React.useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = React.useState<Record<string, string>>({});

  // keep a stable read of current lists without re-creating callbacks
  const byParentRef = React.useRef(byParent);
  React.useEffect(() => { byParentRef.current = byParent; }, [byParent]);

  const load = React.useCallback(async (parentId: string | null, reset = false) => {
    if (!hasSupabaseConfig || !reviewId) return;
    const key = PKEY(parentId);
    const currentLen = reset ? 0 : (byParentRef.current[key]?.length || 0);
    const from = currentLen;
    const to = from + COMMENTS_PAGE; // fetch one extra (inclusive range) to detect hasMore

    let q = supabase
      .from('replies')
      .select('id, review_id, parent_id, user_id, text, created_at')
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true });

    if (parentId === null) (q as any).is('parent_id', null);
    else q.eq('parent_id', parentId);

    const { data, error } = await q.range(from, to);
    if (error) { console.error('[comments4] load error', error); return; }

    const rows = (data || []) as CommentNode[];
    const more = rows.length > COMMENTS_PAGE;
    const pageRows = more ? rows.slice(0, COMMENTS_PAGE) : rows;

    setByParent(prev => ({
      ...prev,
      [key]: reset ? pageRows : ([...(prev[key] || []), ...pageRows]),
    }));
    setHasMore(prev => ({ ...prev, [key]: more }));
  }, [reviewId]);

  const ensureLoaded = React.useCallback(async (parentId: string | null) => {
    const key = PKEY(parentId);
    if (!byParentRef.current[key]) {
      await load(parentId, true);
    }
  }, [load]);

  const toggleOpen = React.useCallback(async (commentId: string) => {
    setOpen(prev => {
      const next = !prev[commentId];
      return { ...prev, [commentId]: next };
    });
    // when opening, ensure children are loaded
    await ensureLoaded(commentId);
  }, [ensureLoaded]);

  const submitReply = React.useCallback(async (parentId: string | null) => {
    const key = PKEY(parentId);
    const t = (replyText[key] || '').trim();
    if (!t) return;
    const me = await requireAuth(); if (!me?.id) return;

    const { error: insErr } = await supabase
      .from('replies')
      .insert({
        review_id: reviewId,
        user_id: me.id,
        parent_id: parentId,
        text: t,
        created_at: new Date().toISOString(),
      });

    if (insErr) { console.error('[comments4] insert failed', insErr); pushToast('Could not post comment'); return; }

    // clear just this composer and refresh just this branch
    setReplyText(prev => ({ ...prev, [key]: '' }));
    await load(parentId, true);
  }, [replyText, reviewId, load]);

  // reset + subscribe to this review’s replies
  React.useEffect(() => {
    setByParent({}); setHasMore({}); setOpen({}); setReplyText({});
    if (!hasSupabaseConfig || !reviewId) return;

    load(null, true);

    const ch = supabase
      .channel(`replies:${reviewId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'replies', filter: `review_id=eq.${reviewId}` },
        (payload: any) => {
          const pid = (payload?.new?.parent_id ?? payload?.old?.parent_id ?? null) as string | null;
          load(pid, true); // targeted refresh of impacted branch only
        }
      )
      .subscribe();

    return () => { try { supabase.removeChannel(ch); } catch {} };
  }, [reviewId, load]);

  return {
    byParent, hasMore, open, replyText,
    setReplyText,
    loadMore: (pid: string | null) => load(pid, false),
    ensureLoaded,
    toggleOpen,
    submitReply,
  };
}

/* ---------------- Component: CommentThread (UI) -------------------------------- */

export function CommentThread({
  reviewId,
  onToggleReplyReaction,
}: {
  reviewId: string;
  onToggleReplyReaction: (replyId: string, emoji: '👍'|'👎') => Promise<void> | void;
}) {
  const {
    byParent, hasMore, open, replyText,
    setReplyText, loadMore, ensureLoaded, toggleOpen, submitReply,
  } = useCommentTree(reviewId);

  // Local, stable inline composer that keeps focus
  const InlineComposer: React.FC<{ pid: string | null; onSubmit: (parentId: string | null, text: string) => Promise<void> }> =
    React.memo(({ pid, onSubmit }) => {
      const [t, setT] = React.useState('');
      const inputRef = React.useRef<HTMLInputElement>(null);

      const post = React.useCallback(async () => {
        const s = t.trim();
        if (!s) return;
        await onSubmit(pid, s);
        setT('');
        requestAnimationFrame(() => inputRef.current?.focus());
      }, [t, pid, onSubmit]);

      const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); post(); }
      };

      return (
        <div className="vp-reply-row">
          <input
            ref={inputRef}
            className="vp-input"
            placeholder={pid ? "Reply…" : "Add a comment…"}
            value={t}
            onChange={e => setT(e.target.value)}
            onKeyDown={onKey}
          />
          <button type="button" className="vp-btn" onClick={post} title="Post">Post</button>
        </div>
      );
    });

  const Branch: React.FC<{ parentId: string | null; depth: number }> = ({ parentId, depth }) => {
    const key = PKEY(parentId);
    const rows = byParent[key] || [];

    return (
      <div className="vp-branch" style={{ marginLeft: depth ? 14 : 0 }}>
        {parentId !== null ? null : (
          <div style={{ marginBottom: 8 }}>
            <InlineComposer pid={null} onSubmit={async (_pid, text) => {
              // mirror submitReply, but let hook own the logic
              const k = PKEY(null);
              setReplyText(prev => ({ ...prev, [k]: text }));
              await submitReply(null);
            }} />
          </div>
        )}

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
          {rows.map(c => (
            <li key={c.id} style={{ padding: 10, border: '1px solid #2b2b2b', borderRadius: 10 }}>
              <div style={{ whiteSpace: 'pre-wrap' }}>{c.text}</div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
                <button type="button" onClick={() => onToggleReplyReaction(c.id, '👍')}>👍</button>
                <button type="button" onClick={() => onToggleReplyReaction(c.id, '👎')}>👎</button>

                <button
                  type="button"
                  className="clear-btn"
                  onClick={() => toggleOpen(c.id)}
                  aria-expanded={!!open[c.id]}
                  aria-controls={`branch-${c.id}`}
                >
                  {open[c.id] ? 'Hide replies' : 'Show replies'}
                </button>
              </div>

              {open[c.id] && (
                <div id={`branch-${c.id}`} style={{ marginTop: 6 }}>
                  <Branch parentId={c.id} depth={depth + 1} />
                </div>
              )}
            </li>
          ))}
        </ul>

        {hasMore[key] ? (
          <div style={{ marginTop: 6 }}>
            <button type="button" className="clear-btn" onClick={() => loadMore(parentId)}>Load more</button>
          </div>
        ) : null}
      </div>
    );
  };

  React.useEffect(() => { ensureLoaded(null); }, [ensureLoaded]);

  return (
    <div className="vp-thread">
      <Branch parentId={null} depth={0} />
    </div>
  );
}
