import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { useMusicStore } from '../../stores/music';
import { ytPlayer } from '../../player/youtube';
import { getVideoSlot } from '../../player/videoSlot';

// The YouTube iframe is mounted once into a single persistent host. The host is
// positioned over whichever player surface registered a slot (NowPlaying art,
// Home deck, lyrics cover) but the iframe is never reparented, so navigating or
// opening/closing the player never reloads the video/audio. With no slot visible
// it falls back to a compact corner dock so the player stays visible (ToS).
// The host renders inside the app canvas (not portalled to <body>): the canvas
// is a fixed-position stacking context, so a body-level host would paint over
// the TopBar quick-search dropdown no matter its z-index.
const DOCK_SIZE = 200;
const VideoDock = () => {
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const ytLoadNonce = useMusicStore((s) => s.ytLoadNonce);
  const nowPlayingOpen = useMusicStore((s) => s.nowPlayingOpen);
  const isYt = currentTrack?.source === 'youtube';
  const videoId = currentTrack?.videoId;
  const hostRef = useRef(null);
  const frameRef = useRef(null);
  const observedRef = useRef(null);
  const [hasSlot, setHasSlot] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!isYt) return undefined;
    return () => {
      ytPlayer.destroy();
    };
  }, [isYt]);

  useLayoutEffect(() => {
    if (!isYt) {
      setHasSlot(false);
      return undefined;
    }
    let raf = 0;
    const ro = new ResizeObserver(() => schedule());
    const apply = () => {
      raf = 0;
      const host = hostRef.current;
      if (!host) return;
      const slot = getVideoSlot();
      const npOpen = useMusicStore.getState().nowPlayingOpen;
      if (slot) {
        if (observedRef.current !== slot) {
          if (observedRef.current) ro.unobserve(observedRef.current);
          ro.observe(slot);
          observedRef.current = slot;
        }
      } else if (observedRef.current) {
        ro.unobserve(observedRef.current);
        observedRef.current = null;
      }
      // Clip the host window to the scroll region that owns the slot so the
      // video can never paint over the TopBar / MiniPlayer when the slot
      // scrolls out of view. The iframe itself keeps its full cover-crop size.
      let r = slot ? slot.getBoundingClientRect() : null;
      let left = 0;
      let top = 0;
      let width = 0;
      let height = 0;
      let radius = '16px';
      let docked = !slot;
      if (slot) {
        // YouTube requires the iframe visible at >=200x200; a slot smaller
        // than that (very short viewports) gets the corner dock instead.
        if (r.width < 200 || r.height < 200) docked = true;
        const clipEl = npOpen
          ? document.querySelector('[data-kv-np-left]')
          : document.querySelector('[data-kv-main]');
        left = r.left;
        top = r.top;
        width = r.width;
        height = r.height;
        radius = getComputedStyle(slot).borderRadius;
        if (clipEl) {
          const cr = clipEl.getBoundingClientRect();
          const x0 = Math.max(r.left, cr.left);
          const y0 = Math.max(r.top, cr.top);
          const x1 = Math.min(r.right, cr.right);
          const y1 = Math.min(r.bottom, cr.bottom);
          if (x1 - x0 < 8 || y1 - y0 < 8) docked = true;
          else {
            left = x0;
            top = y0;
            width = x1 - x0;
            height = y1 - y0;
          }
        }
      }
      if (docked) {
        // Corner dock above the mini player: keeps the iframe >=200x200 and
        // visible on routes without a player surface, without a full-width bar.
        const mini = document.querySelector('[aria-label="Pemutar musik"]');
        const miniTop = mini ? mini.getBoundingClientRect().top : window.innerHeight;
        width = DOCK_SIZE;
        height = DOCK_SIZE;
        left = Math.max(8, window.innerWidth - DOCK_SIZE - 16);
        top = Math.max(8, miniTop - DOCK_SIZE - 12);
        radius = '16px';
        r = { left, top, width, height };
      }
      host.style.display = 'block';
      host.style.top = `${top}px`;
      host.style.left = `${left}px`;
      host.style.width = `${width}px`;
      host.style.height = `${height}px`;
      host.style.borderRadius = radius;
      host.style.zIndex = npOpen ? '60' : '30';
      // Cover-crop the 16:9 frame into the (often square) slot so no black
      // letterbox bars show; keep the iframe itself >=200x200 for YouTube ToS.
      const frame = frameRef.current;
      if (frame) {
        const fh = Math.max(r.height, (r.width * 9) / 16, 200);
        const fw = (fh * 16) / 9;
        frame.style.width = `${fw}px`;
        frame.style.height = `${fh}px`;
        frame.style.left = `${r.left - left + (r.width - fw) / 2}px`;
        frame.style.top = `${r.top - top + (r.height - fh) / 2}px`;
      }
      setFallback(docked);
      setHasSlot(true);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    // Slots register in sibling effects whose order isn't guaranteed; retry until
    // one is found so the host activates reliably on first mount.
    let tries = 0;
    const kickoff = () => {
      apply();
      if (!observedRef.current && tries++ < 90) raf = requestAnimationFrame(kickoff);
    };
    raf = requestAnimationFrame(kickoff);
    window.addEventListener('kv-video-slot', schedule);
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('kv-video-slot', schedule);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      ro.disconnect();
      observedRef.current = null;
    };
  }, [isYt, videoId, nowPlayingOpen]);

  useEffect(() => {
    if (!isYt || !videoId || !hasSlot) return;
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
  }, [isYt, videoId, ytLoadNonce, hasSlot]);

  if (!isYt) return null;

  return (
    <div
      ref={hostRef}
      className={`pointer-events-none fixed overflow-hidden bg-black ${fallback ? 'border border-kv-line shadow-kv-lg' : ''}`}
      style={{ display: hasSlot ? 'block' : 'none' }}
    >
      <div ref={frameRef} className="absolute [&_iframe]:h-full [&_iframe]:w-full" />
      <button
        type="button"
        aria-label="Jeda atau putar video"
        className="pointer-events-auto absolute inset-0 cursor-pointer"
        onClick={() => useMusicStore.getState().togglePlay()}
      />
      {fallback && (
        <button
          type="button"
          aria-label="Perbesar pemutar"
          title="Perbesar pemutar"
          className="pointer-events-auto absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
          onClick={() => useMusicStore.getState().setNowPlayingOpen(true)}
        >
          <Maximize2 size={14} />
        </button>
      )}
    </div>
  );
};

export default VideoDock;