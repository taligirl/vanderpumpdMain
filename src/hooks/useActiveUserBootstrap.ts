import { useEffect, useRef } from 'react';
import { safeGetJSON } from '../lib/utils';
import {
  ACTIVE_UID,
  RATINGS_KEY,
  FAVS_KEY,
  REVIEWS_KEY,
  PROFILE_KEY,
  COLLECTIONS_KEY,
  ACTIVITY_KEY,
  WATCHED_KEY,
} from '../lib/storage';

type UseActiveUserBootstrapArgs = {
  user: any;
  hasSupabaseConfig: boolean;
  setRatings: (v: any) => void;
  setFavs: (v: any) => void;
  setReviews: (v: any) => void;
  setCollections: (v: any) => void;
  setActivity: (v: any) => void;
  setWatchedAt: (v: any) => void;
  setProfile: (v: any) => void;
  loadOwnProfileFromDB: () => void;
};

export function useActiveUserBootstrap({
  user,
  hasSupabaseConfig,
  setRatings,
  setFavs,
  setReviews,
  setCollections,
  setActivity,
  setWatchedAt,
  setProfile,
  loadOwnProfileFromDB,
}: UseActiveUserBootstrapArgs) {
  const lastUidRef = useRef<string>('init');

  useEffect(() => {
    const uid = user?.id || 'anon';

    // Track active user id for localStorage namespace
    try {
      const key = ACTIVE_UID || 'vp_uid';
      localStorage.setItem(key, uid);
    } catch {}

    if (lastUidRef.current === uid) return;
    lastUidRef.current = uid;

    // Reload all per-account bundles from localStorage
    setRatings(safeGetJSON(RATINGS_KEY(), {}));
    setFavs(safeGetJSON(FAVS_KEY(), {}));
    setReviews(safeGetJSON(REVIEWS_KEY(), {}));
    setCollections(safeGetJSON(COLLECTIONS_KEY(), []));
    setActivity(safeGetJSON(ACTIVITY_KEY(), []));
    setWatchedAt(safeGetJSON(WATCHED_KEY(), {}));
    setProfile(
      safeGetJSON(PROFILE_KEY(), {
        name: 'You',
        avatar: '',
        bio: '',
        handle: '',
        isPublic: false,
        cover_url: '',
        featuredCollectionIds: [],
      })
    );

    if (user && hasSupabaseConfig) {
      loadOwnProfileFromDB();
    }
  }, [
    user?.id,
    hasSupabaseConfig,
    setRatings,
    setFavs,
    setReviews,
    setCollections,
    setActivity,
    setWatchedAt,
    setProfile,
    loadOwnProfileFromDB,
  ]);
}
