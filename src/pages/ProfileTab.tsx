import * as React from 'react';
import { useAppCtx } from '../ctx/AppCtx';
// [PROFILE-PAGE-IMPORTS-START]
import { AvatarCropModal } from '../components/AvatarCropModal';
import { CoverCropModal } from '../components/CoverCropModal';
import { ReviewItemCard } from '../components/ReviewItemCard';
import { CommentThread } from '../components/CommentThread';
import { ProfileSubtabs } from '../components/ProfileSubtabs';
import { formatActivityRow } from '../utils/formatActivity';

// [PROFILE-PAGE-IMPORTS-END]

export default function ProfileTab() {
  const ctx = useAppCtx();
  
  // [PROFILE-PAGE-DESTRUCTURE-START]
const {
  // identity
  user, isAdmin,

  // core data
  profile, episodes, ratings, favs, reviews, collections, activity, watchedAt, editReview, deleteReview,

  // profile header + counts + subtabs
  followersCount, followingCount, setFollowersCount, setFollowingCount,
  profileTab, setProfileTab,

  // feed filters
  reviewView, setReviewView,

  // navigation / UI helpers
  tab, setTab, goTab, openHandleProfile, notifCount, openEpisode,

  // public replies cache for local-only replies
  publicReplies, setPublicReplies, addPublicReply,

  // comments/reactions helpers (used by review/comment components)
  loadComments,
  toggleReviewReaction,
  // uploads / crop modals (avatar/cover)
  handleAvatarFileChange, handleCoverFileChange,
  avatarFileRef, coverFileRef, setAvatarCropSrc, setCoverCropSrc,

  // env
  supabase, hasSupabaseConfig,
} = ctx;
// [PROFILE-PAGE-DESTRUCTURE-END]

  return (
    <>
      {/* [TAB-PROFILE-CONTENT] */}
     {/* [TAB-PROFILE-START] */}
          {user && tab==='profile' && (
  <div style={{ border:'1px solid #333', borderRadius:12, padding:12, background:'#171717', maxWidth:980, margin:'0 auto' }}>
    {/* Cover image (display-only) */}
    <div style={{
      width:'100%', height:140, borderRadius:12, overflow:'hidden',
      border:'1px solid #333', background:'#0d0d0d', marginBottom:12
    }}>
      {profile.cover_url ? (
        <img src={profile.cover_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
      ) : (
        <div style={{width:'100%',height:'100%',display:'grid',placeItems:'center',color:'#777'}}>No cover</div>
      )}
    </div>

    <div style={{ display:'flex', justifyContent:'flex-end' }}>
  <button
    type="button"
    className="clear-btn"
    onClick={()=>goTab('settings')}
    title="Edit profile"
    aria-label="Edit profile"
  >
    Edit
  </button>
</div>

    {/* Header: avatar + name + handle + bio (display-only) */}
    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
      <div style={{ width:64, height:64, borderRadius:'50%', overflow:'hidden', border:'1px solid #333', background:'#222', display:'grid', placeItems:'center' }}>
        {profile.avatar ? (
          <img src={profile.avatar} alt="" width={64} height={64} style={{ objectFit:'cover', width:'100%', height:'100%' }} />
        ) : <span style={{ color:'#888', fontSize:12 }}>No AVI</span>}
      </div>

      <div>
        <h3 style={{ margin:0 }}>{profile.name || 'You'}</h3>
        <p style={{ margin:'4px 0 0', opacity:.8 }}>
          {profile.handle ? `@${profile.handle}` : 'Local profile'} •
          <button
            type="button"
            className="clear-btn"
            style={{padding:0, background:'transparent', border:'none', textDecoration:'underline', cursor:'pointer'}}
            onClick={()=> (window as any).__vpSetProfileTab?.('followers')}
          >
            {followersCount} followers
          </button>
          {' • '}
          <button
            type="button"
            className="clear-btn"
            style={{padding:0, background:'transparent', border:'none', textDecoration:'underline', cursor:'pointer'}}
            onClick={()=> (window as any).__vpSetProfileTab?.('following')}
          >
            {followingCount} following
          </button>
        </p>
        {profile.bio && <p style={{ margin:'8px 0 0', whiteSpace:'pre-wrap' }}>{profile.bio}</p>}
      </div>
    </div>

    {/* Profile Subtabs (activity, etc.) */}
    <div className="episode-card" style={{ marginTop:18 }}>
      <ProfileSubtabs
          value={profileTab}
          onChange={setProfileTab}
          episodes={episodes}
          activity={activity}
          reviews={reviews}
          ratings={ratings}
          favs={favs}
          formatActivityRow={formatActivityRow}
          openEpisode={openEpisode}
          onEdit={editReview}
          onDelete={deleteReview}
          toggleReviewReaction={toggleReviewReaction}
      />
    </div>
  </div>
)}
          {/* [TAB-PROFILE-END] */} 
    </>
  );
}
export { ProfileTab };
