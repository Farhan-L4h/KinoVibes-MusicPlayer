import { Innertube, UniversalCache } from 'youtubei.js';

let instancePromise = null;

export const getInnertube = () => {
  if (!instancePromise) {
    instancePromise = Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
    }).catch((err) => {
      instancePromise = null;
      throw err;
    });
  }
  return instancePromise;
};

export const json = (res, code, body, cache = 'no-store') => {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.end(JSON.stringify(body));
};

export const parseDurationText = (text) => {
  if (!text || typeof text !== 'string') return 0;
  const parts = text.split(':').map((p) => parseInt(p, 10));
  if (parts.some((n) => !isFinite(n))) return 0;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
};

export const bestThumbnail = (thumbnails) => {
  if (!Array.isArray(thumbnails) || thumbnails.length === 0) return null;
  const sorted = [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
  let url = sorted[0]?.url || null;
  if (url && url.startsWith('//')) url = `https:${url}`;
  return url;
};