import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMusicStore } from '../../stores/music';
import { ytPlayer } from '../../player/youtube';
import { getVideoSlot } from '../../player/videoSlot';

// The YouTube iframe lives inline inside whichever player surface registered a
// slot (NowPlaying art, Home deck, or the route deck card). It is never a
// floating overlay: the embed stays in normal flow at >=200x200 while visible.
const VideoDock = () => {
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const ytLoadNonce = useMusicStore((s) => s.ytLoadNonce);
  const isYt = currentTrack?.source === 'youtube';
  const videoId = currentTrack?.videoId;
  const frameRef = useRef(null);
  const [slot, setSlot] = useState(null);

  useEffect(() => {
    if (!isYt) return undefined;
    return () => {
      ytPlayer.destroy();
    };
  }, [isYt]);

  useEffect(() => {
    const sync = () => setSlot(getVideoSlot());
    sync();
    window.addEventListener('kv-video-slot', sync);
    return () => window.removeEventListener('kv-video-slot', sync);
  }, [isYt, videoId]);

  useEffect(() => {
    if (!isYt || !videoId || !slot) return;
    const frame = frameRef.current;
    if (!frame) return;
    if (!frame.querySelector('#kv-yt-frame')) {
      const inner = document.createElement('div');
      inner.id = 'kv-yt-frame';
      inner.style.width = '100%';
      inner.style.height = '100%';
      frame.appendChild(inner);
    }
    // A portal move detaches the old iframe; rebuild the orphaned player here, keeping position.
    const liveIframe = ytPlayer.player?.getIframe?.();
    if (ytPlayer.player && (!liveIframe || !frame.contains(liveIframe))) {
      const savedTime = ytPlayer.getTime();
      ytPlayer.destroy();
      if (savedTime > 0) useMusicStore.getState().seekTo(savedTime);
    }
    ytPlayer.mount('kv-yt-frame', videoId, useMusicStore.getState().ytHooks);
    const { muted, volume } = useMusicStore.getState();
    ytPlayer.setVolume(muted ? 0 : volume);
  }, [isYt, videoId, ytLoadNonce, slot]);

  if (!isYt || !slot) return null;

  return createPortal(
    <div className="absolute inset-0 z-10 overflow-hidden [&_iframe]:h-full [&_iframe]:w-full">
      <div ref={frameRef} className="h-full w-full" />
      <button
        type="button"
        aria-label="Jeda atau putar video"
        className="absolute inset-0 cursor-pointer"
        onClick={() => useMusicStore.getState().togglePlay()}
      />
    </div>,
    slot
  );
};

export default VideoDock;