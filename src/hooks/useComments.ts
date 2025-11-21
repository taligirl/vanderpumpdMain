import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, hasSupabaseConfig } from '../supabaseClient';
import { requireAuth } from '../lib/auth';
import { PUBLIC_REPLIES_KEY } from '../lib/storage';
import { safeGetJSON } from '../lib/utils';
import { pushToast } from '../components/Toast';
import type { Comment, PublicReply } from '../types';

export function useComments() {
  // local-only public replies for demo public reviews
  const [publicReplies, setPublicReplies] = useState<
    Record<string, PublicReply[]>
  >(() => safeGetJSON(PUBLIC_REPLIES_KEY(), {}));

  useEffect(() => {
    try {
      localStorage.setItem(PUBLIC_REPLIES_KEY(), JSON.stringify(publicReplies));
    } catch {}
  }, [publicReplies]);

  function addPublicReply(parentId: string, text: string) {
    const t = (text || '').trim();
    if (!t) return;
    const me = (window as any).__vprProfile || {};
    setPublicReplies((map) => {
      const list = map[parentId] ? [...map[parentId]] : [];
      list.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        parentId,
        text: t,
        ts: Date.now(),
        authorName: me.name || 'You',
        authorHandle: me.handle
          ? `@${String(me.handle).replace(/^@/, '')}`
          : '',
        authorAvatar: me.avatar || '',
      });
      return { ...map, [parentId]: list };
    });
  }

  // Real comments (by reviewId)
  const [commentsByReview, setCommentsByReview] = useState<
    Record<string, Comment[]>
  >({});

  // local isMounted guard inside the hook
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load all comments (root + replies) for one review, including reaction counts
  const loadComments = useCallback(async (reviewId: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select(
        `
      id,
      review_id,
      parent_id,
      text,
      created_at,
      author_id,
      profiles:author_id (
        id,
        display_name,
        handle,
        avatar_url
      )
    `
      )
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('comments select error', error);
      return;
    }

    // --- Reaction counts per comment (👍/👎) ---
    const ids = (data ?? []).map((r: any) => r.id);
    const reactionCounts: Record<string, Record<string, number>> = {};

    if (ids.length) {
      const { data: rx, error: rxErr } = await supabase
        .from('comment_reactions')
        .select('comment_id, emoji')
        .in('comment_id', ids);

      if (rxErr) {
        console.error('reaction counts error', rxErr);
      } else {
        for (const r of rx ?? []) {
          const cid = String((r as any).comment_id);
          const e = String((r as any).emoji ?? '');
          if (!reactionCounts[cid]) reactionCounts[cid] = {};
          reactionCounts[cid][e] = (reactionCounts[cid][e] || 0) + 1;
        }
      }
    }

    const rows = (data ?? []).map((row: any) => {
      const createdTs = row.created_at
        ? Date.parse(row.created_at)
        : Date.now();
      const display = row.profiles?.display_name ?? null;
      const handle = row.profiles?.handle ? `@${row.profiles.handle}` : '';
      const avatar = row.profiles?.avatar_url ?? '';

      return {
        id: row.id,
        review_id: row.review_id,
        parent_id: row.parent_id,
        text: row.text,
        created_at: row.created_at,
        ts: createdTs,
        author_id: row.author_id,
        authorName: display || 'User',
        authorHandle: handle,
        authorAvatar: avatar,
        reactions: reactionCounts[row.id] || undefined,
      } as Comment;
    });

    if (!isMountedRef.current) return;
    setCommentsByReview((prev) => ({
      ...prev,
      [reviewId]: rows,
    }));
  }, []);

  // Add a comment to a review (optionally a reply to another comment)
  const addComment = useCallback(
    async (reviewId: string, parentId: string | null, text: string) => {
      if (!hasSupabaseConfig) {
        pushToast('Connect Supabase to comment.');
        return;
      }
      const u = await requireAuth();
      if (!u) return;

      const t = (text || '').trim();
      if (!t) return;

      // DB insert — NOTE: column names must match your table!
      const { data, error } = await supabase
        .from('comments')
        .insert({
          review_id: reviewId,
          parent_id,
          text: t,
          author_id: u.id,
          user_id: u.id,
        })
        .select('id, created_at')
        .single();

      if (error) {
        console.error('comments insert error', error);
        pushToast('Could not post comment. Please try again.');
        return;
      }

      // Refresh from server so the thread shows the new comment
      await loadComments(reviewId);

      // [PH-NOTIF-ON-REPLY] notify review owner or parent comment author
      try {
        const me = await requireAuth();
        if (!me) throw new Error('no user');

        let targetUserId: string | null = null;
        let reviewForNotif: string | null = reviewId;
        let commentForNotif: string | null = (data as any)?.id ?? null;

        if (parentId) {
          const { data: parent } = await supabase
            .from('comments')
            .select('author_id, review_id')
            .eq('id', parentId)
            .maybeSingle();
          targetUserId = parent?.author_id ?? null;
          reviewForNotif = parent?.review_id ?? reviewId;
        } else {
          const { data: rev } = await supabase
            .from('reviews')
            .select('user_id')
            .eq('id', reviewId)
            .maybeSingle();
          targetUserId = rev?.user_id ?? null;
        }

        if (targetUserId && targetUserId !== me.id) {
          await supabase.from('notifications').insert({
            user_id: targetUserId,
            actor_id: me.id,
            type: 'reply',
            review_id: reviewForNotif,
            comment_id: commentForNotif,
          });
        }
      } catch (e) {
        console.warn('[notif:reply] skipped', e);
      }

      // Optimistic local append (read profile from window helper)
      try {
        if (!isMountedRef.current) return;
        const me = (window as any).__vprProfile || {};
        setCommentsByReview((prev) => {
          const list = prev[reviewId] ? [...prev[reviewId]] : [];
          list.push({
            id: data?.id || `${Date.now()}`,
            review_id: reviewId,
            parent_id: parentId ?? null,
            text: t,
            ts: Date.now(),
            authorName: me.name || 'You',
            authorHandle: me.handle
              ? `@${String(me.handle).replace(/^@/, '')}`
              : '',
            authorAvatar: me.avatar || '',
          } as any);
          return { ...prev, [reviewId]: list };
        });
      } catch {
        // ignore
      }
    },
    [loadComments]
  );

  // Toggle 👍 / 👎 per user per comment
  const toggleCommentReaction = useCallback(
    async (commentId: string, emoji: string) => {
      if (!hasSupabaseConfig) {
        pushToast('Connect Supabase to react.');
        return;
      }
      const u = await requireAuth();
      if (!u) return;
      const v = emoji === '👍' ? 1 : -1;

      // Look up ANY existing reaction by this user for this comment
      const { data: existing, error: selErr } = await supabase
        .from('comment_reactions')
        .select('id, emoji, value')
        .eq('comment_id', commentId)
        .eq('user_id', u.id)
        .maybeSingle();

      if (selErr && (selErr as any).code !== 'PGRST116') {
        console.error('reaction select error', selErr);
        pushToast('Could not read reactions');
        return;
      }

      if (existing?.id) {
        if (existing.emoji === emoji) {
          // Same emoji -> toggle off
          const { error: delErr } = await supabase
            .from('comment_reactions')
            .delete()
            .eq('id', existing.id);
          if (delErr) {
            console.error('reaction delete error', delErr);
            pushToast('Could not remove reaction');
          }
        } else {
          // Different emoji -> update existing row
          const { error: updErr } = await supabase
            .from('comment_reactions')
            .update({ emoji, value: v })
            .eq('id', existing.id);
          if (updErr) {
            console.error('reaction update error', updErr);
            pushToast('Could not change reaction');
          } else if (emoji === '👍') {
            // notify on thumb-up update
            try {
              const { data: c } = await supabase
                .from('comments')
                .select('author_id, review_id')
                .eq('id', commentId)
                .maybeSingle();

              const target = c?.author_id ?? null;
              if (target && target !== u.id) {
                await supabase.from('notifications').insert({
                  user_id: target,
                  actor_id: u.id,
                  type: 'thumb_up',
                  review_id: c?.review_id ?? null,
                  comment_id: commentId,
                });
              }
            } catch (e) {
              console.warn('[notif:thumb_up:update] skipped', e);
            }
          }
        }
        return;
      }

      // Preflight: make sure the comment actually exists
      const { data: exists } = await supabase
        .from('comments')
        .select('id')
        .eq('id', commentId)
        .maybeSingle();
      if (!exists?.id) {
        pushToast('Save this comment first (needs a real ID).');
        return;
      }

      // No existing -> insert fresh
      const { error: insErr } = await supabase
        .from('comment_reactions')
        .insert({
          comment_id: commentId,
          user_id: u.id,
          emoji,
          value: v,
        });

      if (insErr) {
        console.error('reaction insert error', insErr);
        const code = (insErr as any).code;
        pushToast(
          code ? `Could not add reaction (${code})` : 'Could not add reaction'
        );
        return;
      }

      if (emoji === '👍') {
        // notify on thumb-up insert
        try {
          const { data: c } = await supabase
            .from('comments')
            .select('author_id, review_id')
            .eq('id', commentId)
            .maybeSingle();

          const target = c?.author_id ?? null;
          if (target && target !== u.id) {
            await supabase.from('notifications').insert({
              user_id: target,
              actor_id: u.id,
              type: 'thumb_up',
              review_id: c?.review_id ?? null,
              comment_id: commentId,
            });
          }
        } catch (e) {
          console.warn('[notif:thumb_up:insert] skipped', e);
        }
      }
    },
    []
  );

  return {
    publicReplies,
    setPublicReplies,
    addPublicReply,
    commentsByReview,
    loadComments,
    addComment,
    toggleCommentReaction,
  };
}
