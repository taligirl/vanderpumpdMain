import React from 'react';
import { supabase, hasSupabaseConfig } from '../supabaseClient';
import { formatStars } from '../lib/stars';
import { CommentThread } from './CommentThread';
import { REVIEW_HEART } from '../lib/constants';
import { pushToast } from './Toast';
import { saveReviewCardAsImage } from '../lib/shareCard';

export const ReviewItemCard = React.memo(function ReviewItemCard({
  ep,
  epId,
  review,
  onEdit,
  onDelete,
  episodeStars,
  episodeHearted,
  commentsCount,
  commentsList,
  loadComments,
  addComment,
  toggleCommentReaction
}: {
  ep: any;
  epId: string;
  review: any;
  onEdit: (epId: string, id: string, text: string) => void;
  onDelete: (epId: string, id: string) => void;
  episodeStars: number;
  episodeHearted: boolean;
  commentsCount?: number;
  commentsList?: any[];
  loadComments: (reviewId: string) => void;
  addComment: (reviewId: string, parentId: string | null, text: string) => void;
  toggleCommentReaction: (commentId: string, emoji: '👍' | '👎') => void;
  onToggleHeart: (reviewId: string) => void;
}) {

  const [isEditing, setIsEditing] = React.useState(false);
  // [PH-REALTIME-REVIEW-LIKE:ITEM] live 👍 count for this review
// [PH-REALTIME-REVIEW-HEART:ITEM] live heart count for this review
React.useEffect(() => {
  if (!hasSupabaseConfig || !review?.id) return;

  async function refresh() {
    try {
      const { count } = await supabase
        .from('review_reactions')
        .select('id', { count: 'exact' })
        .eq('review_id', review.id)
        .eq('emoji', REVIEW_HEART)
        .limit(1);
      const el = document.getElementById(`rr-heart-count-${review.id}`);
    } catch {}
  }

  refresh();
  const ch = supabase
    .channel(`rr:${review.id}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'review_reactions', filter: `review_id=eq.${review.id}` },
      refresh
    )
    .subscribe();

  return () => { try { supabase.removeChannel(ch); } catch {} };
}, [hasSupabaseConfig, review?.id]);

  const [showComments, setShowComments] = React.useState(false);
  const [draft, setDraft] = React.useState(review.text || '');
  // Load comments for this review when it appears / id changes
React.useEffect(() => {
  if (review?.id) {
    loadComments(review.id);
  }
  // we only need to refetch if the review id or supabase config changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [review?.id, hasSupabaseConfig]);


  return (
    <li className="episode-card">
      {/* author header */}
<div style={{ display:'flex', alignItems:'center', gap:8 }}>
  <div style={{ width:28, height:28, borderRadius:'50%', overflow:'hidden', border:'1px solid #333', background:'#222', display:'grid', placeItems:'center' }}>
    {review.authorAvatar
      ? <img src={review.authorAvatar} alt="" width={28} height={28} style={{objectFit:'cover',width:'100%',height:'100%'}}/>
      : <span style={{ fontSize:12, color:'#aaa' }}>👤</span>}
  </div>
  <div style={{ fontSize:13 }}>
    <strong>{review.authorName || 'You'}</strong>
    {review.authorHandle ? <span style={{ opacity:.7 }}> · {review.authorHandle}</span> : null}
  </div>
</div>

      {/* meta row: timestamp + my stars + heart */}
      <div
        className="review-meta"
        style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}
      >
        {new Date(review.ts).toLocaleString()}
    {(review.starsAtPost || 0) > 0 && (
  <span title={`My rating at post time: ${review.starsAtPost}`} aria-label={`My rating at post time ${review.starsAtPost} stars`}>
    {formatStars(review.starsAtPost)}
  </span>
)}
    
        {episodeHearted && <span title="Favorited" aria-label="Favorited">🩷</span>}
      </div>

      {/* text / edit */}
      {isEditing ? (
        <div style={{ display:'grid', gap:8, marginTop:6 }}>
          <textarea
            className="input"
            value={draft}
            onChange={(e)=>setDraft(e.target.value)}
            rows={3}
            style={{ whiteSpace:'pre-wrap' }}
          />
          <div style={{ display:'flex', gap:6 }}>
            <button
              type="button"
              onClick={()=>{
                onEdit(epId, review.id, draft.trim());
                setIsEditing(false);
              }}
            >Save</button>
            <button type="button" className="clear-btn" onClick={()=>{ setDraft(review.text||''); setIsEditing(false); }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ whiteSpace:'pre-wrap', marginTop:6 }}>{review.text}</div>
      )}
      <div style={{marginTop:8, display:'flex', gap:10, alignItems:'center', opacity:.9}}>
  {/* [REVIEW-HEART-BUTTON] */}
<button
  type="button"
  className="clear-btn"
  onClick={() => {
    if (!isUuid(review.id)) { pushToast('Save this review first (needs a real ID).'); return; }
    onToggleHeart(review.id);
  }}
  title="Heart this review"
  style={{fontSize:'1.05rem'}}
>
  <span>❤️</span>
  <span id={`rr-heart-count-${review.id}`} style={{marginLeft:4, opacity:.8}}></span>
</button>
        {/* [COMMENTS4-THREAD-INSERTION] */}
<CommentThread reviewId={review.id} onToggleReplyReaction={toggleCommentReaction} />

  <span id={`rr-count-${review.id}`} style={{fontSize:12, opacity:.8}}></span>
</div>


      {/* actions */}
      <div className="review-actions" style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
        <button
          className="clear-btn"
          onClick={() => { /* uses Phase B function below */ saveReviewCardAsImage(ep, review, episodeStars, episodeHearted); }}
        >
          Share as image
        </button>

        <button
          className="clear-btn"
          onClick={async () => {
            const url = `${location.origin}${location.pathname}#${epId}`;
            const payload = {
              title: `S${ep.season}E${ep.episode}: ${ep.title}`,
              text: review?.text || '',
              url
            };
            try {
              // @ts-ignore
              if (navigator.share) { /* link/text share */
                // @ts-ignore
                await navigator.share(payload);
              } else {
                pushToast('Sharing not supported on this device.');
              }
            } catch {}
          }}
        >
          Share…
        </button>
        
        <button
          className="clear-btn"
          onClick={() => {
            if (!showComments) {
              loadComments(review.id);
            }
            setShowComments(v => !v);
          }}
        >
          💬 {typeof commentsCount === 'number' ? `${commentsCount} comments` : 'Comments'}
        </button>
        
        {!isEditing && <button type="button" onClick={()=>setIsEditing(true)}>Edit</button>}

        <button
          type="button"
          className="clear-btn"
          onClick={() => { if (confirm('Delete this review?')) onDelete(epId, review.id); }}
        >
          Delete
        </button>
      </div>
    </li>
);
});