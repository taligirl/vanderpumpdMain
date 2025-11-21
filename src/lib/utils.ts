// Generic helpers moved out of App.tsx

export function safeGetJSON<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function openReportMail(opts: { targetUserId?: string; handle?: string; reviewId?: string; text?: string; epId?: string }) {
  const to = 'tjbenlev@gmail.com';
  const who = opts.handle ? `@${opts.handle}` : (opts.targetUserId || 'unknown-user');
  const subject = encodeURIComponent(`Report: ${who}${opts.reviewId ? ` (review ${opts.reviewId})` : ''}`);
  const body = encodeURIComponent(
    `Please describe the issue and include any relevant context.\n\n` +
    `Reported user: ${who}\n` +
    (opts.reviewId ? `Review ID: ${opts.reviewId}\n` : '') +
    (opts.epId ? `Episode: ${opts.epId}\n` : '') +
    (opts.text ? `\nText:\n${opts.text}\n` : '') +
    `\nApp link: ${location.origin}${location.pathname}${opts.epId ? `#${opts.epId}` : ''}\n`
  );
  location.href = `mailto:${to}?subject=${subject}&body=${body}`;
}