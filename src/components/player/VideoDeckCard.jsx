import { useEffect, useRef } from 'react';
import { Maximize2 } from 'lucide-react';
import { useMusicStore } from '../../stores/music';
import { registerVideoSlot, unregisterVideoSlot } from '../../player/videoSlot';
import IconButton from '../ui/IconButton';

// Compact inline home for the YouTube embed on routes without the turntable.
// Lowest-priority slot: NowPlaying and the Home deck take over when present.
export default function VideoDeckCard() {
  const track = useMusicStore((s) => s.currentTrack);
  const setNowPlayingOpen = useMusicStore((s) => s.setNowPlayingOpen);
  const slot = useRef(null);

  useEffect(() => {
    const el = slot.current;
    registerVideoSlot(el, 1);
    return () => unregisterVideoSlot(el);
  }, [track?.id]);

  if (!track) return null;

  return (
    <section
      aria-label="Video sedang diputar"
      className="kv-rise mb-5 flex flex-col gap-4 rounded-kv-lg border border-kv-line bg-kv-surface p-3 sm:flex-row sm:items-center"
    >
      <div ref={slot} className="relative h-[200px] w-[200px] shrink-0 overflow-hidden rounded-kv bg-black" />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-widest text-kv-ink-muted">YouTube</p>
        <h2 className="mt-1 truncate font-display text-base leading-snug">{track.title}</h2>
        <p className="truncate text-xs text-kv-ink-muted">{track.artist}</p>
      </div>
      <IconButton label="Perbesar pemutar" onClick={() => setNowPlayingOpen(true)}>
        <Maximize2 size={18} />
      </IconButton>
    </section>
  );
}