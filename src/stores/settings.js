import { create } from 'zustand';

// Non-sensitive playback/appearance preferences only. Auth tokens never live
// here; Supabase keeps its own session storage.
const KEY = 'kv-settings-v1';

export const DEFAULT_SETTINGS = {
  resumeSession: true,
  rememberPosition: true,
  rememberVolume: true,
  autoPlayOnSelect: true,
  smartRecommendations: true,
  crossfadeEnabled: false,
  crossfadeSeconds: 5,
  youtubeQuality: 'auto',
  eqEnabled: false,
  eqPreset: 'flat',
  eqGains: [0, 0, 0, 0, 0, 0, 0],
  lyricsFontScale: 1,
  lyricsSpeed: 1,
  lyricsBlur: true,
  lyricsActiveHighlight: true,
  lyricsAutoScroll: true,
  lyricsOffsetMs: 0,
  ambientArtwork: true,
  animatedArtwork: true,
  visualizerEnabled: true,
  visualizerStyle: 'wave',
  reduceMotion: false,
  compactPlayer: false,
  keyboardShortcuts: true,
  mediaSessionEnabled: true,
  trackChangeToast: false,
  toastDurationMs: 3000,
};

const QUALITY = ['auto', 'medium', 'large', 'hd720', 'hd1080', 'highres'];
const VISUALIZER = ['wave', 'bars'];

const clamp = (value, min, max, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

const bool = (value, fallback) => (typeof value === 'boolean' ? value : fallback);

export const sanitizeSettings = (raw = {}) => {
  const d = DEFAULT_SETTINGS;
  const gains = Array.isArray(raw.eqGains) && raw.eqGains.length === 7
    ? raw.eqGains.map((g) => clamp(g, -12, 12, 0))
    : d.eqGains;
  return {
    resumeSession: bool(raw.resumeSession, d.resumeSession),
    rememberPosition: bool(raw.rememberPosition, d.rememberPosition),
    rememberVolume: bool(raw.rememberVolume, d.rememberVolume),
    autoPlayOnSelect: bool(raw.autoPlayOnSelect, d.autoPlayOnSelect),
    smartRecommendations: bool(raw.smartRecommendations, d.smartRecommendations),
    crossfadeEnabled: bool(raw.crossfadeEnabled, d.crossfadeEnabled),
    crossfadeSeconds: clamp(raw.crossfadeSeconds, 0, 12, d.crossfadeSeconds),
    youtubeQuality: QUALITY.includes(raw.youtubeQuality) ? raw.youtubeQuality : d.youtubeQuality,
    eqEnabled: bool(raw.eqEnabled, d.eqEnabled),
    eqPreset: typeof raw.eqPreset === 'string' ? raw.eqPreset : d.eqPreset,
    eqGains: gains,
    lyricsFontScale: clamp(raw.lyricsFontScale, 0.8, 1.8, d.lyricsFontScale),
    lyricsSpeed: clamp(raw.lyricsSpeed, 0.4, 2, d.lyricsSpeed),
    lyricsBlur: bool(raw.lyricsBlur, d.lyricsBlur),
    lyricsActiveHighlight: bool(raw.lyricsActiveHighlight, d.lyricsActiveHighlight),
    lyricsAutoScroll: bool(raw.lyricsAutoScroll, d.lyricsAutoScroll),
    lyricsOffsetMs: clamp(raw.lyricsOffsetMs, -2000, 2000, d.lyricsOffsetMs),
    ambientArtwork: bool(raw.ambientArtwork, d.ambientArtwork),
    animatedArtwork: bool(raw.animatedArtwork, d.animatedArtwork),
    visualizerEnabled: bool(raw.visualizerEnabled, d.visualizerEnabled),
    visualizerStyle: VISUALIZER.includes(raw.visualizerStyle) ? raw.visualizerStyle : d.visualizerStyle,
    reduceMotion: bool(raw.reduceMotion, d.reduceMotion),
    compactPlayer: bool(raw.compactPlayer, d.compactPlayer),
    keyboardShortcuts: bool(raw.keyboardShortcuts, d.keyboardShortcuts),
    mediaSessionEnabled: bool(raw.mediaSessionEnabled, d.mediaSessionEnabled),
    trackChangeToast: bool(raw.trackChangeToast, d.trackChangeToast),
    toastDurationMs: clamp(raw.toastDurationMs, 1000, 8000, d.toastDurationMs),
  };
};

const load = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? sanitizeSettings(JSON.parse(raw)) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const persist = (settings) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable */
  }
};

export const useSettingsStore = create((set, get) => ({
  ...load(),
  update: (patch) => {
    const next = sanitizeSettings({ ...get(), ...patch });
    persist(next);
    set(next);
  },
  resetKeys: (keys) => {
    const patch = {};
    for (const key of keys) patch[key] = DEFAULT_SETTINGS[key];
    const next = sanitizeSettings({ ...get(), ...patch });
    persist(next);
    set(next);
  },
  resetAll: () => {
    persist(DEFAULT_SETTINGS);
    set({ ...DEFAULT_SETTINGS });
  },
}));

export const getSettings = () => useSettingsStore.getState();
