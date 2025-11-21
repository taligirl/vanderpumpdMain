import React from 'react';
import type { Episode } from '../types';

type DiaryTabProps = {
  episodes: Episode[];
  ratings: Record<string, number>;
  favs: Record<string, boolean>;
  watched: Record<string, boolean>;
  isInDiary: (epId: string) => boolean;
  openReviewModal: (ep: Episode) => void;
  isEpisodeInAnyCollection: (epId: string) => boolean;
  collections: any[];
  episodeTags: (ep: Episode) => any;
  setCollectionPickerOpen: (open: boolean) => void;
  setCollectionPickerTargetEp: (ep: Episode | null) => void;
};

export function DiaryTab({
  episodes,
  ratings,
  favs,
  watched,
  isInDiary,
  openReviewModal,
  isEpisodeInAnyCollection,
  collections,
  episodeTags,
  setCollectionPickerOpen,
  setCollectionPickerTargetEp,
}: DiaryTabProps) {
  return (
               <div>
              {episodes.filter(ep => (reviews[ep.id]?.length || 0) > 0 || !!favs[ep.id] || (ratings[ep.id] || 0) > 0).length === 0 ? (
                <p>No activity yet. Rate, heart, or review an episode in Browse and it will appear here.</p>
              ) : (
                <ul className="episode-list">
                  {episodes
                    .filter(ep => (reviews[ep.id]?.length || 0) > 0 || !!favs[ep.id] || (ratings[ep.id] || 0) > 0)
                    .map(ep => (
                      <li key={ep.id} className="episode-card">
                        <div className="episode-header" style={{ gap:14 }}>
                          <div>
                            <h3 style={{ margin:0 }}>S{ep.season}E{ep.episode}: {ep.title}</h3>
                            <p style={{ margin:'6px 0 0', opacity:.9 }}>{ep.description}</p>
                            {(watchCounts[ep.id] || 0) > 0 && (
  <div className="review-meta" style={{ marginTop:6 }}>
    Watched {watchCounts[ep.id]}× — recent: {(watchDates[ep.id] || []).slice(0, 3).join(', ')}
  </div>
)}

                          </div>
                          <div className="episode-actions" style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
                            <RatingInput
                              value={ratings[ep.id] || 0}
                              onChange={(v)=>setRating(ep.id, v)}
                            />
                            <HeartButton
                              active={!!favs[ep.id]}
                              onToggle={()=>toggleFav(ep.id)}
                            />
                            <div style={{ display:'inline-flex', gap:8, alignItems:'center' }}>
  <input
    type="date"
    value={watchDateInputs[ep.id] ?? todayISO()}
    onChange={e => setWatchDateInputs(m => ({ ...m, [ep.id]: e.target.value }))}
  />
  <button
    type="button"
    className="clear-btn"
    onClick={async ()=>{ await logWatch(ep.id, watchDateInputs[ep.id] ?? todayISO()); }}
  >
    Log watch
  </button>
  <button
    type="button"
    className="clear-btn"
    disabled={!(watchCounts[ep.id] > 0)}
   onClick={()=> deleteLatestReview(ep.id)}
  >
    Delete review
  </button>
</div>


                            <button type="button" className="clear-btn" onClick={()=>openEpisode(ep.id)}>Open</button>
                          </div>
                        </div>

                        {(reviews[ep.id]?.length ?? 0) > 0 && (
                          <div style={{ marginTop:8 }}>
                            <div className="review-meta">{new Date(reviews[ep.id][0].ts).toLocaleString()}</div>
                            <div style={{ whiteSpace:'pre-wrap' }}>{reviews[ep.id][0].text}</div>
                          </div>
                        )}
         <EpisodeReviews
  ep={ep}
  epId={ep.id}
  reviews={reviews[ep.id] || []}
  onEdit={editReview}
  onDelete={deleteReview}
  onAdd={addReview}
  episodeStars={ratings[ep.id] || 0}
  episodeHearted={!!favs[ep.id]}
  commentsByReview={commentsByReview}
  loadComments={loadComments}
  addComment={addComment}
  toggleCommentReaction={toggleCommentReaction}
/>
                      </li>
                    ))}
                </ul>
              )}
            </div>
  );
}
