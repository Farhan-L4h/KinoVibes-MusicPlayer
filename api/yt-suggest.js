import { getInnertube, json } from './_innertube.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const url = new URL(req.url, 'http://localhost');
  const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
  if (!q) return json(res, 200, { suggestions: [] });

  try {
    const yt = await getInnertube();
    const sections = await yt.music.getSearchSuggestions(q);
    const suggestions = [];
    for (const section of sections || []) {
      for (const item of section?.contents || []) {
        const text = item?.suggestion?.toString?.() || '';
        if (text && !suggestions.includes(text)) suggestions.push(text);
        if (suggestions.length >= 8) break;
      }
      if (suggestions.length >= 8) break;
    }
    return json(res, 200, { suggestions }, 'public, max-age=300, s-maxage=600');
  } catch (err) {
    console.error('yt-suggest error:', err?.message || err);
    return json(res, 200, { suggestions: [] });
  }
}