import { useEffect } from 'react';
import { useMusicStore } from '../stores/music';
import { useArtColors } from '../hooks/useArtColors';

// Single ambient source for the whole deck: publishes the cover's sampled light
// as root CSS vars so every surface tints from it, and drifts a mesh behind the
// panel. Without art the vars clear to transparent and the deck stays monochrome.
export default function GlobalAmbient() {
  const art = useMusicStore((s) => s.currentTrack?.albumArt);
  const colors = useArtColors(art);

  useEffect(() => {
    const root = document.documentElement;
    if (colors) {
      root.style.setProperty('--kv-ambient-a', colors.a);
      root.style.setProperty('--kv-ambient-b', colors.b);
      root.style.setProperty('--kv-ambient-c', colors.c);
    } else {
      root.style.removeProperty('--kv-ambient-a');
      root.style.removeProperty('--kv-ambient-b');
      root.style.removeProperty('--kv-ambient-c');
    }
  }, [colors]);

  useEffect(
    () => () => {
      const root = document.documentElement;
      root.style.removeProperty('--kv-ambient-a');
      root.style.removeProperty('--kv-ambient-b');
      root.style.removeProperty('--kv-ambient-c');
    },
    []
  );

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="kv-mesh"
        style={{
          '--mesh-a': colors?.a,
          '--mesh-b': colors?.b,
          '--mesh-c': colors?.c,
          '--mesh-opacity': 0.6,
        }}
      />
    </div>
  );
}