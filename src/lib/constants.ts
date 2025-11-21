// src/lib/constants.ts
export const REVIEW_HEART = '❤️' as const;
export type ReviewHeart = typeof REVIEW_HEART;

// DB "value" is integer; heart is always +1 for reviews
export const reactionValue = 1 as const;
