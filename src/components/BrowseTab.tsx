import React, { useState } from 'react';
import type { Episode, ReviewItem, CommentRow } from '../types';
import { VirtualEpisodeList } from './VirtualEpisodeList';
import { EpisodeReviews } from './EpisodeReviews';
import { RatingInput, HeartButton } from './UiAtoms';

const todayISO = () => new Date().toISOString().slice(0, 10);

type SearchIn = 'all' | 'title' | 'description' | 'reviews';
type SortKey = 'season-asc' | 'season-desc' | 'my-stars-desc' | 'my-stars-asc';
type FunnyTags = {
  costumes: boolean;
  jaxShirtOff: boolean;
  tequilaKatie: boolean;
  vegas: boolean;
  reunion: boolean;
};

const TAG_OPTIONS: { key: keyof FunnyTags; label: string }[] = [
  { key: 'costumes', label: 'Costumes & Burlesque' },
  { key: 'jaxShirtOff', label: 'Jax shirt off' },
  { key: 'tequilaKatie', label: 'Tequila Katie' },
  { key: 'vegas', label: 'Vegas' },
  { key: 'reunion', label: 'Reunion' },
];

type BrowseTabProps = {
  episodes: Episode[];
  finalList: Episode[];

  query: string;
  setQuery: (v: string) => void;
  searchIn: SearchIn;
  setSearchIn: (v: SearchIn) => void;

  seasonFilter: 'all' | number;
  setSeasonFilter: (v: 'all' | number) => void;
  seasonOptions: number[];

  sortBy: SortKey;
  setSortBy: (v: SortKey) => void;

  minStars: number;
  setMinStars: (v: number) => void;
  onlyFavs: boolean;
  setOnlyFavs: React.Dispatch<React.SetStateAction<boolean>>;
  onlyRated: boolean;
  setOnlyRated: React.Dispatch<React.SetStateAction<boolean>>;
  onlyWatched: boolean;
  setOnlyWatched: React.Dispatch<React.SetStateAction<boolean>>;
  onlyUnwatched: boolean;
  setOnlyUnwatched: React.Dispatch<React.SetStateAction<boolean>>;
  hideWatched: boolean;
  setHideWatched: React.Dispatch<React.SetStateAction<boolean>>;
  watchDateFilter: string;
  setWatchDateFilter: (v: string) => void;

  collectionFilterId: string;
  setCollectionFilterId: (v: string) => void;
  collections: any[];
  episodeTags: (ep: Episode) => FunnyTags;
  funny: FunnyTags;
  setFunny: React.Dispatch<React.SetStateAction<FunnyTags>>;
  resetFilters: () => void;

  ratings: Record<string, number>;
  favs: Record<string, boolean>;
  watchedAt: Record<string, number>;
  watchDates: Record<string, string[]>;
  watchCounts: Record<string, number>;
  watchDateInputs: Record<string, string>;
  setWatchDateInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  logWatch: (epId: string, dateISO: string) => Promise<void>;
  deleteLatestReview: (epId: string) => void;
  setRating: (epId: string, v: number) => void;
  toggleFav: (epId: string) => void;
  openEpisode: (id: string) => void;

  addReview: (epId: string, text?: string) => void;
  editReview: (epId: string, reviewId: string, text: string) => void;
  deleteReview: (epId: string, reviewId: string) => void;
  reviews: Record<string, ReviewItem[]>;
  commentsByReview: Record<string, CommentRow[]>;
  loadComments: (reviewId: string) => void;
  addComment: (reviewId: string, parentId: string | null, text: string) => void;
  toggleCommentReaction: (commentId: string, emoji: '👍' | '👎') => void;
  toggleReviewReaction: (reviewId: string) => void;
};

