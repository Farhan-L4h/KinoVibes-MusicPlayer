export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

export const formatTotalDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0 mnt';
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h} jam ${m} mnt`;
  return `${m} mnt`;
};

export const initials = (name) =>
  (name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

export const cleanTitle = (title) =>
  (title || '')
    .replace(/\s*[([][^)\]]*(official|video|audio|lyric|lyrics|hd|hq|4k|mv|m\/v|visualizer|explicit|remaster(ed)?)[^)\]]*[)\]]/gi, '')
    .replace(/\s*(official\s+(music\s+)?video|official\s+audio|lyric\s+video)\s*/gi, '')
    .replace(/\s*feat\.?\s+/gi, ' ft. ')
    .trim();

export const debounce = (fn, ms = 300) => {
  let t;
  const wrapped = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
  wrapped.cancel = () => clearTimeout(t);
  return wrapped;
};