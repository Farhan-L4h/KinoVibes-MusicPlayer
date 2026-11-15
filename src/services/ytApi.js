const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;
let searchController = null;
let suggestController = null;
let relatedController = null;
let radioController = null;

const cached = (key) => {
  for (const [id, entry] of cache) {
    if (entry.expiresAt <= Date.now()) cache.delete(id);
  }
  const hit = cache.get(key);
  if (!hit) return null;
  cache.delete(key);
  cache.set(key, hit);
  return hit.value;
};

const remember = (key, value) => {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL });
  while (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
  return value;
};

const requestJson = async (url, controller, signal) => {
  const abort = () => controller.abort(signal.reason);
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(() => controller.abort(new DOMException('YouTube request timeout', 'TimeoutError')), 12_000);
  try {
    if (controller.signal.aborted) throw controller.signal.reason;
    const res = await fetch(url, { signal: controller.signal });
    const body = await res.json();
    if (controller.signal.aborted) throw controller.signal.reason;
    return { res, body };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
};

// Full-res 16:9 video frame; object-cover crops it to a clean square poster.
export const ytArt = (videoId) => (videoId ? `https://i.ytimg.com/vi/${videoId}/hq720.jpg` : null);

export const ytItemToTrack = (item) => ({
  id: `yt:${item.videoId}`,
  source: 'youtube',
  videoId: item.videoId,
  title: item.title,
  artist: item.artist || 'Unknown Artist',
  album: item.album || null,
  duration: item.duration || 0,
  albumArt: ytArt(item.videoId) || item.thumbnail || null,
  audioUrl: null,
});

export const searchYouTube = async (query, type = 'song', limit = 20, { signal } = {}) => {
  searchController?.abort();
  searchController = null;
  if (signal?.aborted) throw signal.reason;
  const key = `search:${type}:${query}:${limit}`;
  const hit = cached(key);
  if (hit) return hit;

  const controller = new AbortController();
  searchController = controller;
  try {
    const params = new URLSearchParams({ q: query, type, limit: String(limit) });
    const { res, body } = await requestJson(`/api/yt-search?${params}`, controller, signal);
    if (controller.signal.aborted) throw controller.signal.reason;
    if (!res.ok) throw new Error(body.error || 'Pencarian YouTube gagal.');
    return remember(key, body.items || []);
  } finally {
    if (searchController === controller) searchController = null;
  }
};

export const suggestYouTube = async (query, { signal } = {}) => {
  suggestController?.abort();
  suggestController = null;
  if (signal?.aborted) throw signal.reason;
  if (!query || query.length < 2) return [];
  const key = `suggest:${query}`;
  const hit = cached(key);
  if (hit) return hit;

  const controller = new AbortController();
  suggestController = controller;
  try {
    const { res, body } = await requestJson(`/api/yt-suggest?q=${encodeURIComponent(query)}`, controller, signal);
    if (controller.signal.aborted) throw controller.signal.reason;
    if (!res.ok) return [];
    return remember(key, body.suggestions || []);
  } finally {
    if (suggestController === controller) suggestController = null;
  }
};

// Related / automix radio for a YouTube video — powers autoplay + Up Next.
export const getRelatedYouTube = async (videoId, { signal, limit = 20 } = {}) => {
  if (!videoId) return [];
  const key = `related:${videoId}:${limit}`;
  const hit = cached(key);
  if (hit) return hit;

  relatedController?.abort();
  const controller = new AbortController();
  relatedController = controller;
  try {
    const params = new URLSearchParams({ videoId, limit: String(limit) });
    const { res, body } = await requestJson(`/api/yt-related?${params}`, controller, signal);
    if (controller.signal.aborted) throw controller.signal.reason;
    if (!res.ok) return [];
    return remember(key, (body.items || []).map(ytItemToTrack));
  } finally {
    if (relatedController === controller) relatedController = null;
  }
};

// Radio seed for personal uploads (no videoId): search by title+artist using a
// dedicated controller so autoplay prefetch never aborts an active user search.
export const getRelatedByQuery = async (query, { signal, limit = 12 } = {}) => {
  if (!query || query.trim().length < 2) return [];
  const key = `radio:${query}:${limit}`;
  const hit = cached(key);
  if (hit) return hit;

  radioController?.abort();
  const controller = new AbortController();
  radioController = controller;
  try {
    const params = new URLSearchParams({ q: query, type: 'song', limit: String(limit) });
    const { res, body } = await requestJson(`/api/yt-search?${params}`, controller, signal);
    if (controller.signal.aborted) throw controller.signal.reason;
    if (!res.ok) return [];
    return remember(key, (body.items || []).map(ytItemToTrack));
  } finally {
    if (radioController === controller) radioController = null;
  }
};

// Import a public YouTube / YouTube Music playlist by URL or id (no login).
export const importYouTubePlaylist = async (list, { signal, limit = 100 } = {}) => {
  const controller = new AbortController();
  const params = new URLSearchParams({ list, limit: String(limit) });
  const { res, body } = await requestJson(`/api/yt-playlist?${params}`, controller, signal);
  if (controller.signal.aborted) throw controller.signal.reason;
  if (!res.ok) throw new Error(body.error || 'Gagal mengimpor playlist.');
  return { title: body.title || 'Playlist YouTube', items: (body.items || []).map(ytItemToTrack) };
};
