import { create } from 'zustand';
import { Howl } from 'howler';
import { resolveAudioUrl, incrementPlayCount } from '../services/supabaseMusicApi';
import { getSignedUrl, invalidateSignedUrl, BUCKETS } from '../config/supabase';
import { ytPlayer } from '../player/youtube';
import { spotifyPlayer } from '../player/spotify';
import { probeCors, withCorsAudio, tapHowl, markLive } from '../player/analyser';
import { isSpotifyConfigured, isSpotifyConnected, getSpotifyTrackPreview } from '../services/spotifyApi';
import { updateMediaMetadata, updateMediaPosition, bindMediaActions, clearMediaSession } from '../player/mediaSession';
import { getLyricsOffset } from '../services/lyricsApi';
import { findActiveLine } from '../lib/lrc';
import { sameArtist } from '../lib/utils';
import { getRelatedYouTube, getRelatedByQuery } from '../services/ytApi';
import { toast } from './toast';
import { getSettings } from './settings';

const SESSION_KEY = 'kv-session';
const PREFS_KEY = 'kv-prefs';
const RECENT_KEY = 'kv-recent';

let howl = null;
let pollTimer = null;
let playToken = 0;
let seekAfterLoad = null;
let lastPositionSync = 0;
let audioPlayback = null;
let audioAttempt = 0;
let retryTimer = null;
let loadTimer = null;
let detachAudioEvents = null;
let sessionTimer = null;
let lastSessionWrite = -Infinity;
let lastSessionSnapshot = null;
let lastPersistedSecond = -1;
let spotifyMode = null; // 'sdk' (Premium, full track) | 'preview' (30s via Howler)
let lastSpotifyPos = 0;
let xfade = null; // second Howl used to overlap the next upload during crossfade
const RETRY_DELAYS = [1000, 2000, 4000];
const AUDIO_TIMEOUT = 20_000;

const cancelAudioWork = () => {
  // Increment BEFORE clearing timers so any in-flight timeout/retry callbacks
  // that read audioAttempt will see the new value and self-cancel.
  audioAttempt++;
  clearTimeout(retryTimer);
  clearTimeout(loadTimer);
  retryTimer = null;
  loadTimer = null;
};

const loadJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const saveJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable */
  }
};

const savedPrefs = loadJson(PREFS_KEY, {});
if (!getSettings().rememberVolume) {
  delete savedPrefs.volume;
  delete savedPrefs.muted;
}

const stopHowl = () => {
  detachAudioEvents?.();
  detachAudioEvents = null;
  if (howl) {
    try {
      howl.stop();
      howl.unload();
    } catch {
      /* already unloaded */
    }
    howl = null;
  }
};

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

const isUploadTrack = (track) =>
  !!track && track.source !== 'youtube' && track.source !== 'spotify' && !!(track.audioPath || track.audioUrl);

// Crossfade is only real for Howler-backed uploads; the YouTube iframe and the
// Spotify SDK expose no usable dual-deck volume ramp, so Settings states that.
const cancelCrossfade = (restoreVolume = true) => {
  if (!xfade) return;
  const pending = xfade.howl;
  xfade = null;
  if (pending) {
    try {
      pending.stop();
      pending.unload();
    } catch {
      /* already unloaded */
    }
  }
  if (restoreVolume && howl?.state() === 'loaded') {
    const { muted, volume } = useMusicStore.getState();
    try {
      howl.volume(muted ? 0 : volume);
    } catch {
      /* element gone */
    }
  }
};

const pushRecent = (track) => {
  if (!track?.id) return;
  const recent = loadJson(RECENT_KEY, []).filter((t) => t.id !== track.id);
  recent.unshift({
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    albumArt: track.albumArt,
    duration: track.duration,
    source: track.source,
    videoId: track.videoId || null,
    spotifyId: track.spotifyId || null,
    uri: track.uri || null,
    audioUrl: track.audioUrl || null,
    audioPath: track.audioPath || null,
    bucket: track.bucket || null,
    lyricsPath: track.lyricsPath || null,
    savedAt: Date.now(),
  });
  saveJson(RECENT_KEY, recent.slice(0, 12));
};

export const getRecentTracks = () => loadJson(RECENT_KEY, []);

// Howler 2.x has no public HTMLMediaElement accessor. Keep the single HTML5
// sound lookup here; if its internals change, playback still uses public APIs.
const bindNativeAudioEvents = (instance, onBuffering, onPlaying) => {
  detachAudioEvents?.();
  const node = Array.isArray(instance._sounds) ? instance._sounds[0]?._node : null;
  if (!node?.addEventListener || !node?.removeEventListener) {
    detachAudioEvents = null;
    return;
  }
  const stalled = () => {
    if (node.readyState < 3) onBuffering();
  };
  node.addEventListener('waiting', onBuffering);
  node.addEventListener('stalled', stalled);
  node.addEventListener('playing', onPlaying);
  detachAudioEvents = () => {
    node.removeEventListener('waiting', onBuffering);
    node.removeEventListener('stalled', stalled);
    node.removeEventListener('playing', onPlaying);
  };
};

