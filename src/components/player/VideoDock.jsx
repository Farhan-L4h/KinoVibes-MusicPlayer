import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMusicStore } from '../../stores/music';
import { ytPlayer } from '../../player/youtube';
import { getVideoSlot } from '../../player/videoSlot';

// The YouTube iframe is mounted once into a single persistent host portalled to
// <body>. The host is positioned over whichever player surface registered a slot
// (NowPlaying art, Home deck, route deck card) but the iframe is never reparented,
// so navigating or opening/closing the player never reloads the video/audio.
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
      const slot = getVideoSlot();
      if (!host || !slot) return;
      if (observedRef.current !== slot) {
        if (observedRef.current) ro.unobserve(observedRef.current);
        ro.observe(slot);
        observedRef.current = slot;
      }
      const r = slot.getBoundingClientRect();
      // Clip the host window to the scroll region that owns the slot so the
      // video can never paint over the TopBar / MiniPlayer when the slot
      // scrolls out of view. The iframe itself keeps its full cover-crop size.
      const clipEl = useMusicStore.getState().nowPlayingOpen
        ? document.querySelector('[data-kv-np-left]')
        : document.querySelector('[data-kv-main]');
      let left = r.left;
      let top = r.top;
      let width = r.width;
      let height = r.height;
      if (clipEl) {
        const cr = clipEl.getBoundingClientRect();
        const x0 = Math.max(r.left, cr.left);
        const y0 = Math.max(r.top, cr.top);
        const x1 = Math.min(r.right, cr.right);
        const y1 = Math.min(r.bottom, cr.bottom);
        if (x1 - x0 < 8 || y1 - y0 < 8) {
          host.style.display = 'none';
          setHasSlot(true);
          return;
        }
        left = x0;
        top = y0;
        width = x1 - x0;
        height = y1 - y0;
      }
      host.style.display = 'block';
      host.style.top = `${top}px`;
      host.style.left = `${left}px`;
      host.style.width = `${width}px`;
      host.style.height = `${height}px`;
      host.style.borderRadius = getComputedStyle(slot).borderRadius;
      host.style.zIndex = useMusicStore.getState().nowPlayingOpen ? '60' : '30';
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

  return createPortal(
    <div
      ref={hostRef}
      className="pointer-events-none fixed overflow-hidden bg-black"
      style={{ display: hasSlot ? 'block' : 'none' }}
    >
      <div ref={frameRef} className="absolute [&_iframe]:h-full [&_iframe]:w-full" />
      <button
        type="button"
        aria-label="Jeda atau putar video"
        className="pointer-events-auto absolute inset-0 cursor-pointer"
        onClick={() => useMusicStore.getState().togglePlay()}
      />
    </div>,
    document.body
  );
};

export default VideoDock;