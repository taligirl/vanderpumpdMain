// Static demo public reviews used for the episode modal

export type DemoPublicReview = {
  id: string;
  author: string;
  handle: string;
  text: string;
  ts: number;
  avatar?: string;
};

const demoPublicReviewsMap: Record<string, DemoPublicReview[]> = {
  S1E1: [
    {
      id: 'pub1',
      author: 'Taylor',
      handle: '@tay',
      text: 'Iconic pilot, the SUR drama starts strong.',
      ts: Date.now() - 86400000,
    },
    {
      id: 'pub2',
      author: 'Chris',
      handle: '@chr1s',
      text: 'Funny moments and so much foreshadowing.',
      ts: Date.now() - 5400000,
    },
  ],
  S1E2: [
    {
      id: 'pub3',
      author: 'Mia',
      handle: '@miami',
      text: 'The breakup chaos… Wow.',
      ts: Date.now() - 7200000,
    },
  ],
};

export function getDemoPublicReviews(epId: string): DemoPublicReview[] {
  return demoPublicReviewsMap[epId] || [];
}