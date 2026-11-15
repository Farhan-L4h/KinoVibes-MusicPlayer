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
    let raf = 0;
    const update = () => {
      raf = 0;
      const host = hostRef.current;
      if (!host) return;
      const slot = getVideoSlot();
      const r = slot?.isConnected ? slot.getBoundingClientRect() : null;
      if (r && r.width >= 200 && r.height >= 200 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth) {
        Object.assign(host.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, right: 'auto', bottom: 'auto' });
      } else {
        const mobile = innerWidth < 1024;
        const size = Math.min(mobile ? 200 : DOCK, innerWidth - 24);
        const bottom = Math.max(12, Math.min((mobile ? 60 + 88 : 88 + 24) + 12, innerHeight - size - 12));
        Object.assign(host.style, { width: `${size}px`, height: `${size}px`, left: 'auto', top: 'auto', right: mobile ? '12px' : '36px', bottom: `${bottom}px` });
      }
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    const observeSlot = () => {
      observer.disconnect();
      const slot = getVideoSlot();
      if (slot) observer.observe(slot);
      schedule();
    };
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('kv-video-slot', observeSlot);
    observeSlot();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('kv-video-slot', observeSlot);
    };
  }, [isYt]);

  if (!isYt) return null;

  return (
    <div
      ref={hostRef}
      className="fixed z-[55] overflow-hidden rounded-kv-lg border border-white/20 bg-black shadow-kv-lg"
      style={{ width: DOCK, height: DOCK, right: 12, bottom: 156 }}
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
        className="absolute left-2 top-2 rounded-full border border-white/25 bg-black/70 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm"
      >
        ▶ YouTube
      </button>
    </div>
  );
};

export default VideoDock;