import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AvatarCropModal } from './components/AvatarCropModal';
import { CoverCropModal } from './components/CoverCropModal';
import ErrorBoundary from './components/ErrorBoundary';
import { GlobalStyles } from './components/GlobalStyles';
import { MainContent } from './components/MainContent';
import { MainTopBar } from './components/MainTopBar';
import { PublicProfileView } from './components/PublicProfileView';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { ToastHost, pushToast } from './components/Toast';
import { AppCtx } from './ctx/AppCtx';
import { useActiveUserBootstrap } from './hooks/useActiveUserBootstrap';
import { useComments } from './hooks/useComments';
import { useDiaryHelpers } from './hooks/useDiaryHelpers';
import { useEngagementState } from './hooks/useEngagementState';
import { useEpisodeFilters } from './hooks/useEpisodeFilters';
import { useEpisodeModalState } from './hooks/useEpisodeModalState';
import { useEpisodesCatalog } from './hooks/useEpisodesCatalog';
import { useProfileState } from './hooks/useProfileState';
import { useRemoteHydration } from './hooks/useRemoteHydration';
import { useReviewReactionsRealtime } from './hooks/useReviewReactionsRealtime';
import AppShell from './layout/AppShell';
import { toggleReviewReaction } from './lib/commentsApi';
import { getDemoPublicReviews } from './lib/demoPublicReviews';
import { readImageFileToDataURL } from './lib/image';
import { COLLECTIONS_KEY } from './lib/storage';
import { safeGetJSON } from './lib/utils';
import { getCurrentUser, requireAuth, useSupabaseAuth } from './lib/auth';
import { supabase, hasSupabaseConfig } from './supabaseClient';

type CustomCollection = {
  id: string;
  name: string;
  keywords: string[];
  episodeIds: string[];
  description?: string;
};

// Copy helper used in multiple places
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ok = await (await import('./utils/clipboard')).copyText(text);
    return ok;
  } catch {
    return false;
  }
}

