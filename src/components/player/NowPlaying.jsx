import { useEffect, useRef } from 'react';
import { ChevronDown, Heart, ListPlus, Download } from 'lucide-react';
import TrackArt from '../TrackArt';
import { useMusicStore } from '../../stores/music';
import { useFavoritesStore } from '../../stores/favorites';
import { useTrackActions } from '../../hooks/useTrackActions';
import { registerVideoSlot, unregisterVideoSlot } from '../../player/videoSlot';
import IconButton from '../ui/IconButton';
import Ambient from '../Ambient';
import Tabs from '../ui/Tabs';
import LyricsView from '../LyricsView';
import QueueList from './QueueList';
import Transport from './Transport';
import Visualizer from './Visualizer';
import VerticalSpectrum from './VerticalSpectrum';

export default function NowPlaying() {
  const open = useMusicStore((s) => s.nowPlayingOpen);
  const track = useMusicStore((s) => s.currentTrack);
  const tab = useMusicStore((s) => s.nowPlayingTab);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const actions = useTrackActions();
  const dialog = useRef(null);
  const slot = useRef(null);
  const isYt = track?.source === 'youtube';
  const { setNowPlayingOpen, setNowPlayingTab } = useMusicStore.getState();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    dialog.current?.focus();
    const onKey = (e) => {
      if (document.querySelector('[data-kv-modal]')) return;
      if (e.key === 'Escape') useMusicStore.getState().setNowPlayingOpen(false);
      if (e.key !== 'Tab') return;
      const items = [...dialog.current.querySelectorAll('button:not(:disabled), input, [tabindex="0"]')].filter((el) => el.getClientRects().length);
      const first = items[0];
      const last = items.at(-1);
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { e.preventDefault(); last?.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, [open]);

  useEffect(() => {
    if (!open || !isYt) return;
    const el = slot.current;
    registerVideoSlot(el, 3);
    return () => unregisterVideoSlot(el);
  }, [open, isYt, track?.id]);

  if (!open || !track) return null;
  const fav = isFavorite(track);
  return (
    <div ref={dialog} data-kv-nowplaying role="dialog" aria-modal="true" aria-label="Sedang diputar" tabIndex={-1} className="kv-pop fixed inset-0 z-50 flex flex-col overflow-y-auto bg-kv-panel text-kv-ink lg:overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <Ambient url={track.albumArt} opacity={0.7} />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col p-3 sm:p-6 lg:p-8">
        <header className="mb-3 flex shrink-0 items-center justify-between lg:mb-6">
          <IconButton label="Tutup tampilan sedang diputar" onClick={() => setNowPlayingOpen(false)}><ChevronDown size={22} /></IconButton>
          <p className="font-mono text-xs">{isYt ? 'YouTube' : track.source === 'spotify' ? 'Spotify' : 'Koleksi pribadi'}</p>
          <IconButton label={fav ? 'Hapus dari favorit' : 'Tambah ke favorit'} onClick={() => actions.toggleLike(track)}><Heart size={19} fill={fav ? 'currentColor' : 'none'} /></IconButton>
        </header>
        <div className="grid min-h-0 flex-1 items-start gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-12 lg:overflow-hidden">
          <div data-kv-np-left className="kv-scroll space-y-3 sm:space-y-4 lg:h-full lg:min-h-0 lg:space-y-5 lg:overflow-y-auto lg:pr-1">
            <div className="mx-auto flex w-full max-w-[300px] items-stretch gap-3 sm:max-w-[460px]">
              <div className="hidden w-9 shrink-0 lg:block" aria-hidden="true">
                <VerticalSpectrum />
              </div>
              <div ref={slot} key={`art-${track.id}`} className="kv-fade relative aspect-square min-w-0 flex-1 overflow-hidden rounded-kv-lg bg-kv-muted shadow-kv-lg">
                {!isYt && <TrackArt src={track.albumArt} videoId={track.videoId} alt={`Sampul ${track.title}`} placeholderClassName="absolute inset-0 flex items-center justify-center text-kv-ink-muted" placeholderSize={80} />}
              </div>
            </div>
            <div className="h-12 sm:h-24"><Visualizer /></div>
            <div key={`meta-${track.id}`} className="kv-fade space-y-2 sm:space-y-3 lg:space-y-5">
              <h1 className="break-words font-body text-lg font-bold leading-tight sm:text-2xl">{track.title}</h1>
              <p className="text-sm text-kv-ink-muted sm:text-base">{track.artist}</p>
            </div>
            <Transport waveform />
            <div className="flex justify-center gap-2">
              <IconButton label="Tambah ke playlist" onClick={() => actions.openAddToPlaylist(track)}><ListPlus size={20} /></IconButton>
              {!isYt && track.source !== 'spotify' && <IconButton label="Unduh lagu" onClick={() => actions.download(track)}><Download size={20} /></IconButton>}
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-4 lg:h-full lg:min-h-0">
            <div className="shrink-0">
              <Tabs tabs={[{ value: 'lyrics', label: 'Lirik' }, { value: 'queue', label: 'Up Next' }]} active={tab} onChange={setNowPlayingTab} />
            </div>
            <div className="kv-scroll min-h-0 flex-1 lg:overflow-y-auto lg:pr-1">
              {tab === 'lyrics' ? <LyricsView compact /> : <QueueList />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
