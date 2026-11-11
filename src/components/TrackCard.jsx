import { Play, Music2 } from 'lucide-react';
import { useMusicStore } from '../stores/music';
import EqBars from './ui/EqBars';

const TrackCard = ({ track, onPlay, width = 'w-40 sm:w-44' }) => {
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const active =
    currentTrack?.id === track.id || (!!track.videoId && currentTrack?.videoId === track.videoId);

  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`Putar ${track.title} dari ${track.artist}`}
      className={`group ${width} shrink-0 rounded-kv border-3 border-kv-ink bg-kv-surface text-left shadow-kv transition-transform duration-150 hover:-translate-y-1 hover:shadow-kv-lg`}
    >
      <span className={`relative block aspect-square w-full overflow-hidden border-b-3 border-kv-ink ${active ? 'bg-kv-yellow' : 'bg-kv-muted'}`}>
        {track.albumArt ? (
          <img src={track.albumArt} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="kv-dots flex h-full w-full items-center justify-center bg-kv-blue">
            <Music2 size={40} className="text-[#0a0a0a]" />
          </span>
        )}
        <span className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-kv border-3 border-kv-ink bg-kv-yellow opacity-100 shadow-kv transition-transform duration-150 group-hover:scale-110 lg:opacity-0 lg:group-hover:opacity-100">
          {active && isPlaying ? <EqBars /> : <Play size={16} className="ml-0.5 text-[#0a0a0a]" />}
        </span>
        {track.source === 'youtube' && (
          <span className="absolute left-2 top-2 rounded border-2 border-kv-ink bg-kv-red px-1.5 font-mono text-[9px] font-bold uppercase text-white">
            YT
          </span>
        )}
      </span>
      <span className="block p-2.5">
        <span className="block truncate text-sm font-bold leading-tight">{track.title}</span>
        <span className="mt-0.5 block truncate text-xs text-kv-ink-muted">{track.artist}</span>
      </span>
    </button>
  );
};

export default TrackCard;