export default function App() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const { user, recovery } = useSupabaseAuth();
  const isAdmin = Boolean(
    user?.email && user.email.toLowerCase() === 'tjbenlev@gmail.com'
  );

  const [tab, setTab] = useState('browse');
  const [reviewView, setReviewView] = useState('all');
  const [profileTab, setProfileTab] = useState<
    'reviews' | 'activity' | 'followers' | 'following'
  >('reviews');
  const [avatarCropSrc, setAvatarCropSrc] = useState<string | null>(null);
  const [coverCropSrc, setCoverCropSrc] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [notifCount, setNotifCount] = useState<number>(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const avatarFileRef = useRef<HTMLInputElement | null>(null);
  const coverFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!recovery) return;
    setTab('settings');
    setShowReset(true);
  }, [recovery]);

  useEffect(() => {
    if (!user) setTab('browse');
  }, [user]);

  useReviewReactionsRealtime(hasSupabaseConfig);

  useEffect(() => {
    const loadFollowCounts = async () => {
      if (!hasSupabaseConfig) {
        setFollowersCount(0);
        setFollowingCount(0);
        return;
      }

      const current = await getCurrentUser();
      if (!current) {
        setFollowersCount(0);
        setFollowingCount(0);
        return;
      }

      const { count: folCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', current.id);

      const { count: ingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', current.id);

      setFollowersCount(folCount || 0);
      setFollowingCount(ingCount || 0);
    };

    loadFollowCounts();
  }, [user?.id, hasSupabaseConfig]);

  const openHandleProfile = useCallback(
    (input: any) => {
      try {
        const raw =
          typeof input === 'string'
            ? input
            : input?.handle ?? input?.authorHandle ?? input?.userHandle ?? '';
        const handle = String(raw || '').replace(/^@/, '');

        setTab('profile');
        try {
          (window as any).__vpSetProfileTab?.('reviews');
        } catch {}

        const loadByHandle =
          (window as any).__vpLoadProfileByHandle ||
          (window as any).__vpOpenProfileByHandle ||
          null;

        if (typeof loadByHandle === 'function') {
          loadByHandle(handle);
        } else {
          (window as any).__vpLastHandle = handle;
          try {
            history.pushState({}, '', `#@${handle}`);
          } catch {}
        }
      } catch (e) {
        console.warn('[openHandleProfile] fallback', e);
        setTab('profile');
      }
    },
    [setTab]
  );

  useEffect(() => {
    (window as any).openHandleProfile = openHandleProfile;
    return () => {
      try {
        delete (window as any).openHandleProfile;
      } catch {}
    };
  }, [openHandleProfile]);

  useEffect(() => {
    (window as any).__vpSetProfileTab = setProfileTab;
    return () => {
      try {
        delete (window as any).__vpSetProfileTab;
      } catch {}
    };
  }, [setProfileTab]);

  const handleAvatarFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const file = input.files?.[0];
      if (!file) return;

      try {
        const raw = await readImageFileToDataURL(file);
        if (!isMountedRef.current) return;
        setAvatarCropSrc(raw);
      } catch (err) {
        console.error(err);
        pushToast('Sorry—could not read that image.');
      } finally {
        input.value = '';
      }
    },
    []
  );

  const handleCoverFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      const file = input.files?.[0];
      if (!file) return;

      try {
        const raw = await readImageFileToDataURL(file);
        if (!isMountedRef.current) return;
        setCoverCropSrc(raw);
      } catch (err) {
        console.error(err);
        pushToast('Sorry—could not read that image.');
      } finally {
        input.value = '';
      }
    },
    []
  );

  const { catalog, episodes } = useEpisodesCatalog(hasSupabaseConfig);

  const { publicRoute, openEpisode, closeEpisode, epForModal } =
    useEpisodeModalState(episodes, setTab);

  const [collections, setCollections] = useState<CustomCollection[]>(() =>
    safeGetJSON(COLLECTIONS_KEY(), [])
  );

  const {
    publicReplies,
    setPublicReplies,
    addPublicReply,
    commentsByReview,
    loadComments,
    addComment,
    toggleCommentReaction,
  } = useComments();

  const updateCollection = useCallback(
    (collectionId: string, patch: Partial<CustomCollection>) => {
      (async () => {
        if (!hasSupabaseConfig) {
          pushToast('Connect Supabase to edit collections.');
          return;
        }

        const current = await requireAuth();
        if (!current) return;

        const toSend: any = {
          updated_at: new Date().toISOString(),
        };

        if (patch.name != null) toSend.name = patch.name;
        if (patch.keywords != null) toSend.keywords = patch.keywords;
        if (patch.description != null) toSend.description = patch.description;

        const { error } = await supabase
          .from('collections')
          .update(toSend)
          .eq('id', collectionId);

        if (error) {
          console.error(error);
          pushToast('Could not update collection');
          return;
        }

        setCollections((arr) =>
          arr.map((c) => (c.id === collectionId ? { ...c, ...patch } : c))
        );
      })();
    },
    [hasSupabaseConfig, setCollections]
  );

  const {
    profile,
    setProfile,
    savingProfile,
    unsaved,
    setUnsaved,
    saveToast,
    setSaveToast,
    saveProfileNow,
    loadOwnProfileFromDB,
  } = useProfileState({
    user,
    hasSupabaseConfig,
    isMountedRef,
  });

  const goTab = useCallback(
    (next: string) => {
      if (unsaved && !confirm('You have unsaved changes. Leave without saving?')) {
        return;
      }

      if (unsaved) setUnsaved(false);
      setTab(next);
    },
    [setTab, setUnsaved, unsaved]
  );

  const {
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
  } = useEngagementState({
    hasSupabaseConfig,
    profile,
    isMountedRef,
  });

  useActiveUserBootstrap({
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
  });

  useRemoteHydration({
    hasSupabaseConfig,
    setRatings,
    setFavs,
    setCollections,
    setWatchCounts,
    setWatchDates,
    setWatchedAt,
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLECTIONS_KEY(), JSON.stringify(collections));
    } catch {}
  }, [collections]);

  const {
    finalList,
    query,
    setQuery,
    searchIn,
    setSearchIn,
    seasonFilter,
    setSeasonFilter,
    seasonOptions,
    minStars,
    setMinStars,
    onlyFavs,
    setOnlyFavs,
    onlyWatched,
    setOnlyWatched,
    onlyUnwatched,
    setOnlyUnwatched,
    onlyRated,
    setOnlyRated,
    hideWatched,
    setHideWatched,
    watchDateFilter,
    setWatchDateFilter,
    sortBy,
    setSortBy,
    collectionFilterId,
    setCollectionFilterId,
    funny,
    setFunny,
    episodeTags,
    resetFilters,
  } = useEpisodeFilters(
    episodes,
    collections,
    ratings,
    favs,
    reviews,
    watchedAt,
    watchDates
  );

  const publics = useMemo(
    () => (epForModal ? getDemoPublicReviews(epForModal.id) : []),
    [epForModal]
  );

  const avgStars = useMemo(() => {
    if (!epForModal) return 0;

    const stars: number[] = [];
    if (typeof ratings?.[epForModal.id] === 'number') {
      stars.push(ratings[epForModal.id]);
    }

    (publics || []).forEach((p: any) => {
      if (typeof p?.stars === 'number') stars.push(p.stars);
    });

    return stars.length
      ? stars.reduce((a, b) => a + b, 0) / stars.length
      : 0;
  }, [epForModal, ratings, publics]);

  const {
    watched,
    isInDiary,
    isEpisodeInAnyCollection,
    setCollectionPickerOpen,
    setCollectionPickerTargetEp,
    openReviewModal,
  } = useDiaryHelpers({
    watchedAt,
    ratings,
    reviews,
    collections,
    openEpisode,
  });

  const ctx = {
    // auth / identity
    user,
    isAdmin,

    // core data
    profile,
    episodes,
    catalog,
    ratings,
    favs,
    reviews,
    collections,
    activity,
    watchedAt,
    openEpisode,

    // profile counts & subtabs
    followersCount,
    followingCount,
    setFollowersCount,
    setFollowingCount,
    profileTab,
    setProfileTab,

    // feed view
    reviewView,
    setReviewView,

    // ui / nav
    tab,
    setTab,
    goTab,
    openHandleProfile,
    notifCount,

    // public replies local cache
    publicReplies,
    setPublicReplies,
    addPublicReply,

    // comments & reactions helpers
    loadComments,
    editReview,
    deleteReview,

    // uploads (profile header)
    handleAvatarFileChange,
    handleCoverFileChange,
    avatarFileRef,
    coverFileRef,
    setAvatarCropSrc,
    setCoverCropSrc,

    // supabase & flags
    supabase,
    hasSupabaseConfig,

    // reactions
    toggleReviewReaction,
  };

  if (publicRoute && publicRoute.toLowerCase() === 'u') {
    return (
      <PublicProfileView
        profile={profile}
        episodes={episodes}
        ratings={ratings}
        favs={favs}
        reviews={reviews}
        collections={collections}
        onExit={() => {
          try {
            history.replaceState(null, '', location.pathname);
          } catch {}
        }}
      />
    );
  }

  return (
    <AppShell user={user} profile={profile}>
      <AppCtx.Provider value={ctx}>
        <ErrorBoundary>
          <a href="#main" className="skip-link">
            Skip to content
          </a>

          <div
            id="main"
            style={{
              padding: 16,
              background: '#111',
              color: '#fff',
              fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto',
            }}
          >
            <GlobalStyles />

            {saveToast && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  position: 'fixed',
                  left: '50%',
                  bottom: 16,
                  transform: 'translateX(-50%)',
                  background: '#14132b',
                  border: '1px solid var(--line)',
                  color: '#fff',
                  borderRadius: 12,
                  padding: '10px 14px',
                  boxShadow: 'var(--shadow)',
                  zIndex: 2000,
                }}
              >
                {saveToast}
              </div>
            )}

            {avatarCropSrc && (
              <AvatarCropModal
                src={avatarCropSrc}
                onClose={() => setAvatarCropSrc(null)}
                onSave={(dataUrl) => {
                  setProfile((p) => ({ ...p, avatar: dataUrl }));
                  setAvatarCropSrc(null);
                  setTimeout(async () => {
                    await saveProfileNow();
                    setUnsaved(false);
                    setSaveToast('Saved avatar');
                    setTimeout(() => setSaveToast(''), 1500);
                  }, 0);
                }}
              />
            )}

            {coverCropSrc && (
              <CoverCropModal
                src={coverCropSrc}
                onClose={() => setCoverCropSrc(null)}
                onSave={(dataUrl) => {
                  setProfile((p) => ({ ...p, cover_url: dataUrl }));
                  setCoverCropSrc(null);
                  setTimeout(async () => {
                    await saveProfileNow();
                    setUnsaved(false);
                    setSaveToast('Saved cover');
                    setTimeout(() => setSaveToast(''), 1500);
                  }, 0);
                }}
              />
            )}

            {showReset && <ResetPasswordModal onClose={() => setShowReset(false)} />}

            <MainTopBar
              tab={tab}
              goTab={goTab}
              notifCount={notifCount}
              user={user}
              profile={profile}
            />

            <MainContent
              tab={tab}
              user={user}
              episodes={episodes}
              finalList={finalList}
              query={query}
              setQuery={setQuery}
              searchIn={searchIn}
              setSearchIn={setSearchIn}
              seasonFilter={seasonFilter}
              setSeasonFilter={setSeasonFilter}
              seasonOptions={seasonOptions}
              minStars={minStars}
              setMinStars={setMinStars}
              onlyFavs={onlyFavs}
              setOnlyFavs={setOnlyFavs}
              onlyWatched={onlyWatched}
              setOnlyWatched={setOnlyWatched}
              onlyUnwatched={onlyUnwatched}
              setOnlyUnwatched={setOnlyUnwatched}
              onlyRated={onlyRated}
              setOnlyRated={setOnlyRated}
              hideWatched={hideWatched}
              setHideWatched={setHideWatched}
              watchDateFilter={watchDateFilter}
              setWatchDateFilter={setWatchDateFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              collectionFilterId={collectionFilterId}
              setCollectionFilterId={setCollectionFilterId}
              funny={funny}
              setFunny={setFunny}
              resetFilters={resetFilters}
              collections={collections}
              episodeTags={episodeTags}
              ratings={ratings}
              setRating={setRating}
              favs={favs}
              toggleFav={toggleFav}
              watchedAt={watchedAt}
              watchDates={watchDates}
              watchCounts={watchCounts}
              watchDateInputs={watchDateInputs}
              setWatchDateInputs={setWatchDateInputs}
              logWatch={logWatch}
              deleteLatestReview={deleteLatestReview}
              openEpisode={openEpisode}
              addReview={addReview}
              editReview={editReview}
              deleteReview={deleteReview}
              reviews={reviews}
              commentsByReview={commentsByReview}
              loadComments={loadComments}
              addComment={addComment}
              toggleCommentReaction={toggleCommentReaction}
              toggleReviewReaction={toggleReviewReaction}
              watched={watched}
              isInDiary={isInDiary}
              openReviewModal={openReviewModal}
              isEpisodeInAnyCollection={isEpisodeInAnyCollection}
              setCollectionPickerOpen={setCollectionPickerOpen}
              setCollectionPickerTargetEp={setCollectionPickerTargetEp}
              setNotifCount={setNotifCount}
              setCollections={setCollections}
              setTab={setTab}
              updateCollection={updateCollection}
              addActivity={addActivity}
              goTab={goTab}
              supabase={supabase}
              hasSupabaseConfig={hasSupabaseConfig}
              pushToast={pushToast}
              profile={profile}
              setProfile={setProfile}
              unsaved={unsaved}
              setUnsaved={setUnsaved}
              avatarFileRef={avatarFileRef}
              handleAvatarFileChange={handleAvatarFileChange}
              coverFileRef={coverFileRef}
              handleCoverFileChange={handleCoverFileChange}
              saveProfileNow={saveProfileNow}
              savingProfile={savingProfile}
              setSaveToast={setSaveToast}
              epForModal={epForModal}
              avgStars={avgStars}
              reviewView={reviewView}
              setReviewView={setReviewView}
              publics={publics}
              publicReplies={publicReplies}
              addPublicReply={addPublicReply}
              copyText={copyText}
              closeEpisode={closeEpisode}
            />
          </div>
        </ErrorBoundary>
      </AppCtx.Provider>

      <ToastHost />
    </AppShell>
  );
}
