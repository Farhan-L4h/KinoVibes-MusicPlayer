import { useEffect, useRef } from 'react';
import { useMusicStore } from '../../stores/music';
import { ytPlayer } from '../../player/youtube';
import { getVideoSlot } from '../../player/videoSlot';

const DOCK = 240;

// Keeps the YouTube iframe visible at all times while a YT track plays:
// either inside a registered slot (NowPlaying / Lyrics) or docked bottom-right.
const VideoDock = () => {
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const ytLoadNonce = useMusicStore((s) => s.ytLoadNonce);
  const isYt = currentTrack?.source === 'youtube';
  const videoId = currentTrack?.videoId;
  const hostRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!isYt) return undefined;
    return () => {
      ytPlayer.destroy();
    };
  }, [isYt]);

  useEffect(() => {
    if (!isYt || !videoId) return;
    const frame = frameRef.current;
    if (!frame) return;
    if (!frame.querySelector('#kv-yt-frame')) {
      const inner = document.createElement('div');
      inner.id = 'kv-yt-frame';
      inner.style.width = '100%';
      inner.style.height = '100%';
      frame.appendChild(inner);
    }
    ytPlayer.mount('kv-yt-frame', videoId, useMusicStore.getState().ytHooks);
    const { muted, volume } = useMusicStore.getState();
    ytPlayer.setVolume(muted ? 0 : volume);
  }, [isYt, videoId, ytLoadNonce]);

  useEffect(() => {
    if (!isYt) return undefined;
    let raf;
    const tick = () => {
      const host = hostRef.current;
      if (host) {
        const slot = getVideoSlot();
        if (slot && slot.isConnected) {
          const r = slot.getBoundingClientRect();
          if (r.width >= 200 && r.height >= 200) {
            host.style.left = `${r.left}px`;
            host.style.top = `${r.top}px`;
            host.style.width = `${r.width}px`;
            host.style.height = `${r.height}px`;
            host.style.right = 'auto';
            host.style.bottom = 'auto';
          }
        } else {
          const mobile = window.innerWidth < 1024;
          const size = Math.min(DOCK, window.innerWidth - 32);
          host.style.width = `${size}px`;
          host.style.height = `${size}px`;
          host.style.left = 'auto';
          host.style.top = 'auto';
          host.style.right = '16px';
          host.style.bottom = `${(mobile ? 64 : 0) + 88 + 16}px`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isYt]);

  if (!isYt) return null;

  return (
    <div
      ref={hostRef}
      className="fixed z-[55] overflow-hidden rounded-kv border-3 border-kv-ink bg-kv-ink shadow-kv-lg"
      style={{ width: DOCK, height: DOCK, right: 16, bottom: 168 }}
    >
      <div ref={frameRef} className="absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full" />
      <button
        type="button"
        aria-label="Jeda atau putar video"
        className="absolute inset-0 cursor-pointer"
        onClick={() => useMusicStore.getState().togglePlay()}
      />
      <button
        type="button"
        onClick={() => useMusicStore.getState().setNowPlayingOpen(true)}
        className="absolute left-2 top-2 rounded-kv border-2 border-kv-ink bg-kv-yellow px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-kv-ink"
      >
        ▶ YouTube
      </button>
    </div>
  );
};

export default VideoDock;