const loadAudio = async (set, get, playback) => {
  cancelAudioWork();
  const attempt = audioAttempt;
  const { track, token } = playback;
  const valid = () => audioPlayback === playback && token === playToken && attempt === audioAttempt;
  const bucket = track.bucket || BUCKETS.MUSIC;
  let instance;

  const fail = (err, canRetry) => {
    if (!valid()) return;
    const intendedToPlay = get().isPlaying;
    const position = instance?.state() === 'loaded' ? instance.seek() : null;
    if (typeof position === 'number' && Number.isFinite(position)) set({ currentTime: position });
    cancelAudioWork();
    stopHowl();
    stopPolling();
    if (intendedToPlay && canRetry && playback.retries < RETRY_DELAYS.length) {
      if (track.audioPath) invalidateSignedUrl(bucket, track.audioPath);
      set({ status: 'buffering', error: null });
      const delay = RETRY_DELAYS[playback.retries++];
      retryTimer = setTimeout(() => {
        retryTimer = null;
        if (audioPlayback === playback && token === playToken && get().isPlaying) {
          loadAudio(set, get, playback);
        }
      }, delay);
    } else {
      const message = err?.message || 'Gagal memuat audio. Coba putar lagi.';
      set({ isPlaying: false, status: 'error', error: message });
      get()._persistSession();
      toast.error(message);
    }
  };
  const armTimeout = () => {
    if (loadTimer) return;
    loadTimer = setTimeout(() => fail(new DOMException('Koneksi audio terlalu lambat. Coba lagi.', 'TimeoutError'), true), AUDIO_TIMEOUT);
  };
  const playing = () => {
    // Guard: ignore callbacks from a stale load (track changed or cancelled).
    if (!valid()) {
      instance?.pause();
      return;
    }
    // User pressed pause while audio was still loading — honour it immediately.
    if (!get().isPlaying) {
      instance?.pause();
      return;
    }
    clearTimeout(loadTimer);
    loadTimer = null;
    set({ status: 'playing', error: null });
    get()._startPolling();
  };
  const buffering = () => {
    if (!valid() || !get().isPlaying) return;
    set({ status: 'buffering' });
    armTimeout();
  };

  armTimeout();
  try {
    // Private paths must not fall back to a legacy public URL on signing failure.
    const url = track.audioPath
      ? await getSignedUrl(bucket, track.audioPath)
      : await resolveAudioUrl(track);
    if (!valid() || !get().isPlaying) return;
    if (!url) throw new Error('Audio tidak tersedia');
    markLive(false);
    const corsMode = await probeCors(url);
    if (!valid() || !get().isPlaying) return;
    // Howler rejects extension-less URLs (Spotify previews, blobs); format
    // only gates its codec check — the browser still sniffs the real content.
    const format = /\.([a-z0-9]+)$/i.test(url.split('?')[0]) ? undefined : ['mp3'];
    instance = withCorsAudio(corsMode === 'cors', () => new Howl({
      src: [url],
      format,
      html5: true,
      volume: get().muted ? 0 : get().volume,
      onplay: playing,
      onpause: () => {
        if (!valid() || get().isPlaying) return;
        stopPolling();
        get()._persistSession();
      },
      onend: () => {
        if (!valid() || !get().isPlaying) return;
        clearTimeout(loadTimer);
        loadTimer = null;
        stopPolling();
        if (get()._promoteCrossfade()) return;
        get()._handleEnded();
      },
      onload: () => {
        if (!valid()) return;
        const duration = instance.duration();
        if (Number.isFinite(duration) && duration > 0) set({ duration });
        if (get().currentTime > 0) instance.seek(get().currentTime);
        bindNativeAudioEvents(instance, buffering, playing);
      },
      onloaderror: (_id, code) => {
        // Guard: if track changed while this howl was loading, ignore the error.
        if (!valid()) return;
        // Browsers may report an expired signed URL as SRC_NOT_SUPPORTED (4).
        const renewSignedUrl = Number(code) === 4 && track.audioPath && playback.retries === 0;
        fail(new Error('Gagal memuat audio. Coba putar lagi.'), Number(code) === 2 || renewSignedUrl);
      },
      onplayerror: () => {
        if (!valid() || !get().isPlaying) return;
        clearTimeout(loadTimer);
        loadTimer = null;
        stopPolling();
        playback.playBlocked = true;
        const message = 'Gagal memutar audio. Tekan putar untuk mencoba lagi.';
        set({ isPlaying: false, status: 'error', error: message });
        toast.error(message);
      },
    }));
    howl = instance;
    bindNativeAudioEvents(instance, buffering, playing);
    instance.play();
    if (corsMode !== 'none' && tapHowl(instance)) markLive(true);
  } catch (err) {
    const status = Number(err?.status || err?.statusCode);
    const transient = err?.name === 'TimeoutError' || err instanceof TypeError ||
      /network|fetch|connection/i.test(err?.message || '') || status === 408 || status === 429 || status >= 500;
    fail(err, err?.name !== 'AbortError' && transient);
  }
};

