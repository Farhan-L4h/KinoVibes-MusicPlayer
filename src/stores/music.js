import { create } from 'zustand';
import { Howl } from 'howler';
import { resolveAudioUrl, incrementPlayCount } from '../services/supabaseMusicApi';
import { ytPlayer } from '../player/youtube';
import { updateMediaMetadata, updateMediaPosition, bindMediaActions, clearMediaSession } from '../player/mediaSession';
import { getLyricsOffset } from '../services/lyricsApi';
import { findActiveLine } from '../lib/lrc';
import { toast } from './toast';

const SESSION_KEY = 'kv-session';
const PREFS_KEY = 'kv-prefs';
const RECENT_KEY = 'kv-recent';

let howl = null;
let pollTimer = null;
let playToken = 0;
let seekAfterLoad = null;
let lastPositionSync = 0;

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

const useMusicStore = create((set, get) => ({
  currentTrack: null,
  playlist: [],
  currentIndex: -1,
  queue: [],
  isPlaying: false,
  status: 'idle',
  currentTime: 0,
  duration: 0,
  volume: typeof savedPrefs.volume === 'number' ? savedPrefs.volume : 0.8,
  muted: !!savedPrefs.muted,
  shuffle: !!savedPrefs.shuffle,
  repeat: savedPrefs.repeat || 'off',
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

    if (track.source === 'youtube') {
      // VideoDock mounts the iframe; hooks below drive the state machine.
      return;
    }

    try {
      const url = await resolveAudioUrl(track);
      if (token !== playToken) return;
      if (!url) throw new Error('Audio tidak tersedia');

      const startAt = seekAfterLoad;
      seekAfterLoad = null;

      howl = new Howl({
        src: [url],
        html5: true,
        volume: get().muted ? 0 : get().volume,
        onplay: () => {
          if (token !== playToken) return;
          set({ isPlaying: true, status: 'playing' });
          get()._startPolling();
        },
        onpause: () => {
          if (token !== playToken) return;
          set({ isPlaying: false, status: 'paused' });
          stopPolling();
          get()._persistSession();
        },
        onend: () => {
          if (token !== playToken) return;
          stopPolling();
          get()._handleEnded();
        },
        onload: () => {
          if (token !== playToken) return;
          const d = howl?.duration();
          if (d && isFinite(d)) set({ duration: d });
          if (startAt != null && howl) howl.seek(startAt);
        },
        onloaderror: (_id, err) => {
          if (token !== playToken) return;
          console.error('Audio load error:', err);
          set({ isPlaying: false, status: 'error', error: 'Gagal memuat audio' });
          stopPolling();
          toast.error('Gagal memuat audio. Coba putar lagi.');
        },
        onplayerror: (_id, err) => {
          if (token !== playToken) return;
          console.error('Audio play error:', err);
          set({ isPlaying: false, status: 'error', error: 'Gagal memutar audio' });
          toast.error('Gagal memutar audio. Coba lagi.');
        },
      });
      howl.play();
    } catch (err) {
      if (token !== playToken) return;
      console.error('playTrack error:', err);
      set({ isPlaying: false, status: 'error', error: err.message || 'Gagal memutar lagu' });
      toast.error(err.message || 'Gagal memutar lagu');
    }
  },

  togglePlay: () => {
    const { currentTrack, isPlaying, currentTime } = get();
    if (!currentTrack) return;

    if (currentTrack.source === 'youtube') {
      if (isPlaying) {
        ytPlayer.pause();
      } else if (ytPlayer.isReady()) {
        ytPlayer.play();
      } else {
        seekAfterLoad = currentTime > 1 ? currentTime : null;
        set({ isPlaying: true, status: 'loading', ytLoadNonce: get().ytLoadNonce + 1 });
      }
      return;
    }

    if (!howl) {
      seekAfterLoad = currentTime > 1 ? currentTime : null;
      get().playTrack(currentTrack, get().playlist);
      return;
    }

    if (isPlaying) howl.pause();
    else howl.play();
  },

  pause: () => {
    const { currentTrack, isPlaying } = get();
    if (!isPlaying || !currentTrack) return;
    if (currentTrack.source === 'youtube') ytPlayer.pause();
    else howl?.pause();
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
        if (auto && repeat === 'off') {
          set({ isPlaying: false, status: 'paused', currentTime: 0 });
          stopPolling();
          if (get().currentTrack?.source === 'youtube') ytPlayer.pause();
          else howl?.pause();
          get()._persistSession();
          return;
        }
        nextIndex = 0;
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
      ytPlayer.seek(t);
    } else if (howl) {
      howl.seek(t);
    } else {
      seekAfterLoad = t;
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

  setLyrics: (lyrics) => {
    set({ lyrics, currentLyricIndex: -1 });
    get()._syncLyricIndex(get().currentTime);
  },

  setNowPlayingOpen: (open, tab) =>
    set(tab ? { nowPlayingOpen: open, nowPlayingTab: tab } : { nowPlayingOpen: open }),
  setNowPlayingTab: (tab) => set({ nowPlayingTab: tab }),

  ytHooks: {
    onPlaying: () => {
      set({ isPlaying: true, status: 'playing' });
      get()._startPolling();
      if (seekAfterLoad != null) {
        ytPlayer.seek(seekAfterLoad);
        seekAfterLoad = null;
      }
    },
    onPaused: () => {
      set({ isPlaying: false, status: 'paused' });
      stopPolling();
      get()._persistSession();
    },
    onEnded: () => {
      stopPolling();
      get()._handleEnded();
    },
    onBuffering: () => {
      if (get().isPlaying) set({ status: 'buffering' });
    },
    onDuration: (d) => {
      if (d && isFinite(d) && d > 0) set({ duration: d });
    },
    onError: (code) => {
      console.error('YouTube player error:', code);
      if (code === 101 || code === 150) {
        toast.error('Video ini tidak bisa diputar di sini. Lewati ke lagu berikutnya.');
      } else {
        toast.error('Pemutar YouTube bermasalah. Lewati ke lagu berikutnya.');
      }
      set({ status: 'error', error: `YouTube error ${code}` });
      setTimeout(() => {
        if (get().status === 'error') get().nextTrack(true);
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
      set({ currentTime: t });
      get()._syncLyricIndex(t);
      const now = Date.now();
      if (now - lastPositionSync > 1000) {
        lastPositionSync = now;
        updateMediaPosition(t, get().duration);
      }
      if (Math.floor(t) % 5 === 0) get()._persistSession();
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
    const { volume, muted, shuffle, repeat } = get();
    saveJson(PREFS_KEY, { volume, muted, shuffle, repeat });
  },

  _persistSession: () => {
    const { currentTrack, playlist, currentIndex, queue, currentTime } = get();
    if (!currentTrack) {
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch { /* ignore */ }
      return;
    }
    saveJson(SESSION_KEY, {
      currentTrack,
      playlist: playlist.slice(0, 100),
      currentIndex,
      queue: queue.slice(0, 50),
      currentTime,
      savedAt: Date.now(),
    });
  },

  restoreSession: () => {
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
    stopHowl();
    stopPolling();
    ytPlayer.pause();
    clearMediaSession();
    set({
      currentTrack: null,
      playlist: [],
      currentIndex: -1,
      queue: [],
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
  play: () => useMusicStore.getState().togglePlay(),
  pause: () => useMusicStore.getState().pause(),
  previous: () => useMusicStore.getState().previousTrack(),
  next: () => useMusicStore.getState().nextTrack(false),
  seekTo: (t) => useMusicStore.getState().seekTo(t),
  seekBackward: (d) => useMusicStore.getState().seekTo(useMusicStore.getState().currentTime - (d || 10)),
  seekForward: (d) => useMusicStore.getState().seekTo(useMusicStore.getState().currentTime + (d || 10)),
});

export { useMusicStore };