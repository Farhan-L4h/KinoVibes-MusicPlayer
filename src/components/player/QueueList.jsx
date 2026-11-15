import { ListMusic, X, Trash2, Radio, ArrowUp, ArrowDown } from 'lucide-react';
import TrackArt from '../TrackArt';
import { useMusicStore } from '../../stores/music';
import { formatTime, cn } from '../../lib/utils';
import EmptyState from '../ui/EmptyState';
import EqBars from '../ui/EqBars';

const Row = ({ track, active, playing, onPlay, onRemove, removeLabel, reorder }) => (
  <div
    className={cn(
      'kv-queue-row flex items-center gap-2 rounded-kv border px-2.5 py-2 transition-colors',
      active ? 'border-kv-line bg-kv-muted' : 'border-transparent hover:bg-kv-muted'
    )}
  >
    <button type="button" onClick={onPlay} className="flex min-w-0 flex-1 items-center gap-3 text-left">
      <span className="block h-9 w-9 shrink-0 overflow-hidden rounded-md bg-kv-surface-muted">
        <TrackArt src={track.albumArt} videoId={track.videoId} small placeholderSize={14} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{track.title}</span>
        <span className="block truncate font-mono text-xs text-kv-ink-muted">{track.artist}</span>
      </span>
      {active && <EqBars playing={playing} />}
    </button>
    <span className="w-11 shrink-0 text-right font-mono text-xs tabular-nums text-kv-ink-muted">
      {formatTime(track.duration)}
    </span>
    {(reorder || onRemove) && (
      <span className="flex shrink-0 items-center gap-0.5">
        {reorder && (
          <span className="kv-queue-reorder flex items-center">
            <button
              type="button"
              onClick={reorder.onUp}
              disabled={!reorder.canUp}
              aria-label="Naikkan urutan"
              title="Naikkan urutan"
              className="flex h-8 w-8 items-center justify-center rounded-full text-kv-ink-muted transition-colors hover:bg-kv-surface hover:text-kv-ink disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ArrowUp size={13} />
            </button>
            <button
              type="button"
              onClick={reorder.onDown}
              disabled={!reorder.canDown}
              aria-label="Turunkan urutan"
              title="Turunkan urutan"
              className="flex h-8 w-8 items-center justify-center rounded-full text-kv-ink-muted transition-colors hover:bg-kv-surface hover:text-kv-ink disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ArrowDown size={13} />
            </button>
          </span>
        )}
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
      </span>
    )}
  </div>
);

const QueueList = () => {
  const queue = useMusicStore((s) => s.queue);
  const playlist = useMusicStore((s) => s.playlist);
  const currentIndex = useMusicStore((s) => s.currentIndex);
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const autoplay = useMusicStore((s) => s.autoplay);
  const autoplayQueue = useMusicStore((s) => s.autoplayQueue);
  const { playTrack, removeFromQueue, clearQueue, moveInQueue, toggleAutoplay, removeFromAutoplay } =
    useMusicStore.getState();

  const upNext = playlist.slice(currentIndex + 1);
  const empty = queue.length === 0 && upNext.length === 0 && autoplayQueue.length === 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="kv-mono-label">Up Next</h3>
        <button
          type="button"
          onClick={toggleAutoplay}
          aria-pressed={autoplay}
          title="Putar lagu terkait otomatis setelah antrean habis"
          className={cn(
            'flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors',
            autoplay
              ? 'border-kv-ink bg-kv-ink text-kv-panel'
              : 'border-kv-line text-kv-ink-muted hover:border-kv-ink hover:text-kv-ink'
          )}
        >
          <Radio size={13} /> Autoplay {autoplay ? 'on' : 'off'}
        </button>
      </div>

      {empty ? (
        <EmptyState
          icon={ListMusic}
          title="Antrean kosong"
          description={
            autoplay
              ? 'Putar album atau playlist. Setelah habis, Autoplay melanjutkan dengan lagu terkait seperti YouTube Music.'
              : 'Putar album atau playlist, atau tambahkan lagu lewat menu ⋯ pada lagu mana pun.'
          }
        />
      ) : (
        <>
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
                {queue.map((t, i) => (
                  <Row
                    key={`q-${t.id}`}
                    track={t}
                    onPlay={() => {
                      removeFromQueue(t.id);
                      playTrack(t, [t, ...playlist]);
                    }}
                    onRemove={() => removeFromQueue(t.id)}
                    removeLabel="Hapus dari antrean"
                    reorder={{
                      onUp: () => moveInQueue(t.id, -1),
                      onDown: () => moveInQueue(t.id, 1),
                      canUp: i > 0,
                      canDown: i < queue.length - 1,
                    }}
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

          {autoplayQueue.length > 0 && (
            <section>
              <h3 className="kv-mono-label mb-2 flex items-center gap-1.5">
                <Radio size={12} /> Autoplay · {autoplayQueue.length}
              </h3>
              <div className="space-y-1">
                {autoplayQueue.map((t, i) => (
                  <Row
                    key={`a-${t.id}-${i}`}
                    track={t}
                    onPlay={() => playTrack(t, [t, ...autoplayQueue.slice(i + 1)])}
                    onRemove={() => removeFromAutoplay(t.id)}
                    removeLabel="Hapus dari autoplay"
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default QueueList;
