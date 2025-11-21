import React from 'react';
import { formatStars } from '../lib/stars';
import { GlobalStyles } from './GlobalStyles';
import { formatActivityRow } from '/src/utils/formatActivity';

export function PublicProfileView({
  profile,
  episodes,
  ratings,
  favs,
  reviews,
  collections,
  onExit
}: {
  profile: any;
  episodes: any[];
  ratings: Record<string, number>;
  favs: Record<string, boolean>;
  reviews: Record<string, any[]>;
  collections: any[];
  onExit: () => void;
}) {
  const favList = episodes.filter(e => !!favs[e.id]);
  const rated = episodes.filter(e => (ratings[e.id] || 0) > 0);
  const avg = rated.length ? (rated.reduce((s,e)=>s+(ratings[e.id]||0),0)/rated.length).toFixed(2) : '—';
  const featured = (profile.featuredCollectionIds || []).map(id => collections.find(c=>c.id===id)).filter(Boolean) as CustomCollection[];

  return (
    <div style={{ padding:16, background:'#111', color:'#fff', fontFamily:'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto' }}>
      <GlobalStyles />
      <button type="button" className="skip-link" onClick={onExit}>Back to app</button>
      <div style={{ border:'1px solid #333', borderRadius:12, padding:16, background:'#171717', maxWidth:980, margin:'0 auto' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:64, height:64, borderRadius:'50%', overflow:'hidden', border:'1px solid #333', background:'#222', display:'grid', placeItems:'center' }}>
            {profile.avatar ? <img src={profile.avatar} alt="avatar" width={64} height={64} style={{ objectFit:'cover', width:'100%', height:'100%' }} /> : <span style={{ color:'#888', fontSize:12 }}>No AVI</span>}
          </div>
          <div>
            <h2 style={{ margin:0 }}>{profile.name || 'User'}</h2>
            <p style={{ margin:'4px 0 0', opacity:.8 }}>{profile.handle ? `@${profile.handle}` : '(no handle)'}</p>
            {profile.bio && <p style={{ margin:'8px 0 0', whiteSpace:'pre-wrap' }}>{profile.bio}</p>}
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <button type="button" className="clear-btn" onClick={onExit} aria-label="Back">Back</button>
          </div>
        </div>

        <div className="episode-card" style={{ marginTop:16 }}>
          <h3 style={{ margin:0 }}>Ratings summary</h3>
          <p style={{ marginTop:6 }}>
  Rated: {rated.length}
  {' • '}
  Average: {rated.length ? formatStars(Number(avg)) : '—'}{rated.length ? ` (${avg})` : ''}
  {' • '}
  Favorites: {favList.length}
</p>
        </div>

        <div className="episode-card" style={{ marginTop:16 }}>
          <h3 style={{ margin:0 }}>Favorites</h3>
          {favList.length === 0 ? <p style={{ color:'#bbb', marginTop:8 }}>No favorites yet.</p> : (
            <ul className="episode-list" style={{ marginTop:10 }}>
              {favList.map(ep => (
                <li key={ep.id} className="episode-card">
                  <div className="episode-header">
                    <div>
                      <h4 style={{ margin:0 }}>S{ep.season}E{ep.episode}: {ep.title}</h4>
                      <p style={{ margin:'6px 0 0' }}>{ep.description}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="episode-card" style={{ marginTop:16 }}>
          <h3 style={{ margin:0 }}>Featured collections</h3>
          {featured.length === 0 ? <p style={{ color:'#bbb', marginTop:8 }}>No featured collections.</p> : (
            <ul className="episode-list" style={{ marginTop:10 }}>
              {featured.map(c => (
                <li key={c.id} className="episode-card">
                  <div className="episode-header">
                    <div>
                      <h4 style={{ margin:0 }}>{c.name}</h4>
                      <p style={{ margin:'6px 0 0' }}>{(c.keywords||[]).join(', ') || '(no keywords)'} • {(c.episodeIds||[]).length} ep(s)</p>
                      {c.description && <p style={{ marginTop:6, color:'#cdbbf3' }}>{c.description}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="episode-card" style={{ marginTop:16 }}>
          <h3 style={{ margin:0 }}>Recent reviews</h3>
          {Object.entries(reviews).flatMap(([epId,list]) => list.map(r => ({ epId, r })))
            .sort((a,b)=> (b.r.ts||0)-(a.r.ts||0))
            .slice(0,20)
            .map(({ epId, r }) => {
              const ep = episodes.find(e=>e.id===epId);
              if (!ep) return null;
              return (
                <div key={r.id} style={{ border:'1px solid #333', borderRadius:10, padding:10, background:'#0f0f0f', marginTop:8 }}>
                  <div className="review-meta">{new Date(r.ts).toLocaleString()}</div>
                  <div style={{ fontWeight:700 }}>S{ep.season}E{ep.episode}: {ep.title}</div>
                  <div style={{ whiteSpace:'pre-wrap', marginTop:6 }}>{r.text}</div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}