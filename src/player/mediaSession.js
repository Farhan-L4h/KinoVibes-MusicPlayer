import { formatTime } from '../lib/utils';

export const updateMediaMetadata = (track) => {
  if (!('mediaSession' in navigator) || !track) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist || 'Unknown Artist',
    album: track.album || 'KinoVibe',
    artwork: track.albumArt
      ? [{ src: track.albumArt, sizes: '512x512', type: 'image/jpeg' }]
      : [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
  });
};

export const updateMediaPosition = (currentTime, duration) => {
  if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
  if (!Number.isFinite(duration) || duration <= 0) return;
  try {
    navigator.mediaSession.setPositionState({
      duration,
      playbackRate: 1,
      position: Math.min(currentTime, duration),
    });
  } catch {
    // position out of range during transitions
  }
};

export const bindMediaActions = (actions) => {
  if (!('mediaSession' in navigator)) return;
  const map = {
    play: actions.play,
    pause: actions.pause,
    previoustrack: actions.previous,
    nexttrack: actions.next,
    seekto: actions.seekTo ? (d) => actions.seekTo(d.seekTime) : undefined,
    seekbackward: actions.seekBackward,
    seekforward: actions.seekForward,
    stop: actions.pause,
  };
  for (const [name, handler] of Object.entries(map)) {
    try {
      navigator.mediaSession.setActionHandler(name, handler || null);
    } catch {
      // unsupported action
    }
  }
};

export const clearMediaSession = () => {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = null;
  navigator.mediaSession.playbackState = 'none';
};

export const mediaTimeLabel = formatTime;