// src/lib/storage.ts
export function ACTIVE_UID() {
  try { return localStorage.getItem('vp_uid') || 'anon'; } catch { return 'anon'; }
}

export function EPISODES_KEY()      { return `vp_${ACTIVE_UID()}_episodes`; }
export function RATINGS_KEY()       { return `vp_${ACTIVE_UID()}_ratings`; }
export function FAVS_KEY()          { return `vp_${ACTIVE_UID()}_favs`; }
export function REVIEWS_KEY()       { return `vp_${ACTIVE_UID()}_reviews`; }
export function PROFILE_KEY()       { return `vp_${ACTIVE_UID()}_profile`; }
export function COLLECTIONS_KEY()   { return `vp_${ACTIVE_UID()}_collections`; }
export function ACTIVITY_KEY()      { return `vp_${ACTIVE_UID()}_activity`; }
export function WATCHED_KEY()       { return `vp_${ACTIVE_UID()}_watchedAt`; }
export function PUBLIC_REPLIES_KEY(){ return `vp_${ACTIVE_UID()}_public_replies`; }
