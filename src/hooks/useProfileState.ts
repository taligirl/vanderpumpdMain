import { useEffect, useState, type MutableRefObject } from 'react';
import { supabase } from '../supabaseClient';
import { PROFILE_KEY } from '../lib/storage';
import { safeGetJSON } from '../lib/utils';
import { pushToast } from '../components/Toast';

type ProfileShape = {
  name: string;
  avatar: string;
  bio?: string;
  handle?: string;
  isPublic?: boolean;
  cover_url?: string;
  featuredCollectionIds?: string[];
};

type UseProfileStateArgs = {
  user: { id?: string | null } | null;
  hasSupabaseConfig: boolean;
  isMountedRef: MutableRefObject<boolean>;
};

export function useProfileState({
  user,
  hasSupabaseConfig,
  isMountedRef,
}: UseProfileStateArgs) {
  const [profile, setProfile] = useState<ProfileShape>(() =>
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

  const [savingProfile, setSavingProfile] = useState(false);
  const [unsaved, setUnsaved] = useState(false);
  const [saveToast, setSaveToast] = useState<string>('');

  // Warn before closing tab if there are unsaved edits
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!unsaved) return;
      e.preventDefault();
      e.returnValue = ''; // required for Chrome
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [unsaved]);

  // Let other helpers read the current profile (share-image, etc.)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as any).__vprProfile = profile;
  }, [profile]);

  // Persist profile to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_KEY(), JSON.stringify(profile));
    } catch {}
  }, [profile]);

  /* Ensure a profile row exists, and save edits to the cloud */
  async function saveProfileNow() {
    if (!hasSupabaseConfig || !user?.id) return;

    const handleRaw = (profile.handle || '')
      .replace(/^@/, '')
      .trim()
      .toLowerCase();
    const cleanHandle = handleRaw || null;

    if (cleanHandle && !/^[a-z0-9_]{3,20}$/.test(cleanHandle)) {
      pushToast(
        'Handle must be 3–20 chars, lowercase letters/numbers/underscores.'
      );
      return;
    }

    const payload = {
      id: user.id,
      handle: cleanHandle,
      display_name: profile.name || null,
      avatar_url: profile.avatar || null,
      cover_url: profile.cover_url || null,
      bio: profile.bio || null,
      is_public: !!profile.isPublic,
      updated_at: new Date().toISOString(),
    };

    const { data: row, error } = await supabase
      .from('profiles')
      .upsert(payload)
      .select('id, handle, display_name, avatar_url, bio, is_public, cover_url')
      .single();

    if (error) {
      if (
        (error as any).code === '23505' ||
        /duplicate|unique/i.test(error.message || '')
      ) {
        pushToast('That handle is already taken. Pick another one.');
      } else {
        pushToast('Could not save profile. Please try again.');
      }
      return;
    }

    const next: ProfileShape = {
      name: row.display_name || 'You',
      avatar: row.avatar_url || '',
      bio: row.bio || '',
      handle: row.handle || '',
      isPublic: !!row.is_public,
      cover_url: row.cover_url || '',
      featuredCollectionIds: Array.isArray(
        (profile as any)?.featuredCollectionIds
      )
        ? (profile as any).featuredCollectionIds
        : [],
    };

    if (!isMountedRef.current) return;
    setProfile((prev) => ({ ...prev, ...next }));

    try {
      localStorage.setItem(
        PROFILE_KEY(),
        JSON.stringify({ ...(profile as any), ...next })
      );
    } catch {}
  }

  // Load my profile row from Supabase and mirror it into local state + localStorage
  async function loadOwnProfileFromDB() {
    if (!hasSupabaseConfig || !user?.id) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('handle, display_name, avatar_url, cover_url, bio, is_public')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('profile fetch error', error);
      return;
    }
    if (!data) return;

    const next: ProfileShape = {
      name: data.display_name || 'You',
      avatar: data.avatar_url || '',
      bio: data.bio || '',
      handle: data.handle || '',
      isPublic: !!data.is_public,
      cover_url: data.cover_url || '',
      featuredCollectionIds: Array.isArray(
        (profile as any)?.featuredCollectionIds
      )
        ? (profile as any).featuredCollectionIds
        : [],
    };

    if (!isMountedRef.current) return;
    setProfile((prev) => ({ ...prev, ...next }));

    try {
      localStorage.setItem(
        PROFILE_KEY(),
        JSON.stringify({ ...(profile as any), ...next })
      );
    } catch {}
  }

  return {
    profile,
    setProfile,
    savingProfile,
    setSavingProfile,
    unsaved,
    setUnsaved,
    saveToast,
    setSaveToast,
    saveProfileNow,
    loadOwnProfileFromDB,
  };
}