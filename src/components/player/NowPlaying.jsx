import { useEffect, useRef } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ListPlus,
  Volume2,
  VolumeX,
  Loader2,
  Music2,
  Download,
} from 'lucide-react';
import { useMusicStore } from '../../stores/music';
import { useFavoritesStore } from '../../stores/favorites';
import { useTrackActions } from '../../hooks/useTrackActions';
import { registerVideoSlot, unregisterVideoSlot } from '../../player/videoSlot';
import { formatTime } from '../../lib/utils';
import Slider from '../ui/Slider';
import IconButton from '../ui/IconButton';
import Badge from '../ui/Badge';
import Tabs from '../ui/Tabs';
import LyricsView from '../LyricsView';
import QueueList from './QueueList';

const NowPlaying = () => {
  const open = useMusicStore((s) => s.nowPlayingOpen);
  const tab = useMusicStore((s) => s.nowPlayingTab);
  const track = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const status = useMusicStore((s) => s.status);
  const currentTime = useMusicStore((s) => s.currentTime);
  const duration = useMusicStore((s) => s.duration);
  const volume = useMusicStore((s) => s.volume);
  const muted = useMusicStore((s) => s.muted);
  const shuffle = useMusicStore((s) => s.shuffle);
  const repeat = useMusicStore((s) => s.repeat);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const actions = useTrackActions();
  const slotRef = useRef(null);

  const isYt = track?.source === 'youtube';

  useEffect(() => {
    if (!open || !isYt) return undefined;
    const el = slotRef.current;
    if (el) registerVideoSlot(el);
    return () => unregisterVideoSlot(el);
  }, [open, isYt, track?.id]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') useMusicStore.getState().setNowPlayingOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !track) return null;

  const {
    togglePlay,
    nextTrack,
    previousTrack,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    setNowPlayingOpen,
    setNowPlayingTab,
  } = useMusicStore.getState();

  const loading = status === 'loading' || status === 'buffering';
  const fav = isFavorite(track);

  return (
    <div className="fixed inset-0 z-50 animate-slide-up overflow-y-auto bg-kv-bg">
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 pb-10 pt-4 sm:px-6">
        <header className="mb-5 flex items-center justify-between gap-3">
          <IconButton variant="ink" label="Tutup tampilan sedang diputar" onClick={() => setNowPlayingOpen(false)}>
            <ChevronDown size={22} />
          </IconButton>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-kv-ink-muted">
              Sedang diputar
            </span>
            {isYt ? <Badge tone="pink">YouTube</Badge> : <Badge tone="blue">Upload</Badge>}
          </div>
          <IconButton
            variant={fav ? 'pink' : 'ghost'}
            label={fav ? 'Hapus dari favorit' : 'Tambah ke favorit'}
            onClick={() => actions.toggleLike(track)}
          >
            <Heart size={18} fill={fav ? 'currentColor' : 'none'} />
          </IconButton>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-10">
          <div className="space-y-5">
            <div
              ref={slotRef}
              className="kv-stripes relative mx-auto aspect-square w-full max-w-[440px] overflow-hidden rounded-kv-lg border-3 border-kv-ink bg-kv-muted shadow-kv-lg"
            >
              {!isYt &&
                (track.albumArt ? (
                  <img src={track.albumArt} alt={`Sampul ${track.album || track.title}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-kv-yellow">
                    <Music2 size={72} className="text-[#0a0a0a]" />
                    <span className="font-display text-sm uppercase tracking-widest text-[#0a0a0a]">KinoVibe</span>
                  </div>
                ))}
              {isYt && (
                <div className="absolute bottom-2 left-2">
                  <Badge tone="pink">▶ Video YouTube</Badge>
                </div>
              )}
            </div>

            <div className="text-center lg:text-left">
              <h1 className="font-display text-2xl uppercase leading-tight sm:text-3xl">{track.title}</h1>
              <p className="mt-1 text-lg font-semibold text-kv-ink-muted">{track.artist}</p>
              {track.album && <p className="text-sm text-kv-ink-muted">{track.album}</p>}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <IconButton label="Tambah ke playlist" onClick={() => actions.openAddToPlaylist(track)}>
                <ListPlus size={18} />
              </IconButton>
              {track.source !== 'youtube' && (
                <IconButton label="Unduh lagu" onClick={() => actions.download(track)}>
                  <Download size={18} />
                </IconButton>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-5">
            <div className="kv-card space-y-4 p-4 sm:p-5">
              <div>
                <Slider
                  value={Math.floor(currentTime)}
                  max={Math.max(1, Math.floor(duration))}
                  onChange={(e) => seekTo(Number(e.target.value))}
                  fill="var(--kv-pink)"
                  aria-label="Posisi lagu"
                />
                <div className="mt-1 flex justify-between font-mono text-xs font-bold text-kv-ink-muted">
                  <span>{formatTime(currentTime)}</span>
                  <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <IconButton
                  variant={shuffle ? 'primary' : 'ghost'}
                  label={shuffle ? 'Acak aktif' : 'Acak mati'}
                  onClick={toggleShuffle}
                  aria-pressed={shuffle}
                >
                  <Shuffle size={18} />
                </IconButton>
                <IconButton label="Lagu sebelumnya" onClick={previousTrack} className="h-12 w-12">
                  <SkipBack size={22} />
                </IconButton>
                <IconButton
                  variant="primary"
                  label={isPlaying ? 'Jeda' : 'Putar'}
                  onClick={togglePlay}
                  className="h-16 w-16 shadow-kv-lg"
                >
                  {loading ? (
                    <Loader2 size={30} className="animate-spin" />
                  ) : isPlaying ? (
                    <Pause size={30} />
                  ) : (
                    <Play size={30} className="ml-1" />
                  )}
                </IconButton>
                <IconButton label="Lagu berikutnya" onClick={() => nextTrack(false)} className="h-12 w-12">
                  <SkipForward size={22} />
                </IconButton>
                <IconButton
                  variant={repeat !== 'off' ? 'primary' : 'ghost'}
                  label={repeat === 'one' ? 'Ulang satu lagu' : repeat === 'all' ? 'Ulang semua' : 'Ulang mati'}
                  onClick={cycleRepeat}
                >
                  {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
                </IconButton>
              </div>

              <div className="flex items-center gap-3">
                <IconButton label={muted ? 'Bunyikan' : 'Bisukan'} onClick={toggleMute}>
                  {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </IconButton>
                <Slider
                  value={muted ? 0 : Math.round(volume * 100)}
                  max={100}
                  onChange={(e) => setVolume(Number(e.target.value) / 100)}
                  fill="var(--kv-blue)"
                  aria-label="Volume"
                />
                <span className="w-10 text-right font-mono text-xs font-bold text-kv-ink-muted">
                  {muted ? 0 : Math.round(volume * 100)}%
                </span>
              </div>
            </div>

            <Tabs
              tabs={[
                { value: 'lyrics', label: 'Lirik' },
                { value: 'queue', label: 'Antrean' },
              ]}
              active={tab}
              onChange={setNowPlayingTab}
            />

            <div className="min-h-[300px] flex-1">
              {tab === 'lyrics' ? <LyricsView compact /> : <QueueList />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NowPlaying;