import { useEffect, useState } from 'react';
import { Music2 } from 'lucide-react';

// YouTube's Innertube search/playlist thumbnails are tiny 120px googleusercontent
// crops that upscale to grey slivers. Prefer a real i.ytimg.com video frame and
// fall back to mqdefault, then a glyph, so a poster is never a broken/blank box.
// `small` uses the 320px frame for dense list thumbs to keep payloads light.
export default function TrackArt({
  src,
  videoId,
  small = false,
  alt = '',
  imgClassName = 'h-full w-full object-cover',
  placeholderClassName = 'flex h-full w-full items-center justify-center text-kv-ink-muted',
  placeholderSize = 16,
}) {
  const [stage, setStage] = useState(0);
  useEffect(() => setStage(0), [src, videoId, small]);
  const yt = videoId ? `https://i.ytimg.com/vi/${videoId}` : null;
  const candidates = (
    small && yt ? [`${yt}/mqdefault.jpg`, `${yt}/hq720.jpg`] : [src, yt ? `${yt}/mqdefault.jpg` : null]
  ).filter(Boolean);
  const url = candidates[stage];
  if (!url) {
    return (
      <span className={placeholderClassName}>
        <Music2 size={placeholderSize} />
      </span>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={imgClassName}
      onError={() => setStage((s) => s + 1)}
    />
  );
}