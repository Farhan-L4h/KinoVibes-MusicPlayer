import { useArtColors } from '../hooks/useArtColors';
import { useSettingsStore } from '../stores/settings';

// Slow-drifting light sampled from the cover art. Sits behind content at low
// opacity so text contrast is untouched; falls back to monochrome without art.
export default function Ambient({ url, className = '', opacity }) {
  const colors = useArtColors(url);
  const enabled = useSettingsStore((s) => s.ambientArtwork);
  if (!enabled) return null;
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