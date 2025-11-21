import type { Episode, ReviewItem } from '../types';
import { loadImageSafe } from './image';
import { pushToast } from '../components/Toast';

export async function saveReviewCardAsImage(
  ep: Episode,
  review: ReviewItem | { text?: string; ts?: number },
  stars: number,
  isFav: boolean
) {
  try {
    const C = { bg:'#111', text:'#eee', sub:'#bbb', star:'#ffd166', accent:'#ff3dbd', footer:'#888' };
    const W = 1080, H = 1350, pad = 48;

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // bg
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);

    // title
    ctx.fillStyle = C.text;
    ctx.font = 'bold 44px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillText(`S${ep.season}E${ep.episode}: ${ep.title}`, pad, pad + 44);

    // [PH-A3] stars (supports halves) — compact, no empties for the export
const r = Math.max(0, Math.min(5, Number(stars) || 0));
const full = Math.floor(r);
const half = (r - full) >= 0.5 ? 1 : 0;
// No empties: ⭐️ repeated + optional ✨
const starsText = '⭐️'.repeat(full) + (half ? '✨' : '');

ctx.fillStyle = C.star;
ctx.font = 'bold 56px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
ctx.fillText(starsText, pad, pad + 44 + 64);

// heart — place right after the rendered stars
if (isFav) {
  const sw = ctx.measureText(starsText).width;
  ctx.fillStyle = C.accent;
  ctx.font = 'bold 56px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  ctx.fillText('🩷', pad + sw + 16, pad + 44 + 64);
}

    // author
    const viewer: any = (window as any).__vprProfile || {};
    const AV = 96, ax = pad, ay = pad + 44 + 64 + 28;
    const avatarImg = viewer.avatar ? await loadImageSafe(viewer.avatar) : null;

    ctx.save();
    ctx.beginPath(); ctx.arc(ax + AV/2, ay + AV/2, AV/2, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    if (avatarImg) ctx.drawImage(avatarImg, ax, ay, AV, AV); else { ctx.fillStyle = '#222'; ctx.fillRect(ax, ay, AV, AV); }
    ctx.restore();

    const name = viewer.name || 'You';
    const handle = viewer.handle ? '@' + String(viewer.handle).replace(/^@/, '') : '';
    const ts = (review as any)?.ts ? new Date((review as any).ts).toLocaleString() : '';

    ctx.fillStyle = C.text;
    ctx.font = 'bold 40px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillText(name, ax + AV + 20, ay + 42);

    ctx.fillStyle = C.sub;
    ctx.font = '400 28px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    const metaLine = [handle, ts].filter(Boolean).join(' • ');
    if (metaLine) ctx.fillText(metaLine, ax + AV + 20, ay + 80);

    // review body
    const reviewY = ay + AV + 36;
    ctx.fillStyle = C.text;
    ctx.font = '400 34px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    wrapText(ctx, String((review as any)?.text || ''), pad, reviewY, W - pad*2, 42);

    // footer
    ctx.fillStyle = C.footer;
    ctx.font = '400 28px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillText('vanderpumpd.app', pad, H - pad);

    // -> try share as FILE; fall back to download
    const filename = `review-S${ep.season}E${ep.episode}.png`;
    const shareTitle = `S${ep.season}E${ep.episode}: ${ep.title}`;
    const shareText = (review as any)?.text || '';

    await new Promise<void>((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) { pushToast('Could not create image.'); resolve(); return; }
        const file = new File([blob], filename, { type: 'image/png' });

        try {
          // @ts-ignore
          if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
            // @ts-ignore
            await navigator.share({ files: [file], title: shareTitle, text: shareText });
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename; a.click();
            URL.revokeObjectURL(url);
          }
        } catch {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = filename; a.click();
          URL.revokeObjectURL(url);
        }
        resolve();
      }, 'image/png');
    });

    function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
      const words = (text || '').split(/\s+/);
      let line = '';
      for (let i = 0; i < words.length; i++) {
        const test = line ? line + ' ' + words[i] : words[i];
        if (ctx.measureText(test).width > maxWidth && line) {
          ctx.fillText(line, x, y);
          line = words[i];
          y += lineHeight;
        } else {
          line = test;
        }
      }
      if (line) ctx.fillText(line, x, y);
    }
  } catch (e) {
    console.error(e);
    pushToast('Could not create image.');
  }
}
