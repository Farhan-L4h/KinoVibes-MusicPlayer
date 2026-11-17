const TIME_TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
// Enhanced LRC word-level stamps; LRCLIB serves them inline in syncedLyrics.
const WORD_TAG = /<\d{1,3}:\d{1,2}(?:[.:]\d{1,3})?>/g;
const META_TAG = /^\[(ar|ti|al|by|offset|length):(.*)\]$/i;

export const parseLrc = (text) => {
  const lines = [];
  const meta = {};
  let globalOffset = 0;

  for (const rawLine of (text || '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const metaMatch = line.match(META_TAG);
    if (metaMatch && !TIME_TAG.test(line)) {
      const key = metaMatch[1].toLowerCase();
      meta[key] = metaMatch[2].trim();
      if (key === 'offset') globalOffset = parseInt(metaMatch[2], 10) || 0;
      TIME_TAG.lastIndex = 0;
      continue;
    }

    TIME_TAG.lastIndex = 0;
    const stamps = [...line.matchAll(TIME_TAG)];
    if (stamps.length === 0) continue;

    const content = line.replace(TIME_TAG, '').replace(WORD_TAG, '').trim();
    for (const stamp of stamps) {
      const min = parseInt(stamp[1], 10);
      const sec = parseInt(stamp[2], 10);
      const fracRaw = stamp[3] || '0';
      const frac = parseInt(fracRaw.padEnd(3, '0').slice(0, 3), 10);
      lines.push({ timeMs: min * 60_000 + sec * 1000 + frac, text: content || '♪' });
    }
  }

  lines.sort((a, b) => a.timeMs - b.timeMs);
  return { lines, meta, offsetMs: globalOffset };
};

export const findActiveLine = (lines, timeMs, offsetMs = 0) => {
  if (!lines?.length) return -1;
  const target = timeMs + offsetMs;
  let lo = 0;
  let hi = lines.length - 1;
  let result = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].timeMs <= target) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return result;
};

export const toLrcText = (lines, meta = {}) => {
  const tags = [];
  if (meta.ti) tags.push(`[ti:${meta.ti}]`);
  if (meta.ar) tags.push(`[ar:${meta.ar}]`);
  if (meta.al) tags.push(`[al:${meta.al}]`);
  const body = (lines || []).map((l) => {
    const total = Math.max(0, l.timeMs);
    const min = Math.floor(total / 60_000);
    const sec = Math.floor((total % 60_000) / 1000);
    const cs = Math.floor((total % 1000) / 10);
    return `[${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(2, '0')}]${l.text === '♪' ? '' : l.text}`;
  });
  return [...tags, ...body].join('\n');
};

export const isLrcFormat = (text) => /\[\d{1,3}:\d{1,2}(?:[.:]\d{1,3})?\]/.test(text || '');