const useMusicStore = create((set, get) => ({
  currentTrack: null,
  playlist: [],
  currentIndex: -1,
  queue: [],
  autoplayQueue: [],
  isPlaying: false,
  status: 'idle',
  currentTime: 0,
  duration: 0,
  volume: typeof savedPrefs.volume === 'number' ? savedPrefs.volume : 0.8,
  muted: !!savedPrefs.muted,
  shuffle: !!savedPrefs.shuffle,
  repeat: savedPrefs.repeat || 'off',
  autoplay: savedPrefs.autoplay !== false,
  playerMode: savedPrefs.playerMode || 'music', // 'music' | 'video'
  error: null,
  lyrics: null,
  currentLyricIndex: -1,
  nowPlayingOpen: false,
  nowPlayingTab: 'lyrics',
  ytLoadNonce: 0,

  playTrack: async (track, contextList = null) => {
    if (!track) return;
    const token = ++playToken;
    const prev = get().currentTrack;

    cancelAudioWork();
    cancelCrossfade();
    audioPlayback = null;
    seekAfterLoad = null;
    stopHowl();
    stopPolling();
    if (prev?.source === 'youtube' && track.source !== 'youtube') {
      ytPlayer.pause();
    }
    if (prev?.source === 'spotify' && spotifyMode === 'sdk' && track.id !== prev.id) {
      spotifyPlayer.pause();
    }
    if (track.source !== 'spotify') spotifyMode = null;

    const list = contextList && contextList.length > 0 ? contextList : [track];
    const index = list.findIndex((t) => t.id === track.id);
    const playlist = index >= 0 ? list : [track, ...list];
    const currentIndex = index >= 0 ? index : 0;

    set({
      currentTrack: track,
      playlist,
      currentIndex,
      // isPlaying is set optimistically here. If the user presses pause before
      // the audio player fires its first `playing` callback, that callback will
      // detect isPlaying === false and call instance.pause() to honour the user
      // intent without letting audio bleed through.
      isPlaying: getSettings().autoPlayOnSelect !== false,
      status: getSettings().autoPlayOnSelect === false ? 'paused' : 'loading',
      currentTime: 0,
      duration: track.duration || 0,
      error: null,
      lyrics: null,
      currentLyricIndex: -1,
      ytLoadNonce: get().ytLoadNonce + 1,
    });

    const settings = getSettings();
    if (settings.mediaSessionEnabled) updateMediaMetadata(track);
    pushRecent(track);
    if (!/^(yt|sp):/.test(String(track.id))) {
      incrementPlayCount(track.id).catch(() => {});
    }
    if (settings.trackChangeToast && prev?.id !== track.id) {
      toast.info(`${track.title} — ${track.artist || 'Unknown Artist'}`, settings.toastDurationMs);
    }
    get()._persistSession();
    void get()._prefetchRelated();

    if (settings.autoPlayOnSelect === false) {
      // Load the track into the player without starting audio; the first play()
      // press then starts it from the beginning for the selected source.
      if (track.source === 'youtube') {
        markLive(false);
        return;
      }
      if (track.source !== 'spotify') {
        audioPlayback = { track, token, retries: 0 };
        return loadAudio(set, get, audioPlayback);
      }
      return;
    }

    if (track.source === 'youtube') {
      // VideoDock mounts the iframe; hooks below drive the state machine.
      markLive(false);
      return;
    }

    if (track.source === 'spotify') {
      return get()._startSpotify(track, 0);
    }

    audioPlayback = { track, token, retries: 0 };
    return loadAudio(set, get, audioPlayback);
  },

  play: () => {
    const { currentTrack, isPlaying, currentTime, status } = get();
    if (!currentTrack || isPlaying) return;
    set({ isPlaying: true, status: 'loading', error: null });
    if (currentTrack.source === 'youtube') {
      playToken++;
      if (ytPlayer.isReady() && status !== 'error') ytPlayer.play();
      else {
        seekAfterLoad = currentTime;
        set({ ytLoadNonce: get().ytLoadNonce + 1 });
      }
      return;
    }
    if (currentTrack.source === 'spotify' && spotifyMode !== 'preview') {
      playToken++;
      return get()._startSpotify(currentTrack, currentTime * 1000);
    }
    if (howl?.state() === 'loaded' && (status !== 'error' || audioPlayback?.playBlocked)) {
      // null-guard: audioPlayback may be null if playTrack was cancelled mid-flight
      if (audioPlayback) audioPlayback.retries = 0;
      if (audioPlayback?.playBlocked) howl.seek(currentTime);
      if (audioPlayback) audioPlayback.playBlocked = false;
      howl.play();
    } else {
      cancelAudioWork();
      stopHowl();
      audioPlayback = { track: currentTrack, token: ++playToken, retries: 0 };
      if (currentTrack.audioPath) invalidateSignedUrl(currentTrack.bucket || BUCKETS.MUSIC, currentTrack.audioPath);
      return loadAudio(set, get, audioPlayback);
    }
  },

  togglePlay: () => {
    if (get().isPlaying) get().pause();
    else return get().play();
  },

  pause: () => {
    const { currentTrack } = get();
    if (!currentTrack) return;
    cancelCrossfade();
    set({ isPlaying: false, status: 'paused' });
    clearTimeout(retryTimer);
    clearTimeout(loadTimer);
    retryTimer = null;
    loadTimer = null;
    stopPolling();
    if (currentTrack.source === 'youtube') ytPlayer.pause();
    else if (currentTrack.source === 'spotify' && spotifyMode === 'sdk') spotifyPlayer.pause();
    else if (howl?.state() === 'loaded') {
      const position = howl.seek();
      if (typeof position === 'number' && Number.isFinite(position)) set({ currentTime: position });
      howl.pause();
    } else {
      cancelAudioWork();
      stopHowl();
    }
    get()._persistSession();
  },

  nextTrack: (auto = false) => {
    const { queue, playlist, currentIndex, shuffle, repeat } = get();

    if (queue.length > 0) {
      const [next, ...rest] = queue;
      set({ queue: rest });
      get().playTrack(next, playlist.some((t) => t.id === next.id) ? playlist : [next, ...playlist]);
      return;
    }

    if (playlist.length === 0) return;

    let nextIndex;
    if (shuffle && playlist.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * playlist.length);
      } while (nextIndex === currentIndex);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= playlist.length) {
        if (repeat !== 'off') {
          nextIndex = 0;
        } else {
          // Context exhausted: continue with the autoplay radio (YouTube Music style).
          const radio = get().autoplayQueue;
          if (get().autoplay && radio.length > 0) {
            const [next, ...rest] = radio;
            get().playTrack(next, [next, ...rest]);
            return;
          }
          if (auto) {
            if (get().autoplay) {
              void get()._autoplayNext();
              return;
            }
            get().pause();
            set({ currentTime: 0 });
            if (howl?.state() === 'loaded') howl.seek(0);
            get()._persistSession();
            return;
          }
          nextIndex = 0;
        }
      }
    }
    get().playTrack(playlist[nextIndex], playlist);
  },

  previousTrack: () => {
    const { playlist, currentIndex, currentTime, currentTrack } = get();
    if (!currentTrack) return;
    if (currentTime > 3 || playlist.length <= 1) {
      get().seekTo(0);
      return;
    }
    const prevIndex = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1;
    get().playTrack(playlist[prevIndex], playlist);
  },

  seekTo: (seconds) => {
    const { currentTrack, duration } = get();
    if (!currentTrack) return;
    cancelCrossfade();
    const t = Math.max(0, duration ? Math.min(seconds, duration) : seconds);
    if (currentTrack.source === 'youtube') {
      if (ytPlayer.isReady()) ytPlayer.seek(t);
      else seekAfterLoad = t;
    } else if (currentTrack.source === 'spotify' && spotifyMode === 'sdk') {
      spotifyPlayer.seek(t);
    } else if (howl?.state() === 'loaded') {
      howl.seek(t);
    }
    set({ currentTime: t });
    updateMediaPosition(t, duration);
    get()._syncLyricIndex(t);
  },

  setVolume: (v) => {
    const volume = Math.max(0, Math.min(1, v));
    const muted = volume === 0 ? get().muted : false;
    set({ volume, muted });
    if (howl) howl.volume(muted ? 0 : volume);
    ytPlayer.setVolume(muted ? 0 : volume);
    spotifyPlayer.setVolume(muted ? 0 : volume);
    get()._persistPrefs();
  },

  toggleMute: () => {
    const muted = !get().muted;
    set({ muted });
    const effective = muted ? 0 : get().volume;
    if (howl) howl.volume(effective);
    ytPlayer.setVolume(effective);
    spotifyPlayer.setVolume(effective);
    get()._persistPrefs();
  },

  setShuffle: (shuffle) => {
    set({ shuffle: !!shuffle });
    get()._persistPrefs();
  },

  toggleShuffle: () => {
    get().setShuffle(!get().shuffle);
  },

  setRepeat: (repeat) => {
    set({ repeat: ['off', 'all', 'one'].includes(repeat) ? repeat : 'off' });
    get()._persistPrefs();
  },

  cycleRepeat: () => {
    const order = { off: 'all', all: 'one', one: 'off' };
    get().setRepeat(order[get().repeat] || 'off');
  },

  setAutoplay: (autoplay) => {
    set({ autoplay: !!autoplay });
    get()._persistPrefs();
    if (autoplay) void get()._prefetchRelated();
    else set({ autoplayQueue: [] });
  },

  setPlayerMode: (mode) => {
    set({ playerMode: mode });
    get()._persistPrefs();
  },

  addToQueue: (track) => {
    if (!track) return;
    if (get().queue.some((t) => t.id === track.id)) {
      toast.info('Lagu sudah ada di antrean');
      return;
    }
    set({ queue: [...get().queue, track] });
    toast.success('Ditambahkan ke antrean');
    get()._persistSession();
  },

  removeFromQueue: (trackId) => {
    set({ queue: get().queue.filter((t) => t.id !== trackId) });
    get()._persistSession();
  },

  clearQueue: () => {
    set({ queue: [] });
    get()._persistSession();
  },

  playNext: (track) => {
    if (!track) return;
    const queue = get().queue.filter((t) => t.id !== track.id);
    set({ queue: [track, ...queue] });
    toast.success('Akan diputar berikutnya');
    get()._persistSession();
  },

  toggleAutoplay: () => {
    get().setAutoplay(!get().autoplay);
  },

  removeFromAutoplay: (trackId) => {
    set({ autoplayQueue: get().autoplayQueue.filter((t) => t.id !== trackId) });
  },

  moveInQueue: (trackId, dir) => {
    const queue = [...get().queue];
    const i = queue.findIndex((t) => t.id === trackId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= queue.length) return;
    [queue[i], queue[j]] = [queue[j], queue[i]];
    set({ queue });
    get()._persistSession();
  },

  _fetchRelated: async () => {
    const { currentTrack } = get();
    if (!currentTrack) return [];
    const token = playToken;
    let items = [];
    try {
      if (currentTrack.source === 'youtube' && currentTrack.videoId) {
        items = await getRelatedYouTube(currentTrack.videoId, { limit: 20 });
      } else {
        items = await getRelatedByQuery(`${currentTrack.title || ''} ${currentTrack.artist || ''}`.trim());
      }
    } catch {
      return [];
    }
    if (token !== playToken || get().currentTrack?.id !== currentTrack.id) return [];
    const { queue, playlist, autoplayQueue } = get();
    const exclude = new Set([
      currentTrack.id,
      ...queue.map((t) => t.id),
      ...playlist.map((t) => t.id),
      ...autoplayQueue.map((t) => t.id),
      ...getRecentTracks().map((t) => t.id),
    ]);
    const seen = new Set();
    const scored = [];
    for (const t of items) {
      if (!t?.id || exclude.has(t.id) || seen.has(t.id)) continue;
      seen.add(t.id);
      // Related results start from YouTube's own relevance; same-artist and
      // same-album lift the tracks that continue the current listening context.
      let score = 25;
      if (sameArtist(t.artist, currentTrack.artist)) score += 25;
      if (t.album && currentTrack.album && t.album.toLowerCase() === currentTrack.album.toLowerCase()) score += 10;
      scored.push({ track: t, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 20).map((entry) => entry.track);
  },

  _prefetchRelated: async () => {
    if (!get().autoplay || !getSettings().smartRecommendations || !get().currentTrack) return;
    const seed = get().currentTrack.id;
    const tracks = await get()._fetchRelated();
    if (!get().autoplay || get().currentTrack?.id !== seed) return;
    set({ autoplayQueue: tracks });
  },

  _promoteCrossfade: () => {
    const pending = xfade;
    if (!pending?.howl || pending.pending) return false;
    xfade = null;
    const { howl: nextHowl, track } = pending;
    const { queue, playlist } = get();
    const fromQueue = queue[0]?.id === track.id;
    let nextPlaylist = playlist;
    let nextIndex = playlist.findIndex((t) => t.id === track.id);
    if (nextIndex < 0) {
      nextPlaylist = [...playlist, track];
      nextIndex = nextPlaylist.length - 1;
    }
    try {
      howl?.stop();
      howl?.unload();
    } catch {
      /* ended already */
    }
    nextHowl.__kvActive = true;
    howl = nextHowl;
    audioPlayback = pending.playback;
    const buffering = () => {
      if (get().isPlaying) set({ status: 'buffering' });
    };
    const playing = () => {
      if (!get().isPlaying) {
        nextHowl.pause();
        return;
      }
      set({ status: 'playing', error: null });
    };
    bindNativeAudioEvents(nextHowl, buffering, playing);
    const duration = nextHowl.duration();
    set({
      currentTrack: track,
      playlist: nextPlaylist,
      currentIndex: nextIndex,
      queue: fromQueue ? queue.slice(1) : queue,
      isPlaying: getSettings().autoPlayOnSelect !== false,
      status: 'playing',
      currentTime: 0,
      duration: Number.isFinite(duration) && duration > 0 ? duration : track.duration || 0,
      error: null,
      lyrics: null,
      currentLyricIndex: -1,
      ytLoadNonce: get().ytLoadNonce + 1,
    });
    if (getSettings().mediaSessionEnabled) updateMediaMetadata(track);
    pushRecent(track);
    if (!/^(yt|sp):/.test(String(track.id))) incrementPlayCount(track.id).catch(() => {});
    get()._startPolling();
    get()._persistSession();
    void get()._prefetchRelated();
    return true;
  },

  _maybeCrossfade: (t) => {
    const settings = getSettings();
    if (!settings.crossfadeEnabled || settings.crossfadeSeconds <= 0) return;
    if (xfade || !howl || howl.state() !== 'loaded') return;
    const { currentTrack, duration, isPlaying, repeat } = get();
    if (!isPlaying || !isUploadTrack(currentTrack) || !Number.isFinite(duration) || duration <= 0) return;
    if (repeat === 'one') return;
    const remaining = duration - t;
    if (remaining <= 0.15 || remaining > settings.crossfadeSeconds) return;
    void get()._startCrossfade(settings.crossfadeSeconds);
  },

  _startCrossfade: async (seconds) => {
    if (xfade) return;
    const { queue, playlist, currentIndex, repeat, currentTrack } = get();
    let next = queue.length > 0 ? queue[0] : playlist[currentIndex + 1];
    if (!next && repeat === 'all') next = playlist[0];
    if (!next || next.id === currentTrack?.id || !isUploadTrack(next)) return;

    const token = playToken;
    xfade = { pending: true, track: next };
    const abortIfStale = () => !xfade || xfade.track.id !== next.id || token !== playToken;
    try {
      const bucket = next.bucket || BUCKETS.MUSIC;
      const url = next.audioPath
        ? await getSignedUrl(bucket, next.audioPath)
        : await resolveAudioUrl(next);
      if (abortIfStale()) return;
      if (!url) throw new Error('Audio tidak tersedia');
      const corsMode = await probeCors(url);
      if (abortIfStale() || !get().isPlaying) {
        cancelCrossfade();
        return;
      }
      const format = /\.([a-z0-9]+)$/i.test(url.split('?')[0]) ? undefined : ['mp3'];
      const targetVolume = get().muted ? 0 : get().volume;
      const playback = { track: next, token, retries: 0, crossfade: true };
      const nextHowl = withCorsAudio(corsMode === 'cors', () => new Howl({
        src: [url],
        format,
        html5: true,
        volume: 0,
        onend: () => {
          if (nextHowl.__kvActive && get().isPlaying) {
            stopPolling();
            get()._handleEnded();
          }
        },
        onloaderror: () => {
          if (xfade?.howl === nextHowl) cancelCrossfade(false);
        },
      }));
      xfade = { howl: nextHowl, playback, track: next, pending: false };
      if (corsMode !== 'none' && tapHowl(nextHowl)) markLive(true);
      nextHowl.play();
      try {
        howl?.fade(howl.volume(), 0, Math.max(300, seconds * 1000));
      } catch {
        /* old sound already gone */
      }
      nextHowl.fade(0, targetVolume, Math.max(300, seconds * 1000));
    } catch {
      if (xfade?.track.id === next.id) xfade = null;
    }
  },

  _autoplayNext: async () => {
    const tracks = await get()._fetchRelated();
    if (tracks.length > 0) {
      const [next, ...rest] = tracks;
      set({ autoplayQueue: rest });
      get().playTrack(next, [next, ...rest]);
      return;
    }
    get().pause();
    set({ currentTime: 0 });
    get()._persistSession();
  },

  setLyrics: (lyrics) => {
    set({ lyrics, currentLyricIndex: -1 });
    get()._syncLyricIndex(get().currentTime);
  },

  setNowPlayingOpen: (open, tab) =>
    set(tab ? { nowPlayingOpen: open, nowPlayingTab: tab } : { nowPlayingOpen: open }),
  setNowPlayingTab: (tab) => set({ nowPlayingTab: tab }),

  ytHooks: {
    shouldPlay: () => get().currentTrack?.source === 'youtube' && get().isPlaying,
    onPlaying: () => {
      if (get().currentTrack?.source !== 'youtube' || !get().isPlaying) {
        ytPlayer.pause();
        return;
      }
      set({ isPlaying: true, status: 'playing', error: null });
      get()._startPolling();
      if (seekAfterLoad != null) {
        ytPlayer.seek(seekAfterLoad);
        seekAfterLoad = null;
      }
    },
    onPaused: () => {
      if (get().currentTrack?.source !== 'youtube') return;
      // Guard: do not pause if a new track is currently loading
      if (get().status === 'loading') return;
      set({ isPlaying: false, status: 'paused' });
      stopPolling();
      get()._persistSession();
    },
    onEnded: () => {
      if (get().currentTrack?.source !== 'youtube' || !get().isPlaying) return;
      stopPolling();
      get()._handleEnded();
    },
    onBuffering: () => {
      if (get().currentTrack?.source === 'youtube' && get().isPlaying) set({ status: 'buffering' });
    },
    onDuration: (d) => {
      if (get().currentTrack?.source === 'youtube' && d && isFinite(d) && d > 0) set({ duration: d });
    },
    onAutoplayBlocked: () => {
      if (get().currentTrack?.source !== 'youtube') return;
      set({ isPlaying: false, status: 'paused' });
      stopPolling();
      get()._persistSession();
    },
    onError: (code) => {
      if (get().currentTrack?.source !== 'youtube') return;
      const token = playToken;
      console.error('YouTube player error:', code);
      // Update UI immediately so the user sees error state right away.
      set({ isPlaying: false, status: 'error', error: `YouTube error ${code}` });
      stopPolling();
      if (code === 'API_LOAD') return;
      if (code === 101 || code === 150 || code === 100 || code === 2) {
        // Restricted or invalid video (101/150: embedding disabled, 100: not found/removed, 2: bad videoId)
        toast.error('Video ini tidak bisa diputar di sini. Lewati ke lagu berikutnya.');
        setTimeout(() => {
          if (token === playToken && get().status === 'error') get().nextTrack(true);
        }, 800);
      } else {
        toast.error('Pemutar YouTube bermasalah. Lewati ke lagu berikutnya.');
        setTimeout(() => {
          if (token === playToken && get().status === 'error') get().nextTrack(true);
        }, 1200);
      }
    },
  },

  _startSpotify: (track, positionMs = 0) => {
    const token = playToken;
    if (isSpotifyConfigured() && isSpotifyConnected()) {
      spotifyMode = 'sdk';
      markLive(false);
      lastSpotifyPos = positionMs;
      spotifyPlayer.setVolume(get().muted ? 0 : get().volume);
      spotifyPlayer.play(track, positionMs, get().spotifyHooks).catch(() => {
        if (token !== playToken || get().currentTrack?.id !== track.id) return;
        get()._spotifyFallback(track);
      });
      return;
    }
    if (track.audioUrl) {
      spotifyMode = 'preview';
      set({ duration: 30 });
      audioPlayback = { track: { ...track, audioPath: null, bucket: null }, token, retries: 0 };
      return loadAudio(set, get, audioPlayback);
    }
    spotifyMode = null;
    const message = 'Hubungkan akun Spotify di Profil untuk memutar lagu ini.';
    set({ isPlaying: false, status: 'error', error: message });
    toast.error(message);
  },

  // Full-track streaming needs Premium; degrade to the 30s preview when the
  // SDK refuses (free account, unsupported browser, revoked session).
  _spotifyFallback: async (track) => {
    if (!track || get().currentTrack?.id !== track.id || spotifyMode !== 'sdk') return;
    spotifyMode = 'fallback';
    spotifyPlayer.pause();
    stopPolling();
    let preview = track.audioUrl;
    if (!preview && track.spotifyId && isSpotifyConnected()) {
      preview = await getSpotifyTrackPreview(track.spotifyId).catch(() => null);
    }
    if (get().currentTrack?.id !== track.id || spotifyMode !== 'fallback') return;
    if (preview) {
      spotifyMode = 'preview';
      set({ status: 'loading', currentTime: 0, duration: 30, error: null });
      toast.info('Lagu penuh butuh Spotify Premium — memutar preview 30 detik.');
      audioPlayback = { track: { ...track, audioPath: null, bucket: null, audioUrl: preview }, token: playToken, retries: 0 };
      loadAudio(set, get, audioPlayback);
    } else {
      spotifyMode = null;
      const message = 'Lagu ini butuh Spotify Premium, dan preview tidak tersedia.';
      set({ isPlaying: false, status: 'error', error: message });
      toast.error(message);
      get()._persistSession();
    }
  },

  spotifyHooks: {
    onState: (s) => {
      const cur = get().currentTrack;
      if (!s || cur?.source !== 'spotify' || spotifyMode !== 'sdk') return;
      const uri = s.track_window?.current_track?.uri;
      if (cur.spotifyId && uri && uri !== `spotify:track:${cur.spotifyId}`) return;
      const d = (s.duration || 0) / 1000;
      if (d > 0 && Math.abs(d - get().duration) > 1) set({ duration: d });
      if (!s.paused) {
        lastSpotifyPos = s.position || 0;
        if (!get().isPlaying) {
          spotifyPlayer.pause();
          return;
        }
        if (get().status !== 'playing') set({ status: 'playing', error: null });
        get()._startPolling();
        return;
      }
      if (!get().isPlaying || get().status === 'loading') return;
      if ((s.position || 0) === 0 && d > 0 && lastSpotifyPos > s.duration - 3000) {
        stopPolling();
        get()._handleEnded();
        return;
      }
      set({ isPlaying: false, status: 'paused' });
      stopPolling();
      get()._persistSession();
    },
    onError: (kind) => {
      const cur = get().currentTrack;
      if (cur?.source !== 'spotify' || spotifyMode !== 'sdk') return;
      if (kind === 'auth') toast.error('Sesi Spotify berakhir. Hubungkan ulang di Profil.');
      get()._spotifyFallback(cur);
    },
  },

  _handleEnded: () => {
    const { repeat, currentTrack, currentTime, duration } = get();
    if (repeat === 'one' && currentTrack) {
      cancelCrossfade(false);
      if (currentTrack.source === 'youtube') {
        ytPlayer.seek(0);
        ytPlayer.play();
      } else if (currentTrack.source === 'spotify' && spotifyMode === 'sdk') {
        spotifyPlayer.seek(0);
        spotifyPlayer.resume();
      } else if (howl) {
        howl.seek(0);
        howl.play();
      }
      return;
    }
    get().nextTrack(true);
    void currentTime;
    void duration;
  },

  _startPolling: () => {
    stopPolling();
    // 500 ms is sufficient for waveform and lyrics sync and is kinder on
    // battery / CPU than the previous 250 ms tick.
    pollTimer = setInterval(() => {
      const { currentTrack, isPlaying, status } = get();
      // Stop polling aggressively when paused or no track is active.
      if (!currentTrack || !isPlaying || status === 'paused') return;
      let t = 0;
      if (currentTrack.source === 'youtube') {
        t = ytPlayer.getTime() || 0;
        const d = ytPlayer.getDuration();
        if (d && isFinite(d) && d > 0 && Math.abs(d - get().duration) > 1) {
          set({ duration: d });
        }
      } else if (currentTrack.source === 'spotify' && spotifyMode === 'sdk') {
        t = spotifyPlayer.getTime() || 0;
        lastSpotifyPos = t * 1000;
        const d = spotifyPlayer.getDuration();
        if (d && isFinite(d) && d > 0 && Math.abs(d - get().duration) > 1) {
          set({ duration: d });
        }
      } else if (howl) {
        const seek = howl.seek();
        t = typeof seek === 'number' ? seek : 0;
        get()._maybeCrossfade(t);
      }
      if (t !== get().currentTime) {
        set({ currentTime: t });
        const second = Math.floor(t);
        if (second !== lastPersistedSecond) {
          lastPersistedSecond = second;
          get()._persistSession();
        }
      }
      get()._syncLyricIndex(t);
      const now = Date.now();
      if (now - lastPositionSync > 1000) {
        lastPositionSync = now;
        updateMediaPosition(t, get().duration);
      }
    }, 500);
  },

  _syncLyricIndex: (t) => {
    const { lyrics, currentTrack, currentLyricIndex } = get();
    if (!lyrics?.synced?.length || !currentTrack) return;
    const offset = getLyricsOffset(currentTrack.id) + (lyrics.baseOffsetMs || 0) + getSettings().lyricsOffsetMs;
    const idx = findActiveLine(lyrics.synced, t * 1000 + offset);
    if (idx !== currentLyricIndex) set({ currentLyricIndex: idx });
  },

  _persistPrefs: () => {
    const { volume, muted, shuffle, repeat, autoplay, playerMode } = get();
    const remember = getSettings().rememberVolume;
    saveJson(PREFS_KEY, {
      ...(remember ? { volume, muted } : {}),
      shuffle,
      repeat,
      autoplay,
      playerMode,
    });
  },

  _persistSession: () => {
    const { currentTrack, playlist, currentIndex, queue, currentTime } = get();
    if (!currentTrack) return;
    const remaining = 5000 - (Date.now() - lastSessionWrite);
    if (remaining > 0) {
      if (!sessionTimer) sessionTimer = setTimeout(() => {
        sessionTimer = null;
        get()._persistSession();
      }, remaining);
      return;
    }
    clearTimeout(sessionTimer);
    sessionTimer = null;
    const session = {
      currentTrack,
      playlist: playlist.slice(0, 100),
      currentIndex,
      queue: queue.slice(0, 50),
      currentTime,
    };
    const snapshot = JSON.stringify(session);
    if (snapshot === lastSessionSnapshot) return;
    saveJson(SESSION_KEY, { ...session, savedAt: Date.now() });
    lastSessionSnapshot = snapshot;
    lastSessionWrite = Date.now();
  },

  restoreSession: () => {
    if (get().currentTrack) return;
    if (!getSettings().resumeSession) return;
    const saved = loadJson(SESSION_KEY, null);
    if (!saved?.currentTrack) return;
    const resumeAt = getSettings().rememberPosition ? saved.currentTime || 0 : 0;
    set({
      currentTrack: saved.currentTrack,
      playlist: Array.isArray(saved.playlist) ? saved.playlist : [saved.currentTrack],
      currentIndex: typeof saved.currentIndex === 'number' ? saved.currentIndex : 0,
      queue: Array.isArray(saved.queue) ? saved.queue : [],
      currentTime: resumeAt,
      duration: saved.currentTrack.duration || 0,
      isPlaying: false,
      status: 'paused',
    });
    if (getSettings().mediaSessionEnabled) updateMediaMetadata(saved.currentTrack);
  },

  stopAndClear: () => {
    playToken++;
    markLive(false);
    cancelCrossfade(false);
    cancelAudioWork();
    audioPlayback = null;
    seekAfterLoad = null;
    clearTimeout(sessionTimer);
    sessionTimer = null;
    lastSessionSnapshot = null;
    stopHowl();
    stopPolling();
    ytPlayer.pause();
    spotifyPlayer.pause();
    spotifyMode = null;
    clearMediaSession();
    set({
      currentTrack: null,
      playlist: [],
      currentIndex: -1,
      queue: [],
      autoplayQueue: [],
      isPlaying: false,
      status: 'idle',
      currentTime: 0,
      duration: 0,
      error: null,
      lyrics: null,
      currentLyricIndex: -1,
      nowPlayingOpen: false,
    });
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch { /* ignore */ }
  },
}));

bindMediaActions({
  play: () => useMusicStore.getState().play(),
  pause: () => useMusicStore.getState().pause(),
  previous: () => useMusicStore.getState().previousTrack(),
  next: () => useMusicStore.getState().nextTrack(false),
  seekTo: (t) => useMusicStore.getState().seekTo(t),
  seekBackward: (d) => useMusicStore.getState().seekTo(useMusicStore.getState().currentTime - (d || 10)),
  seekForward: (d) => useMusicStore.getState().seekTo(useMusicStore.getState().currentTime + (d || 10)),
});

export { useMusicStore };