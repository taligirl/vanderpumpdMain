import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Episode } from '../types';

export function useEpisodeModalState(
  episodes: Episode[],
  setTab: (tab: string) => void
) {
  const [openEpisodeId, setOpenEpisodeId] = useState<string | null>(null);
  const [publicRoute, setPublicRoute] = useState<string | null>(null);

  const openEpisode = useCallback((id: string) => {
    setOpenEpisodeId(id);
    try {
      history.replaceState(null, '', `${location.pathname}#${id}`);
    } catch {
      // ignore
    }
  }, []);

  const closeEpisode = useCallback(() => {
    setOpenEpisodeId(null);
    try {
      history.replaceState(
        null,
        '',
        location.pathname + (publicRoute ? '#u' : '')
      );
    } catch {
      // ignore
    }
  }, [publicRoute]);

  // Handle hash routes: #S2E4, #u, etc.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyHash = () => {
      const raw = window.location.hash || '';
      const hash = raw.startsWith('#') ? raw.slice(1) : raw;

      // Episode deep link: "S1E1", "S2E4", etc.
      if (/^S\d+E\d+$/i.test(hash)) {
        setOpenEpisodeId(hash.toUpperCase());
        setPublicRoute(null);
        setTab('browse');
        return;
      }

      // Local "#u" profile route
      if (hash.toLowerCase() === 'u') {
        setPublicRoute('u');
        setOpenEpisodeId(null);
        return;
      }

      // Anything else: clear
      setPublicRoute(null);
      setOpenEpisodeId(null);
    };

    applyHash();
    const onHash = () => applyHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [setTab]);

  // ESC to close modal
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openEpisodeId) {
        e.preventDefault();
        closeEpisode();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openEpisodeId, closeEpisode]);

  const epForModal = useMemo(
    () =>
      openEpisodeId
        ? episodes.find((e) => e.id === openEpisodeId) ?? null
        : null,
    [openEpisodeId, episodes]
  );

  return {
    publicRoute,
    openEpisode,
    closeEpisode,
    epForModal,
  };
}
