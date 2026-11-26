import { Play, Heart, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMusicStore } from '../stores/music';
import { useFavoritesStore } from '../stores/favorites';
import { useTrackActions } from '../hooks/useTrackActions';
import { formatTime, cn, normalizeArtist } from '../lib/utils';
import EqBars from './ui/EqBars';
import TrackMenu from './TrackMenu';
import TrackArt from './TrackArt';

const TrackRow = ({
  track,
  index = 0,
  list,
  showAlbum = true,
  onDelete,
  onRemove,
  removeLabel = 'Hapus lagu',
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) => {
  const navigate = useNavigate();
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const actions = useTrackActions();

  const active =
    currentTrack?.id === track.id ||
    (!!track.videoId && currentTrack?.videoId === track.videoId);
  const fav = isFavorite(track);

  const goArtist = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (track.artist) navigate(`/artist/${normalizeArtist(track.artist)}`);
  };

  return (
    <div
      className={cn(
        'group flex flex-nowrap items-center gap-2 rounded-kv border p-1.5 transition-colors duration-150 sm:gap-3 sm:p-2',
        active
          ? 'border-kv-line bg-kv-surface'
          : 'border-transparent hover:border-kv-line hover:bg-kv-surface'
      )}
    >
      <button
        type="button"
        onClick={() => actions.play(track, list)}
        aria-label={`Putar ${track.title}`}
        className="hidden h-11 w-8 shrink-0 items-center justify-center font-mono text-sm font-bold text-kv-ink-muted sm:flex"
      >
        {active ? (
          <EqBars playing={isPlaying} />
        ) : (
          <>
            <span className="group-hover:hidden">{String(index + 1).padStart(2, '0')}</span>
            <Play size={16} className="hidden text-kv-ink group-hover:block" />
          </>
        )}
      </button>

      <div className="flex min-w-0 flex-[2] items-center gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => actions.play(track, list)}
          aria-label={`Putar ${track.title}`}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left sm:gap-3"
        >
          <span className="block h-10 w-10 shrink-0 overflow-hidden rounded-kv border border-kv-line bg-kv-muted sm:h-12 sm:w-12">
            <TrackArt src={track.albumArt} videoId={track.videoId} small placeholderSize={18} />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold leading-tight text-kv-ink">
                {track.title}
              </span>
              {track.source === 'youtube' && (
                <span className="shrink-0 rounded border border-kv-line bg-kv-panel px-1 font-mono text-[9px] text-kv-ink">
                  YT
                </span>
              )}
              {track.source === 'spotify' && (
                <span className="shrink-0 rounded border border-kv-line bg-kv-panel px-1 font-mono text-[9px] text-kv-ink">
                  SP
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={goArtist}
              className="block max-w-full truncate text-left text-sm text-kv-ink-muted hover:text-kv-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-kv-ink"
              aria-label={`Lihat artis ${track.artist}`}
            >
              {track.artist}
            </button>
          </span>
        </button>
      </div>

      {showAlbum && (
        <span className="hidden min-w-0 flex-1 truncate text-sm text-kv-ink-muted lg:block">
          {track.album || '—'}
        </span>
      )}

      <span className="hidden w-14 shrink-0 text-right font-mono text-xs font-bold text-kv-ink-muted sm:block">
        {formatTime(track.duration)}
      </span>

      <div className="flex shrink-0 items-center gap-1.5">
        {onMoveUp && (
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label="Pindah ke atas"
            className="flex h-11 w-11 items-center justify-center rounded border border-kv-line bg-kv-surface hover:bg-kv-muted disabled:opacity-30"
          >
            <ChevronUp size={14} />
          </button>
        )}
        {onMoveDown && (
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label="Pindah ke bawah"
            className="flex h-11 w-11 items-center justify-center rounded border border-kv-line bg-kv-surface hover:bg-kv-muted disabled:opacity-30"
          >
            <ChevronDown size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={() => actions.toggleLike(track)}
          aria-label={fav ? 'Hapus dari favorit' : 'Tambah ke favorit'}
          aria-pressed={fav}
          title={fav ? 'Hapus dari favorit' : 'Tambah ke favorit'}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-kv border border-kv-line',
            fav
              ? 'bg-kv-ink text-kv-panel'
              : 'bg-transparent text-kv-ink hover:bg-kv-muted'
          )}
        >
          <Heart size={16} fill={fav ? 'currentColor' : 'none'} />
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={removeLabel}
            title={removeLabel}
            className="flex h-11 w-11 items-center justify-center rounded-kv border border-kv-line bg-kv-surface hover:bg-kv-muted hover:text-kv-danger"
          >
            <X size={16} />
          </button>
        )}
        <TrackMenu track={track} onDelete={onDelete} />
      </div>
    </div>
  );
};

export default TrackRow;