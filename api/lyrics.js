import { json } from './_innertube.js';

const LRCLIB = 'https://lrclib.net/api';
const UA = 'KinoVibe Music Player v1.0 (personal music player project)';

const fetchJson = async (url) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const pickBest = (results, duration) => {
  if (!Array.isArray(results) || results.length === 0) return null;
  let best = null;
  let bestScore = -Infinity;
  for (const r of results) {
    if (!r?.syncedLyrics && !r?.plainLyrics) continue;
    let score = 0;
    if (r.syncedLyrics) score += 4;
    if (duration > 0 && r.duration > 0) {
      const diff = Math.abs(r.duration - duration);
      if (diff <= 3) score += 3;
      else if (diff <= 10) score += 1;
      else if (diff > 30) score -= 4;
    }
    if (r.instrumental) score -= 2;
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return best;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const url = new URL(req.url, 'http://localhost');
  const title = (url.searchParams.get('title') || '').trim().slice(0, 200);
  const artist = (url.searchParams.get('artist') || '').trim().slice(0, 200);
  const album = (url.searchParams.get('album') || '').trim().slice(0, 200);
  const duration = Math.max(0, parseInt(url.searchParams.get('duration') || '0', 10) || 0);

  if (!title || !artist) return json(res, 400, { error: 'Parameter title dan artist wajib diisi' });

  try {
    const exactParams = new URLSearchParams({ track_name: title, artist_name: artist });
    if (album) exactParams.set('album_name', album);
    if (duration > 0) exactParams.set('duration', String(duration));

    let match = await fetchJson(`${LRCLIB}/get?${exactParams}`);
    if (!match?.syncedLyrics && !match?.plainLyrics) {
      const searchParams = new URLSearchParams({ track_name: title, artist_name: artist });
      const results = await fetchJson(`${LRCLIB}/search?${searchParams}`);
      match = pickBest(results, duration);
    }
    if (!match?.syncedLyrics && !match?.plainLyrics && album) {
      const searchParams = new URLSearchParams({ q: `${title} ${artist}` });
      const results = await fetchJson(`${LRCLIB}/search?${searchParams}`);
      match = pickBest(results, duration);
    }

    if (!match) return json(res, 404, { error: 'Lirik tidak ditemukan' });

    return json(
      res,
      200,
      {
        syncedLyrics: match.syncedLyrics || null,
        plainLyrics: match.plainLyrics || null,
        trackName: match.trackName || title,
        artistName: match.artistName || artist,
        albumName: match.albumName || album || null,
        duration: match.duration || duration || null,
        instrumental: !!match.instrumental,
      },
      'public, max-age=3600, s-maxage=86400'
    );
  } catch (err) {
    console.error('lyrics error:', err?.message || err);
    return json(res, 502, { error: 'Layanan lirik sedang tidak tersedia' });
  }
}