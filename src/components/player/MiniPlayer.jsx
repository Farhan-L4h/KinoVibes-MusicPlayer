import { Mic2, ListMusic, Music2, Maximize2 } from 'lucide-react';
import { useMusicStore } from '../../stores/music';
import IconButton from '../ui/IconButton';
import Transport from './Transport';
import SeekSlider from './SeekSlider';

export default function MiniPlayer() {
  const track = useMusicStore((s) => s.currentTrack);
  const setNowPlayingOpen = useMusicStore((s) => s.setNowPlayingOpen);
  if (!track) return null;
  return (
    <section aria-label="Pemutar musik" className="shrink-0 border-t border-kv-line bg-kv-panel px-3 sm:px-5">
      <SeekSlider />
      <div className="flex min-h-[68px] items-center gap-2 pb-2 sm:gap-4">
        <button type="button" onClick={() => setNowPlayingOpen(true)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label="Buka tampilan sedang diputar">
          <span className="hidden h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-kv-muted sm:block">
            {track.albumArt ? <img src={track.albumArt} alt="" width="44" height="44" decoding="async" className="h-full w-full object-cover" /> : <Music2 className="m-3 h-5 w-5" />}
          </span>
          <span className="min-w-0"><span className="block truncate text-sm font-bold">{track.title}</span><span className="block truncate text-xs text-kv-ink-muted">{track.artist}</span></span>
        </button>
        <Transport compact />
        <div className="hidden flex-1 items-center justify-end gap-1 lg:flex">
          <IconButton label="Lirik" onClick={() => setNowPlayingOpen(true, 'lyrics')}><Mic2 size={18} /></IconButton>
          <IconButton label="Antrean" onClick={() => setNowPlayingOpen(true, 'queue')}><ListMusic size={18} /></IconButton>
          <IconButton label="Perbesar pemutar" onClick={() => setNowPlayingOpen(true)}><Maximize2 size={18} /></IconButton>
        </div>
      </div>
    </section>
  );
}
