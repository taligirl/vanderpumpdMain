import React from 'react';
import { HeartButton, RatingInput } from './UiAtoms';
import { EpisodeReviews } from './EpisodeReviews';
import { pushToast } from './Toast';
import { formatStars } from '../lib/stars';
import type { Episode, Comment, ReviewItem, PublicReply } from '../types';
import type { DemoPublicReview } from '../lib/demoPublicReviews';

const todayISO = () => new Date().toISOString().slice(0, 10);

type EpisodeModalProps = {
  ep: Episode;
  ratings: Record<string, number>;
  favs: Record<string, boolean>;
  setRating: (epId: string, v: number) => void;
  toggleFav: (epId: string) => void;

  watchDateInputs: Record<string, string>;
  setWatchDateInputs: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  logWatch: (epId: string, dateISO: string) => Promise<void> | void;
  watchCounts: Record<string, number>;
  deleteLatestReview: (epId: string) => void;

  avgStars: number;
  reviewView: string;
  setReviewView: React.Dispatch<React.SetStateAction<string>>;

  reviews: Record<string, ReviewItem[]>;
  commentsByReview: Record<string, Comment[]>;
  loadComments: (reviewId: string) => Promise<void> | void;
  addComment: (
    reviewId: string,
    parentId: string | null,
    text: string
  ) => Promise<void> | void;
  toggleCommentReaction: (
    commentId: string,
    emoji: string
  ) => Promise<void> | void;
  toggleReviewReaction: (reviewId: string, emoji: string) => Promise<void> | void;

  addReview: (epId: string, text: string) => void;
  editReview: (epId: string, reviewId: string, newText: string) => void;
  deleteReview: (epId: string, reviewId: string) => void;

  publics: DemoPublicReview[];
  publicReplies: Record<string, PublicReply[]>;
  addPublicReply: (parentId: string, text: string) => void;

  copyText: (text: string) => Promise<boolean>;
  closeEpisode: () => void;
};

