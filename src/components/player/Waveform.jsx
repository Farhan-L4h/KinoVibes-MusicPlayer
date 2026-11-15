import { useMemo } from 'react';
import { useMusicStore } from '../../stores/music';
import { useSeekDrag } from '../../hooks/useSeekDrag';
import { cn } from '../../lib/utils';

const hash = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (a) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const Waveform = ({ trackId, bars = 56, className }) => {
  const currentTime = useMusicStore((s) => s.currentTime);
  const duration = useMusicStore((s) => s.duration);
  const seekTo = useMusicStore((s) => s.seekTo);
  const { ref, handlers } = useSeekDrag(() => useMusicStore.getState().duration, seekTo);

  const heights = useMemo(() => {
    const rnd = mulberry32(hash(String(trackId || 'kinovibe')));
    return Array.from({ length: bars }, (_, i) => {
      const envelope = 0.55 + 0.45 * Math.sin((i / bars) * Math.PI);
      return Math.max(0.14, Math.min(1, (0.3 + 0.7 * rnd()) * envelope));
    });
  }, [trackId, bars]);

  const played = duration > 0 ? currentTime / duration : 0;

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label="Posisi lagu"
      aria-valuemin={0}
      aria-valuemax={Math.max(1, Math.floor(duration))}
      aria-valuenow={Math.floor(currentTime)}
      onKeyDown={(e) => {
        if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
        e.preventDefault();
        if (e.key === 'ArrowRight') seekTo(Math.min(duration, currentTime + 5));
        if (e.key === 'ArrowLeft') seekTo(Math.max(0, currentTime - 5));
        if (e.key === 'Home') seekTo(0);
        if (e.key === 'End') seekTo(duration);
      }}
      className={cn('kv-wave', className)}
      {...handlers}
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className="kv-wave-bar"
          data-played={i / bars < played}
          style={{ height: `${Math.round(h * 100)}%` }}
        />
      ))}
    </div>
  );
};

export default Waveform;