const TIME_TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
// Enhanced LRC word-level stamps; LRCLIB serves them inline in syncedLyrics.
const WORD_TAG = /<\d{1,3}:\d{1,2}(?:[.:]\d{1,3})?>/g;
const META_TAG = /^\[(ar|ti|al|by|offset|length):(.*)\]$/i;

// Enhanced LRC puts a timestamp before each word; the text between two stamps
// belongs to the earlier one. Returns null when a line has no word stamps.
const parseWordTimings = (line) => {
  const stamps = [...line.matchAll(new RegExp(WORD_TAG.source, 'g'))];
  if (stamps.length < 2) return null;
  const words = [];
  for (let i = 0; i < stamps.length; i += 1) {
    const match = stamps[i];
    const end = i + 1 < stamps.length ? stamps[i + 1].index : line.length;
    const text = line.slice(match.index + match[0].length, end).replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const digits = match[0].match(/<(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?>/);
    if (!digits) continue;
    const frac = parseInt((digits[3] || '0').padEnd(3, '0').slice(0, 3), 10);
    words.push({ text, timeMs: parseInt(digits[1], 10) * 60_000 + parseInt(digits[2], 10) * 1000 + frac });
  }
  return words.length > 0 ? words : null;
};

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

    const words = parseWordTimings(line);
    const content = line.replace(TIME_TAG, '').replace(WORD_TAG, '').replace(/\s+/g, ' ').trim();
    for (const stamp of stamps) {
      const min = parseInt(stamp[1], 10);
      const sec = parseInt(stamp[2], 10);
      const fracRaw = stamp[3] || '0';
      const frac = parseInt(fracRaw.padEnd(3, '0').slice(0, 3), 10);
      lines.push({ timeMs: min * 60_000 + sec * 1000 + frac, text: content || '♪', words });
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