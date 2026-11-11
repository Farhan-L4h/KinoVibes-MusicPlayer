const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
let searchController = null;

const cached = (key) => {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  cache.delete(key);
  return null;
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

export const searchYouTube = async (query, type = 'song', limit = 20) => {
  const key = `search:${type}:${query}:${limit}`;
  const hit = cached(key);
  if (hit) return hit;

  searchController?.abort();
  searchController = new AbortController();

  const params = new URLSearchParams({ q: query, type, limit: String(limit) });
  const res = await fetch(`/api/yt-search?${params}`, { signal: searchController.signal });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Pencarian YouTube gagal.');
  const value = body.items || [];
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL });
  return value;
};

export const suggestYouTube = async (query) => {
  if (!query || query.length < 2) return [];
  const key = `suggest:${query}`;
  const hit = cached(key);
  if (hit) return hit;

  const res = await fetch(`/api/yt-suggest?q=${encodeURIComponent(query)}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return [];
  const value = body.suggestions || [];
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL });
  return value;
};