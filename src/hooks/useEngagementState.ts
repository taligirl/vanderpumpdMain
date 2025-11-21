import { useEffect, useState, MutableRefObject } from 'react';
import { supabase } from '../supabaseClient';
import { requireAuth } from '../lib/auth';
import {
  RATINGS_KEY,
  FAVS_KEY,
  REVIEWS_KEY,
  ACTIVITY_KEY,
  WATCHED_KEY,
} from '../lib/storage';
import { safeGetJSON } from '../lib/utils';
import { pushToast } from '../components/Toast';
import type { ActivityItem, ReviewItem } from '../types';

type ProfileShape = {
  name: string;
  avatar: string;
  bio?: string;
  handle?: string;
  isPublic?: boolean;
  cover_url?: string;
  featuredCollectionIds?: string[];
};

type UseEngagementStateArgs = {
  hasSupabaseConfig: boolean;
  profile: ProfileShape;
  isMountedRef: MutableRefObject<boolean>;
};

export function useEngagementState({
  hasSupabaseConfig,
  profile,
  isMountedRef,
}: UseEngagementStateArgs) {
  // core state bundles (per-user, persisted to localStorage)
  const [ratings, setRatings] = useState<Record<string, number>>(() =>
    safeGetJSON(RATINGS_KEY(), {})
  );
  const [favs, setFavs] = useState<Record<string, boolean>>(() =>
    safeGetJSON(FAVS_KEY(), {})
  );
  const [reviews, setReviews] = useState<Record<string, ReviewItem[]>>(() =>
    safeGetJSON(REVIEWS_KEY(), {})
  );
  const [activity, setActivity] = useState<ActivityItem[]>(() =>
    safeGetJSON(ACTIVITY_KEY(), [])
  );
  const [watchedAt, setWatchedAt] = useState<Record<string, number>>(() =>
    safeGetJSON(WATCHED_KEY(), {})
  );

  // watch metadata (not persisted; derived + runtime)
  const [watchCounts, setWatchCounts] = useState<Record<string, number>>({});
  const [watchDates, setWatchDates] = useState<Record<string, string[]>>({});
  const [watchDateInputs, setWatchDateInputs] = useState<
    Record<string, string>
  >({});

  // --- persistence to localStorage ---
  useEffect(() => {
    try {
      localStorage.setItem(RATINGS_KEY(), JSON.stringify(ratings));
    } catch {
      // ignore
    }
  }, [ratings]);

  useEffect(() => {
    try {
      localStorage.setItem(FAVS_KEY(), JSON.stringify(favs));
    } catch {
      // ignore
    }
  }, [favs]);

  useEffect(() => {
    try {
      localStorage.setItem(REVIEWS_KEY(), JSON.stringify(reviews));
    } catch {
      // ignore
    }
  }, [reviews]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVITY_KEY(), JSON.stringify(activity));
    } catch {
      // ignore
    }
  }, [activity]);

  useEffect(() => {
    try {
      localStorage.setItem(WATCHED_KEY(), JSON.stringify(watchedAt));
    } catch {
      // ignore
    }
  }, [watchedAt]);

  // --- helpers ---

  function addActivity(
    item: Omit<ActivityItem, 'id' | 'ts'> & Partial<Pick<ActivityItem, 'ts'>>
  ) {
    setActivity((prev) => {
      const now = Date.now();
      const ts = item.ts ?? now;
      const keyType = item.type;
      const keyEp = item.epId ?? '';
      const keyDet = item.detail ?? '';

      // coalesce rating events per episode within 10 minutes
      if (keyType === 'rating' && keyEp) {
        const tenMin = 10 * 60 * 1000;
        const idx = prev.findIndex(
          (a) =>
            a.type === 'rating' &&
            (a.epId ?? '') === keyEp &&
            now - (a.ts ?? 0) <= tenMin
        );
        if (idx !== -1) {
          const updated = { ...prev[idx], ts, detail: keyDet };
          const copy = [...prev];
          copy[idx] = updated;
          return copy;
        }
      }

      const dup = prev.find(
        (a) =>
          Math.abs((a.ts ?? 0) - ts) < 1000 &&
          a.type === keyType &&
          (a.epId ?? '') === keyEp &&
          (a.detail ?? '') === keyDet
      );
      if (dup) return prev;

      const next: ActivityItem = {
        id: `${ts}-${Math.random().toString(36).slice(2, 8)}`,
        ts,
        type: keyType,
        epId: item.epId,
        detail: item.detail,
      };
      return [next, ...prev].slice(0, 500);
    });
  }

  // Ratings & Favorites (with specific activity message)
  function setRating(epId: string, v: number) {
    (async () => {
      if (!hasSupabaseConfig) {
        pushToast('Connect Supabase to rate.');
        return;
      }
      const u = await requireAuth();
      if (!u) return;

      const stars = Math.max(0, Math.min(5, v));

      // only log activity if > 0 stars
      setRatings((r) => {
        const before = r[epId] || 0;
        const next = { ...r, [epId]: stars };
        if (stars > 0 && before !== stars) {
          addActivity({ type: 'rating', epId, detail: String(stars) });
        }
        return next;
      });

      const { error } = await supabase
        .from('ratings')
        .upsert({
          user_id: u.id,
          ep_id: epId,
          stars,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error(error);
        pushToast('Could not save rating online.');
      }
    })();
  }

  function toggleFav(epId: string) {
    (async () => {
      if (!hasSupabaseConfig) {
        pushToast('Connect Supabase to favorite.');
        return;
      }
      const u = await requireAuth();
      if (!u) return;

      const wasFav = !!favs[epId];
      setFavs((f) => {
        const nowFav = !wasFav;
        const next = { ...f, [epId]: nowFav };
        if (nowFav) addActivity({ type: 'favorited', epId, detail: 'Favorited' });
        return next;
      });

      if (wasFav) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', u.id)
          .eq('ep_id', epId);
        if (error) console.error(error);
      } else {
        const { error } = await supabase.from('favorites').upsert({
          user_id: u.id,
          ep_id: epId,
          created_at: new Date().toISOString(),
        });
        if (error) console.error(error);
      }
    })();
  }

  // Log a watch on a chosen date (YYYY-MM-DD)
  async function logWatch(epId: string, dateISO: string) {
    if (!hasSupabaseConfig) {
      pushToast('Connect Supabase to log watches.');
      return;
    }
    const u = await requireAuth();
    if (!u) return;

    const d = (dateISO || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      pushToast('Pick a date');
      return;
    }

    const { error } = await supabase
      .from('watch_events')
      .insert({ ep_id: epId, watched_on: d, user_id: u.id, event: 'watch' });

    if (error) {
      console.error('watch insert error', error);
      pushToast(error.message || 'Could not log watch');
      return;
    }

    if (!isMountedRef.current) return;

    // optimistic local update
    setWatchCounts((m) => ({ ...m, [epId]: (m[epId] || 0) + 1 }));
    setWatchDates((m) => {
      const cur = m[epId] || [];
      const next = [d, ...cur.filter((x) => x !== d)];
      return { ...m, [epId]: next };
    });
    setWatchedAt((m) => ({ ...m, [epId]: new Date(d).getTime() }));
    setWatchDateInputs((m) => {
      const copy = { ...m };
      delete copy[epId];
      return copy;
    });

    // also create a blank review entry for this watch
    try {
      const starsSnap = ratings[epId] || 0;
      const createdAt = new Date(`${d}T12:00:00.000Z`).toISOString();

      const { data: ins, error: revErr } = await supabase
        .from('reviews')
        .insert({
          user_id: u.id,
          ep_id: epId,
          text: '',
          stars_at_post: starsSnap,
          created_at: createdAt,
        })
        .select('id, stars_at_post, created_at')
        .single();

      const newItem: ReviewItem = {
        id: ins?.id || `${Date.now()}`,
        text: '',
        starsAtPost: ins?.stars_at_post ?? starsSnap,
        ts: ins?.created_at
          ? new Date(ins.created_at).getTime()
          : Date.now(),
        authorName: profile?.name || 'You',
        authorHandle: profile?.handle
          ? `@${String(profile.handle).replace(/^@/, '')}`
          : '',
        authorAvatar: profile?.avatar || '',
      };

      setReviews((m) => {
        const list = m[epId] ? [newItem, ...m[epId]] : [newItem];
        return { ...m, [epId]: list };
      });
      addActivity({ type: 'review_add', epId, detail: '', ts: newItem.ts });

      if (revErr) {
        console.warn('[watch->review] insert failed (kept local):', revErr);
      }
    } catch (e) {
      console.warn('[watch->review] fallback:', e);
    }
  }

  // Review helpers (+ activity)
  const addReview = (epId: string, text: string) => {
    (async () => {
      const t = (text || '').trim();
      if (!t) return;

      if (!hasSupabaseConfig) {
        pushToast('Connect Supabase to post reviews.');
        return;
      }
      const u = await requireAuth();
      if (!u) return;

      const starsSnap = ratings[epId] || 0;

      const { data: ins, error } = await supabase
        .from('reviews')
        .insert({
          user_id: u.id,
          ep_id: epId,
          text: t,
          stars_at_post: starsSnap,
          created_at: new Date().toISOString(),
        })
        .select('id, stars_at_post')
        .single();

      const newItem: ReviewItem = {
        id: ins?.id || `${Date.now()}`,
        text: t,
        starsAtPost: ins?.stars_at_post ?? starsSnap,
        ts: Date.now(),
        authorName: profile?.name || 'You',
        authorHandle: profile?.handle ? `@${profile.handle}` : '',
        authorAvatar: profile?.avatar || '',
      };

      setReviews((m) => {
        const list = m[epId] ? [...m[epId]] : [];
        list.unshift(newItem);
        return { ...m, [epId]: list };
      });
      addActivity({ type: 'review_add', epId, detail: t });

      if (error) {
        console.error('Supabase insert reviews error:', error);
        pushToast('Could not save review online. It’s saved locally.');
      }
    })();
  };

  const editReview = (epId: string, reviewId: string, newText: string) => {
    setReviews((m) => {
      const list = (m[epId] || []).map((r) =>
        r.id === reviewId ? { ...r, text: newText } : r
      );
      return { ...m, [epId]: list };
    });
    addActivity({ type: 'review_edit', epId, detail: 'Edited review' });
  };

  const deleteReview = (epId: string, reviewId: string) => {
    (async () => {
      // optimistic local removal
      setReviews((m) => {
        const list = (m[epId] || []).filter((r) => r.id !== reviewId);
        return { ...m, [epId]: list };
      });

      if (!hasSupabaseConfig) return;
      const u = await requireAuth();
      if (!u) return;

      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', u.id);

      if (error)
        console.error('[deleteReview] supabase delete error:', error);
    })();
  };

  const deleteLatestReview = (epId: string) => {
    const list = (reviews[epId] || [])
      .slice()
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
    const latest = list[0];
    if (!latest?.id) {
      pushToast('No review to delete');
      return;
    }
    if (confirm('Delete the latest review?')) deleteReview(epId, latest.id);
  };

  return {
    ratings,
    setRatings,
    favs,
    setFavs,
    reviews,
    setReviews,
    activity,
    setActivity,
    watchedAt,
    setWatchedAt,
    watchCounts,
    setWatchCounts,
    watchDates,
    setWatchDates,
    watchDateInputs,
    setWatchDateInputs,
    addActivity,
    setRating,
    toggleFav,
    logWatch,
    addReview,
    editReview,
    deleteReview,
    deleteLatestReview,
  };
}