export function BrowseTab(props: BrowseTabProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [showTags, setShowTags] = useState(false);
  const {
    finalList,
    query,
    setQuery,
    searchIn,
    setSearchIn,
    seasonFilter,
    setSeasonFilter,
    seasonOptions,
    sortBy,
    setSortBy,
    minStars,
    setMinStars,
    onlyFavs,
    setOnlyFavs,
    onlyRated,
    setOnlyRated,
    onlyWatched,
    setOnlyWatched,
    onlyUnwatched,
    setOnlyUnwatched,
    hideWatched,
    setHideWatched,
    watchDateFilter,
    setWatchDateFilter,
    collectionFilterId,
    setCollectionFilterId,
    collections,
    funny,
    setFunny,
    resetFilters,
    episodeTags,
    ratings,
    favs,
    watchedAt,
    watchDates,
    watchCounts,
    watchDateInputs,
    setWatchDateInputs,
    logWatch,
    deleteLatestReview,
    setRating,
    toggleFav,
    openEpisode,
    addReview,
    editReview,
    deleteReview,
    reviews,
    commentsByReview,
    loadComments,
    addComment,
    toggleCommentReaction,
    toggleReviewReaction,
  } = props;

  const renderEpisodeCard = (ep: Episode) => (
    <li key={ep.id} className="episode-card">
      <div className="episode-header" style={{ gap:14 }}>
        <div>
          <h3 style={{ margin:0, cursor:'pointer', textDecoration:'underline' }}>
            <button
              type="button"
              onClick={() => openEpisode(ep.id)}
              className="clear-btn"
              style={{ background:'transparent', border:'none', padding:0, textDecoration:'underline', cursor:'pointer' }}
              aria-label={`Open episode S${ep.season}E${ep.episode}`}
            >
              S{ep.season}E{ep.episode}: {ep.title}
            </button>
          </h3>
          <p style={{ margin:'6px 0 0', opacity:.9 }}>
            {ep.description}
          </p>
          {(watchCounts[ep.id] || 0) > 0 && (
            <div className="review-meta" style={{ marginTop:6 }}>
              Watched {watchCounts[ep.id]}× — recent: {(watchDates[ep.id] || []).slice(0, 3).join(', ')}
            </div>
          )}
        </div>

        <div className="episode-actions" style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
          <RatingInput value={ratings[ep.id] || 0} onChange={(v)=>setRating(ep.id, v)} />
          <HeartButton active={!!favs[ep.id]} onToggle={()=>toggleFav(ep.id)} />

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

      {watchedAt[ep.id] ? (
        <div className="review-meta" style={{ marginTop:6 }}>
          Watched {new Date(watchedAt[ep.id]).toLocaleString()}
        </div>
      ) : null}

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
    </li>
  );

  return (
            <div>
    {/* Filters */}
<div style={{ position:'sticky', top:0, zIndex:10, padding:'8px 0', background:'linear-gradient(180deg, rgba(17,17,17,.92), rgba(17,17,17,.6) 60%, rgba(17,17,17,0))', backdropFilter:'blur(6px)', borderRadius:12, marginBottom:10 }}>
  {/* Always-visible row: Search + Sort + Filters button */}
  <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
    <div style={{ display:'flex', gap:8, alignItems:'center', flex:'1 1 380px', minWidth:260 }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search (title / description / reviews)…"
        className="input"
        style={{ flex:1 }}
        aria-label="Search"
      />
      <button type="button" className="clear-btn" onClick={resetFilters}>Clear</button>
    </div>

    {/* Sort stays visible */}
    <select
  value={sortBy}
  onChange={(e) => setSortBy(e.target.value as SortKey)}
  className="select"
  style={{ minWidth: 200 }}
  aria-label="Sort by"
>
  <option value="season-asc">Season ↑</option>
  <option value="season-desc">Season ↓</option>
  <option value="my-stars-desc">My ⭐️ High → Low</option>
  <option value="my-stars-asc">My ⭐️ Low → High</option>
</select>


    {/* Toggle for advanced */}
    <button
      type="button"
      className="clear-btn"
      onClick={()=>setShowAdvancedFilters(v=>!v)}
      aria-expanded={showAdvancedFilters}
      aria-controls="adv-filters"
    >
      Filters ▾
    </button>
  </div>

  {/* Advanced popover/drawer */}
  {showAdvancedFilters && (
    <div id="adv-filters" className="episode-card" style={{ marginTop:8, display:'grid', gap:8 }}>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
        <select
          value={searchIn}
          onChange={(e) => setSearchIn(e.target.value as SearchIn)}
          className="select"
          aria-label="Search field"
        >
          <option value="all">All fields</option>
          <option value="title">Title only</option>
          <option value="description">Description only</option>
          <option value="reviews">My reviews only</option>
        </select>

        <select
          value={seasonFilter}
          onChange={(e) => setSeasonFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="select"
          aria-label="Season"
        >
          <option value="all">All Seasons</option>
          {seasonOptions.map((s) => <option key={s} value={s}>S{s}</option>)}
        </select>

        <select
          value={minStars}
          onChange={(e) => setMinStars(Number(e.target.value))}
          className="select"
          aria-label="Minimum stars"
        >
          <option value={0}>Any ★</option>
          <option value={1}>≥ 1★</option>
          <option value={2}>≥ 2★</option>
          <option value={3}>≥ 3★</option>
          <option value={4}>≥ 4★</option>
          <option value={5}>= 5★</option>
        </select>

        <select
          value={collectionFilterId}
          onChange={(e) => setCollectionFilterId(e.target.value)}
          className="select"
          style={{ minWidth: 220 }}
          aria-label="Filter by collection"
        >
          <option value="all">All collections</option>
          {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Pills row */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        <button
          type="button"
          className="pill"
          aria-pressed={onlyFavs}
          onClick={()=>setOnlyFavs(v=>!v)}
          title="Only favorites"
        >❤️ Only favorites {onlyFavs ? '✓' : ''}</button>

        <button
          type="button"
          className="pill"
          aria-pressed={onlyRated}
          onClick={()=>setOnlyRated(v=>!v)}
          title="Only rated"
        >★ Only rated {onlyRated ? '✓' : ''}</button>

        <button
          type="button"
          className="pill"
          aria-pressed={onlyWatched}
          onClick={()=>setOnlyWatched(v=>!v)}
          title="Only watched"
        >👀 Only watched {onlyWatched ? '✓' : ''}</button>

        <div className="review-meta" style={{ display:'inline-flex', gap:8, alignItems:'center', marginTop:6 }}>
  <label htmlFor="watch-date-filter">Filter by watch date:</label>
  <input
    id="watch-date-filter"
    type="date"
    value={watchDateFilter}
    onChange={e => setWatchDateFilter(e.target.value)}
  />
  {watchDateFilter && (
    <button type="button" className="clear-btn" onClick={()=>setWatchDateFilter('')}>Clear</button>
  )}
</div>

        <button
          type="button"
          className="pill"
          aria-pressed={onlyUnwatched}
          onClick={()=>setOnlyUnwatched(v=>!v)}
          title="Only unwatched"
        >🙈 Only unwatched {onlyUnwatched ? '✓' : ''}</button>

        <button
          type="button"
          className="pill"
          aria-pressed={hideWatched}
          onClick={()=>setHideWatched(v=>!v)}
          title="Hide watched"
        >🙈 Hide watched {hideWatched ? '✓' : ''}</button>
      </div>
    </div>
  )}
</div>


              {/* Tag dropdown */}
              <div style={{ position:'relative', marginBottom:10 }}>
                               <button
                  type="button"
                  onClick={()=>setShowTags(v => !v)}
                  aria-expanded={showTags}
                  aria-controls="ep-tag-menu"
                  aria-haspopup="true"
                >
                  Tags ▾
                </button>
                               {showTags && (
                  <div
                    id="ep-tag-menu"
                    style={{ position:'absolute', top:44, left:0, zIndex:30,
                             background:'#0e0e0e', border:'1px solid #333', borderRadius:12, padding:10, minWidth:260,
                             boxShadow:'0 16px 40px rgba(0,0,0,.6)'}}
                    role="menu"
                  >
                    {TAG_OPTIONS.map(({key,label})=>(
                      <span key={key}
  tabIndex={0}
  onKeyDown={(e)=>{ if (e.key===' '||e.key==='Enter'){ e.preventDefault(); setFunny(f=>({...f, [key]: !f[key]})); }}}
  onClick={() => setFunny(f => ({ ...f, [key]: !f[key] }))}
  style={{
    display:'inline-flex', alignItems:'center', gap:6, margin:4,
    background: (funny as any)[key] ? '#ff3dbd' : '#171717',
    color: (funny as any)[key] ? '#fff' : '#ddd',
    border:'1px solid #333', borderRadius:999, padding:'6px 10px', fontSize:12, cursor:'pointer'
  }}
  role="menuitemcheckbox"
  aria-checked={(funny as any)[key]}
>
                        {label}
                      </span>
                    ))}
                    <span
                      onClick={()=>setFunny({costumes:false, jaxShirtOff:false, tequilaKatie:false, vegas:false, reunion:false})}
                      style={{ display:'inline-flex', alignItems:'center', gap:6, margin:4,
                               background:'#171717', color:'#ddd', border:'1px solid #333', borderRadius:999, padding:'6px 10px', fontSize:12, cursor:'pointer' }}
                      role="menuitem"
                    >
                      Clear
                    </span>
                  </div>
                )}
              </div>

              {/* Results */}
              {finalList.length === 0 ? (
                <div className="episode-card" style={{ padding:16 }}>
                  <h3 style={{ marginTop:0 }}>No results</h3>
                  <p className="review-meta" style={{ marginTop:6 }}>
                    Try clearing filters, lowering the star minimum, or switching collections.
                  </p>
                  <div style={{ marginTop:10 }}>
                    <button type="button" className="clear-btn" onClick={resetFilters}>Reset filters</button>
                  </div>
                </div>
              ) : (
                <VirtualEpisodeList
                  items={finalList}
                  estimateHeight={190}
                  render={(ep: Episode) => renderEpisodeCard(ep)}
                />
              )}
            </div>
  );
}
