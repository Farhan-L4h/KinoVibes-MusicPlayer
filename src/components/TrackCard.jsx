import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TrackArt from './TrackArt';
import { useMusicStore } from '../stores/music';
import EqBars from './ui/EqBars';
import { normalizeArtist } from '../lib/utils';

const TrackCard = ({ track, onPlay, width = 'w-40 sm:w-44' }) => {
  const navigate = useNavigate();
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const active = currentTrack?.id === track.id || (!!track.videoId && currentTrack?.videoId === track.videoId);

  const goArtist = () => {
    if (track.artist) navigate(`/artist/${normalizeArtist(track.artist)}`);
  };

  return (
    <div className={`kv-lift group ${width} shrink-0 overflow-hidden rounded-kv border border-kv-line bg-kv-surface text-left transition-colors hover:border-kv-ink`}>
      <button type="button" onClick={onPlay} aria-label={`Putar ${track.title} dari ${track.artist}`} className="block w-full text-left">
        <span className="relative block aspect-square w-full overflow-hidden bg-kv-muted">
          <TrackArt src={track.albumArt} videoId={track.videoId} imgClassName="h-full w-full object-cover grayscale transition-[filter,transform] duration-300 group-hover:scale-[1.03] group-hover:grayscale-0" placeholderSize={36} />
          <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-kv-ink/0 opacity-0 transition-opacity group-hover:opacity-100 group-hover:bg-kv-ink/20">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-kv-line bg-kv-panel text-kv-ink shadow-kv">
              {active ? <EqBars playing={isPlaying} /> : <Play size={17} fill="currentColor" className="ml-0.5" />}
            </span>
          </span>
        </span>
        <span className="block px-3 pt-3 text-sm font-semibold leading-tight">
          <span className="block truncate">{track.title}</span>
        </span>
      </button>
      <span className="block px-3 pb-3 pt-1 text-xs text-kv-ink-muted">
        <button
          type="button"
          onClick={goArtist}
          className="block max-w-full truncate text-left hover:text-kv-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-ink"
          aria-label={`Lihat artis ${track.artist}`}
        >
          {track.artist}
        </button>
      </span>
    </div>
  );
};

export default TrackCard;
