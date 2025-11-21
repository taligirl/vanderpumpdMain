import React, { useState } from 'react';
import type { Episode, ReviewItem, CommentRow } from '../types';
import { ReviewItemCard } from './ReviewItemCard';

type EpisodeReviewsProps = {
  ep: Episode;
  epId: string;
  reviews: ReviewItem[];
  onEdit: (epId: string, id: string, text: string) => void;
  onDelete: (epId: string, id: string) => void;
  onAdd: (epId: string, text: string) => void;
  episodeStars: number;
  episodeHearted: boolean;
  loadComments: (reviewId: string) => void;
  commentsByReview: Record<string, CommentRow[]>;
  addComment: (reviewId: string, parentId: string | null, text: string) => void;
  toggleCommentReaction: (commentId: string, emoji: '👍' | '👎') => void;
  toggleReviewReaction: (reviewId: string) => Promise<void> | void;
};

export const EpisodeReviews = React.memo(function EpisodeReviews({
  ep,
  epId,
  reviews,
  onEdit,
  onDelete,
  onAdd,
  episodeStars,
  episodeHearted,
  commentsByReview,
  loadComments,
  addComment,
  toggleCommentReaction,
  toggleReviewReaction,
}: EpisodeReviewsProps) {
  const [text, setText] = useState('');

  const submitNew = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(epId, t);
    setText('');
  };

  return (
    <div className="reviews">
      {/* Write a new review */}
      <div
        className="review-box"
        style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 12 }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a review…"
          rows={2}
          className="input"
          style={{ flex: 1, minHeight: 64 }}
          aria-label="Write a review"
        />
        <button type="button" onClick={submitNew}>
          Post
        </button>
      </div>

      {/* Review list */}
      {reviews.length > 0 && (
        <ul
          className="review-list"
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '10px 0 0',
            display: 'grid',
            gap: 8,
          }}
        >
          {reviews.map((r) => (
            <ReviewItemCard
              key={r.id}
              ep={ep}
              epId={epId}
              review={r}
              onEdit={onEdit}
              onDelete={onDelete}
              episodeStars={episodeStars}
              episodeHearted={episodeHearted}
              commentsCount={(commentsByReview[r.id] || []).length}
              commentsList={commentsByReview[r.id]}
              loadComments={loadComments}
              addComment={addComment}
              toggleCommentReaction={toggleCommentReaction}
              onToggleHeart={toggleReviewReaction}
            />
          ))}
        </ul>
      )}
    </div>
  );
});
