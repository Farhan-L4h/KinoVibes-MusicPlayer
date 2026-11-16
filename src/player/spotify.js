import { getSpotifyToken, spotifyFetch } from '../services/spotifyApi';

let sdkPromise = null;

const loadSdk = () => {
  if (window.Spotify?.Player) return Promise.resolve(window.Spotify);
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const prev = window.onSpotifyWebPlaybackSDKReady;
      const tag = document.createElement('script');
      let timeout;
      const cleanup = () => {
        clearTimeout(timeout);
        tag.onerror = null;
        if (window.onSpotifyWebPlaybackSDKReady === ready) window.onSpotifyWebPlaybackSDKReady = prev;
      };
      const fail = () => {
        cleanup();
        tag.remove();
        sdkPromise = null;
        reject(new Error('Gagal memuat Spotify Player SDK.'));
      };
      const ready = () => {
        cleanup();
        resolve(window.Spotify);
        prev?.();
      };
      window.onSpotifyWebPlaybackSDKReady = ready;
      tag.src = 'https://sdk.scdn.co/spotify-player.js';
      tag.async = true;
      tag.onerror = fail;
      timeout = setTimeout(fail, 15_000);
      document.head.appendChild(tag);
    });
  }
  return sdkPromise;
};

// Singleton wrapper around the Spotify Web Playback SDK (Premium, EME/DRM).
// Full tracks stream through Spotify's own player — no ads, no extraction.
export const spotifyPlayer = {
  player: null,
  deviceId: null,
  hooks: {},
  _state: null,
  _stateAt: 0,
  _volume: 0.8,
  _connectPromise: null,
  _readyResolve: null,

  async connect(hooks) {
    if (hooks) this.hooks = hooks;
    if (this.player && this.deviceId) return this.deviceId;
    if (this._connectPromise) return this._connectPromise;
    this._connectPromise = (async () => {
      const Spotify = await loadSdk();
      const player = new Spotify.Player({
        name: 'KinoVibe',
        getOAuthToken: (cb) => {
          getSpotifyToken().then((t) => { if (t) cb(t); }).catch(() => {});
        },
        volume: this._volume,
      });
      this.player = player;
      const ready = new Promise((resolve, reject) => {
        this._readyResolve = resolve;
        setTimeout(() => reject(new Error('Spotify Player tidak siap. Coba lagi.')), 15_000);
      });
      player.addListener('ready', ({ device_id }) => {
        this.deviceId = device_id;
        this._readyResolve?.(device_id);
        this._readyResolve = null;
        this.hooks.onReady?.(device_id);
      });
      player.addListener('not_ready', () => {
        this.deviceId = null;
      });
      player.addListener('player_state_changed', (s) => {
        this._state = s;
        this._stateAt = Date.now();
        this.hooks.onState?.(s);
      });
      player.addListener('initialization_error', ({ message }) => this.hooks.onError?.('init', message));
      player.addListener('authentication_error', ({ message }) => this.hooks.onError?.('auth', message));
      player.addListener('account_error', ({ message }) => this.hooks.onError?.('account', message));
      player.addListener('playback_error', ({ message }) => this.hooks.onError?.('playback', message));
      const ok = await player.connect();
      if (!ok) throw new Error('Gagal terhubung ke Spotify Player.');
      return ready;
    })();
    try {
      return await this._connectPromise;
    } catch (err) {
      this.disconnect();
      throw err;
    } finally {
      this._connectPromise = null;
    }
  },

  isReady() {
    return !!(this.player && this.deviceId);
  },

  // Required on iOS/mobile before the first playback.
  activate() {
    try {
      this.player?.activateElement?.();
    } catch { /* not supported */ }
  },

  async play(track, positionMs = 0, hooks) {
    const uri = track.uri || `spotify:track:${track.spotifyId}`;
    const deviceId = await this.connect(hooks);
    this.activate();
    await spotifyFetch(`/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      body: { uris: [uri], position_ms: Math.max(0, Math.round(positionMs)) },
    });
  },

  pause() {
    this.player?.pause?.().catch(() => {});
  },

  resume() {
    this.player?.resume?.().catch(() => {});
  },

  seek(seconds) {
    this.player?.seek?.(Math.max(0, Math.round(seconds * 1000))).catch(() => {});
  },

  setVolume(v01) {
    this._volume = Math.max(0, Math.min(1, v01));
    this.player?.setVolume?.(this._volume).catch(() => {});
  },

  getTime() {
    const s = this._state;
    if (!s) return 0;
    const base = (s.position || 0) / 1000;
    if (s.paused) return base;
    return base + (Date.now() - this._stateAt) / 1000;
  },

  getDuration() {
    return (this._state?.duration || 0) / 1000;
  },

  disconnect() {
    try {
      this.player?.disconnect?.();
    } catch { /* already gone */ }
    this.player = null;
    this.deviceId = null;
    this._state = null;
    this._readyResolve = null;
  },
};