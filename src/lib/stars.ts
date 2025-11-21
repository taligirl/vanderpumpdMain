export function formatStars(val: number, full = '⭐️', half = '✨', empty = '☆') {
  const v = Math.max(0, Math.min(5, Number(val) || 0));
  const f = Math.floor(v);
  const h = (v - f) >= 0.5 ? 1 : 0;
  const e = 5 - f - h;
  return full.repeat(f) + (h ? half : '') + empty.repeat(e);
}

export function compactStars(val: number) {
  const v = Math.max(0, Math.min(5, Number(val) || 0));
  const f = Math.floor(v);
  const h = (v - f) >= 0.5 ? 1 : 0;
  return '⭐️'.repeat(f) + (h ? '✨' : '');
}
