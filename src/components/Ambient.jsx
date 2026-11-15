import { useArtColors } from '../hooks/useArtColors';

// Slow-drifting light sampled from the cover art. Sits behind content at low
// opacity so text contrast is untouched; falls back to monochrome without art.
export default function Ambient({ url, className = '', opacity }) {
  const colors = useArtColors(url);
  return (
    <div
      aria-hidden="true"
      className={`kv-mesh ${className}`}
      style={{
        '--mesh-a': colors?.a,
        '--mesh-b': colors?.b,
        '--mesh-c': colors?.c,
        ...(opacity != null ? { '--mesh-opacity': opacity } : null),
      }}
    />
  );
}