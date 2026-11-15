import { create } from 'zustand';
import { Howl } from 'howler';
import { resolveAudioUrl, incrementPlayCount } from '../services/supabaseMusicApi';
import { getSignedUrl, invalidateSignedUrl, BUCKETS } from '../config/supabase';
import { ytPlayer } from '../player/youtube';
import { updateMediaMetadata, updateMediaPosition, bindMediaActions, clearMediaSession } from '../player/mediaSession';
import { getLyricsOffset } from '../services/lyricsApi';
import { findActiveLine } from '../lib/lrc';
import { getRelatedYouTube, getRelatedByQuery } from '../services/ytApi';
import { toast } from './toast';

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
const RETRY_DELAYS = [1000, 2000, 4000];
const AUDIO_TIMEOUT = 20_000;

const cancelAudioWork = () => {
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
    if (!valid()) return;
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
    instance = new Howl({
      src: [url],
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
    });
    howl = instance;
    bindNativeAudioEvents(instance, buffering, playing);
    instance.play();
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
    audioPlayback = null;
    seekAfterLoad = null;
    stopHowl();
    stopPolling();
    if (prev?.source === 'youtube' && track.source !== 'youtube') {
      ytPlayer.pause();
    }

    const list = contextList && contextList.length > 0 ? contextList : [track];
    const index = list.findIndex((t) => t.id === track.id);
    const playlist = index >= 0 ? list : [track, ...list];
    const currentIndex = index >= 0 ? index : 0;

    set({
      currentTrack: track,
      playlist,
      currentIndex,
      isPlaying: true,
      status: 'loading',
      currentTime: 0,
      duration: track.duration || 0,
      error: null,
      lyrics: null,
      currentLyricIndex: -1,
      ytLoadNonce: get().ytLoadNonce + 1,
    });

    updateMediaMetadata(track);
    pushRecent(track);
    if (!String(track.id).startsWith('yt:')) {
      incrementPlayCount(track.id).catch(() => {});
    }
    get()._persistSession();
    void get()._prefetchRelated();

    if (track.source === 'youtube') {
      // VideoDock mounts the iframe; hooks below drive the state machine.
      return;
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
    if (howl?.state() === 'loaded' && (status !== 'error' || audioPlayback?.playBlocked)) {
      audioPlayback.retries = 0;
      if (audioPlayback.playBlocked) howl.seek(currentTime);
      audioPlayback.playBlocked = false;
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
    set({ isPlaying: false, status: 'paused' });
    clearTimeout(retryTimer);
    clearTimeout(loadTimer);
    retryTimer = null;
    loadTimer = null;
    stopPolling();
    if (currentTrack.source === 'youtube') ytPlayer.pause();
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
    const t = Math.max(0, duration ? Math.min(seconds, duration) : seconds);
    if (currentTrack.source === 'youtube') {
      if (ytPlayer.isReady()) ytPlayer.seek(t);
      else seekAfterLoad = t;
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
    get()._persistPrefs();
  },

  toggleMute: () => {
    const muted = !get().muted;
    set({ muted });
    const effective = muted ? 0 : get().volume;
    if (howl) howl.volume(effective);
    ytPlayer.setVolume(effective);
    get()._persistPrefs();
  },

  toggleShuffle: () => {
    set({ shuffle: !get().shuffle });
    get()._persistPrefs();
  },

  cycleRepeat: () => {
    const order = { off: 'all', all: 'one', one: 'off' };
    set({ repeat: order[get().repeat] || 'off' });
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
    const autoplay = !get().autoplay;
    set({ autoplay });
    get()._persistPrefs();
    if (autoplay) void get()._prefetchRelated();
    else set({ autoplayQueue: [] });
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
    const out = [];
    for (const t of items) {
      if (!t?.id || exclude.has(t.id) || seen.has(t.id)) continue;
      seen.add(t.id);
      out.push(t);
      if (out.length >= 20) break;
    }
    return out;
  },

  _prefetchRelated: async () => {
    if (!get().autoplay || !get().currentTrack) return;
    const seed = get().currentTrack.id;
    const tracks = await get()._fetchRelated();
    if (!get().autoplay || get().currentTrack?.id !== seed) return;
    set({ autoplayQueue: tracks });
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
      if (code === 101 || code === 150) {
        toast.error('Video ini tidak bisa diputar di sini. Lewati ke lagu berikutnya.');
      } else {
        toast.error('Pemutar YouTube bermasalah. Lewati ke lagu berikutnya.');
      }
      set({ isPlaying: false, status: 'error', error: `YouTube error ${code}` });
      stopPolling();
      if (code === 'API_LOAD') return;
      setTimeout(() => {
        if (token === playToken && get().status === 'error') get().nextTrack(true);
      }, 1200);
    },
  },

  _handleEnded: () => {
    const { repeat, currentTrack, currentTime, duration } = get();
    if (repeat === 'one' && currentTrack) {
      if (currentTrack.source === 'youtube') {
        ytPlayer.seek(0);
        ytPlayer.play();
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
    pollTimer = setInterval(() => {
      const { currentTrack, isPlaying } = get();
      if (!currentTrack || !isPlaying) return;
      let t = 0;
      if (currentTrack.source === 'youtube') {
        t = ytPlayer.getTime() || 0;
        const d = ytPlayer.getDuration();
        if (d && isFinite(d) && d > 0 && Math.abs(d - get().duration) > 1) {
          set({ duration: d });
        }
      } else if (howl) {
        const seek = howl.seek();
        t = typeof seek === 'number' ? seek : 0;
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
    }, 250);
  },

  _syncLyricIndex: (t) => {
    const { lyrics, currentTrack, currentLyricIndex } = get();
    if (!lyrics?.synced?.length || !currentTrack) return;
    const offset = getLyricsOffset(currentTrack.id) + (lyrics.baseOffsetMs || 0);
    const idx = findActiveLine(lyrics.synced, t * 1000 + offset);
    if (idx !== currentLyricIndex) set({ currentLyricIndex: idx });
  },

  _persistPrefs: () => {
    const { volume, muted, shuffle, repeat, autoplay } = get();
    saveJson(PREFS_KEY, { volume, muted, shuffle, repeat, autoplay });
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
    const saved = loadJson(SESSION_KEY, null);
    if (!saved?.currentTrack) return;
    set({
      currentTrack: saved.currentTrack,
      playlist: Array.isArray(saved.playlist) ? saved.playlist : [saved.currentTrack],
      currentIndex: typeof saved.currentIndex === 'number' ? saved.currentIndex : 0,
      queue: Array.isArray(saved.queue) ? saved.queue : [],
      currentTime: saved.currentTime || 0,
      duration: saved.currentTrack.duration || 0,
      isPlaying: false,
      status: 'paused',
    });
    updateMediaMetadata(saved.currentTrack);
  },

  stopAndClear: () => {
    playToken++;
    cancelAudioWork();
    audioPlayback = null;
    seekAfterLoad = null;
    clearTimeout(sessionTimer);
    sessionTimer = null;
    lastSessionSnapshot = null;
    stopHowl();
    stopPolling();
    ytPlayer.pause();
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