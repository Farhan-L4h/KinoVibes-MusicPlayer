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
import Slider from '../components/ui/Slider';

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
        <h1 className="mb-6 font-display text-3xl uppercase sm:text-4xl">Lirik</h1>
        <EmptyState
          icon={Mic2}
          title="Belum ada lagu diputar"
          description="Cari dan putar lagu dulu — lirik tersinkron akan tampil di sini otomatis."
          action={
            <Link to="/search">
              <Button size="sm"><Search size={15} /> Cari lagu</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const { togglePlay, nextTrack, previousTrack, seekTo } = useMusicStore.getState();
  const loading = status === 'loading' || status === 'buffering';

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl uppercase sm:text-4xl">Lirik</h1>
        {isYt ? <Badge tone="pink">YouTube</Badge> : <Badge tone="blue">Upload</Badge>}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div
            ref={slotRef}
            className="kv-stripes relative aspect-square w-full overflow-hidden rounded-kv-lg border-3 border-kv-ink bg-kv-muted shadow-kv-lg"
          >
            {!isYt &&
              (track.albumArt ? (
                <img src={track.albumArt} alt={`Sampul ${track.album || track.title}`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-kv-blue">
                  <Music2 size={64} className="text-[#0a0a0a]" />
                  <span className="font-display text-xs uppercase tracking-widest text-[#0a0a0a]">KinoVibe</span>
                </div>
              ))}
            {isYt && (
              <span className="absolute bottom-2 left-2">
                <Badge tone="pink">▶ Video YouTube</Badge>
              </span>
            )}
          </div>

          <div className="kv-card p-4">
            <h2 className="truncate font-display text-lg uppercase leading-tight">{track.title}</h2>
            <p className="truncate text-sm font-semibold text-kv-ink-muted">{track.artist}</p>
            <div className="mt-3">
              <Slider
                value={Math.floor(currentTime)}
                max={Math.max(1, Math.floor(duration))}
                onChange={(e) => seekTo(Number(e.target.value))}
                fill="var(--kv-pink)"
                aria-label="Posisi lagu"
              />
              <div className="mt-1 flex justify-between font-mono text-[11px] font-bold text-kv-ink-muted">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-3">
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