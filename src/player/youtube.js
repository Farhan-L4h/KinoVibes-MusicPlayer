let apiPromise = null;

const loadApi = () => {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve(window.YT);
      };
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.onerror = () => {
        apiPromise = null;
        reject(new Error('Gagal memuat YouTube Player API.'));
      };
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

  async mount(elementId, videoId, hooks) {
    this.hooks = hooks || {};
    const YT = await loadApi();
    if (this.player) {
      this.videoId = videoId;
      this.player.loadVideoById(videoId);
      return;
    }
    this.videoId = videoId;
    this.player = new YT.Player(elementId, {
      videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: (e) => {
          e.target.setVolume(this._pendingVolume);
          e.target.playVideo();
          this.hooks.onDuration?.(e.target.getDuration?.() || 0);
        },
        onStateChange: (e) => {
          const S = window.YT.PlayerState;
          if (e.data === S.PLAYING) {
            this.hooks.onDuration?.(e.target.getDuration?.() || 0);
            this.hooks.onPlaying?.();
          } else if (e.data === S.PAUSED) this.hooks.onPaused?.();
          else if (e.data === S.ENDED) this.hooks.onEnded?.();
          else if (e.data === S.BUFFERING) this.hooks.onBuffering?.();
        },
        onError: (e) => {
          this.hooks.onError?.(e.data);
        },
      },
    });
  },

  isReady() {
    return !!this.player?.playVideo;
  },
  play() {
    this.player?.playVideo?.();
  },
  pause() {
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
    try {
      this.player?.destroy?.();
    } catch {
      // iframe may already be detached
    }
    this.player = null;
    this.videoId = null;
  },
};