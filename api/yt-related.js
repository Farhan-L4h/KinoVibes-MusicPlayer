import { getInnertube, json, parseDurationText, bestThumbnail } from './_innertube.js';

const fallbackThumb = (videoId) => `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

const mapPanelVideo = (v) => {
  const videoId = v?.video_id;
  if (!videoId) return null;
  const artists = (v.artists || []).map((a) => a.name).filter(Boolean);
  return {
    type: 'song',
    videoId,
    title: v.title?.toString?.() || '',
    artist: artists.join(', ') || v.author || '',
    album: v.album?.name || '',
    duration: v.duration?.seconds || parseDurationText(v.duration?.text),
    thumbnail: bestThumbnail(v.thumbnail) || fallbackThumb(videoId),
  };
};

const mapListItem = (item) => {
  const videoId = item?.id;
  if (!videoId) return null;
  const artists = (item.artists || item.authors || []).map((a) => a.name).filter(Boolean);
  return {
    type: item.item_type === 'video' ? 'video' : 'song',
    videoId,
    title: item.title?.toString?.() || item.title || '',
    artist: artists.join(', ') || item.author?.name || '',
    album: item.album?.name || '',
    duration: item.duration?.seconds || parseDurationText(item.duration?.text),
    thumbnail: bestThumbnail(item.thumbnails) || fallbackThumb(videoId),
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const url = new URL(req.url, 'http://localhost');
  const videoId = (url.searchParams.get('videoId') || '').trim();
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20', 10) || 20, 1), 40);
  if (!/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) return json(res, 400, { error: 'videoId tidak valid' });

  try {
    const yt = await getInnertube();
    const items = [];
    const seen = new Set([videoId]);
    const push = (mapped) => {
      if (!mapped?.videoId || seen.has(mapped.videoId)) return;
      seen.add(mapped.videoId);
      items.push(mapped);
    };

    // YouTube Music automix radio — the same feed that powers "Up Next".
    try {
      const panel = await yt.music.getUpNext(videoId, true);
      for (const entry of panel?.contents || []) {
        if (items.length >= limit) break;
        push(mapPanelVideo(entry?.video_id ? entry : entry?.primary));
      }
    } catch {
      /* automix unavailable for this video; fall back to related below */
    }

    if (items.length < limit) {
      try {
        const related = await yt.music.getRelated(videoId);
        for (const section of related?.contents || []) {
          for (const entry of section?.contents || []) {
            if (items.length >= limit) break;
            if (entry?.video_id || entry?.primary) push(mapPanelVideo(entry?.video_id ? entry : entry?.primary));
            else push(mapListItem(entry));
          }
          if (items.length >= limit) break;
        }
      } catch {
        /* related unavailable; return whatever automix produced */
      }
    }

    return json(res, 200, { videoId, items }, 'public, max-age=120, s-maxage=600');
  } catch (err) {
    console.error('yt-related error:', err?.message || err);
    return json(res, 502, { error: 'Rekomendasi YouTube sedang tidak tersedia. Coba lagi.' });
  }
}