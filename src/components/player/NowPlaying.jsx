import { useEffect, useRef } from 'react';
import { ChevronDown, Heart, ListPlus, Download, Tv, Music } from 'lucide-react';
import { cn } from '../../lib/utils';
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

export default function NowPlaying() {
  const open = useMusicStore((s) => s.nowPlayingOpen);
  const track = useMusicStore((s) => s.currentTrack);
  const tab = useMusicStore((s) => s.nowPlayingTab);
  const playerMode = useMusicStore((s) => s.playerMode);
  const setPlayerMode = useMusicStore((s) => s.setPlayerMode);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const actions = useTrackActions();
  const dialog = useRef(null);
  const slot = useRef(null);
  const touchStartY = useRef(null);
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
    if (!open || !isYt) return undefined;
    if (playerMode === 'video') {
      const el = slot.current;
      registerVideoSlot(el, 3);
      return () => unregisterVideoSlot(el);
    }
    unregisterVideoSlot(slot.current);
    return undefined;
  }, [open, isYt, track?.id, playerMode]);

  useEffect(() => {
    if (dialog.current) {
      dialog.current.scrollTop = 0;
    }
  }, [track?.id]);

  const handleTouchStart = (e) => {
    if (!dialog.current || dialog.current.scrollTop <= 15) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = null;
    }
  };

  const handleTouchMove = (e) => {
    if (touchStartY.current === null) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 80) {
      setNowPlayingOpen(false);
      touchStartY.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
  };

  if (!open || !track) return null;
  const fav = isFavorite(track);
  return (
    <div
      ref={dialog}
      data-kv-nowplaying
      role="dialog"
      aria-modal="true"
      aria-label="Sedang diputar"
      tabIndex={-1}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="kv-pop fixed inset-0 z-50 flex flex-col overflow-y-auto bg-kv-panel text-kv-ink lg:overflow-hidden"
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <Ambient url={track.albumArt} opacity={0.7} />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col p-3 sm:p-6 lg:p-8">
        <div aria-hidden="true" className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-kv-ink/20 sm:hidden" />
        <header className="mb-3 flex shrink-0 items-center justify-between lg:mb-6">
          <IconButton label="Tutup tampilan sedang diputar" onClick={() => setNowPlayingOpen(false)}><ChevronDown size={22} /></IconButton>
          {isYt ? (
            <div className="flex items-center rounded-full border border-kv-line bg-kv-surface/80 p-0.5 text-xs shadow-sm backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setPlayerMode('music')}
                className={cn(
                  'flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors',
                  playerMode === 'music' ? 'bg-kv-ink text-kv-panel font-bold shadow-sm' : 'text-kv-ink-muted hover:text-kv-ink'
                )}
              >
                <Music size={11} aria-hidden="true" />
                Lagu
              </button>
              <button
                type="button"
                onClick={() => setPlayerMode('video')}
                className={cn(
                  'flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors',
                  playerMode === 'video' ? 'bg-kv-ink text-kv-panel font-bold shadow-sm' : 'text-kv-ink-muted hover:text-kv-ink'
                )}
              >
                <Tv size={11} aria-hidden="true" />
                Video
              </button>
            </div>
          ) : (
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-kv-ink-muted">{track.source === 'spotify' ? 'Spotify' : 'Koleksi pribadi'}</p>
          )}
          <IconButton label={fav ? 'Hapus dari favorit' : 'Tambah ke favorit'} onClick={() => actions.toggleLike(track)}><Heart size={19} fill={fav ? 'currentColor' : 'none'} /></IconButton>
        </header>
        <div className="grid min-h-0 flex-1 items-start gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-12 lg:overflow-hidden">
          <div data-kv-np-left className="kv-scroll space-y-3 sm:space-y-4 lg:flex lg:h-full lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-4 lg:space-y-0 lg:overflow-hidden lg:pr-1 [@media(max-height:760px)]:lg:gap-3">
            <div className="lg:flex lg:min-h-0 lg:flex-1 lg:items-center lg:justify-center">
              <div className="mx-auto flex w-full max-w-[300px] items-center justify-center sm:max-w-[460px] lg:mx-auto lg:h-full lg:max-h-full lg:w-auto lg:max-w-full">
                <div className="relative min-w-0 flex-1 lg:aspect-square lg:h-[min(100%,356px)] lg:w-auto lg:flex-none">
                  <div
                    aria-hidden="true"
                    className="absolute -inset-2 rounded-[28px] opacity-55 blur-2xl transition-opacity duration-700"
                    style={{ background: 'linear-gradient(140deg, color-mix(in srgb, var(--kv-ambient-a) 60%, transparent), color-mix(in srgb, var(--kv-ambient-b) 42%, transparent) 55%, color-mix(in srgb, var(--kv-ambient-c) 30%, transparent))' }}
                  />
                  <div ref={slot} key={`art-${track.id}`} className="kv-fade relative aspect-square w-full overflow-hidden rounded-kv-lg bg-kv-muted shadow-kv-lg ring-1 ring-kv-line/60 lg:aspect-auto lg:h-full">
                    {(!isYt || playerMode === 'music') && (
                      <TrackArt src={track.albumArt} videoId={track.videoId} alt={`Sampul ${track.title}`} placeholderClassName="absolute inset-0 flex items-center justify-center text-kv-ink-muted" placeholderSize={80} />
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="h-12 sm:h-24 lg:h-16 lg:shrink-0 [@media(max-height:760px)]:lg:h-10 [@media(max-height:660px)]:lg:hidden"><Visualizer /></div>
            <div key={`meta-${track.id}`} className="kv-fade space-y-1.5 sm:space-y-2 lg:shrink-0 lg:space-y-3">
              <h1 className="break-words font-display text-xl leading-tight tracking-tight sm:text-3xl [@media(max-height:760px)]:lg:text-2xl">{track.title}</h1>
              <p className="text-sm font-semibold text-kv-ink-muted sm:text-base">{track.artist}</p>
              {track.album && <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-kv-ink-muted/80">{track.album}</p>}
            </div>
            <div className="lg:shrink-0"><Transport waveform /></div>
            <div className="flex justify-center gap-2 lg:shrink-0 [@media(max-height:660px)]:lg:hidden">
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
