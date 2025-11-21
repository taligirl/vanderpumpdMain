import { formatStars } from '../lib/stars';

export type AnyActivity = {
  type?: string;
  episode?: string | { code?: string; title?: string };
  rating?: number;
  target?: string;
  created_at?: string;
  user?: { name?: string };
  [k: string]: any;
};

/** Safe, simple text for your activity feed. Returns a string. */
export function formatActivityRow(a?: AnyActivity): string {
  try {
    const t = (a?.type || 'activity').toString();
    const ts = a?.created_at ? new Date(a.created_at).toLocaleString() : '';
    const ep =
      typeof a?.episode === 'string'
        ? a?.episode
        : a?.episode?.code || a?.episode?.title || '';

    if (t === 'review') {
      const r =
        typeof a?.rating === 'number' ? ` — ${a.rating}/5` : '';
      const who = a?.user?.name ? `${a.user.name} ` : '';
      return `${who}reviewed ${ep}${r}${ts ? ` · ${ts}` : ''}`;
    }

    if (t === 'comment') {
      return `commented on ${ep}${ts ? ` · ${ts}` : ''}`;
    }

    if (t === 'like' || t === 'reaction') {
      const tgt = a?.target || 'post';
      return `reacted to a ${tgt}${ts ? ` · ${ts}` : ''}`;
    }

    return `${t}${ep ? ` · ${ep}` : ''}${ts ? ` · ${ts}` : ''}`;
  } catch {
    return typeof a === 'string' ? a : JSON.stringify(a ?? {});
  }
}
