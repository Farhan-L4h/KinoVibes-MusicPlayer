import { useEffect, useState } from 'react';

const cache = new Map();
const CACHE_LIMIT = 64;
let sharedCanvas = null;

const remember = (url, colors) => {
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value);
  cache.set(url, colors);
};

const clamp = (v) => Math.round(Math.max(16, Math.min(230, v * 0.55 + 12)));
const toHex = (rgb) => `#${rgb.map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`;

export const useArtColors = (url) => {
  const [colors, setColors] = useState(() => (url ? cache.get(url) || null : null));

  useEffect(() => {
    if (!url) {
      setColors(null);
      return undefined;
    }
    if (cache.has(url)) {
      setColors(cache.get(url));
      return undefined;
    }
    let alive = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        if (!sharedCanvas) {
          sharedCanvas = document.createElement('canvas');
          sharedCanvas.width = 12;
          sharedCanvas.height = 12;
        }
        const ctx = sharedCanvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, 12, 12);
        const d = ctx.getImageData(0, 0, 12, 12).data;
        const avg = (x0, y0, x1, y1) => {
          let r = 0;
          let g = 0;
          let b = 0;
          let n = 0;
          for (let y = y0; y < y1; y += 1) {
            for (let x = x0; x < x1; x += 1) {
              const i = (y * 12 + x) * 4;
              r += d[i];
              g += d[i + 1];
              b += d[i + 2];
              n += 1;
            }
          }
          return [r / n, g / n, b / n];
        };
        const result = {
          a: toHex(avg(0, 0, 6, 6)),
          b: toHex(avg(6, 6, 12, 12)),
          c: toHex(avg(6, 0, 12, 6)),
        };
        remember(url, result);
        if (alive) setColors(result);
      } catch {
        // tainted canvas (no CORS): stay monochrome
      }
    };
    img.src = url;
    return () => {
      alive = false;
      img.onload = null;
      img.src = '';
    };
  }, [url]);

  return colors;
};