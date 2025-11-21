import { useMemo, useState } from 'react';
import type { Episode, ReviewItem } from '../types';

type SearchIn = 'all' | 'title' | 'description' | 'reviews';
type SortKey = 'season-asc' | 'season-desc' | 'my-stars-desc' | 'my-stars-asc';

export type FunnyTags = {
  costumes: boolean;
  jaxShirtOff: boolean;
  tequilaKatie: boolean;
  vegas: boolean;
  reunion: boolean;
};

type CustomCollectionLike = {
  id: string;
  name: string;
  keywords?: string[];
  description?: string;
  episodeIds: string[];
};

export function useEpisodeFilters(
  episodes: Episode[],
  collections: CustomCollectionLike[],
  ratings: Record<string, number>,
  favs: Record<string, boolean>,
  reviews: Record<string, ReviewItem[]>,
  watchedAt: Record<string, number>,
  watchDates: Record<string, string[]>
) {
  // basic filters
  const [query, setQuery] = useState('');
  const [searchIn, setSearchIn] = useState<SearchIn>('all');
  const [seasonFilter, setSeasonFilter] = useState<number | 'all'>('all');

  const seasonOptions = useMemo(
    () =>
      Array.from(new Set((episodes || []).map((e) => e.season))).sort(
        (a, b) => a - b
      ),
    [episodes]
  );

  const [minStars, setMinStars] = useState<number>(0);
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [onlyWatched, setOnlyWatched] = useState(false);
  const [onlyUnwatched, setOnlyUnwatched] = useState(false);
  const [onlyRated, setOnlyRated] = useState(false);
  const [hideWatched, setHideWatched] = useState(false);

  const [watchDateFilter, setWatchDateFilter] = useState<string>('');

  const [sortBy, setSortBy] = useState<SortKey>('season-asc');
  const [collectionFilterId, setCollectionFilterId] =
    useState<string>('all');

  // funny tags
  const [funny, setFunny] = useState<FunnyTags>({
    costumes: false,
    jaxShirtOff: false,
    tequilaKatie: false,
    vegas: false,
    reunion: false,
  });

  const episodeTags = (ep: Episode): FunnyTags => {
    const explicit = new Set((ep.tags || []).map((s) => s.toLowerCase()));
    const t = `${ep.title} ${ep.description}`.toLowerCase();

    const guess: FunnyTags = {
      costumes: /costume|halloween|surlesque|burlesque|dress|wig/.test(t),
      jaxShirtOff: /jax[^a-z]*shirt|shirtless|abs/.test(t),
      tequilaKatie: /tequila|katie rant|rage[- ]text|rage text/.test(t),
      vegas: /vegas|sin city|bachelor|bachelorette/.test(t),
      reunion: /reunion/.test(t),
    };

    return {
      costumes: explicit.has('costumes') || guess.costumes,
      jaxShirtOff:
        explicit.has('jaxshirtoff') ||
        explicit.has('jax_shirt_off') ||
        explicit.has('jax-shirt-off') ||
        guess.jaxShirtOff,
      tequilaKatie:
        explicit.has('tequilakatie') ||
        explicit.has('tequila_katie') ||
        explicit.has('tequila-katie') ||
        guess.tequilaKatie,
      vegas: explicit.has('vegas') || guess.vegas,
      reunion: explicit.has('reunion') || guess.reunion,
    };
  };

  const applyFilters = (list: Episode[]) => {
    const q = (query || '').toLowerCase();

    return list.filter((ep) => {
      if (seasonFilter !== 'all' && ep.season !== seasonFilter) return false;
      if (onlyFavs && !favs[ep.id]) return false;
      if (onlyRated && !(ratings[ep.id] > 0)) return false;
      if (minStars > 0 && (ratings[ep.id] || 0) < minStars) return false;

      // watched logic
      const isWatched = !!watchedAt[ep.id];
      if (onlyWatched && !isWatched) return false;
      if (onlyUnwatched && isWatched) return false;

      // filter by specific watch date
      if (watchDateFilter) {
        const dates = watchDates[ep.id] || [];
        if (!dates.includes(watchDateFilter)) return false;
      }

      // search logic
      if (q) {
        const inTitle = ep.title.toLowerCase().includes(q);
        const inDesc = ep.description.toLowerCase().includes(q);
        const inReviews = (reviews[ep.id] || []).some((r) =>
          (r.text || '').toLowerCase().includes(q)
        );

        if (searchIn === 'title' && !inTitle) return false;
        if (searchIn === 'description' && !inDesc) return false;
        if (searchIn === 'reviews' && !inReviews) return false;
        if (searchIn === 'all' && !(inTitle || inDesc || inReviews))
          return false;
      }

      // funny tags
      const tags = episodeTags(ep);
      if (funny.costumes && !tags.costumes) return false;
      if (funny.jaxShirtOff && !tags.jaxShirtOff) return false;
      if (funny.tequilaKatie && !tags.tequilaKatie) return false;
      if (funny.vegas && !tags.vegas) return false;
      if (funny.reunion && !tags.reunion) return false;

      return true;
    });
  };

  const finalList = useMemo(() => {
    let base = episodes;

    if (collectionFilterId !== 'all') {
      const selected = collections.find(
        (c) => c.id === collectionFilterId
      );
      if (selected) {
        const manualIds = new Set(selected.episodeIds || []);
        const kws = (selected.keywords || []).map((s) =>
          s.toLowerCase()
        );
        base = base.filter((ep) => {
          const text = `${ep.title} ${ep.description}`.toLowerCase();
          const byKeywords =
            kws.length > 0 && kws.some((kw) => text.includes(kw));
          return manualIds.has(ep.id) || byKeywords;
        });
      }
    }

    const filtered = applyFilters(base).filter(
      (ep) => !(hideWatched && watchedAt[ep.id])
    );

    const out = [...filtered];
    const myStars = (id: string) => ratings[id] || 0;

    switch (sortBy) {
      case 'season-asc':
        out.sort(
          (a, b) =>
            a.season - b.season || (a.episode - b.episode)
        );
        break;
      case 'season-desc':
        out.sort(
          (a, b) =>
            b.season - a.season || (b.episode - a.episode)
        );
        break;
      case 'my-stars-desc':
        out.sort(
          (a, b) =>
            myStars(b.id) - myStars(a.id) ||
            a.title.localeCompare(b.title)
        );
        break;
      case 'my-stars-asc':
        out.sort(
          (a, b) =>
            myStars(a.id) - myStars(b.id) ||
            a.title.localeCompare(b.title)
        );
        break;
      default:
        break;
    }

    return out;
  }, [
    episodes,
    collections,
    ratings,
    favs,
    reviews,
    watchedAt,
    watchDates,
    watchDateFilter,
    query,
    searchIn,
    seasonFilter,
    minStars,
    onlyFavs,
    onlyRated,
    onlyWatched,
    onlyUnwatched,
    hideWatched,
    sortBy,
    collectionFilterId,
    funny.costumes,
    funny.jaxShirtOff,
    funny.tequilaKatie,
    funny.vegas,
    funny.reunion,
  ]);

  function resetFilters() {
    setQuery('');
    setSearchIn('all');
    setSeasonFilter('all');
    setMinStars(0);
    setOnlyFavs(false);
    setOnlyRated(false);
    setOnlyWatched(false);
    setOnlyUnwatched(false);
    setHideWatched(false);
    setSortBy('season-asc');
    setCollectionFilterId('all');
    setFunny({
      costumes: false,
      jaxShirtOff: false,
      tequilaKatie: false,
      vegas: false,
      reunion: false,
    });
    setWatchDateFilter('');
  }

  return {
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
  };
}
