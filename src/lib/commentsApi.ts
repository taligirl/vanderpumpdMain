import { supabase, hasSupabaseConfig } from '../supabaseClient';
import { requireAuth } from './auth';
import { pushToast } from '../components/Toast';
import { REVIEW_HEART, type ReviewHeart, reactionValue } from './constants';


// local helper so this file is self-contained
function isUuid(x: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
}

/** Toggle 👍/👎 on a reply (comment) with clear messages + FK preflight */
export async function toggleReplyReaction(replyId: string, emoji: '👍'|'👎') {
  console.warn('[CLICK] toggleReplyReaction', { replyId, emoji });
  if (!hasSupabaseConfig) { pushToast('Connect Supabase to react'); return; }
  if (!isUuid(replyId)) { pushToast('Save this comment first (needs a real ID).'); return; }

  // ensure reply exists (avoid FK 23503)
  const { data: exists, error: exErr } = await supabase
    .from('replies')
    .select('id')
    .eq('id', replyId)
    .maybeSingle();
  if (exErr) console.warn('[comment_reactions] exist check failed', exErr);
  if (!exists?.id) { pushToast('Save this comment first (needs a real ID).'); return; }

  const me = await requireAuth(); if (!me?.id) return;

  // Already reacted with this emoji?
  const { data: existing } = await supabase
    .from('comment_reactions')
    .select('id')
    .eq('reply_id', replyId)
    .eq('user_id', me.id)
    .eq('emoji', emoji)
    .maybeSingle();

  if (existing?.id) {
    const { error: delErr } = await supabase.from('comment_reactions').delete().eq('id', existing.id);
    if (delErr) {
      console.error('[comment_reactions] delete failed', delErr);
      const code = (delErr as any).code;
      pushToast(code === '42501' ? 'Sign in again to remove reaction.' : 'Could not remove reaction');
    }
    return;
  }

  const value = emoji === '👎' ? -1 : 1;

  const { error: insErr } = await supabase
    .from('comment_reactions')
    .insert({ reply_id: replyId, user_id: me.id, emoji, value });

  if (insErr) {
    console.error('comment reaction insert error', insErr);
    const code = (insErr as any).code;
    if (code === '23505') return; // duplicate → harmless race
    if (code === '23503') { pushToast('This is an older comment that may not exist yet. Add a new comment or migrate legacy comments.'); return; }
    if (code === '42501') { pushToast('Sign in again to react.'); return; }
    pushToast('Could not add reaction');
  }
}

/** Toggle ❤️ on a review (unique per review+user). */
export async function toggleReviewReaction(reviewId: string, emoji: ReviewHeart = REVIEW_HEART) {
  console.warn('[CLICK] toggleReviewReaction', { reviewId, emoji });
  if (!hasSupabaseConfig) { pushToast('Connect Supabase to react'); return; }
  if (!isUuid(reviewId)) { pushToast('Save this review first (needs a real ID).'); return; }

  const me = await requireAuth(); if (!me?.id) return;

  // Look up any existing reaction for this review+user (ignore emoji → matches unique (review_id,user_id))
  const { data: existing, error: selErr } = await supabase
    .from('review_reactions')
    .select('id, emoji')
    .eq('review_id', reviewId)
    .eq('user_id', me.id)
    .maybeSingle();
  if (selErr) console.warn('[review_reactions] select failed', selErr);

  if (existing?.id) {
    if (existing.emoji === emoji) {
      // Toggle OFF heart
      const { error: delErr } = await supabase.from('review_reactions').delete().eq('id', existing.id);
      if (delErr) {
        console.error('[review_reactions] delete failed', delErr);
        pushToast('Could not remove heart');
      }
      return;
    } else {
      // Was some other emoji from older builds → UPDATE into ❤️
      const { error: updErr } = await supabase
        .from('review_reactions')
        .update({ emoji, value: reactionValue }) // value = 1
        .eq('id', existing.id);
      if (updErr) {
        console.error('[review_reactions] update failed', updErr);
        pushToast('Could not add heart');
        return;
      }
      // notify owner on upgrade to heart
      try {
        const { data: owner } = await supabase
          .from('reviews')
          .select('user_id, ep_id')
          .eq('id', reviewId)
          .maybeSingle();
        const ownerId = owner?.user_id;
        if (ownerId && ownerId !== me.id) {
          await supabase.from('notifications').insert({
            user_id: ownerId,
            actor_id: me.id,
            type: 'review_heart',
            review_id: reviewId,
            meta: { emoji, ep_id: owner?.ep_id }
          });
        }
      } catch (e) {
        console.warn('[notifications] heart notify failed', e);
      }
      return;
    }
  }

  // No existing row -> INSERT
  const { error: insErr } = await supabase
    .from('review_reactions')
    .insert({ review_id: reviewId, user_id: me.id, emoji, value: reactionValue });

  if (insErr) {
    // If another tab inserted between select & insert → treat as success
    if ((insErr as any).code === '23505') return;
    console.error('review reaction insert error', insErr);
    pushToast('Could not add heart');
    return;
  }

  // notify owner on new heart
  try {
    const { data: owner } = await supabase
      .from('reviews')
      .select('user_id, ep_id')
      .eq('id', reviewId)
      .maybeSingle();
    const ownerId = owner?.user_id;
    if (ownerId && ownerId !== me.id) {
      await supabase.from('notifications').insert({
        user_id: ownerId,
        actor_id: me.id,
        type: 'review_heart',
        review_id: reviewId,
        meta: { emoji, ep_id: owner?.ep_id }
      });
    }
  } catch (e) {
    console.warn('[notifications] heart notify failed', e);
  }
}
