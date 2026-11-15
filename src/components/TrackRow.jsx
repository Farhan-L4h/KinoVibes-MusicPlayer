import { Play, Heart, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useMusicStore } from '../stores/music';
import { useFavoritesStore } from '../stores/favorites';
import { useTrackActions } from '../hooks/useTrackActions';
import { formatTime, cn } from '../lib/utils';
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
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const actions = useTrackActions();

  const active =
    currentTrack?.id === track.id ||
    (!!track.videoId && currentTrack?.videoId === track.videoId);
  const fav = isFavorite(track);

  return (
    <div
      className={cn(
        'group flex flex-wrap items-center gap-2 rounded-kv border p-2 transition-colors duration-150 sm:flex-nowrap sm:gap-3',
        active
          ? 'border-kv-line bg-kv-surface'
          : 'border-transparent hover:border-kv-line hover:bg-kv-surface'
      )}
    >
      <button
        type="button"
        onClick={() => actions.play(track, list)}
        aria-label={`Putar ${track.title}`}
        className="flex h-11 w-8 shrink-0 items-center justify-center font-mono text-sm font-bold text-kv-ink-muted"
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

      <button
        type="button"
        onClick={() => actions.play(track, list)}
        className="flex min-w-0 flex-[2] items-center gap-3 text-left"
      >
        <span className="block h-12 w-12 shrink-0 overflow-hidden rounded-kv border border-kv-line bg-kv-muted">
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
          </span>
          <span className="block truncate text-sm text-kv-ink-muted">{track.artist}</span>
        </span>
      </button>

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