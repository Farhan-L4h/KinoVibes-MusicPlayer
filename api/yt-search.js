import { getInnertube, json, parseDurationText, bestThumbnail } from './_innertube.js';

const VALID_TYPES = new Set(['song', 'video', 'album', 'artist', 'playlist']);

const mapListItem = (item) => {
  const videoId = item.id;
  if (!videoId) return null;
  const artistNames = (item.artists || item.authors || []).map((a) => a.name).filter(Boolean);
  const duration = item.duration?.seconds || parseDurationText(item.duration?.text);
  return {
    type: item.item_type === 'video' ? 'video' : 'song',
    videoId,
    title: item.title || '',
    artist: artistNames.join(', ') || item.author?.name || '',
    album: item.album?.name || '',
    duration,
    thumbnail:
      bestThumbnail(item.thumbnails) || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    views: item.views || null,
    year: item.year || null,
  };
};

const mapTwoRow = (item) => {
  const artistNames = (item.artists || []).map((a) => a.name).filter(Boolean);
  const thumb = item.thumbnail?.contents || item.thumbnail;
  return {
    type: item.item_type || 'album',
    browseId: item.id || null,
    title: item.title?.toString?.() || item.name?.toString?.() || '',
    subtitle: item.subtitle?.toString?.() || '',
    artist: artistNames.join(', ') || item.author?.name || '',
    year: item.year || null,
    thumbnail: bestThumbnail(thumb),
    itemCount: item.item_count || null,
    subscribers: item.subscribers?.toString?.() || item.subscribers || null,
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const url = new URL(req.url, 'http://localhost');
  const q = (url.searchParams.get('q') || '').trim().slice(0, 200);
  const type = url.searchParams.get('type') || 'song';
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20', 10) || 20, 1), 40);

  if (!q) return json(res, 400, { error: 'Parameter q wajib diisi' });
  if (!VALID_TYPES.has(type)) return json(res, 400, { error: 'Tipe tidak valid' });

  try {
    const yt = await getInnertube();
    const search = await yt.music.search(q, { type });

    const items = [];
    const sections = search.contents || [];
    for (const section of sections) {
      const entries = section?.contents;
      if (!Array.isArray(entries)) continue;
      for (const item of entries) {
        if (items.length >= limit) break;
        const kind = item?.item_type;
        if (kind === 'song' || kind === 'video' || kind === 'non_music_track') {
          const mapped = mapListItem(item);
          if (mapped) items.push(mapped);
        } else if (kind === 'album' || kind === 'artist' || kind === 'playlist') {
          const mapped = mapTwoRow(item);
          if (mapped?.title) items.push(mapped);
        }
      }
      if (items.length >= limit) break;
    }

    return json(res, 200, { query: q, type, items }, 'public, max-age=60, s-maxage=300');
  } catch (err) {
    console.error('yt-search error:', err?.message || err);
    return json(res, 502, { error: 'Pencarian YouTube sedang tidak tersedia. Coba lagi.' });
  }
}