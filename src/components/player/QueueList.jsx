import { ListMusic, X, Music2, Trash2 } from 'lucide-react';
import { useMusicStore } from '../../stores/music';
import { formatTime, cn } from '../../lib/utils';
import EmptyState from '../ui/EmptyState';
import EqBars from '../ui/EqBars';

const Row = ({ track, active, playing, onPlay, onRemove, removeLabel }) => (
  <div
    className={cn(
      'flex items-center gap-3 rounded-kv border px-3 py-2 transition-colors',
      active ? 'border-kv-line bg-kv-muted' : 'border-transparent hover:bg-kv-muted'
    )}
  >
    <button type="button" onClick={onPlay} className="flex min-w-0 flex-1 items-center gap-3 text-left">
      <span className="block h-9 w-9 shrink-0 overflow-hidden rounded-md bg-kv-surface-muted">
        {track.albumArt ? (
          <img src={track.albumArt} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-kv-ink-muted">
            <Music2 size={14} />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{track.title}</span>
        <span className="block truncate font-mono text-xs text-kv-ink-muted">{track.artist}</span>
      </span>
      {active && <EqBars playing={playing} />}
      <span className="shrink-0 font-mono text-xs text-kv-ink-muted">{formatTime(track.duration)}</span>
    </button>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        title={removeLabel}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-kv-ink-muted transition-colors hover:bg-kv-surface hover:text-kv-red"
      >
        <X size={14} />
      </button>
    )}
  </div>
);

const QueueList = () => {
  const queue = useMusicStore((s) => s.queue);
  const playlist = useMusicStore((s) => s.playlist);
  const currentIndex = useMusicStore((s) => s.currentIndex);
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const { playTrack, removeFromQueue, clearQueue } = useMusicStore.getState();

  const upNext = playlist.slice(currentIndex + 1);

  if (queue.length === 0 && upNext.length === 0) {
    return (
      <EmptyState
        icon={ListMusic}
        title="Antrean kosong"
        description="Putar album atau playlist, atau tambahkan lagu lewat menu ⋯ pada lagu mana pun."
      />
    );
  }

  return (
    <div className="space-y-5">
      {queue.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="kv-mono-label">Antrean manual · {queue.length}</h3>
            <button
              type="button"
              onClick={clearQueue}
              className="flex items-center gap-1 rounded-full border border-kv-line px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-kv-ink-muted transition-colors hover:border-kv-red hover:text-kv-red"
            >
              <Trash2 size={12} /> Kosongkan
            </button>
          </div>
          <div className="space-y-1">
            {queue.map((t) => (
              <Row
                key={`q-${t.id}`}
                track={t}
                onPlay={() => {
                  removeFromQueue(t.id);
                  playTrack(t, [t, ...playlist]);
                }}
                onRemove={() => removeFromQueue(t.id)}
                removeLabel="Hapus dari antrean"
              />
            ))}
          </div>
        </section>
      )}

      {upNext.length > 0 && (
        <section>
          <h3 className="kv-mono-label mb-2">Berikutnya · {upNext.length}</h3>
          <div className="space-y-1">
            {upNext.map((t, i) => (
              <Row
                key={`n-${t.id}-${i}`}
                track={t}
                active={currentTrack?.id === t.id}
                playing={isPlaying}
                onPlay={() => playTrack(t, playlist)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default QueueList;
