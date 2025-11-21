// src/ctx/AppCtx.ts
import * as React from 'react';
import type { Episode, ReviewItem, ActivityItem, PublicReply } from '../types';

// Match the inline profile state you have in App.tsx
type Profile = {
  name: string;
  avatar: string;
  bio?: string;
  handle?: string;
  isPublic?: boolean;
  cover_url?: string;
  featuredCollectionIds?: string[];
};

// Match the CustomCollection type you declared in App.tsx
type CustomCollection = {
  id: string;
  name: string;
  keywords: string[];
  episodeIds: string[];
  description?: string;
};

// Everything that goes into `const ctx = { ... }` in App.tsx
export type AppCtxType = {
  // auth / identity
  user: any;  // Supabase user (we can tighten later)
  isAdmin: boolean;

  // core data
  profile: Profile;
  episodes: Episode[];
  catalog: Episode[];
  ratings: Record<string, number>;
  favs: Record<string, boolean>;
  reviews: Record<string, ReviewItem[]>;
  collections: CustomCollection[];
  activity: ActivityItem[];
  watchedAt: Record<string, number>;
  openEpisode: (id: string) => void;

  // profile counts & subtabs
  followersCount: number;
  followingCount: number;
  setFollowersCount: React.Dispatch<React.SetStateAction<number>>;
  setFollowingCount: React.Dispatch<React.SetStateAction<number>>;
  profileTab: 'reviews' | 'activity' | 'followers' | 'following';
  setProfileTab: React.Dispatch<
    React.SetStateAction<'reviews' | 'activity' | 'followers' | 'following'>
  >;

  // feed view
  reviewView: string;
  setReviewView: React.Dispatch<React.SetStateAction<string>>;

  // ui / nav
  tab: string;  // e.g. 'browse' | 'diary' | ...
  setTab: React.Dispatch<React.SetStateAction<string>>;
  goTab: (next: string) => void;
  openHandleProfile: (input: any) => void;

  // notifications + public replies
  notifCount: number;
  publicReplies: Record<string, PublicReply[]>;
  setPublicReplies: React.Dispatch<
    React.SetStateAction<Record<string, PublicReply[]>>
  >;
  addPublicReply: (parentId: string, text: string) => void;

  // comments / reviews
  loadComments: (reviewId: string) => Promise<void>;
  editReview: (epId: string, reviewId: string, newText: string) => void;
  deleteReview: (epId: string, reviewId: string) => void;

  // uploads (avatar / cover)
  handleAvatarFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCoverFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  avatarFileRef: React.RefObject<HTMLInputElement>;
  coverFileRef: React.RefObject<HTMLInputElement>;
  setAvatarCropSrc: React.Dispatch<React.SetStateAction<string | null>>;
  setCoverCropSrc: React.Dispatch<React.SetStateAction<string | null>>;

  // supabase & flags
  supabase: any;
  hasSupabaseConfig: boolean;

  // reactions
  toggleReviewReaction: (reviewId: string, emoji: string) => Promise<void>;
};

export const AppCtx = React.createContext<AppCtxType | null>(null);

export function useAppCtx(): AppCtxType {
  const v = React.useContext(AppCtx);
  if (!v) {
    throw new Error('AppCtx missing (wrap children in <AppCtx.Provider value={ctx}>)');
  }
  return v;
}
