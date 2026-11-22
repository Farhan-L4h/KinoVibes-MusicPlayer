import { Mic2, ListMusic, Maximize2 } from 'lucide-react';
import TrackArt from '../TrackArt';
import { useMusicStore } from '../../stores/music';
import IconButton from '../ui/IconButton';
import Ambient from '../Ambient';
import Transport from './Transport';
import SeekSlider from './SeekSlider';
import Visualizer from './Visualizer';

export default function MiniPlayer() {
  const track = useMusicStore((s) => s.currentTrack);
  const setNowPlayingOpen = useMusicStore((s) => s.setNowPlayingOpen);
  if (!track) return null;
  return (
    <section
      aria-label="Pemutar musik"
      className="relative isolate shrink-0 overflow-hidden border-t border-kv-line bg-kv-panel px-3 sm:px-5"
      style={{ backgroundImage: 'linear-gradient(0deg, color-mix(in srgb, var(--kv-ambient-a) 6%, transparent), color-mix(in srgb, var(--kv-ambient-a) 6%, transparent))' }}
    >
      {/* Swipe-up hint indicator */}
      <div aria-hidden="true" className="absolute left-1/2 top-1.5 h-1 w-8 -translate-x-1/2 rounded-full bg-kv-ink/20 sm:hidden" />
      <div className="pointer-events-none absolute inset-0 z-0 opacity-50"><Visualizer /></div>
      <div className="relative z-10">
        <SeekSlider />
        <div className="flex min-h-[56px] items-center gap-2 pb-1.5 sm:min-h-[60px] sm:gap-4">
          <button type="button" onClick={() => setNowPlayingOpen(true)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left sm:gap-3" aria-label="Buka tampilan sedang diputar">
            <span key={track.id} className="kv-fade relative isolate h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-kv-muted sm:h-11 sm:w-11">
              <Ambient url={track.albumArt} opacity={0.55} />
              <TrackArt src={track.albumArt} videoId={track.videoId} small imgClassName="relative z-10 h-full w-full object-cover" placeholderClassName="relative z-10 flex h-full w-full items-center justify-center text-kv-ink-muted" placeholderSize={20} />
            </span>
            <span key={`meta-${track.id}`} className="kv-fade min-w-0"><span className="block truncate text-sm font-bold">{track.title}</span><span className="block truncate text-xs text-kv-ink-muted">{track.artist}</span></span>
          </button>
          <Transport compact />
          <div className="hidden flex-1 items-center justify-end gap-1 lg:flex">
            <IconButton label="Lirik" onClick={() => setNowPlayingOpen(true, 'lyrics')}><Mic2 size={18} /></IconButton>
            <IconButton label="Antrean" onClick={() => setNowPlayingOpen(true, 'queue')}><ListMusic size={18} /></IconButton>
            <IconButton label="Perbesar pemutar" onClick={() => setNowPlayingOpen(true)}><Maximize2 size={18} /></IconButton>
          </div>
        </div>
      </div>
    </section>
  );
}