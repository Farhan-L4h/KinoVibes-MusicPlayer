import { getInnertube, json, parseDurationText, bestThumbnail } from './_innertube.js';

// Accepts a full YouTube / YouTube Music playlist URL or a bare playlist id.
const extractPlaylistId = (raw) => {
  const value = (raw || '').trim();
  if (!value) return null;
  if (!value.includes('://') && !value.includes('?') && /^[A-Za-z0-9_-]{10,}$/.test(value)) return value;
  try {
    const u = new URL(value.startsWith('http') ? value : `https://${value}`);
    const list = u.searchParams.get('list');
    if (list) return list;
  } catch {
    /* not a parseable URL; try the query pattern below */
  }
  const m = value.match(/[?&]list=([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
};

const mapItem = (item) => {
  const videoId = item?.id;
  if (!videoId) return null;
  const kind = item.item_type;
  if (kind && kind !== 'song' && kind !== 'video' && kind !== 'non_music_track') return null;
  const artists = (item.artists || item.authors || []).map((a) => a.name).filter(Boolean);
  return {
    type: kind === 'video' ? 'video' : 'song',
    videoId,
    title: item.title?.toString?.() || item.title || '',
    artist: artists.join(', ') || item.author?.name || '',
    album: item.album?.name || '',
    duration: item.duration?.seconds || parseDurationText(item.duration?.text),
    thumbnail: bestThumbnail(item.thumbnails) || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const url = new URL(req.url, 'http://localhost');
  const raw = (url.searchParams.get('list') || '').trim().slice(0, 300);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 1), 200);
  const playlistId = extractPlaylistId(raw);
  if (!playlistId) return json(res, 400, { error: 'Tautan atau ID playlist tidak valid.' });

  try {
    const yt = await getInnertube();
    const playlist = await yt.music.getPlaylist(playlistId);
    const header = playlist?.header;
    const title = header?.title?.toString?.() || header?.title || header?.headline?.toString?.() || 'Playlist YouTube';

    const items = [];
    const seen = new Set();
    for (const item of playlist?.items || []) {
      if (items.length >= limit) break;
      const mapped = mapItem(item);
      if (!mapped || seen.has(mapped.videoId)) continue;
      seen.add(mapped.videoId);
      items.push(mapped);
    }

    if (items.length === 0) {
      return json(res, 404, { error: 'Playlist kosong atau tidak bisa dibaca. Pastikan playlist bersifat publik.' });
    }
    return json(res, 200, { playlistId, title, count: items.length, items }, 'public, max-age=60, s-maxage=300');
  } catch (err) {
    console.error('yt-playlist error:', err?.message || err);
    return json(res, 502, { error: 'Gagal membaca playlist. Pastikan tautan benar dan playlist publik.' });
  }
}