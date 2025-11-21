// src/hooks/useDiaryHelpers.ts
import { useCallback, useMemo, useState } from 'react';
import type { Episode, ReviewItem } from '../types';

type CustomCollectionLike = {
  id: string;
  name: string;
  keywords?: string[];
  description?: string;
  episodeIds: string[];
};

type Params = {
  watchedAt: Record<string, number>;
  ratings: Record<string, number>;
  reviews: Record<string, ReviewItem[]>;
  collections: CustomCollectionLike[];
  openEpisode: (epId: string) => void;
};

export function useDiaryHelpers({
  watchedAt,
  ratings,
  reviews,
  collections,
  openEpisode,
}: Params) {
  // Simple "watched" boolean map derived from watchedAt
  const watched: Record<string, boolean> = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(watchedAt || {}).map((id) => [id, true]),
      ),
    [watchedAt],
  );

  // An episode is "in diary" if it has a watch, rating, or review
  const isInDiary = useCallback(
    (epId: string) => {
      const hasWatch = !!watched[epId];
      const hasRating = (ratings[epId] || 0) > 0;
      const hasReview = (reviews[epId]?.length ?? 0) > 0;
      return hasWatch || hasRating || hasReview;
    },
    [watched, ratings, reviews],
  );

  // Whether an episode belongs to any collection (by id)
  const isEpisodeInAnyCollection = useCallback(
    (epId: string) =>
      collections.some((c) => (c.episodeIds || []).includes(epId)),
    [collections],
  );

  // Collection picker state (used by DiaryTab to open a picker UI)
  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false);
  const [collectionPickerTargetEp, setCollectionPickerTargetEp] =
    useState<Episode | null>(null);

  // For DiaryTab: open the same episode modal you use elsewhere
  const openReviewModal = useCallback(
    (epId: string) => {
      openEpisode(epId);
    },
    [openEpisode],
  );

  return {
    watched,
    isInDiary,
    isEpisodeInAnyCollection,
    collectionPickerOpen,
    setCollectionPickerOpen,
    collectionPickerTargetEp,
    setCollectionPickerTargetEp,
    openReviewModal,
  };
}