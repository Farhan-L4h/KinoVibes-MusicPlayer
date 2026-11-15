import { useRef, useState } from 'react';
import Slider from '../ui/Slider';
import { useMusicStore } from '../../stores/music';

// Streaming audio re-requests a byte range on every seek, so dragging must not
// fire one per pixel. The thumb moves locally and only the release seeks.
export default function SeekSlider({ className, ...props }) {
  const time = useMusicStore((s) => s.currentTime);
  const duration = useMusicStore((s) => s.duration);
  const seekTo = useMusicStore((s) => s.seekTo);
  const [draft, setDraft] = useState(null);
  const pointerDown = useRef(false);

  const commit = () => {
    pointerDown.current = false;
    if (draft == null) return;
    seekTo(draft);
    setDraft(null);
  };

  return (
    <Slider
      aria-label="Posisi lagu"
      className={className}
      value={draft ?? time}
      max={Math.max(1, duration)}
      step={0.1}
      onChange={(e) => setDraft(Number(e.target.value))}
      onPointerDown={() => { pointerDown.current = true; }}
      onPointerUp={commit}
      onPointerCancel={() => { pointerDown.current = false; setDraft(null); }}
      onKeyUp={commit}
      onBlur={() => { if (!pointerDown.current) commit(); }}
      {...props}
    />
  );
}