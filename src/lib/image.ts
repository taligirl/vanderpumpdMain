// Image + canvas helpers for avatars, covers, and sharing

export function readImageFileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error || new Error('Failed to read file'));
    fr.readAsDataURL(file);
  });
}

export function resizeImageToDataURL(
  srcDataUrl: string,
  targetSize = 256 // square size in px (tweak if you want)
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // draw into a square canvas (cover)
      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d')!;
      // cover logic: center crop to square first
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - side) / 2;
      const sy = (img.naturalHeight - side) / 2;
      ctx.drawImage(img, sx, sy, side, side, 0, 0, targetSize, targetSize);
      resolve(canvas.toDataURL('image/png')); // store as PNG
    };
    img.onerror = () => reject(new Error('Failed to load image for resize'));
    img.src = srcDataUrl;
  });
}

export function cropToAspectDataURL(
  srcDataUrl: string,
  targetW: number,
  targetH: number,
  focusX: 'left'|'center'|'right' = 'center',
  focusY: 'top'|'center'|'bottom' = 'center'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const aspect = targetW / targetH;

      // start with width-limited crop
      let sw = iw;
      let sh = Math.round(iw / aspect);
      if (sh > ih) {
        // height-limited crop
        sh = ih;
        sw = Math.round(ih * aspect);
      }

      // position by focus
      let sx = 0, sy = 0;
      if (focusX === 'left') sx = 0;
      if (focusX === 'center') sx = Math.round((iw - sw) / 2);
      if (focusX === 'right') sx = iw - sw;

      if (focusY === 'top') sy = 0;
      if (focusY === 'center') sy = Math.round((ih - sh) / 2);
      if (focusY === 'bottom') sy = ih - sh;

      sx = Math.max(0, Math.min(iw - sw, sx));
      sy = Math.max(0, Math.min(ih - sh, sy));

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image for crop'));
    img.src = srcDataUrl;
  });
}

export function cropToAspectDataURLAt(
  srcDataUrl: string,
  targetW: number,
  targetH: number,
  centerX01: number,
  centerY01: number,
  scale = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        const iw = img.naturalWidth, ih = img.naturalHeight;
        const aspect = targetW / targetH;

        // base window equals image scaled DOWN by "scale"
        let sw = Math.min(iw, Math.round(iw / scale));
        let sh = Math.min(ih, Math.round(ih / scale));

        // now enforce exact aspect inside that window
        const curAspect = sw / sh;
        if (curAspect > aspect) {
          // too wide -> narrow to target aspect
          sw = Math.round(sh * aspect);
        } else if (curAspect < aspect) {
          // too tall -> reduce height to target aspect
          sh = Math.round(sw / aspect);
        }

        // clamp center and derive top-left
        const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
        const cx = clamp(centerX01 * iw, sw / 2, iw - sw / 2);
        const cy = clamp(centerY01 * ih, sh / 2, ih - sh / 2);
        const sx = Math.round(cx - sw / 2);
        const sy = Math.round(cy - sh / 2);

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Failed to load image for crop'));
      img.src = srcDataUrl;
    } catch (e) {
      reject(e);
    }
  });
}

export function loadImageSafe(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    } catch {
      resolve(null);
    }
  });
}