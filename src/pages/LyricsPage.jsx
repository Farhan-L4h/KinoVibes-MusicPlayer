import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Mic2, Play, Pause, SkipBack, SkipForward, Music2, Search, Loader2 } from 'lucide-react';
import { useMusicStore } from '../stores/music';
import { registerVideoSlot, unregisterVideoSlot } from '../player/videoSlot';
import { formatTime } from '../lib/utils';
import LyricsView from '../components/LyricsView';
import IconButton from '../components/ui/IconButton';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import SeekSlider from '../components/player/SeekSlider';

const LyricsPage = () => {
  const track = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const status = useMusicStore((s) => s.status);
  const currentTime = useMusicStore((s) => s.currentTime);
  const duration = useMusicStore((s) => s.duration);
  const nowPlayingOpen = useMusicStore((s) => s.nowPlayingOpen);
  const slotRef = useRef(null);

  const isYt = track?.source === 'youtube';

  useEffect(() => {
    if (!isYt || nowPlayingOpen) return undefined;
    const el = slotRef.current;
    if (el) registerVideoSlot(el);
    return () => unregisterVideoSlot(el);
  }, [isYt, nowPlayingOpen, track?.id]);

  if (!track) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 font-display text-2xl leading-relaxed sm:text-3xl">Lirik</h1>
        <EmptyState
          icon={Mic2}
          title="Belum ada lagu diputar"
          description="Cari dan putar lagu dulu. Lirik tersinkron akan tampil di sini otomatis."
          action={
            <Link to="/search">
              <Button size="sm"><Search size={15} /> Cari lagu</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const { togglePlay, nextTrack, previousTrack } = useMusicStore.getState();
  const loading = status === 'loading' || status === 'buffering';

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl leading-relaxed sm:text-3xl">Lirik</h1>
        {isYt ? <Badge tone="ink">YouTube</Badge> : <Badge>Upload</Badge>}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div
            ref={slotRef}
            className="relative aspect-square w-full overflow-hidden rounded-kv-lg border border-kv-line bg-kv-muted shadow-kv-lg"
          >
            {!isYt &&
              (track.albumArt ? (
                <img src={track.albumArt} alt={`Sampul ${track.album || track.title}`} loading="lazy" decoding="async" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-kv-surface-muted">
                  <Music2 size={64} className="text-kv-ink-muted" aria-hidden="true" />
                  <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-kv-ink-muted">KINOVIBE</span>
                </div>
              ))}
            {isYt && (
              <span className="absolute bottom-2 left-2">
                <Badge tone="ink">Video YouTube</Badge>
              </span>
            )}
          </div>

          <div className="kv-card p-4">
            <h2 className="break-words font-display text-lg leading-relaxed">{track.title}</h2>
            <p className="mt-1 truncate text-sm text-kv-ink-muted">{track.artist}</p>
            <div className="mt-4">
              <SeekSlider />
              <div className="mt-1 flex justify-between font-mono text-[11px] tabular-nums text-kv-ink-muted">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-3">
              <IconButton label="Lagu sebelumnya" onClick={previousTrack}>
                <SkipBack size={18} />
              </IconButton>
              <IconButton variant="primary" label={isPlaying ? 'Jeda' : 'Putar'} onClick={togglePlay} className="h-14 w-14">
                {loading ? <Loader2 size={24} className="animate-spin" /> : isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
              </IconButton>
              <IconButton label="Lagu berikutnya" onClick={() => nextTrack(false)}>
                <SkipForward size={18} />
              </IconButton>
            </div>
          </div>
        </div>

        <div className="min-h-[60vh]">
          <LyricsView />
        </div>
      </div>
    </div>
  );
};

export default LyricsPage;
