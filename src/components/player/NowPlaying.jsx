import { useEffect, useRef } from 'react';
import { ChevronDown, Heart, ListPlus, Download, Music2 } from 'lucide-react';
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
    <div ref={dialog} role="dialog" aria-modal="true" aria-label="Sedang diputar" tabIndex={-1} className="kv-pop fixed inset-0 z-50 overflow-y-auto bg-kv-panel p-4 text-kv-ink sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between">
          <IconButton label="Tutup tampilan sedang diputar" onClick={() => setNowPlayingOpen(false)}><ChevronDown size={22} /></IconButton>
          <p className="font-mono text-xs">{isYt ? 'YouTube' : 'Koleksi pribadi'}</p>
          <IconButton label={fav ? 'Hapus dari favorit' : 'Tambah ke favorit'} onClick={() => actions.toggleLike(track)}><Heart size={19} fill={fav ? 'currentColor' : 'none'} /></IconButton>
        </header>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-14">
          <div className="space-y-5">
            <div className="relative isolate -m-3 overflow-hidden rounded-kv-lg p-3">
              <Ambient url={track.albumArt} opacity={0.4} />
              <div ref={slot} key={track.id} className="kv-fade relative z-10 mx-auto aspect-square w-full max-w-[420px] overflow-hidden rounded-kv-lg bg-kv-muted shadow-kv-lg">
                {!isYt && (track.albumArt ? <img src={track.albumArt} alt={`Sampul ${track.title}`} width="420" height="420" className="h-full w-full object-cover" /> : <Music2 className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2" />)}
              </div>
            </div>
            <h1 className="break-words font-body text-2xl font-bold leading-tight">{track.title}</h1>
            <p className="text-kv-ink-muted">{track.artist}</p>
            <Transport waveform />
            <div className="flex justify-center gap-2">
              <IconButton label="Tambah ke playlist" onClick={() => actions.openAddToPlaylist(track)}><ListPlus size={20} /></IconButton>
              {!isYt && <IconButton label="Unduh lagu" onClick={() => actions.download(track)}><Download size={20} /></IconButton>}
            </div>
          </div>
          <div className="min-w-0 space-y-4">
            <Tabs tabs={[{ value: 'lyrics', label: 'Lirik' }, { value: 'queue', label: 'Antrean' }]} active={tab} onChange={setNowPlayingTab} />
            <div className="min-h-[420px]">{tab === 'lyrics' ? <LyricsView compact /> : <QueueList />}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
