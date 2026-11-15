import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Loader2, Volume2, VolumeX } from 'lucide-react';
import { useMusicStore } from '../../stores/music';
import { formatTime } from '../../lib/utils';
import Slider from '../ui/Slider';
import IconButton from '../ui/IconButton';
import Waveform from './Waveform';
import SeekSlider from './SeekSlider';

export default function Transport({ waveform = false, compact = false }) {
  const track = useMusicStore((s) => s.currentTrack);
  const playing = useMusicStore((s) => s.isPlaying);
  const status = useMusicStore((s) => s.status);
  const time = useMusicStore((s) => s.currentTime);
  const duration = useMusicStore((s) => s.duration);
  const shuffle = useMusicStore((s) => s.shuffle);
  const repeat = useMusicStore((s) => s.repeat);
  const volume = useMusicStore((s) => s.volume);
  const muted = useMusicStore((s) => s.muted);
  const { togglePlay, nextTrack, previousTrack, toggleShuffle, cycleRepeat, setVolume, toggleMute } = useMusicStore.getState();
  const loading = status === 'loading' || status === 'buffering';

  if (!track) return null;
  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex items-center gap-3">
          <span className="w-11 shrink-0 font-mono text-xs tabular-nums">{formatTime(time)}</span>
          {waveform ? <Waveform trackId={track.id} className="min-w-0 flex-1" /> : (
            <SeekSlider className="min-w-0 flex-1" />
          )}
          <span className="w-11 shrink-0 text-right font-mono text-xs tabular-nums">{formatTime(duration)}</span>
        </div>
      )}
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {!compact && <IconButton label={shuffle ? 'Acak aktif' : 'Acak mati'} aria-pressed={shuffle} onClick={toggleShuffle} className={shuffle ? 'bg-kv-muted' : ''}><Shuffle size={18} /></IconButton>}
        <IconButton label="Lagu sebelumnya" onClick={previousTrack}><SkipBack size={21} /></IconButton>
        <IconButton variant="primary" size={compact ? 'md' : 'lg'} label={playing ? 'Jeda' : status === 'error' ? 'Coba putar lagi' : 'Putar'} onClick={togglePlay}>
          {loading ? <Loader2 size={24} className="animate-spin" /> : playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
        </IconButton>
        <IconButton label="Lagu berikutnya" onClick={() => nextTrack(false)}><SkipForward size={21} /></IconButton>
        {!compact && <IconButton label={repeat === 'one' ? 'Ulang satu lagu' : repeat === 'all' ? 'Ulang semua' : 'Ulang mati'} aria-pressed={repeat !== 'off'} onClick={cycleRepeat} className={repeat !== 'off' ? 'bg-kv-muted' : ''}>{repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}</IconButton>}
      </div>
      {!compact && (
        <div className="mx-auto flex max-w-[240px] items-center gap-2">
          <IconButton label={muted ? 'Bunyikan' : 'Bisukan'} onClick={toggleMute}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</IconButton>
          <Slider aria-label="Volume" value={muted ? 0 : volume * 100} max={100} onChange={(e) => setVolume(Number(e.target.value) / 100)} />
        </div>
      )}
      {!compact && (status === 'buffering' || status === 'error') && <p role="status" className="text-center text-xs text-kv-ink-muted">{status === 'error' ? 'Pemutaran terhenti. Tekan putar untuk mencoba lagi.' : 'Menunggu audio. Pemutaran akan lanjut setelah buffer siap.'}</p>}
    </div>
  );
}