export function EpisodeModal({
  ep,
  ratings,
  favs,
  setRating,
  toggleFav,
  watchDateInputs,
  setWatchDateInputs,
  logWatch,
  watchCounts,
  deleteLatestReview,
  avgStars,
  reviewView,
  setReviewView,
  reviews,
  commentsByReview,
  loadComments,
  addComment,
  toggleCommentReaction,
  toggleReviewReaction,
  addReview,
  editReview,
  deleteReview,
  publics,
  publicReplies,
  addPublicReply,
  copyText,
  closeEpisode,
}: EpisodeModalProps) {
  if (!ep) return null;

  const ratingValue = ratings[ep.id] || 0;
  const watchDate = watchDateInputs[ep.id] ?? todayISO();
  const watchCount = watchCounts[ep.id] || 0;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Episode S${ep.season}E${ep.episode}`}
    >
      <div className="modal-panel">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <h3 style={{ margin: 0 }}>
            S{ep.season}E{ep.episode}: {ep.title}
          </h3>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <RatingInput
              value={ratingValue}
              onChange={(v) => setRating(ep.id, v)}
            />
            <HeartButton
              active={!!favs[ep.id]}
              onToggle={() => toggleFav(ep.id)}
            />

            <div
              style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}
            >
              <input
                type="date"
                value={watchDate}
                onChange={(e) =>
                  setWatchDateInputs((m) => ({
                    ...m,
                    [ep.id]: e.target.value,
                  }))
                }
              />
              <button
                type="button"
                className="clear-btn"
                onClick={async () => {
                  await logWatch(ep.id, watchDate);
                }}
              >
                Log watch
              </button>
              <button
                type="button"
                className="clear-btn"
                disabled={!(watchCount > 0)}
                onClick={() => deleteLatestReview(ep.id)}
              >
                Delete review
              </button>
            </div>

            <div
              aria-label="Average rating"
              title={`Average: ${avgStars.toFixed(1)}★`}
              style={{ fontSize: 18, display: 'inline-block', minWidth: 120 }}
            >
              {formatStars(Math.round(avgStars * 2) / 2)}
              <span className="review-meta" style={{ marginLeft: 8 }}>
                ({avgStars.toFixed(1)})
              </span>
            </div>

            <button
              type="button"
              className="clear-btn"
              aria-label="Copy episode link"
              onClick={async () => {
                const url = `${location.origin}${location.pathname}#${ep.id}`;
                const shared = await (async () => {
                  try {
                    // @ts-ignore
                    if (navigator.share) {
                      // @ts-ignore
                      await navigator.share({
                        title: `S${ep.season}E${ep.episode}: ${ep.title}`,
                        text: 'Check this episode',
                        url,
                      });
                      return true;
                    }
                  } catch {
                    // ignore
                  }
                  return false;
                })();

                if (!shared) {
                  const ok = await copyText(url);
                  pushToast(ok ? 'Link copied!' : 'Copy failed');
                }
              }}
            >
              Copy link
            </button>

            <button
              type="button"
              className="clear-btn"
              onClick={closeEpisode}
              aria-label="Close episode"
            >
              Close
            </button>
          </div>
        </div>

        <p style={{ marginTop: 6, opacity: 0.9 }}>{ep.description}</p>

        {/* Review filter switch */}
        <div
          style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}
        >
          <button
            type="button"
            className="clear-btn"
            onClick={() => setReviewView('all')}
            aria-pressed={reviewView === 'all'}
          >
            All
          </button>
          <button
            type="button"
            className="clear-btn"
            onClick={() => setReviewView('mine')}
            aria-pressed={reviewView === 'mine'}
          >
            Mine
          </button>
          <button
            type="button"
            className="clear-btn"
            onClick={() => setReviewView('public')}
            aria-pressed={reviewView === 'public'}
          >
            Public
          </button>
        </div>

        {/* Your own reviews for this episode */}
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
          toggleReviewReaction={toggleReviewReaction}
        />

        {/* Public reviews (demo) + replies */}
        {reviewView !== 'mine' && (
          <div className="episode-card" style={{ marginTop: 12 }}>
            <h4 style={{ margin: 0 }}>Public reviews (demo)</h4>
            {publics.length === 0 ? (
              <p style={{ color: '#bbb', marginTop: 8 }}>
                No public reviews yet.
              </p>
            ) : (
              <ul className="review-list" style={{ marginTop: 10 }}>
                {publics.map((p) => {
                  const replies = publicReplies[p.id] || [];
                  return (
                    <li
                      key={p.id}
                      style={{
                        border: '1px solid #333',
                        borderRadius: 10,
                        padding: 10,
                        background: '#0f0f0f',
                      }}
                    >
                      {/* Public review header */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '1px solid #333',
                            background: '#222',
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          {p.avatar ? (
                            <img
                              src={p.avatar}
                              alt=""
                              width={28}
                              height={28}
                              style={{
                                objectFit: 'cover',
                                width: '100%',
                                height: '100%',
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: 12, color: '#aaa' }}>
                              👤
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13 }}>
                          <strong>{p.author || 'User'}</strong>
                          {p.handle ? (
                            <span style={{ opacity: 0.7 }}> · {p.handle}</span>
                          ) : null}
                        </div>
                        <div
                          className="review-meta"
                          style={{ marginLeft: 'auto' }}
                        >
                          {new Date(p.ts).toLocaleString()}
                        </div>
                      </div>

                      <div
                        style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}
                      >
                        {p.text}
                      </div>

                      {/* Replies (list) */}
                      {replies.length > 0 && (
                        <ul
                          style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: '10px 0 0',
                            display: 'grid',
                            gap: 8,
                          }}
                        >
                          {replies.map((r) => (
                            <li
                              key={r.id}
                              style={{
                                border: '1px solid #333',
                                borderRadius: 10,
                                padding: 10,
                                background: '#101010',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '1px solid #333',
                                    background: '#222',
                                    display: 'grid',
                                    placeItems: 'center',
                                  }}
                                >
                                  {r.authorAvatar ? (
                                    <img
                                      src={r.authorAvatar}
                                      alt=""
                                      width={24}
                                      height={24}
                                      style={{
                                        objectFit: 'cover',
                                        width: '100%',
                                        height: '100%',
                                      }}
                                    />
                                  ) : (
                                    <span
                                      style={{ fontSize: 11, color: '#aaa' }}
                                    >
                                      👤
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 12 }}>
                                  <strong>{r.authorName || 'You'}</strong>
                                  {r.authorHandle ? (
                                    <span style={{ opacity: 0.7 }}>
                                      {' '}
                                      · {r.authorHandle}
                                    </span>
                                  ) : null}
                                </div>
                                <div
                                  className="review-meta"
                                  style={{ marginLeft: 'auto' }}
                                >
                                  {new Date(r.ts).toLocaleString()}
                                </div>
                              </div>
                              <div
                                style={{
                                  whiteSpace: 'pre-wrap',
                                  marginTop: 6,
                                }}
                              >
                                {r.text}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Reply box */}
                      <div
                        style={{
                          display: 'flex',
                          gap: 6,
                          alignItems: 'flex-start',
                          marginTop: 10,
                        }}
                      >
                        <textarea
                          className="input"
                          rows={2}
                          placeholder="Write a reply…"
                          style={{ flex: 1, minHeight: 56 }}
                          id={`reply-${p.id}`}
                        />
                        <button
                          type="button"
                          className="clear-btn"
                          onClick={() => {
                            const el = document.getElementById(
                              `reply-${p.id}`
                            ) as HTMLTextAreaElement | null;
                            const t = el?.value || '';
                            if (!t.trim()) return;
                            addPublicReply(p.id, t);
                            if (el) el.value = '';
                          }}
                        >
                          Reply
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}