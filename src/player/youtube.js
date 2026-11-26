let apiPromise = null;

const loadApi = () => {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      const prev = window.onYouTubeIframeAPIReady;
      const tag = document.createElement('script');
      let timeout;
      const cleanup = () => {
        clearTimeout(timeout);
        tag.onerror = null;
        if (window.onYouTubeIframeAPIReady === ready) window.onYouTubeIframeAPIReady = prev;
      };
      const fail = () => {
        cleanup();
        tag.remove();
        apiPromise = null;
        reject(new Error('Gagal memuat YouTube Player API.'));
      };
      const ready = () => {
        cleanup();
        resolve(window.YT);
        prev?.();
      };
      window.onYouTubeIframeAPIReady = ready;
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.onerror = fail;
      timeout = setTimeout(fail, 15_000);
      document.head.appendChild(tag);
    });
  }
  return apiPromise;
};

// Singleton wrapper around the official YouTube IFrame Player API.
// The iframe element is owned by <VideoDock/> and must stay visible (>=200x200)
// while a YouTube track plays, per YouTube embed rules.
export const ytPlayer = {
  player: null,
  videoId: null,
  hooks: {},
  _pendingVolume: 100,
  _mountToken: 0,
  _wantPlay: false,
  _ready: false,
  _quality: 'auto',
  _qualityApplied: false,

  async mount(elementId, videoId, hooks) {
    const token = ++this._mountToken;
    this.hooks = hooks || {};
    this._wantPlay = this.hooks.shouldPlay?.() ?? true;
    let YT;
    try {
      YT = await loadApi();
    } catch {
      if (token === this._mountToken) this.hooks.onError?.('API_LOAD');
      return;
    }
    if (token !== this._mountToken) return;
    this.videoId = videoId;
    if (this.player) {
      if (this._ready) this._loadVideo();
      return;
    }
    this.player = new YT.Player(elementId, {
      videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: (e) => {
          if (this.player !== e.target) return;
          this._ready = true;
          e.target.setVolume(this._pendingVolume);
          this._qualityApplied = false;
          this._applyQuality();
          this._loadVideo();
          this.hooks.onDuration?.(e.target.getDuration?.() || 0);
        },
        onStateChange: (e) => {
          if (!this._isCurrent(e.target)) return;
          const S = window.YT.PlayerState;
          if (e.data === S.PLAYING) {
            if (!this._shouldPlay()) {
              e.target.pauseVideo();
              return;
            }
            this.hooks.onDuration?.(e.target.getDuration?.() || 0);
            this._applyQuality();
            this.hooks.onPlaying?.();
          } else if (e.data === S.PAUSED) this.hooks.onPaused?.();
          else if (e.data === S.ENDED) this.hooks.onEnded?.();
          else if (e.data === S.BUFFERING && this._shouldPlay()) this.hooks.onBuffering?.();
        },
        onError: (e) => {
          if (this._isCurrent(e.target)) this.hooks.onError?.(e.data);
        },
        onAutoplayBlocked: (e) => {
          if (!this._isCurrent(e.target)) return;
          this._wantPlay = false;
          this.hooks.onAutoplayBlocked?.();
        },
      },
    });
  },

  _shouldPlay() {
    return this._wantPlay && (this.hooks.shouldPlay?.() ?? true);
  },
  _isCurrent(player) {
    if (this.player !== player) return false;
    const id = player.getVideoData?.()?.video_id;
    return !id || id === this.videoId;
  },
  _loadVideo() {
    this._qualityApplied = false;
    if (this._shouldPlay()) this.player.loadVideoById(this.videoId);
    else this.player.cueVideoById(this.videoId);
  },
  // The IFrame API treats quality as a suggestion; the actual level is read
  // back with getPlaybackQuality() so Settings never claims a fake resolution.
  _applyQuality() {
    if (!this._ready || !this.player || this._qualityApplied) return;
    const map = {
      auto: 'default',
      medium: 'medium',
      large: 'large',
      hd720: 'hd720',
      hd1080: 'hd1080',
      highres: 'highres',
    };
    try {
      this.player.setPlaybackQuality?.(map[this._quality] || 'default');
      this._qualityApplied = true;
    } catch {
      /* deprecated/unsupported in some embeds */
    }
  },
  setQuality(quality) {
    this._quality = quality || 'auto';
    this._qualityApplied = false;
    this._applyQuality();
  },
  getActualQuality() {
    try {
      return this.player?.getPlaybackQuality?.() || null;
    } catch {
      return null;
    }
  },
  isReady() {
    return this._ready;
  },
  play() {
    this._wantPlay = true;
    this.player?.playVideo?.();
  },
  pause() {
    this._wantPlay = false;
    this.player?.pauseVideo?.();
  },
  seek(seconds) {
    this.player?.seekTo?.(seconds, true);
  },
  setVolume(v01) {
    this._pendingVolume = Math.round(v01 * 100);
    this.player?.setVolume?.(this._pendingVolume);
  },
  getTime() {
    return this.player?.getCurrentTime?.() || 0;
  },
  getDuration() {
    return this.player?.getDuration?.() || 0;
  },
  destroy() {
    this._mountToken++;
    this._wantPlay = false;
    this._ready = false;
    this._qualityApplied = false;
    this.hooks = {};
    try {
      this.player?.destroy?.();
    } catch {
      // iframe may already be detached
    }
    this.player = null;
    this.videoId = null;
  },
};