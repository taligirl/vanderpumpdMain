// [PROFILESUBTABS-FULL]
import * as React from 'react';
import { pushToast } from './Toast';

type TabKey = 'reviews' | 'activity' | 'followers' | 'following';

type Episode = any;        // keep loose to avoid type import churn
type ActivityItem = any;   // "
type ReviewItem = any;     // "

type Props = {
  // Optional controlled props
  value?: TabKey;
  onChange?: (v: TabKey) => void;

  // Data from caller (ProfileTab)
  episodes: Episode[];
  activity: ActivityItem[];
  reviews: Record<string, ReviewItem[]>; // epId -> list of reviews
  ratings: Record<string, number>;
  favs: Record<string, boolean>;

  // Helpers from caller (already exist in your app)
  formatActivityRow: (a: ActivityItem) => string;
  openEpisode: (epId: string) => void;
  onEdit: (epId: string, id: string, text: string) => void;
  onDelete: (epId: string, id: string) => void;

  // Reactions (we wire this below from ctx)
  toggleReviewReaction?: (reviewId: string, emoji?: string) => Promise<void> | void;
};

export function ProfileSubtabs(props: Props) {
  // ---- Controlled or local tab
  const [localTab, setLocalTab] = React.useState<TabKey>(props.value ?? 'reviews');
  React.useEffect(() => {
    if (props.value) setLocalTab(props.value);
  }, [props.value]);
  const val: TabKey = (props.value ?? localTab) as TabKey;
  const set = (props.onChange ?? setLocalTab) as (v: TabKey) => void;

  // ---- Allow global `window.__vpSetProfileTab('followers')` hooks (you already use this)
  React.useEffect(() => {
    (window as any).__vpSetProfileTab = (v: string) => {
      if (v === 'reviews' || v === 'activity' || v === 'followers' || v === 'following') set(v as TabKey);
    };
    return () => { try { delete (window as any).__vpSetProfileTab; } catch {} };
  }, [set]);

  // ---- Helpers
  const isUuid = (s: any) =>
    typeof s === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

  // Episodes that actually have at least one review
  const reviewedEps = React.useMemo(() => {
    try {
      const eps = props.episodes || [];
      return eps.filter((ep: any) => (props.reviews?.[String(ep.id)]?.length || 0) > 0);
    } catch { return []; }
  }, [props.episodes, props.reviews]);

  // Small tab button UI helper
  function TabBtn(k: TabKey, label: string) {
    const active = val === k;
    return (
      <button
        key={k}
        type="button"
        className={active ? 'tab active' : 'tab'}
        aria-pressed={active}
        onClick={() => set(k)}
        style={{
          padding: '6px 10px',
          borderRadius: 10,
          border: active ? '1px solid #777' : '1px solid #2b2b2b',
          background: active ? '#1f1f1f' : 'transparent',
          color: active ? '#fff' : '#aaa',
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    );
  }

  // ---- Render
  return (
    <div className="profile-subtabs-wrap" style={{ display: 'grid', gap: 10 }}>
      {/* Tabs row */}
      <div className="profile-subtabs" style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
        {TabBtn('reviews', 'Reviews')}
        {TabBtn('activity', 'Activity')}
        {TabBtn('followers', 'Followers')}
        {TabBtn('following', 'Following')}
      </div>

      {/* Body */}
      <div className="profile-subtabs-body" style={{ border: '1px solid #2b2b2b', borderRadius: 12, padding: 12 }}>
        {/* -------- REVIEWS -------- */}
        {val === 'reviews' && (
          reviewedEps.length === 0 ? (
            <p style={{ opacity: 0.8 }}>No reviews yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
              {reviewedEps.map((ep: any) => {
                const epId = String(ep.id);
                const list = (props.reviews?.[epId] || []).slice().sort((a: any, b: any) => (b.ts || 0) - (a.ts || 0));
                const latest = list[0];
                const when = latest?.ts ? new Date(latest.ts).toLocaleString() : '';

                const season = (ep?.season != null) ? `S${ep.season}` : '';
                const number = (ep?.episode != null || ep?.number != null) ? `E${ep.episode ?? ep.number}` : '';
                const header = [season, number].filter(Boolean).join('');

                return (
                  <li key={epId} style={{ padding: 12, border: '1px solid #333', borderRadius: 10, background: '#171717' }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {header ? `${header} • ${ep?.title ?? ep?.name ?? `Episode ${epId}`}` : (ep?.title ?? ep?.name ?? `Episode ${epId}`)}
                        </div>
                        {when && <div style={{ opacity: 0.8, fontSize: 12 }}>{when}</div>}
                        {/* rating/fav hints */}
                        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                          {props.ratings?.[epId] != null && <span>Rated: {props.ratings[epId]}★</span>}
                          {props.favs?.[epId] && <span style={{ marginLeft: 8 }}>★ Favorite</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="clear-btn"
                          onClick={() => props.openEpisode(epId)}
                          title="Open episode"
                          aria-label="Open episode"
                          style={{ border: '1px solid #2b2b2b', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}
                        >
                          Open
                        </button>

                        {/* Heart (latest review) — integrates with your realtime count badges */}
                        <button
                          type="button"
                          className="clear-btn"
                          onClick={() => {
                            const rid = String(latest?.id || '');
                            if (!rid || !isUuid(rid)) { pushToast('Save this review first (needs a real ID).'); return; }
                            if (props.toggleReviewReaction) props.toggleReviewReaction(rid, '❤️');
                          }}
                          title="Heart this review"
                          aria-label="Heart this review"
                          style={{ border: '1px solid #2b2b2b', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}
                        >
                          <span>❤️</span>
                          <span id={`rr-heart-count-${latest?.id || 'x'}`} style={{ marginLeft: 4, opacity: 0.8 }} />
                        </button>
                      </div>
                    </div>

                    {/* Latest review preview */}
                    {latest?.text && (
                      <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{String(latest.text)}</div>
                    )}

                    {/* (Optional) full list of reviews for this episode — edit/delete hooks */}
                    {list.length > 1 && (
                      <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                        {list.slice(1).map((r: any) => {
                          const rid = String(r.id ?? `${epId}-${r.ts ?? Math.random()}`);
                          const text = String(r.text ?? '').trim();
                          return (
                            <div key={rid} style={{ border: '1px solid #2b2b2b', borderRadius: 8, padding: 10, background: '#111' }}>
                              <div style={{ whiteSpace: 'pre-wrap' }}>{text || <span style={{ opacity: 0.7 }}>(no text)</span>}</div>
                              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <button
                                  type="button"
                                  className="clear-btn"
                                  onClick={() => props.onEdit(epId, rid, text)}
                                  aria-label="Edit review"
                                  title="Edit review"
                                  style={{ border: '1px solid #2b2b2b', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="clear-btn"
                                  onClick={() => props.onDelete(epId, rid)}
                                  aria-label="Delete review"
                                  title="Delete review"
                                  style={{ border: '1px solid #2b2b2b', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )
        )}

        {/* -------- ACTIVITY -------- */}
        {val === 'activity' && (
          (!props.activity || props.activity.length === 0) ? (
            <p style={{ opacity: 0.8 }}>No activity yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
              {props.activity
                .slice()
                .sort((a: any, b: any) => (Number(b.ts || 0) - Number(a.ts || 0)))
                .map((a: any, i: number) => (
                  <li key={a.id ?? i} style={{ padding: 12, border: '1px solid #333', borderRadius: 10, whiteSpace: 'pre-wrap' }}>
                    {props.formatActivityRow?.(a) ?? ''}
                    {a?.ep_id && (
                      <div style={{ marginTop: 6 }}>
                        <button
                          type="button"
                          className="clear-btn"
                          onClick={() => props.openEpisode(String(a.ep_id))}
                          style={{ border: '1px solid #2b2b2b', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}
                        >
                          Open Episode
                        </button>
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          )
        )}

        {/* -------- FOLLOWERS -------- */}
        {val === 'followers' && (
          <p style={{ opacity: 0.8 }}>Followers list coming soon.</p>
        )}

        {/* -------- FOLLOWING -------- */}
        {val === 'following' && (
          <p style={{ opacity: 0.8 }}>Following list coming soon.</p>
        )}
      </div>
    </div>
  );
}
