// src/types.ts — shared type definitions (moved from App.tsx)

export type Episode = { id: string; season: number; episode: number; title: string; description: string; tags?: string[] };
export type CommentNode = {
  id: string;
  review_id: string;
  parent_id: string | null;
  user_id: string;
  text: string;
  created_at: string;
};
export type ReviewItem = {
  id: string;
  text: string;
  ts: number;
  authorName?: string;
  authorHandle?: string;
  authorAvatar?: string;
  starsAtPost?: number;
};
export type Comment = {
  id: string;
  review_id: string;
  parent_id?: string | null;
  text: string;
  ts: number;
  authorId?: string;
  authorName?: string;
  authorHandle?: string;
  authorAvatar?: string;
  reactions?: Record<string, number>; // e.g. {'👍': 3, '👎': 1}
};
export type ActivityType =
  | 'review_add'
  | 'review_edit'
  | 'review_delete'
  | 'rating'
  | 'favorited'
  | 'unfavorited'
  | 'collection_add'
  | 'collection_update'
  | 'collection_delete'
  | 'import'
  | 'watched'
  | 'unwatched';
export type ActivityItem = {
  id: string;
  ts: number;
  type: ActivityType;
  epId?: string;
  detail?: string;
};
export type CommentRow = {
  id: string;
  review_id: string;
  parent_id: string | null;
  text: string;
  ts: number;
  authorName?: string;
  authorHandle?: string;
  authorAvatar?: string;
};
export type DbComment = {
  id: string;
  review_id: string;
  parent_comment_id: string | null;
  text: string;
  user_id?: string;
  created_at?: string;
  // optional denorm for UI:
  authorName?: string;
  authorHandle?: string;
  authorAvatar?: string;
  ts?: number;
};
export type PublicReply = {
  id: string;
  parentId: string;
  text: string;
  ts: number;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
};
