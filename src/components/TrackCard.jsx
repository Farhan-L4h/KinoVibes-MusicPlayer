import { Play } from 'lucide-react';
import TrackArt from './TrackArt';
import { useMusicStore } from '../stores/music';
import EqBars from './ui/EqBars';

const TrackCard = ({ track, onPlay, width = 'w-40 sm:w-44' }) => {
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const active = currentTrack?.id === track.id || (!!track.videoId && currentTrack?.videoId === track.videoId);

  return (
    <button type="button" onClick={onPlay} aria-label={`Putar ${track.title} dari ${track.artist}`} className={`kv-lift group ${width} shrink-0 overflow-hidden rounded-kv border border-kv-line bg-kv-surface text-left transition-colors hover:border-kv-ink`}>
      <span className="relative block aspect-square w-full overflow-hidden bg-kv-muted">
        <TrackArt src={track.albumArt} videoId={track.videoId} small imgClassName="h-full w-full object-cover grayscale transition-[filter] group-hover:grayscale-0 group-focus-visible:grayscale-0" placeholderSize={36} />
        <span className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-kv-panel text-kv-ink shadow-sm">
          {active && isPlaying ? <EqBars /> : <Play size={15} className="ml-0.5" />}
        </span>
        {track.source === 'youtube' && <span className="absolute left-2 top-2 rounded bg-kv-panel px-1.5 py-0.5 font-mono text-[9px] text-kv-ink">YT</span>}
      </span>
      <span className="block p-3">
        <span className="block truncate text-sm font-semibold leading-tight">{track.title}</span>
        <span className="mt-1 block truncate text-xs text-kv-ink-muted">{track.artist}</span>
      </span>
    </button>
  );
};

export default TrackCard;
