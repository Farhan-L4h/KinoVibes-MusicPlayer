import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Mic2,
  ListMusic,
  ChevronUp,
  Volume2,
  VolumeX,
  Loader2,
  Music2,
} from 'lucide-react';
import { useMusicStore } from '../../stores/music';
import { formatTime } from '../../lib/utils';
import Slider from '../ui/Slider';
import IconButton from '../ui/IconButton';
import EqBars from '../ui/EqBars';

const MiniPlayer = () => {
  const navigate = useNavigate();
  const track = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const status = useMusicStore((s) => s.status);
  const currentTime = useMusicStore((s) => s.currentTime);
  const duration = useMusicStore((s) => s.duration);
  const volume = useMusicStore((s) => s.volume);
  const muted = useMusicStore((s) => s.muted);
  const queue = useMusicStore((s) => s.queue);
  const { togglePlay, nextTrack, previousTrack, seekTo, setVolume, toggleMute, setNowPlayingOpen } =
    useMusicStore.getState();

  if (!track) return null;

  const loading = status === 'loading' || status === 'buffering';

  return (
    <div className="fixed bottom-kv-bottomnav left-0 right-0 z-40 border-t-3 border-kv-ink bg-kv-surface lg:bottom-0 lg:left-kv-sidebar">
      <div className="px-3 pt-1 sm:px-4">
        <Slider
          value={Math.floor(currentTime)}
          max={Math.max(1, Math.floor(duration))}
          onChange={(e) => seekTo(Number(e.target.value))}
          fill="var(--kv-pink)"
          aria-label="Posisi lagu"
          className="h-5"
        />
      </div>
      <div className="flex h-[64px] items-center gap-2 px-3 pb-1 sm:gap-3 sm:px-4">
        <button
          type="button"
          onClick={() => setNowPlayingOpen(true)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label="Buka tampilan sedang diputar"
        >
          <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-kv border-3 border-kv-ink bg-kv-yellow shadow-kv">
            {track.albumArt ? (
              <img src={track.albumArt} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-kv-ink">
                <Music2 size={20} />
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate font-bold leading-tight">{track.title}</span>
              {isPlaying && <EqBars className="hidden shrink-0 sm:flex" />}
            </span>
            <span className="block truncate text-xs text-kv-ink-muted">
              {track.artist}
              {track.source === 'youtube' && (
                <span className="ml-2 rounded border border-kv-ink bg-kv-red px-1 font-mono text-[9px] font-bold uppercase text-white">
                  YT
                </span>
              )}
            </span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          <IconButton label="Lagu sebelumnya" onClick={previousTrack} className="hidden sm:inline-flex">
            <SkipBack size={18} />
          </IconButton>
          <IconButton
            variant="primary"
            label={isPlaying ? 'Jeda' : 'Putar'}
            onClick={togglePlay}
            className="h-12 w-12"
          >
            {loading ? <Loader2 size={22} className="animate-spin" /> : isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
          </IconButton>
          <IconButton label="Lagu berikutnya" onClick={() => nextTrack(false)}>
            <SkipForward size={18} />
          </IconButton>
        </div>

        <span className="hidden shrink-0 font-mono text-xs text-kv-ink-muted md:block">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div className="hidden items-center gap-2 xl:flex">
          <IconButton label={muted ? 'Bunyikan' : 'Bisukan'} onClick={toggleMute}>
            {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </IconButton>
          <Slider
            value={muted ? 0 : Math.round(volume * 100)}
            max={100}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            fill="var(--kv-blue)"
            aria-label="Volume"
            className="w-24"
          />
        </div>

        <IconButton
          label="Lirik"
          onClick={() => navigate('/lyrics')}
          className="hidden sm:inline-flex"
        >
          <Mic2 size={18} />
        </IconButton>
        <IconButton
          label={`Antrean${queue.length ? ` (${queue.length})` : ''}`}
          onClick={() => setNowPlayingOpen(true, 'queue')}
          className="relative hidden md:inline-flex"
        >
          <ListMusic size={18} />
          {queue.length > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-kv-ink bg-kv-pink px-1 font-mono text-[10px] font-bold text-[#0a0a0a]">
              {queue.length}
            </span>
          )}
        </IconButton>
        <IconButton
          variant="ink"
          label="Perbesar pemutar"
          onClick={() => setNowPlayingOpen(true)}
          className="lg:hidden"
        >
          <ChevronUp size={18} />
        </IconButton>
      </div>
    </div>
  );
};

export default MiniPlayer;