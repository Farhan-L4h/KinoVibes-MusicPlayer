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
      host.style.top = `${r.top}px`;
      host.style.left = `${r.left}px`;
      host.style.width = `${r.width}px`;
      host.style.height = `${r.height}px`;
      host.style.borderRadius = getComputedStyle(slot).borderRadius;
      host.style.zIndex = useMusicStore.getState().nowPlayingOpen ? '60' : '30';
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
      <div ref={frameRef} className="h-full w-full [&_iframe]:h-full [&_iframe]:w-full" />
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