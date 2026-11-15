const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;
let searchController = null;
let suggestController = null;

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

export const ytItemToTrack = (item) => ({
  id: `yt:${item.videoId}`,
  source: 'youtube',
  videoId: item.videoId,
  title: item.title,
  artist: item.artist || 'Unknown Artist',
  album: item.album || null,
  duration: item.duration || 0,
  albumArt: item.thumbnail || null,
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
